<script setup>
import { computed, nextTick, ref } from 'vue'
import AppTabbar from '../components/AppTabbar.vue'
import TaskCard from '../components/TaskCard.vue'
import TaskForm from '../components/TaskForm.vue'
import StatusBadge from '../components/StatusBadge.vue'
import PriorityBadge from '../components/PriorityBadge.vue'
import {
  taskState,
  addTask,
  updateTask,
  setTaskStatus,
  setTaskPriority,
} from '../store/tasks'
import '../css/task-components.css'
import '../css/task-form.css'

const selectedStatus = ref('all')
const selectedPriority = ref('all')
const sortMode = ref('default') // заняття 2.5, дод. завдання 6
const selectedTaskId = ref(null) // заняття 2.5, дод. завдання 5
const formVisible = ref(false)
const editingId = ref(null)
const formAnchor = ref(null)
const feedback = ref('')
const searchQuery = ref('') // додаткове завдання 6: пошук за назвою

const statusOptions = [
  { value: 'all', label: 'Усі' },
  { value: 'todo', label: 'Заплановано' },
  { value: 'progress', label: 'У роботі' },
  { value: 'done', label: 'Виконано' },
]
const priorityOptions = [
  { value: 'all', label: 'Усі' },
  { value: 'low', label: 'Низький' },
  { value: 'medium', label: 'Середній' },
  { value: 'high', label: 'Високий' },
]
const sortOptions = [
  { value: 'default', label: 'Як у списку' },
  { value: 'priority-desc', label: 'Спершу високий' },
  { value: 'priority-asc', label: 'Спершу низький' },
]

const normalizedQuery = computed(() => searchQuery.value.trim().toLocaleLowerCase('uk'))
const filteredTasks = computed(() => taskState.tasks.filter((task) => (
  (selectedStatus.value === 'all' || task.status === selectedStatus.value) &&
  (selectedPriority.value === 'all' || task.priority === selectedPriority.value) &&
  (!normalizedQuery.value || task.title.toLocaleLowerCase('uk').includes(normalizedQuery.value))
)))
// Додаткове завдання 7: назви для перевірки унікальності у формі
const existingTitles = computed(() => taskState.tasks.map((task) => task.title))

const priorityRank = { high: 3, medium: 2, low: 1 }
const visibleTasks = computed(() => {
  if (sortMode.value === 'default') return filteredTasks.value
  const direction = sortMode.value === 'priority-desc' ? -1 : 1
  return [...filteredTasks.value].sort(
    (a, b) => direction * (priorityRank[a.priority] - priorityRank[b.priority]))
})

const editingTask = computed(() => (
  taskState.tasks.find((task) => task.id === editingId.value) ?? null
))
const selectedTask = computed(() =>
  taskState.tasks.find((task) => task.id === selectedTaskId.value) || null)

function handleStatusChange(payload) { setTaskStatus(payload) }
function handlePriorityChange(payload) { setTaskPriority(payload) }
function handleTaskSelect({ id }) {
  selectedTaskId.value = selectedTaskId.value === id ? null : id
}

async function scrollToForm() {
  await nextTick()
  formAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function createTask() {
  editingId.value = null
  formVisible.value = true
  feedback.value = ''
  await scrollToForm()
}

async function editTask(id) {
  editingId.value = id
  formVisible.value = true
  feedback.value = ''
  await scrollToForm()
}

function cancelForm() {
  formVisible.value = false
  editingId.value = null
}

function saveTask(data) {
  const isEditing = editingId.value !== null
  const saved = isEditing
    ? updateTask({ id: editingId.value, ...data })
    : addTask(data)

  if (!saved) {
    feedback.value = 'Не вдалося зберегти завдання. Перевірте дані форми.'
    return
  }

  feedback.value = isEditing
    ? `Завдання «${saved.title}» оновлено.`
    : `Завдання «${saved.title}» створено.`
  cancelForm()
  selectedStatus.value = 'all'
  selectedPriority.value = 'all'
  searchQuery.value = '' // щоб нове/змінене завдання було видно у списку
}
</script>

<template>
  <f7-page name="tasks" class="tf3-page">
    <f7-navbar title="Мої завдання" />

    <div class="tf3-container">
      <section class="tf3-hero">
        <div class="tf3-eyebrow">TASKFLOW / TASK MANAGER</div>
        <h1>Мої завдання</h1>
        <p>Керуйте завданнями, статусами та пріоритетами.</p>
        <button type="button" class="tf4-new-task" @click="createTask">
          + Додати завдання
        </button>
      </section>

      <p v-if="feedback" class="tf4-feedback" role="status">{{ feedback }}</p>

      <section v-if="formVisible" ref="formAnchor" class="tf4-form-section">
        <TaskForm :key="editingId ?? 'new'" :task="editingTask"
          :existing-titles="existingTitles"
          @save="saveTask" @cancel="cancelForm" />
      </section>

      <section class="tf3-filters">
        <!-- Додаткове завдання 6: пошук за назвою реагує на кожне введення -->
        <div class="tf3-filter-group">
          <label class="tf3-filter-title" for="tf4-search">Пошук за назвою</label>
          <div class="tf4-search">
            <input id="tf4-search" v-model="searchQuery" type="search"
              placeholder="Почніть вводити назву завдання…" autocomplete="off" />
            <button v-if="searchQuery" type="button" class="tf4-search-clear"
              aria-label="Очистити пошук" @click="searchQuery = ''">×</button>
          </div>
        </div>
        <div class="tf3-filter-group">
          <div class="tf3-filter-title">Фільтр за статусом</div>
          <div class="tf3-filter-buttons">
            <button v-for="option in statusOptions" :key="option.value"
              type="button" class="tf3-filter-button"
              :class="{ 'is-active': selectedStatus === option.value }"
              :aria-pressed="selectedStatus === option.value"
              @click="selectedStatus = option.value">{{ option.label }}</button>
          </div>
        </div>
        <div class="tf3-filter-group">
          <div class="tf3-filter-title">Фільтр за пріоритетом</div>
          <div class="tf3-filter-buttons">
            <button v-for="option in priorityOptions" :key="option.value"
              type="button" class="tf3-filter-button"
              :class="{ 'is-active': selectedPriority === option.value }"
              :aria-pressed="selectedPriority === option.value"
              @click="selectedPriority = option.value">{{ option.label }}</button>
          </div>
        </div>
        <div class="tf3-filter-group">
          <div class="tf3-filter-title">Сортування за пріоритетом</div>
          <div class="tf3-filter-buttons">
            <button v-for="option in sortOptions" :key="option.value"
              type="button" class="tf3-filter-button"
              :class="{ 'is-active': sortMode === option.value }"
              :aria-pressed="sortMode === option.value"
              @click="sortMode = option.value">{{ option.label }}</button>
          </div>
        </div>
      </section>

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
          <div class="tf3-counter">Знайдено: {{ filteredTasks.length }}</div>
        </div>
        <div v-if="visibleTasks.length" class="tf3-task-grid">
          <TaskCard v-for="task in visibleTasks" :key="task.id"
            :task="task" :editable="true"
            :selected="task.id === selectedTaskId"
            @status-change="handleStatusChange"
            @priority-change="handlePriorityChange"
            @task-select="handleTaskSelect"
            @edit="editTask" />
        </div>
        <div v-else class="tf3-empty">
          <template v-if="normalizedQuery">За запитом «{{ searchQuery.trim() }}» завдань не знайдено.</template>
          <template v-else>За обраними фільтрами завдань не знайдено.</template>
        </div>
      </section>
    </div>

    <template #fixed>
      <AppTabbar active="tasks" />
    </template>
  </f7-page>
</template>
