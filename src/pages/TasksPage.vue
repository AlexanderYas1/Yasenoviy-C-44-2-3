<script setup>
import { ref, computed } from 'vue'
import AppTabbar from '../components/AppTabbar.vue'
import TaskCard from '../components/TaskCard.vue'
import StatusBadge from '../components/StatusBadge.vue'
import PriorityBadge from '../components/PriorityBadge.vue'
import { taskState, setTaskStatus, setTaskPriority } from '../store/tasks'
import '../css/task-components.css'

const selectedStatus = ref('all')
const selectedPriority = ref('all')
const sortMode = ref('default') // додаткове завдання 6
const selectedTaskId = ref(null) // додаткове завдання 5

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

const filteredTasks = computed(() => taskState.tasks.filter((task) => (
  (selectedStatus.value === 'all' || task.status === selectedStatus.value) &&
  (selectedPriority.value === 'all' || task.priority === selectedPriority.value)
)))

// Додаткове завдання 6: сортування за рівнем пріоритету (копія масиву, стан не змінюється)
const priorityRank = { high: 3, medium: 2, low: 1 }
const visibleTasks = computed(() => {
  if (sortMode.value === 'default') return filteredTasks.value
  const direction = sortMode.value === 'priority-desc' ? -1 : 1
  return [...filteredTasks.value].sort(
    (a, b) => direction * (priorityRank[a.priority] - priorityRank[b.priority]))
})

const selectedTask = computed(() =>
  taskState.tasks.find((task) => task.id === selectedTaskId.value) || null)

function handleStatusChange(payload) { setTaskStatus(payload) }
function handlePriorityChange(payload) { setTaskPriority(payload) }
// Додаткове завдання 5: обробка події task-select у батьківській сторінці
function handleTaskSelect({ id }) {
  selectedTaskId.value = selectedTaskId.value === id ? null : id
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
      </section>

      <section class="tf3-filters">
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
          <div><div class="tf3-eyebrow">TASK LIST</div><h2>Список завдань</h2></div>
          <div class="tf3-counter">Знайдено: {{ filteredTasks.length }}</div>
        </div>
        <div v-if="visibleTasks.length" class="tf3-task-grid">
          <TaskCard v-for="task in visibleTasks" :key="task.id" :task="task"
            :selected="task.id === selectedTaskId"
            @status-change="handleStatusChange"
            @priority-change="handlePriorityChange"
            @task-select="handleTaskSelect" />
        </div>
        <div v-else class="tf3-empty">За обраними фільтрами завдань не знайдено.</div>
      </section>
    </div>

    <template #fixed>
      <AppTabbar active="tasks" />
    </template>
  </f7-page>
</template>
