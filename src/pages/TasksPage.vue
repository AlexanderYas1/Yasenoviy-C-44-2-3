<script setup>
import { computed, nextTick, ref } from 'vue'
import { storeToRefs } from 'pinia'
import AppTabbar from '../components/AppTabbar.vue'
import TaskCard from '../components/TaskCard.vue'
import TaskForm from '../components/TaskForm.vue'
import TaskListControls from '../components/TaskListControls.vue'
import StatusBadge from '../components/StatusBadge.vue'
import PriorityBadge from '../components/PriorityBadge.vue'
import { useTasksStore } from '../store/tasks'
import { useProjectsStore } from '../store/projects'
import { persistenceState, retrySave } from '../services/persistence'
import { downloadExport, parseImport } from '../services/transfer'
import '../css/task-components.css'
import '../css/task-form.css'
import '../css/task-list.css'
import '../css/persistence.css'

const taskStore = useTasksStore()
const projectStore = useProjectsStore()

// Для деструктуризації реактивного стану й getters використовуємо storeToRefs().
const {
  tasks,
  visibleTasks,
  searchText,
  selectedStatus,
  selectedPriority,
  selectedProject,
  sortOrder,
  onlyActive,
  onlyNoDue,
} = storeToRefs(taskStore)
// 2.9, дод. завдання 1: projectStats — getter сховища замість локального computed
const { projects, projectStats } = storeToRefs(projectStore)

// Стан відкриття форми локальний: іншим сторінкам він не потрібен.
const showForm = ref(false)
const editingId = ref(null)
const newProjectTitle = ref('')
const newProjectError = ref('')
const formAnchor = ref(null) // 2.6: прокрутка до форми
const feedback = ref('') // 2.6: повідомлення про результат дії
const selectedTaskId = ref(null) // 2.5, дод. завдання 5

const editingTask = computed(
  () => tasks.value.find((task) => task.id === editingId.value) ?? null,
)
const selectedTask = computed(
  () => tasks.value.find((task) => task.id === selectedTaskId.value) ?? null,
)
// 2.6, дод. завдання 7: назви для перевірки унікальності у формі
const existingTitles = computed(() => tasks.value.map((task) => task.title))

// 2.8, дод. завдання 3: частка виконаних серед знайдених завдань
const donePercent = computed(() => {
  if (!visibleTasks.value.length) return 0
  const done = visibleTasks.value.filter((task) => task.status === 'done').length
  return Math.round((done / visibleTasks.value.length) * 100)
})

// 2.9, дод. завдання 4: скільки завдань обраного проєкту ще не «У роботі»
const currentProject = computed(() =>
  projectStats.value.find((project) => project.id === selectedProject.value) ?? null,
)
const tasksToStart = computed(() => tasks.value.filter(
  (task) => task.projectId === selectedProject.value && task.status !== 'progress',
).length)

// Робота 2.10: інтерфейс не повідомляє про успіх до завершення фактичного запису.
const saveMessage = computed(() => {
  if (persistenceState.status === 'loading') return 'Завантаження локальних даних…'
  if (persistenceState.status === 'saving') return 'Збереження змін у IndexedDB…'
  if (persistenceState.status === 'saved') return 'Усі зміни збережено в цьому браузері.'
  return persistenceState.error || 'Помилка локального збереження.'
})
// 2.10, дод. завдання 4: дата й час останнього успішного запису з metadata.lastSavedAt
const lastSavedText = computed(() => (persistenceState.lastSavedAt
  ? new Intl.DateTimeFormat('uk-UA', { dateStyle: 'long', timeStyle: 'medium' })
    .format(persistenceState.lastSavedAt)
  : '—'))

// 2.10, дод. завдання 1–2: експорт та імпорт JSON
const importInput = ref(null)
const transferError = ref('')

function exportJson() {
  const data = downloadExport(tasks.value, projects.value)
  transferError.value = ''
  feedback.value = `Експортовано завдань: ${data.tasks.length}, проєктів: ${data.projects.length}.`
}

async function importJson(event) {
  const file = event.target.files?.[0]
  event.target.value = '' // той самий файл можна обрати повторно
  if (!file) return

  let data
  try {
    data = parseImport(await file.text())
  } catch (error) {
    transferError.value = `Імпорт неможливий: ${error.message}`
    return
  }
  transferError.value = ''

  const confirmed = window.confirm(
    `Імпорт замінить поточні дані (${tasks.value.length} завдань, ${projects.value.length} проєктів) ` +
    `вмістом файлу «${file.name}»: ${data.tasks.length} завдань, ${data.projects.length} проєктів. Продовжити?`,
  )
  if (!confirmed) return

  cancelForm()
  selectedTaskId.value = null
  taskStore.resetFilters()
  // Обидва $patch виконуються синхронно — persistence.js запише їх одним знімком.
  projectStore.$patch({ projects: data.projects, nextProjectId: data.nextProjectId })
  taskStore.$patch({ tasks: data.tasks })
  feedback.value = `Імпортовано з «${file.name}»: завдань — ${data.tasks.length}, проєктів — ${data.projects.length}.`
}

async function scrollToForm() {
  await nextTick()
  formAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function startCreate() {
  editingId.value = null
  showForm.value = true
  feedback.value = ''
  await scrollToForm()
}

async function startEdit(id) {
  editingId.value = id
  showForm.value = true
  feedback.value = ''
  await scrollToForm()
}

function cancelForm() {
  editingId.value = null
  showForm.value = false
}

function saveTask(values) {
  const isEditing = values.id !== null
  const saved = isEditing ? taskStore.updateTask(values) : taskStore.addTask(values)

  if (!saved) {
    feedback.value = 'Не вдалося зберегти завдання. Перевірте дані форми.'
    return
  }

  feedback.value = isEditing
    ? `Завдання «${saved.title}» оновлено.`
    : `Завдання «${saved.title}» створено.`
  cancelForm()
  // 2.6: щоб нове/змінене завдання було видно у списку
  searchText.value = ''
  selectedStatus.value = 'all'
  selectedPriority.value = 'all'
  onlyActive.value = false
  onlyNoDue.value = false
  if (selectedProject.value !== 'all' && selectedProject.value !== saved.projectId) {
    selectedProject.value = 'all'
  }
}

function handleTaskSelect({ id }) {
  selectedTaskId.value = selectedTaskId.value === id ? null : id
}

function handleDelete(id) {
  const task = tasks.value.find((item) => item.id === Number(id))
  if (!task) return

  if (!window.confirm(`Видалити завдання «${task.title}»?`)) return

  if (taskStore.deleteTask(id)) {
    feedback.value = `Завдання «${task.title}» видалено.`
    if (editingId.value === id) cancelForm()
    if (selectedTaskId.value === id) selectedTaskId.value = null
  }
}

function createProject() {
  const project = projectStore.addProject(newProjectTitle.value)
  if (!project) {
    newProjectError.value = 'Назва: 3–40 символів. Не повторюйте назви проєктів.'
    return
  }
  newProjectTitle.value = ''
  newProjectError.value = ''
  feedback.value = `Проєкт «${project.title}» створено.`
  selectedProject.value = project.id
}

// 2.9, дод. завдання 4: окреме підтвердження перед груповою зміною статусу
function startProjectTasks() {
  const project = currentProject.value
  if (!project || !tasksToStart.value) return

  const confirmed = window.confirm(
    `Перевести всі завдання проєкту «${project.title}» (${tasksToStart.value}) у статус «У роботі»?`,
  )
  if (!confirmed) return

  const changed = taskStore.startProjectTasks(project.id)
  feedback.value = `Проєкт «${project.title}»: у статус «У роботі» переведено завдань — ${changed}.`
}
</script>

<template>
  <f7-page name="tasks" class="tf3-page">
    <f7-navbar title="Мої завдання" />

    <div class="tf3-container">
      <section class="tf3-hero">
        <div class="tf3-eyebrow">TASKFLOW / TASK MANAGER</div>
        <h1>Керування завданнями і проєктами</h1>
        <p>Pinia керує станом, IndexedDB зберігає завдання та проєкти локально.</p>
        <button type="button" class="tf5-btn tf5-btn--primary tf5-new" @click="startCreate">
          + Додати завдання
        </button>
      </section>

      <section
        class="tf7-persistence"
        :class="`tf7-persistence--${persistenceState.status}`"
        role="status"
        aria-live="polite"
      >
        <strong>Локальне збереження</strong>
        <span>{{ saveMessage }}</span>
        <button
          v-if="persistenceState.canRetry"
          type="button"
          class="tf5-btn"
          @click="retrySave"
        >
          Повторити збереження
        </button>
        <!-- 2.10, дод. завдання 4 і 6: час останнього запису, зміни з іншої вкладки -->
        <div class="tf7-persistence-meta">
          Останнє збереження: <time class="tf7-saved-at">{{ lastSavedText }}</time>
          <span v-if="persistenceState.remoteNotice" class="tf7-remote">
            · {{ persistenceState.remoteNotice }}
          </span>
        </div>
      </section>

      <!-- 2.10, дод. завдання 1–2, 5: експорт, імпорт, сторінка «Налаштування» -->
      <section class="tf7-data-tools" aria-label="Резервна копія даних">
        <button type="button" class="tf5-btn tf7-export" @click="exportJson">Експорт JSON</button>
        <button type="button" class="tf5-btn tf7-import" @click="importInput?.click()">Імпорт JSON</button>
        <input ref="importInput" type="file" accept="application/json,.json" class="tf7-file"
          aria-label="Файл JSON для імпорту" @change="importJson" />
        <f7-link href="/settings/" class="tf7-settings-link">Налаштування сховища →</f7-link>
      </section>
      <p v-if="transferError" class="tf5-error tf7-transfer-error" role="alert">{{ transferError }}</p>

      <p v-if="feedback" class="tf4-feedback" role="status">{{ feedback }}</p>

      <section class="tf5-panel tf6-project-panel" aria-label="Проєкти">
        <h2>Мої проєкти</h2>
        <div class="tf6-project-list">
          <!-- 2.9, дод. завдання 3: відсоток виконання в кожному проєкті -->
          <span v-for="project in projectStats" :key="project.id" class="tf6-project-pill"
            :class="{ 'is-current': project.id === selectedProject }"
            :title="`Виконано ${project.completedCount} із ${project.taskCount}`">
            {{ project.title }} <strong>{{ project.taskCount }}</strong>
            <em class="tf6-project-percent">{{ project.completedPercent }}%</em>
          </span>
        </div>
        <form class="tf6-project-form" @submit.prevent="createProject">
          <label>
            Назва нового проєкту
            <input
              v-model="newProjectTitle"
              type="text"
              maxlength="40"
              placeholder="Наприклад: Лабораторні"
              @input="newProjectError = ''"
            />
          </label>
          <button type="submit" class="tf5-btn tf5-btn--primary">Створити проєкт</button>
        </form>
        <p v-if="newProjectError" class="tf5-error" role="alert">{{ newProjectError }}</p>

        <!-- 2.9, дод. завдання 4: групова зміна статусу для обраного у фільтрі проєкту -->
        <div v-if="currentProject" class="tf6-bulk">
          <span>
            Обраний проєкт: <strong>{{ currentProject.title }}</strong> ·
            завдань не «У роботі»: {{ tasksToStart }}
          </span>
          <button type="button" class="tf5-btn tf6-bulk-btn" :disabled="!tasksToStart"
            @click="startProjectTasks">
            Усі завдання проєкту → «У роботі»
          </button>
        </div>
      </section>

      <section v-if="showForm" ref="formAnchor" class="tf4-form-section">
        <TaskForm
          :key="editingId ?? 'new'"
          :task="editingTask"
          :projects="projects"
          :existing-titles="existingTitles"
          @save="saveTask"
          @cancel="cancelForm"
        />
      </section>

      <TaskListControls
        v-model:search="searchText"
        v-model:status="selectedStatus"
        v-model:priority="selectedPriority"
        v-model:project="selectedProject"
        v-model:sort="sortOrder"
        v-model:only-active="onlyActive"
        v-model:only-no-due="onlyNoDue"
        :projects="projects"
        @reset="taskStore.resetFilters"
      />

      <section v-if="selectedTask" class="tf3-selected" aria-live="polite">
        <div>
          <div class="tf3-eyebrow">ОБРАНЕ ЗАВДАННЯ</div>
          <div class="tf3-selected-title">{{ selectedTask.title }}</div>
          <div class="tf3-selected-badges">
            <StatusBadge :status="selectedTask.status" />
            <PriorityBadge :priority="selectedTask.priority" />
          </div>
        </div>
        <button type="button" class="tf3-action" @click="selectedTaskId = null">Скасувати вибір</button>
      </section>

      <section class="tf3-section">
        <div class="tf3-section-heading">
          <div>
            <div class="tf3-eyebrow">TASK LIST</div>
            <h2>Список завдань</h2>
          </div>
          <div class="tf5-counters">
            <div class="tf3-counter">
              Показано: {{ visibleTasks.length }} із {{ tasks.length }}
            </div>
            <div class="tf3-counter tf5-done-share" title="Частка виконаних серед показаних завдань">
              Виконано: {{ donePercent }}%
            </div>
          </div>
        </div>

        <div v-if="visibleTasks.length" class="tf3-task-grid">
          <TaskCard
            v-for="task in visibleTasks"
            :key="task.id"
            :task="task"
            :project-title="projectStore.projectTitle(task.projectId)"
            :selected="task.id === selectedTaskId"
            @status-change="taskStore.setTaskStatus"
            @priority-change="taskStore.setTaskPriority"
            @task-select="handleTaskSelect"
            @edit="startEdit"
            @delete="handleDelete"
          />
        </div>
        <!-- 2.8, дод. завдання 5: окреме пояснення, коли видалено всі завдання -->
        <div v-else-if="!tasks.length" class="tf5-empty tf5-empty--all">
          <p><strong>Список завдань порожній.</strong></p>
          <p>Усі завдання видалено. Створіть нове завдання — воно з’явиться тут і на головній сторінці.</p>
          <button type="button" class="tf5-btn tf5-btn--primary" @click="startCreate">
            + Додати завдання
          </button>
        </div>
        <div v-else class="tf5-empty">
          <p>За поточними умовами завдань не знайдено.</p>
          <button type="button" class="tf5-btn" @click="taskStore.resetFilters">
            Показати всі завдання
          </button>
        </div>
      </section>
    </div>

    <!-- слот fixed: панель поза областю прокрутки, завжди внизу екрана (виправлення з 2.4) -->
    <template #fixed>
      <AppTabbar active="tasks" />
    </template>
  </f7-page>
</template>
