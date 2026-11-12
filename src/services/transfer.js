// Додаткові завдання 1–2: експорт та імпорт даних TaskFlow у форматі JSON.
// До файлу потрапляють лише завдання, проєкти й дата експорту — без паролів і токенів.
const allowedStatuses = ['todo', 'progress', 'done']
const allowedPriorities = ['low', 'medium', 'high']
const allowedCategories = ['', 'study', 'work', 'personal']

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

function validDate(value) {
  if (value === '') return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00`)
  return !Number.isNaN(date.getTime()) &&
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` === value
}

export function buildExport(tasks, projects) {
  return {
    app: 'TaskFlow',
    exportedAt: new Date().toISOString(),
    tasks: JSON.parse(JSON.stringify(tasks)),
    projects: JSON.parse(JSON.stringify(projects)),
  }
}

// Формуємо файл у браузері й пропонуємо його завантажити.
export function downloadExport(tasks, projects) {
  const data = buildExport(tasks, projects)
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `taskflow-export-${data.exportedAt.slice(0, 10)}.json`
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return data
}

// Перевіряє вміст файлу; повертає нормалізовані дані або кидає Error з поясненням.
export function parseImport(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Файл не є коректним JSON.')
  }

  if (!isObject(data) || !Array.isArray(data.tasks) || !Array.isArray(data.projects)) {
    throw new Error('Очікується об’єкт зі списками tasks і projects.')
  }

  const projectIds = new Set()
  const projectTitles = new Set()
  const projects = data.projects.map((project, index) => {
    const where = `Проєкт №${index + 1}`
    if (!isObject(project)) throw new Error(`${where}: запис має бути об’єктом.`)
    if (typeof project.id !== 'string' || !project.id.trim()) {
      throw new Error(`${where}: id має бути непорожнім рядком.`)
    }
    if (projectIds.has(project.id)) throw new Error(`${where}: id «${project.id}» повторюється.`)
    if (typeof project.title !== 'string') throw new Error(`${where}: title має бути рядком.`)
    const title = project.title.trim()
    if (title.length < 3 || title.length > 40) {
      throw new Error(`${where}: назва має містити 3–40 символів.`)
    }
    const titleKey = title.toLocaleLowerCase('uk-UA')
    if (projectTitles.has(titleKey)) throw new Error(`${where}: назва «${title}» повторюється.`)
    projectIds.add(project.id)
    projectTitles.add(titleKey)
    return { id: project.id, title }
  })
  if (!projectIds.has('general')) {
    throw new Error('Серед проєктів має бути «general» (Загальні) — до нього належать завдання за замовчуванням.')
  }

  const taskIds = new Set()
  const taskTitles = new Set()
  const tasks = data.tasks.map((task, index) => {
    const where = `Завдання №${index + 1}`
    if (!isObject(task)) throw new Error(`${where}: запис має бути об’єктом.`)
    if (!Number.isSafeInteger(task.id) || task.id < 1) {
      throw new Error(`${where}: id має бути цілим додатним числом.`)
    }
    if (taskIds.has(task.id)) throw new Error(`${where}: id ${task.id} повторюється.`)
    if (typeof task.title !== 'string') throw new Error(`${where}: title має бути рядком.`)
    const title = task.title.trim()
    if (title.length < 3 || title.length > 80) {
      throw new Error(`${where}: назва має містити 3–80 символів.`)
    }
    const titleKey = title.toLocaleLowerCase('uk-UA')
    if (taskTitles.has(titleKey)) throw new Error(`${where}: назва «${title}» повторюється.`)

    const description = task.description ?? ''
    if (typeof description !== 'string' || description.trim().length > 500) {
      throw new Error(`${where}: опис має бути рядком до 500 символів.`)
    }
    if (!allowedStatuses.includes(task.status)) {
      throw new Error(`${where}: недопустимий статус «${task.status}».`)
    }
    if (!allowedPriorities.includes(task.priority)) {
      throw new Error(`${where}: недопустимий пріоритет «${task.priority}».`)
    }
    const dueDate = task.dueDate ?? ''
    if (typeof dueDate !== 'string' || !validDate(dueDate)) {
      throw new Error(`${where}: дата має бути у форматі РРРР-ММ-ДД або порожньою.`)
    }
    const category = task.category ?? ''
    if (!allowedCategories.includes(category)) {
      throw new Error(`${where}: недопустима категорія «${category}».`)
    }
    if (typeof task.projectId !== 'string' || !task.projectId) {
      throw new Error(`${where}: відсутній projectId.`)
    }
    if (!projectIds.has(task.projectId)) {
      throw new Error(`${where}: проєкту «${task.projectId}» немає у списку projects.`)
    }

    taskIds.add(task.id)
    taskTitles.add(titleKey)
    return {
      id: task.id,
      title,
      description: description.trim(),
      status: task.status,
      priority: task.priority,
      dueDate,
      category,
      projectId: task.projectId,
    }
  })

  const nextProjectId = Math.max(
    0,
    ...projects.map((project) => {
      const match = /^project-(\d+)$/.exec(project.id)
      return match ? Number(match[1]) : 0
    }),
  ) + 1

  return { tasks, projects, nextProjectId, exportedAt: data.exportedAt ?? null }
}
