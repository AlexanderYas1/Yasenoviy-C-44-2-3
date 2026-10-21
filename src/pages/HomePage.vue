<script setup>
import { computed } from 'vue'
import AppTabbar from '../components/AppTabbar.vue'
import TaskCard from '../components/TaskCard.vue'
import TaskCounter from '../components/TaskCounter.vue'
import { taskState, setTaskStatus, setTaskPriority } from '../store/tasks'
import '../css/task-components.css'

const totalTasks = computed(() => taskState.tasks.length)
const completedTasks = computed(() => taskState.tasks.filter(
  (task) => task.status === 'done').length)
const progressTasks = computed(() => taskState.tasks.filter(
  (task) => task.status === 'progress').length)
// Додаткове завдання 2: четвертий показник «Заплановано»
const todoTasks = computed(() => taskState.tasks.filter(
  (task) => task.status === 'todo').length)
// Додаткове завдання 4: відсоток виконаних завдань
const completedPercent = computed(() => totalTasks.value
  ? Math.round((completedTasks.value / totalTasks.value) * 100) : 0)
const activeTasks = computed(() => {
  const order = { high: 0, medium: 1, low: 2 }
  return taskState.tasks.filter((task) => task.status !== 'done')
    .sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 3)
})

function handleStatusChange(payload) { setTaskStatus(payload) }
function handlePriorityChange(payload) { setTaskPriority(payload) }
</script>

<template>
  <f7-page name="home" class="tf3-page">
    <f7-navbar title="TaskFlow">
      <f7-nav-right><f7-link href="/about/">Про застосунок</f7-link></f7-nav-right>
    </f7-navbar>

    <div class="tf3-container">
      <section class="tf3-hero">
        <div class="tf3-eyebrow">TASKFLOW / DASHBOARD</div>
        <h1>Панель керування</h1>
        <p>Контролюйте виконання завдань та їхні пріоритети.</p>
      </section>

      <!-- Додаткове завдання 3: показники через компонент TaskCounter -->
      <section class="tf3-stat-grid tf3-stat-grid--4">
        <TaskCounter label="Усього завдань" :count="totalTasks" />
        <TaskCounter label="Заплановано" :count="todoTasks" variant="todo" />
        <TaskCounter label="У роботі" :count="progressTasks" variant="progress" />
        <TaskCounter label="Виконано" :count="completedTasks" variant="done" />
      </section>

      <!-- Додаткове завдання 4: відсоток виконання -->
      <section class="tf3-progress" aria-label="Прогрес виконання">
        <div class="tf3-progress-head">
          <span class="tf3-stat-label">Виконано завдань</span>
          <strong class="tf3-progress-value">{{ completedPercent }}%</strong>
        </div>
        <div class="tf3-progress-bar" role="progressbar" :aria-valuenow="completedPercent"
          aria-valuemin="0" aria-valuemax="100">
          <div class="tf3-progress-fill" :style="{ width: `${completedPercent}%` }"></div>
        </div>
        <div class="tf3-progress-hint">{{ completedTasks }} з {{ totalTasks }}</div>
      </section>

      <section class="tf3-section">
        <div class="tf3-section-heading">
          <div><div class="tf3-eyebrow">PRIORITY TASKS</div>
            <h2>Актуальні завдання</h2></div>
          <f7-button href="/tasks/" outline small>Переглянути всі</f7-button>
        </div>
        <div v-if="activeTasks.length" class="tf3-task-grid">
          <TaskCard v-for="task in activeTasks" :key="task.id" :task="task"
            @status-change="handleStatusChange"
            @priority-change="handlePriorityChange" />
        </div>
        <div v-else class="tf3-empty">Наразі всі завдання виконані.</div>
      </section>
    </div>

    <!-- слот fixed: панель поза областю прокрутки, завжди внизу екрана (виправлення з 2.4) -->
    <template #fixed>
      <AppTabbar active="home" />
    </template>
  </f7-page>
</template>
