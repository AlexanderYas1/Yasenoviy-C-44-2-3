<script setup>
import { computed, nextTick, ref } from 'vue'
import AppTabbar from '../components/AppTabbar.vue'
import TaskCard from '../components/TaskCard.vue'
import TaskForm from '../components/TaskForm.vue'
import TaskListControls from '../components/TaskListControls.vue'
import StatusBadge from '../components/StatusBadge.vue'
import PriorityBadge from '../components/PriorityBadge.vue'
import {
  taskState,
  addTask,
  updateTask,
  deleteTask,
  setTaskStatus,
  setTaskPriority,
} from '../store/tasks'
import '../css/task-components.css'
import '../css/task-form.css'
import '../css/task-list.css'

const searchText = ref('')
const selectedStatus = ref('all')
const selectedPriority = ref('all')
const sortOrder = ref('newest')
const onlyActive = ref(false) // дод. завдання 1

const showForm = ref(false)
const editingId = ref(null)
const formAnchor = ref(null) // 2.6: прокрутка до форми
const feedback = ref('') // 2.6: повідомлення про результат дії
const selectedTaskId = ref(null) // 2.5, дод. завдання 5

const editingTask = computed(
  () => taskState.tasks.find((task) => task.id === editingId.value) ?? null,
)
const selectedTask = computed(
  () => taskState.tasks.find((task) => task.id === selectedTaskId.value) ?? null,
)
// 2.6, дод. завдання 7: назви для перевірки унікальності у формі
const existingTitles = computed(() => taskState.tasks.map((task) => task.title))

const visibleTasks = computed(() => {
  const term = searchText.value.trim().toLocaleLowerCase('uk-UA')
  const priorityWeight = { high: 3, medium: 2, low: 1 }
  // Дод. завдання 2: «У роботі» → «Заплановано» → «Виконано»
  const statusWeight = { progress: 1, todo: 2, done: 3 }

  // filter() створює новий масив: вихідний стан не змінюється.
  const result = taskState.tasks.filter((task) => {
    const matchesText = !term ||
      `${task.title} ${task.description ?? ''}`.toLocaleLowerCase('uk-UA').includes(term)
    const matchesStatus =
      selectedStatus.value === 'all' || task.status === selectedStatus.value
    const matchesPriority =
      selectedPriority.value === 'all' || task.priority === selectedPriority.value
    const matchesActive = !onlyActive.value || task.status !== 'done'

    return matchesText && matchesStatus && matchesPriority && matchesActive
  })

  // Сортуємо лише копію, щоб не змінювати taskState.tasks.
  return result.sort((a, b) => {
    if (sortOrder.value === 'title') {
      return a.title.localeCompare(b.title, 'uk-UA') || a.id - b.id
    }
    if (sortOrder.value === 'priority') {
      return priorityWeight[b.priority] - priorityWeight[a.priority] || b.id - a.id
    }
    if (sortOrder.value === 'priority-asc') {
      return priorityWeight[a.priority] - priorityWeight[b.priority] || b.id - a.id
    }
    if (sortOrder.value === 'status') {
      return statusWeight[a.status] - statusWeight[b.status] || b.id - a.id
    }
    if (sortOrder.value === 'dueDate') {
      // Порожні дати завжди після заповнених.
      const first = a.dueDate || '9999-12-31'
      const second = b.dueDate || '9999-12-31'
      return first.localeCompare(second) || b.id - a.id
    }
    if (sortOrder.value === 'dueDate-desc') {
      // Дод. завдання 6: найпізніший термін першим, порожні дати — так само в кінці.
      if (!a.dueDate !== !b.dueDate) return a.dueDate ? -1 : 1
      return (b.dueDate || '').localeCompare(a.dueDate || '') || b.id - a.id
    }
    return b.id - a.id
  })
})

// Дод. завдання 3: частка виконаних серед знайдених завдань
const donePercent = computed(() => {
  if (!visibleTasks.value.length) return 0
  const done = visibleTasks.value.filter((task) => task.status === 'done').length
  return Math.round((done / visibleTasks.value.length) * 100)
})

function resetFilters() {
  searchText.value = ''
  selectedStatus.value = 'all'
  selectedPriority.value = 'all'
  sortOrder.value = 'newest'
  onlyActive.value = false
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
  const saved = isEditing ? updateTask(values) : addTask(values)

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
}

function handleTaskSelect({ id }) {
  selectedTaskId.value = selectedTaskId.value === id ? null : id
}

function handleDelete(id) {
  const task = taskState.tasks.find((item) => item.id === id)
  if (!task) return

  const confirmed = window.confirm(`Видалити завдання «${task.title}»?`)
  if (!confirmed) return

  if (deleteTask(id)) {
    feedback.value = `Завдання «${task.title}» видалено.`
    if (editingId.value === id) cancelForm()
    if (selectedTaskId.value === id) selectedTaskId.value = null
  }
}
</script>

<template>
  <f7-page name="tasks" class="tf3-page">
    <f7-navbar title="Мої завдання" />

    <div class="tf3-container">
      <section class="tf3-hero">
        <div class="tf3-eyebrow">TASKFLOW / TASK MANAGER</div>
        <h1>Керування завданнями</h1>
        <p>Створюйте, редагуйте, знаходьте, сортуйте та видаляйте завдання.</p>
        <button type="button" class="tf5-btn tf5-btn--primary tf5-new" @click="startCreate">
          + Додати завдання
        </button>
      </section>

      <p v-if="feedback" class="tf4-feedback" role="status">{{ feedback }}</p>

      <section v-if="showForm" ref="formAnchor" class="tf4-form-section">
        <TaskForm
          :key="editingId ?? 'new'"
          :task="editingTask"
          :existing-titles="existingTitles"
          @save="saveTask"
          @cancel="cancelForm"
        />
      </section>

      <TaskListControls
        v-model:search="searchText"
        v-model:status="selectedStatus"
        v-model:priority="selectedPriority"
        v-model:sort="sortOrder"
        v-model:only-active="onlyActive"
        @reset="resetFilters"
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
              Показано: {{ visibleTasks.length }} із {{ taskState.tasks.length }}
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
            :editable="true"
            :selected="task.id === selectedTaskId"
            @status-change="setTaskStatus"
            @priority-change="setTaskPriority"
            @task-select="handleTaskSelect"
            @edit="startEdit"
            @delete="handleDelete"
          />
        </div>
        <!-- Дод. завдання 5: окреме пояснення, коли видалено всі завдання -->
        <div v-else-if="!taskState.tasks.length" class="tf5-empty tf5-empty--all">
          <p><strong>Список завдань порожній.</strong></p>
          <p>Усі завдання видалено. Створіть нове завдання — воно з’явиться тут і на головній сторінці.</p>
          <button type="button" class="tf5-btn tf5-btn--primary" @click="startCreate">
            + Додати завдання
          </button>
        </div>
        <div v-else class="tf5-empty">
          <p>За поточними умовами завдань не знайдено.</p>
          <button type="button" class="tf5-btn" @click="resetFilters">
            Показати всі завдання
          </button>
        </div>
      </section>
    </div>

    <template #fixed>
      <AppTabbar active="tasks" />
    </template>
  </f7-page>
</template>
