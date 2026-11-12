import { openDB } from 'idb'

const DB_NAME = 'taskflow-db'
const DB_VERSION = 1
let databasePromise = null

// Відкриваємо одну базу даних і повторно використовуємо з'єднання.
export function getDatabase() {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('Цей браузер не підтримує IndexedDB.'))
  }

  if (!databasePromise) {
    databasePromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata')
        }
      },
    }).catch((error) => {
      databasePromise = null
      throw error
    })
  }

  return databasePromise
}

// Читаємо завдання, проєкти та службові значення в одній транзакції.
export async function readSnapshot() {
  const db = await getDatabase()
  const tx = db.transaction(['tasks', 'projects', 'metadata'], 'readonly')
  const metadata = tx.objectStore('metadata')
  const [tasks, projects, initialized, nextProjectId, lastSavedAt] = await Promise.all([
    tx.objectStore('tasks').getAll(),
    tx.objectStore('projects').getAll(),
    metadata.get('initialized'),
    metadata.get('nextProjectId'),
    metadata.get('lastSavedAt'), // дод. завдання 4
  ])
  await tx.done

  return { tasks, projects, initialized: initialized === true, nextProjectId, lastSavedAt }
}

// Атомарно замінюємо збережені списки актуальним знімком Pinia.
// Повертає час успішного запису (дод. завдання 4).
export async function writeSnapshot(snapshot) {
  const db = await getDatabase()
  const tx = db.transaction(['tasks', 'projects', 'metadata'], 'readwrite')
  const taskStore = tx.objectStore('tasks')
  const projectStore = tx.objectStore('projects')
  const metadataStore = tx.objectStore('metadata')
  const savedAt = new Date().toISOString()

  await Promise.all([taskStore.clear(), projectStore.clear()])
  await Promise.all([
    ...snapshot.tasks.map((task) => taskStore.put(task)),
    ...snapshot.projects.map((project) => projectStore.put(project)),
    metadataStore.put(true, 'initialized'),
    metadataStore.put(snapshot.nextProjectId, 'nextProjectId'),
    metadataStore.put(savedAt, 'lastSavedAt'),
    tx.done,
  ])
  return savedAt
}

// Дод. завдання 3: точкове видалення одного завдання методом delete().
// Змінюється лише один запис tasks і час збереження в metadata.
export async function deleteTaskRecord(id) {
  const db = await getDatabase()
  const tx = db.transaction(['tasks', 'metadata'], 'readwrite')
  const savedAt = new Date().toISOString()

  await Promise.all([
    tx.objectStore('tasks').delete(id),
    tx.objectStore('metadata').put(savedAt, 'lastSavedAt'),
    tx.done,
  ])
  return savedAt
}

// Дод. завдання 5: відомості для сторінки «Налаштування» — безпосередньо з IndexedDB.
export async function readStorageInfo() {
  const db = await getDatabase()
  const tx = db.transaction(['tasks', 'projects', 'metadata'], 'readonly')
  const metadata = tx.objectStore('metadata')
  const [taskCount, projectCount, initialized, nextProjectId, lastSavedAt] = await Promise.all([
    tx.objectStore('tasks').count(),
    tx.objectStore('projects').count(),
    metadata.get('initialized'),
    metadata.get('nextProjectId'),
    metadata.get('lastSavedAt'),
  ])
  await tx.done

  return {
    name: db.name,
    version: db.version,
    storeNames: [...db.objectStoreNames],
    taskCount,
    projectCount,
    initialized: initialized === true,
    nextProjectId,
    lastSavedAt,
  }
}
