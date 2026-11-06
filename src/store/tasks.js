import { defineStore } from 'pinia'
import initialTasks from '../data/tasks'
import { useProjectsStore } from './projects'

// Робота 2.9: замість reactive-об'єкта taskState — Pinia-сховище.
// Дані лише в оперативній пам'яті: IndexedDB буде в наступній роботі.
const allowedStatuses = ['todo', 'progress', 'done']
const allowedPriorities = ['low', 'medium', 'high']
// 2.6, дод. завдання 1: категорія (необов'язкова, '' — не вказано)
const allowedCategories = ['study', 'work', 'personal']

const priorityRank = { high: 3, medium: 2, low: 1 }
// 2.8, дод. завдання 2: «У роботі» → «Заплановано» → «Виконано»
const statusRank = { progress: 1, todo: 2, done: 3 }

// 2.6, дод. завдання 7: порівняння назв без урахування регістру
function sameTitle(a, b) {
  return a.trim().toLocaleLowerCase('uk-UA') === b.trim().toLocaleLowerCase('uk-UA')
}

// Термін необов'язковий: порожній рядок означає «Без терміну»
function validDate(value) {
  if (value === '') return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const date = new Date(`${value}T12:00:00`)
  return !Number.isNaN(date.getTime()) &&
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` === value
}

function normalizeValues(values, projects) {
  const requestedProject = String(values.projectId ?? 'general')
  const projectId = projects.some((project) => project.id === requestedProject)
    ? requestedProject
    : 'general'

  return {
    title: String(values.title ?? '').trim(),
    description: String(values.description ?? '').trim(),
    status: allowedStatuses.includes(values.status) ? values.status : 'todo',
    priority: allowedPriorities.includes(values.priority) ? values.priority : 'medium',
    dueDate: String(values.dueDate ?? ''),
    category: allowedCategories.includes(values.category) ? values.category : '',
    projectId,
  }
}

function isValidTask(values) {
  return values.title.length >= 3 && values.title.length <= 80 &&
    values.description.length <= 500 &&
    validDate(values.dueDate)
}

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    // Старі записи без projectId належать проєкту «Загальні».
    tasks: initialTasks.map((task) => ({
      ...task,
      projectId: task.projectId ?? 'general',
    })),
    searchText: '',
    selectedStatus: 'all',
    selectedPriority: 'all',
    selectedProject: 'all',
    sortOrder: 'newest',
    onlyActive: false, // 2.8, дод. завдання 1: «Тільки невиконані»
    onlyNoDue: false, // 2.9, дод. завдання 5: «Лише без терміну»
  }),

  getters: {
    totalTasks: (state) => state.tasks.length,
    completedTasks: (state) =>
      state.tasks.filter((task) => task.status === 'done').length,
    progressTasks: (state) =>
      state.tasks.filter((task) => task.status === 'progress').length,
    // Четвертий показник головної сторінки (2.5, дод. завдання 2)
    todoTasks: (state) =>
      state.tasks.filter((task) => task.status === 'todo').length,
    // Відсоток виконання на головній сторінці (2.5, дод. завдання 4)
    completedPercent() {
      return this.totalTasks ? Math.round((this.completedTasks / this.totalTasks) * 100) : 0
    },
    activeTasks: (state) => {
      return state.tasks
        .filter((task) => task.status !== 'done')
        .sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority] || b.id - a.id)
        .slice(0, 3)
    },
    // 2.6, дод. завдання 7: чи є вже завдання з такою назвою
    titleExists: (state) => (title, exceptId = null) =>
      state.tasks.some((task) => task.id !== exceptId && sameTitle(task.title, title)),

    visibleTasks: (state) => {
      const term = state.searchText.trim().toLocaleLowerCase('uk-UA')

      const filtered = state.tasks.filter((task) => {
        const text = `${task.title} ${task.description ?? ''}`
          .toLocaleLowerCase('uk-UA')
        return (!term || text.includes(term)) &&
          (state.selectedStatus === 'all' || task.status === state.selectedStatus) &&
          (state.selectedPriority === 'all' || task.priority === state.selectedPriority) &&
          (state.selectedProject === 'all' || task.projectId === state.selectedProject) &&
          (!state.onlyActive || task.status !== 'done') &&
          (!state.onlyNoDue || !task.dueDate)
      })

      // sort() застосовуємо до нового масиву, а не до state.tasks.
      return filtered.sort((a, b) => {
        if (state.sortOrder === 'title') {
          return a.title.localeCompare(b.title, 'uk-UA') || a.id - b.id
        }
        if (state.sortOrder === 'priority') {
          return priorityRank[b.priority] - priorityRank[a.priority] || b.id - a.id
        }
        if (state.sortOrder === 'priority-asc') {
          return priorityRank[a.priority] - priorityRank[b.priority] || b.id - a.id
        }
        if (state.sortOrder === 'status') {
          return statusRank[a.status] - statusRank[b.status] || b.id - a.id
        }
        if (state.sortOrder === 'dueDate') {
          return (a.dueDate || '9999-12-31').localeCompare(
            b.dueDate || '9999-12-31',
          ) || b.id - a.id
        }
        if (state.sortOrder === 'dueDate-desc') {
          // Найпізніший термін першим, порожні дати — так само в кінці.
          if (!a.dueDate !== !b.dueDate) return a.dueDate ? -1 : 1
          return (b.dueDate || '').localeCompare(a.dueDate || '') || b.id - a.id
        }
        return b.id - a.id
      })
    },
  },

  actions: {
    // Повертає створене завдання або null (сторінка показує його назву в повідомленні).
    addTask(values) {
      const projectStore = useProjectsStore()
      const normalized = normalizeValues(values, projectStore.projects)
      if (!isValidTask(normalized)) return null
      // 2.6, дод. завдання 7: повторна перевірка унікальності назви на рівні сховища
      if (this.titleExists(normalized.title)) return null

      const nextId = Math.max(0, ...this.tasks.map((task) => task.id)) + 1
      const task = { id: nextId, ...normalized }
      this.tasks.unshift(task)
      return task
    },

    updateTask(values) {
      const task = this.tasks.find((item) => item.id === Number(values.id))
      if (!task) return null

      const projectStore = useProjectsStore()
      const normalized = normalizeValues(values, projectStore.projects)
      if (!isValidTask(normalized)) return null

      Object.assign(task, normalized)
      return task
    },

    deleteTask(id) {
      const index = this.tasks.findIndex((task) => task.id === Number(id))
      if (index === -1) return false
      this.tasks.splice(index, 1)
      return true
    },

    setTaskStatus({ id, status }) {
      if (!allowedStatuses.includes(status)) return false
      const task = this.tasks.find((item) => item.id === Number(id))
      if (!task) return false
      task.status = status
      return true
    },

    setTaskPriority({ id, priority }) {
      if (!allowedPriorities.includes(priority)) return false
      const task = this.tasks.find((item) => item.id === Number(id))
      if (!task) return false
      task.priority = priority
      return true
    },

    // 2.9, дод. завдання 4: групове переведення завдань проєкту до статусу «У роботі».
    // Підтвердження запитує сторінка; action повертає кількість змінених завдань.
    startProjectTasks(projectId) {
      let changed = 0
      this.tasks.forEach((task) => {
        if (task.projectId === projectId && task.status !== 'progress') {
          task.status = 'progress'
          changed += 1
        }
      })
      return changed
    },

    resetFilters() {
      this.searchText = ''
      this.selectedStatus = 'all'
      this.selectedPriority = 'all'
      this.selectedProject = 'all'
      this.sortOrder = 'newest'
      this.onlyActive = false
      this.onlyNoDue = false
    },
  },
})
