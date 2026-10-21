export const tasks = [
  { id: 1, title: 'Створити макет картки завдання', description: 'Розробити компонент TaskCard для TaskFlow.', status: 'todo', priority: 'high', dueDate: '2026-10-23' },
  { id: 2, title: 'Налаштувати навігацію', description: 'Реалізувати Navbar, Toolbar та переходи.', status: 'done', priority: 'medium', dueDate: '2026-10-24' },
  { id: 3, title: 'Створити індикатор статусу', description: 'Розробити компонент StatusBadge.', status: 'progress', priority: 'high', dueDate: '2026-10-25' },
  { id: 4, title: 'Реалізувати фільтрацію завдань', description: 'Додати фільтри за статусом і пріоритетом.', status: 'todo', priority: 'medium', dueDate: '2026-10-27' },
  { id: 5, title: 'Створити адаптивний інтерфейс', description: 'Налаштувати вигляд на різних екранах.', status: 'progress', priority: 'low', dueDate: '2026-10-29' },
  { id: 6, title: 'Підготувати структуру PWA', description: 'Налаштувати початковий проєкт.', status: 'done', priority: 'low', dueDate: '2026-10-30' },
  // Додаткове завдання 1: чотири власні завдання з різними статусами й пріоритетами
  { id: 7, title: 'Додати сортування за пріоритетом', description: 'Показувати спершу завдання з високим пріоритетом.', status: 'todo', priority: 'high', dueDate: '2026-10-31' },
  { id: 8, title: 'Створити компонент TaskCounter', description: 'Лічильник статистики, що отримує число через Props.', status: 'progress', priority: 'medium', dueDate: '2026-11-02' },
  { id: 9, title: 'Підготувати звіт до заняття 2.5', description: 'Описати компоненти, Props та Emits, додати скриншоти.', status: 'todo', priority: 'low', dueDate: '2026-11-04' },
  { id: 10, title: 'Опублікувати оновлення на Cloudflare', description: 'Зробити git push і перевірити новий deployment.', status: 'done', priority: 'high', dueDate: '2026-11-05' },
]

export default tasks
