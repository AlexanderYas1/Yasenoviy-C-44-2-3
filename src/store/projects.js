import { defineStore } from 'pinia'
import { useTasksStore } from './tasks'

// Окреме сховище для каталогу проєктів.
// Сховище лише в оперативній пам'яті: IndexedDB буде в наступній роботі.
export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [
      { id: 'general', title: 'Загальні' },
      { id: 'study', title: 'Навчання' },
      { id: 'personal', title: 'Особисті' },
    ],
    nextProjectId: 1,
  }),

  getters: {
    projectCount: (state) => state.projects.length,
    projectTitle: (state) => (id) =>
      state.projects.find((project) => project.id === id)?.title ?? 'Загальні',

    // 2.9, дод. завдання 1: кількість завдань у кожному проєкті (раніше — локальний computed у TasksPage).
    // Дод. завдання 2–3: також невиконані завдання та відсоток виконання completed / total × 100.
    projectStats(state) {
      // Інше сховище викликаємо всередині getter, а не на рівні модуля.
      const taskStore = useTasksStore()
      return state.projects.map((project) => {
        const projectTasks = taskStore.tasks.filter((task) => task.projectId === project.id)
        const taskCount = projectTasks.length
        const completedCount = projectTasks.filter((task) => task.status === 'done').length
        return {
          ...project,
          taskCount,
          completedCount,
          activeCount: taskCount - completedCount,
          // За нульового total показуємо 0 %, а не NaN.
          completedPercent: taskCount ? Math.round((completedCount / taskCount) * 100) : 0,
        }
      })
    },
  },

  actions: {
    addProject(rawTitle) {
      const title = String(rawTitle ?? '').trim()
      if (title.length < 3 || title.length > 40) return null

      const duplicate = this.projects.some(
        (project) => project.title.toLocaleLowerCase('uk-UA') ===
          title.toLocaleLowerCase('uk-UA'),
      )
      if (duplicate) return null

      const project = { id: `project-${this.nextProjectId}`, title }
      this.nextProjectId += 1
      this.projects.push(project)
      return project
    },
  },
})
