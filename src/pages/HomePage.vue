<script setup>
import { storeToRefs } from 'pinia'
import AppTabbar from '../components/AppTabbar.vue'
import TaskCard from '../components/TaskCard.vue'
import TaskCounter from '../components/TaskCounter.vue'
import { useTasksStore } from '../store/tasks'
import { useProjectsStore } from '../store/projects'
import '../css/task-components.css'
import '../css/task-list.css'

const taskStore = useTasksStore()
const projectStore = useProjectsStore()
const {
  totalTasks,
  completedTasks,
  progressTasks,
  todoTasks, // 2.5, дод. завдання 2: четвертий показник
  completedPercent, // 2.5, дод. завдання 4: відсоток виконаних
  activeTasks,
} = storeToRefs(taskStore)
// 2.9, дод. завдання 2: projectStats обчислюється у сховищі — масив завдань не копіюється
const { projectCount, projectStats } = storeToRefs(projectStore)

function projectTitleFor(task) {
  return projectStore.projectTitle(task.projectId)
}
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
        <p>Контролюйте виконання завдань і пріоритети. Проєктів: {{ projectCount }}.</p>
      </section>

      <!-- 2.5, дод. завдання 3: показники через компонент TaskCounter -->
      <section class="tf3-stat-grid tf3-stat-grid--4">
        <TaskCounter label="Усього завдань" :count="totalTasks" />
        <TaskCounter label="Заплановано" :count="todoTasks" variant="todo" />
        <TaskCounter label="У роботі" :count="progressTasks" variant="progress" />
        <TaskCounter label="Виконано" :count="completedTasks" variant="done" />
      </section>

      <!-- 2.5, дод. завдання 4: відсоток виконання -->
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

      <!-- 2.9, дод. завдання 2–3: проєкти, невиконані завдання та відсоток виконання -->
      <section class="tf3-section tf6-home-projects" aria-label="Проєкти">
        <div class="tf3-section-heading">
          <div><div class="tf3-eyebrow">PROJECTS</div>
            <h2>Проєкти</h2></div>
        </div>
        <div class="tf6-home-project-grid">
          <div v-for="project in projectStats" :key="project.id" class="tf6-home-project">
            <div class="tf6-home-project-head">
              <strong>{{ project.title }}</strong>
              <span class="tf6-home-project-percent">{{ project.completedPercent }}%</span>
            </div>
            <div class="tf6-home-project-active">
              Невиконаних: <strong>{{ project.activeCount }}</strong>
              <span>&nbsp;· усього {{ project.taskCount }}</span>
            </div>
            <div class="tf3-progress-bar" role="progressbar" :aria-valuenow="project.completedPercent"
              aria-valuemin="0" aria-valuemax="100" :aria-label="`Виконання проєкту «${project.title}»`">
              <div class="tf3-progress-fill" :style="{ width: `${project.completedPercent}%` }"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="tf3-section">
        <div class="tf3-section-heading">
          <div><div class="tf3-eyebrow">PRIORITY TASKS</div>
            <h2>Актуальні завдання</h2></div>
          <f7-button href="/tasks/" outline small>Переглянути всі</f7-button>
        </div>
        <div v-if="activeTasks.length" class="tf3-task-grid">
          <TaskCard
            v-for="task in activeTasks"
            :key="task.id"
            :task="task"
            :project-title="projectTitleFor(task)"
            :show-management-actions="false"
            @status-change="taskStore.setTaskStatus"
            @priority-change="taskStore.setTaskPriority"
          />
        </div>
        <!-- 2.8, дод. завдання 5: окреме пояснення для порожнього списку -->
        <div v-else-if="!totalTasks" class="tf3-empty">
          Завдань немає — усі видалено. Додайте нове на вкладці «Мої завдання».
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
