import { reactive } from 'vue'
import { useTasksStore } from '../store/tasks'
import { useProjectsStore } from '../store/projects'
import { readSnapshot, writeSnapshot, deleteTaskRecord } from './database'

export const persistenceState = reactive({
  status: 'loading', // loading | saving | saved | error
  error: '',
  canRetry: false,
  lastSavedAt: null,
  lastWriteMode: '', // дод. завдання 3: 'snapshot' — повний знімок, 'delete' — точкове видалення
  remoteNotice: '', // дод. завдання 6: дані оновлено з іншої вкладки
})

let taskStore = null
let projectStore = null
let enabled = false
let writing = false
let revision = 0
let savedRevision = 0
let lastRequestedSnapshot = ''
let scheduled = false
let storedSnapshot = null // дод. завдання 3: останній знімок, підтверджений у базі
let channel = null // дод. завдання 6
let remotePending = false

// JSON-серіалізація перетворює реактивні об'єкти Pinia на звичайні дані.
function makeSnapshot() {
  return JSON.parse(JSON.stringify({
    tasks: taskStore.tasks,
    projects: projectStore.projects,
    nextProjectId: projectStore.nextProjectId,
  }))
}

// getAll() повертає записи за зростанням ключа. Повертаємо звичний порядок:
// стандартні проєкти, далі project-1, project-2…; завдання — нові першими.
const builtInProjects = ['general', 'study', 'personal']
function projectOrder(project) {
  const builtIn = builtInProjects.indexOf(project.id)
  if (builtIn !== -1) return builtIn
  const match = /^project-(\d+)$/.exec(String(project.id))
  return match ? 100 + Number(match[1]) : Number.MAX_SAFE_INTEGER
}

// Відновлення (hydration) state двох stores зі знімка бази.
function applySnapshot(snapshot) {
  if (!Array.isArray(snapshot.tasks) || !Array.isArray(snapshot.projects)) {
    throw new Error('Некоректний формат локальних даних.')
  }

  const calculatedNextId = Math.max(
    0,
    ...snapshot.projects.map((project) => {
      const match = /^project-(\d+)$/.exec(String(project.id))
      return match ? Number(match[1]) : 0
    }),
  ) + 1

  projectStore.$patch({
    projects: [...snapshot.projects].sort((a, b) => projectOrder(a) - projectOrder(b)),
    nextProjectId: Number.isSafeInteger(snapshot.nextProjectId) &&
      snapshot.nextProjectId >= calculatedNextId
      ? snapshot.nextProjectId
      : calculatedNextId,
  })
  taskStore.$patch({ tasks: [...snapshot.tasks].sort((a, b) => b.id - a.id) })
}

// Дод. завдання 3: якщо порівняно з базою зникло рівно одне завдання, а решта
// даних не змінилася, достатньо точкового delete() замість повного перезапису.
function findSingleDeletedTask(previous, next) {
  if (!previous || next.tasks.length !== previous.tasks.length - 1) return null
  if (next.nextProjectId !== previous.nextProjectId) return null
  if (JSON.stringify(next.projects) !== JSON.stringify(previous.projects)) return null

  const nextById = new Map(next.tasks.map((task) => [task.id, JSON.stringify(task)]))
  const removed = previous.tasks.filter((task) => !nextById.has(task.id))
  if (removed.length !== 1) return null

  const othersUnchanged = previous.tasks.every((task) =>
    task.id === removed[0].id || nextById.get(task.id) === JSON.stringify(task))
  return othersUnchanged ? removed[0].id : null
}

// В один момент часу виконуємо не більш як один запис в IndexedDB.
async function flushChanges() {
  if (!enabled || writing) return
  writing = true

  try {
    while (savedRevision < revision) {
      const targetRevision = revision
      const snapshot = makeSnapshot()

      try {
        const deletedId = findSingleDeletedTask(storedSnapshot, snapshot)
        const savedAt = deletedId !== null
          ? await deleteTaskRecord(deletedId)
          : await writeSnapshot(snapshot)
        persistenceState.lastWriteMode = deletedId !== null ? 'delete' : 'snapshot'
        storedSnapshot = snapshot
        savedRevision = targetRevision
        persistenceState.lastSavedAt = new Date(savedAt)
        channel?.postMessage({ type: 'saved', savedAt })
      } catch (error) {
        console.error('TaskFlow: збереження не вдалося:', error)
        persistenceState.status = 'error'
        persistenceState.error = 'Зміни поки що залишилися лише в пам’яті.'
        persistenceState.canRetry = true
        return
      }
    }

    persistenceState.status = 'saved'
    persistenceState.error = ''
    persistenceState.canRetry = false
  } finally {
    writing = false
  }

  // Повідомлення від іншої вкладки надійшло під час власного запису — обробляємо зараз.
  if (remotePending) void applyRemoteChanges()
}

function requestSave(force = false) {
  if (!enabled) return
  const fingerprint = JSON.stringify(makeSnapshot())
  if (!force && fingerprint === lastRequestedSnapshot) return
  lastRequestedSnapshot = fingerprint

  revision += 1
  persistenceState.status = 'saving'
  persistenceState.error = ''
  persistenceState.canRetry = false
  persistenceState.remoteNotice = ''
  void flushChanges()
}

// Об'єднуємо синхронні зміни й не записуємо зміни лише у фільтрах.
function onStoreChanged() {
  if (scheduled) return
  scheduled = true
  queueMicrotask(() => {
    scheduled = false
    requestSave()
  })
}

// Дод. завдання 6: інша вкладка записала нові дані — перечитуємо базу, щоб
// наступний повний знімок цієї вкладки не стер чужих змін.
async function applyRemoteChanges() {
  if (writing || savedRevision < revision) {
    remotePending = true
    return
  }
  remotePending = false

  try {
    const snapshot = await readSnapshot()
    // Поки читали базу, у цій вкладці з'явилися власні зміни — вони мають пріоритет.
    if (writing || savedRevision < revision || !snapshot.initialized) return

    applySnapshot(snapshot)
    // Синхронно оновлюємо відбитки, тож підписка не запустить зайвого запису.
    storedSnapshot = makeSnapshot()
    lastRequestedSnapshot = JSON.stringify(storedSnapshot)
    persistenceState.lastSavedAt = snapshot.lastSavedAt ? new Date(snapshot.lastSavedAt) : null
    persistenceState.status = 'saved'
    persistenceState.remoteNotice = 'Дані оновлено зі змін в іншій вкладці.'
  } catch (error) {
    console.error('TaskFlow: не вдалося прочитати зміни іншої вкладки:', error)
  }
}

function connectOtherTabs() {
  if (typeof BroadcastChannel === 'undefined') return
  channel = new BroadcastChannel('taskflow-db')
  channel.onmessage = (event) => {
    if (event.data?.type === 'saved') void applyRemoteChanges()
  }
}

// Кнопка повторної спроби використовується тільки після помилки запису.
export function retrySave() {
  if (!enabled || persistenceState.status !== 'error') return
  requestSave(true)
}

export async function initializePersistence(pinia) {
  taskStore = useTasksStore(pinia)
  projectStore = useProjectsStore(pinia)

  try {
    const snapshot = await readSnapshot()

    if (snapshot.initialized) {
      applySnapshot(snapshot)
      // Дод. завдання 4: показуємо час останнього запису з metadata, а не час запуску.
      persistenceState.lastSavedAt = snapshot.lastSavedAt ? new Date(snapshot.lastSavedAt) : null
    } else {
      // Демонстраційні дані записуємо тільки під час першого запуску.
      const savedAt = await writeSnapshot(makeSnapshot())
      persistenceState.lastSavedAt = new Date(savedAt)
    }

    storedSnapshot = makeSnapshot()
    persistenceState.status = 'saved'
    lastRequestedSnapshot = JSON.stringify(storedSnapshot)
    enabled = true

    // Слухаємо зміни стану обох сховищ; фільтри не записуємо.
    taskStore.$subscribe(onStoreChanged, { detached: true, flush: 'sync' })
    projectStore.$subscribe(onStoreChanged, { detached: true, flush: 'sync' })
    connectOtherTabs()
  } catch (error) {
    console.error('TaskFlow: IndexedDB недоступна:', error)
    persistenceState.status = 'error'
    persistenceState.error = 'Не вдалося відкрити або відновити локальні дані. ' +
      'Працює лише тимчасовий стан; наявну базу не перезаписано.'
    persistenceState.canRetry = false
  }
}
