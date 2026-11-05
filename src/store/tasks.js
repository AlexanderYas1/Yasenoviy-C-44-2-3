import { reactive } from 'vue'
import initialTasks from '../data/tasks'

// Єдине реактивне сховище для HomePage і TasksPage.
// Pinia та IndexedDB будемо використовувати в наступних роботах.
const allowedStatuses = ['todo', 'progress', 'done']
const allowedPriorities = ['low', 'medium', 'high']
// 2.6, дод. завдання 1: категорія (необов'язкова, '' — не вказано)
const allowedCategories = ['study', 'work', 'personal']

export const taskState = reactive({
  tasks: initialTasks.map((task) => ({ ...task })),
})

function findTask(id) {
  return taskState.tasks.find((task) => task.id === Number(id))
}

// 2.6, дод. завдання 7: порівняння назв без урахування регістру
function sameTitle(a, b) {
  return a.trim().toLocaleLowerCase('uk') === b.trim().toLocaleLowerCase('uk')
}

export function titleExists(title, exceptId = null) {
  return taskState.tasks.some((task) => task.id !== exceptId && sameTitle(task.title, title))
}

// Термін необов'язковий: порожній рядок означає «Без терміну»
function validDate(value) {
  if (value === '') return true
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T12:00:00`)
  return !Number.isNaN(date.getTime()) &&
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` === value
}

function normalizeTaskData(data) {
  if (!data || typeof data !== 'object') return null

  const title = typeof data.title === 'string' ? data.title.trim() : ''
  const description = typeof data.description === 'string'
    ? data.description.trim()
    : ''
  const dueDate = data.dueDate || ''

  if (title.length < 3 || title.length > 80) return null
  if (description.length > 500) return null
  if (!allowedStatuses.includes(data.status)) return null
  if (!allowedPriorities.includes(data.priority)) return null
  if (!validDate(dueDate)) return null
  const category = data.category ?? ''
  if (category !== '' && !allowedCategories.includes(category)) return null

  return {
    title,
    description,
    status: data.status,
    priority: data.priority,
    dueDate,
    category,
  }
}

export function addTask(data) {
  const normalized = normalizeTaskData(data)
  if (!normalized) return null
  // 2.6, дод. завдання 7: повторна перевірка унікальності назви на рівні сховища
  if (titleExists(normalized.title)) return null

  const nextId = Math.max(0, ...taskState.tasks.map((task) => task.id)) + 1
  const newTask = { id: nextId, ...normalized }
  taskState.tasks.unshift(newTask)
  return newTask
}

export function updateTask({ id, ...data }) {
  const task = findTask(id)
  if (!task) return null

  const normalized = normalizeTaskData(data)
  if (!normalized) return null

  Object.assign(task, normalized)
  return task
}

export function setTaskStatus({ id, status }) {
  if (!allowedStatuses.includes(status)) return false
  const task = findTask(id)
  if (!task) return false
  task.status = status
  return true
}

export function setTaskPriority({ id, priority }) {
  if (!allowedPriorities.includes(priority)) return false
  const task = findTask(id)
  if (!task) return false
  task.priority = priority
  return true
}

export function deleteTask(id) {
  const index = taskState.tasks.findIndex((task) => task.id === Number(id))
  if (index === -1) return false
  taskState.tasks.splice(index, 1)
  return true
}
