<script setup>
import { computed, reactive, ref } from 'vue'

const props = defineProps({
  task: { type: Object, default: null },
  // Додаткове завдання 7: назви наявних завдань для перевірки унікальності
  existingTitles: { type: Array, default: () => [] },
})
const emit = defineEmits(['save', 'cancel'])

const TITLE_MAX = 80
const DESCRIPTION_MAX = 300

// Стандартні значення режиму створення (використовуються і кнопкою «Очистити форму»)
const defaults = () => ({
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
  category: '',
})

// Копіюємо поля: форма не змінює вихідний об'єкт до натискання «Зберегти».
const form = reactive({
  ...defaults(),
  ...(props.task ? {
    title: props.task.title ?? '',
    description: props.task.description ?? '',
    status: props.task.status ?? 'todo',
    priority: props.task.priority ?? 'medium',
    dueDate: props.task.dueDate ?? '',
    category: props.task.category ?? '',
  } : {}),
})

const showErrors = ref(false)
const isEditing = computed(() => props.task !== null)
const statusLabels = {
  todo: 'Заплановано',
  progress: 'У роботі',
  done: 'Виконано',
}
const priorityLabels = {
  low: 'Низький',
  medium: 'Середній',
  high: 'Високий',
}
const categoryLabels = {
  study: 'Навчання',
  work: 'Робота',
  personal: 'Особисте',
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00`)
  return !Number.isNaN(date.getTime()) &&
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` === value
}

// Додаткове завдання 2: сьогоднішня дата у форматі YYYY-MM-DD (локальний час)
function todayString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const today = todayString()
// Для старого завдання з минулим терміном дозволяємо залишити дату без змін
const keepsOriginalDate = computed(() => isEditing.value && form.dueDate === props.task.dueDate)
const originalDateIsPast = computed(() => isEditing.value && !!props.task.dueDate && props.task.dueDate < today)

// Додаткове завдання 3: скільки символів залишилося
function charsWord(n) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'символ'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'символи'
  return 'символів'
}
const titleLeft = computed(() => TITLE_MAX - form.title.length)
const descriptionLeft = computed(() => DESCRIPTION_MAX - form.description.length)

const errors = computed(() => {
  const result = {}
  const title = form.title.trim()
  const description = form.description.trim()

  if (!title) result.title = 'Вкажіть назву завдання.'
  else if (title.length < 3) result.title = 'Назва має містити щонайменше 3 символи.'
  else if (title.length > TITLE_MAX) result.title = 'Максимальна довжина — 80 символів.'
  // Додаткове завдання 7: унікальність назви для нових завдань (без урахування регістру)
  else if (!isEditing.value && props.existingTitles.some(
    (existing) => existing.trim().toLocaleLowerCase('uk') === title.toLocaleLowerCase('uk'))) {
    result.title = 'Завдання з такою назвою вже існує.'
  }

  if (description.length > DESCRIPTION_MAX) {
    result.description = 'Опис не повинен перевищувати 300 символів.'
  }
  if (!['todo', 'progress', 'done'].includes(form.status)) {
    result.status = 'Оберіть коректний статус.'
  }
  if (!['low', 'medium', 'high'].includes(form.priority)) {
    result.priority = 'Оберіть коректний пріоритет.'
  }
  if (!isValidDate(form.dueDate)) {
    result.dueDate = 'Укажіть коректну дату завершення.'
  } else if (form.dueDate < today && !keepsOriginalDate.value) {
    // Додаткове завдання 2: нова або змінена дата не може бути минулою
    result.dueDate = 'Дата завершення не може бути в минулому.'
  }
  if (form.category !== '' && !Object.keys(categoryLabels).includes(form.category)) {
    result.category = 'Оберіть коректну категорію.'
  }
  return result
})

// Додаткове завдання 5: aria-describedby = підказка + повідомлення про помилку (якщо є)
function describedBy(field, hasHint = true) {
  const ids = []
  if (hasHint) ids.push(`tf4-${field}-hint`)
  if (showErrors.value && errors.value[field]) ids.push(`tf4-${field}-error`)
  return ids.join(' ') || undefined
}

// Додаткове завдання 4: повернення стандартних значень у режимі створення
function clearForm() {
  Object.assign(form, defaults())
  showErrors.value = false
}

function submitForm() {
  showErrors.value = true
  if (Object.keys(errors.value).length > 0) return

  emit('save', {
    title: form.title.trim(),
    description: form.description.trim(),
    status: form.status,
    priority: form.priority,
    dueDate: form.dueDate,
    category: form.category,
  })
}
</script>

<template>
  <div class="tf4-form-panel">
    <div class="tf4-form-heading">
      <div>
        <div class="tf3-eyebrow">TASKFLOW / FORM</div>
        <h2>{{ isEditing ? 'Редагування завдання' : 'Нове завдання' }}</h2>
        <p class="tf4-required-note"><span class="tf4-required" aria-hidden="true">*</span> — обов'язкове поле</p>
      </div>
      <button type="button" class="tf4-close" @click="emit('cancel')">
        Закрити
      </button>
    </div>

    <form class="tf4-form" novalidate @submit.prevent="submitForm">
      <div class="tf4-field tf4-field--wide">
        <label for="tf4-title">Назва завдання <span class="tf4-required" aria-hidden="true">*</span></label>
        <input id="tf4-title" v-model.trim="form.title" type="text"
          placeholder="Наприклад: Підготувати звіт" :maxlength="TITLE_MAX"
          required aria-required="true"
          :aria-invalid="showErrors && !!errors.title"
          :aria-describedby="describedBy('title')" />
        <small id="tf4-title-hint">
          Від 3 до 80 символів. Введено: {{ form.title.length }}/80 ·
          <span :class="{ 'tf4-left-low': titleLeft <= 10 }">залишилось {{ titleLeft }} {{ charsWord(titleLeft) }}</span>
        </small>
        <p v-if="showErrors && errors.title" id="tf4-title-error" class="tf4-error" role="alert">
          {{ errors.title }}
        </p>
      </div>

      <div class="tf4-field tf4-field--wide">
        <label for="tf4-description">Опис</label>
        <textarea id="tf4-description" v-model.trim="form.description"
          placeholder="Що потрібно зробити?" rows="3" :maxlength="DESCRIPTION_MAX"
          :aria-invalid="showErrors && !!errors.description"
          :aria-describedby="describedBy('description')"></textarea>
        <small id="tf4-description-hint">
          Необов'язкове поле. Введено: {{ form.description.length }}/300 ·
          <span :class="{ 'tf4-left-low': descriptionLeft <= 30 }">залишилось {{ descriptionLeft }} {{ charsWord(descriptionLeft) }}</span>
        </small>
        <p v-if="showErrors && errors.description" id="tf4-description-error" class="tf4-error" role="alert">
          {{ errors.description }}
        </p>
      </div>

      <div class="tf4-field">
        <label for="tf4-status">Статус <span class="tf4-required" aria-hidden="true">*</span></label>
        <select id="tf4-status" v-model="form.status" required aria-required="true"
          :aria-invalid="showErrors && !!errors.status"
          :aria-describedby="describedBy('status', false)">
          <option value="todo">Заплановано</option>
          <option value="progress">У роботі</option>
          <option value="done">Виконано</option>
        </select>
        <p v-if="showErrors && errors.status" id="tf4-status-error" class="tf4-error" role="alert">{{ errors.status }}</p>
      </div>

      <div class="tf4-field">
        <label for="tf4-priority">Пріоритет <span class="tf4-required" aria-hidden="true">*</span></label>
        <select id="tf4-priority" v-model="form.priority" required aria-required="true"
          :aria-invalid="showErrors && !!errors.priority"
          :aria-describedby="describedBy('priority', false)">
          <option value="low">Низький</option>
          <option value="medium">Середній</option>
          <option value="high">Високий</option>
        </select>
        <p v-if="showErrors && errors.priority" id="tf4-priority-error" class="tf4-error" role="alert">{{ errors.priority }}</p>
      </div>

      <!-- Додаткове завдання 1: категорія -->
      <div class="tf4-field">
        <label for="tf4-category">Категорія</label>
        <select id="tf4-category" v-model="form.category"
          :aria-invalid="showErrors && !!errors.category"
          :aria-describedby="describedBy('category')">
          <option value="">Не вказано</option>
          <option value="study">Навчання</option>
          <option value="work">Робота</option>
          <option value="personal">Особисте</option>
        </select>
        <small id="tf4-category-hint">Необов'язкове поле.</small>
        <p v-if="showErrors && errors.category" id="tf4-category-error" class="tf4-error" role="alert">{{ errors.category }}</p>
      </div>

      <div class="tf4-field">
        <label for="tf4-date">Дата завершення <span class="tf4-required" aria-hidden="true">*</span></label>
        <input id="tf4-date" v-model="form.dueDate" type="date"
          :min="isEditing ? undefined : today"
          required aria-required="true"
          :aria-invalid="showErrors && !!errors.dueDate"
          :aria-describedby="describedBy('dueDate')" />
        <small id="tf4-dueDate-hint">
          <template v-if="originalDateIsPast">Термін уже минув — дату можна залишити без змін або перенести на майбутнє.</template>
          <template v-else>Не раніше сьогоднішнього дня.</template>
        </small>
        <p v-if="showErrors && errors.dueDate" id="tf4-dueDate-error" class="tf4-error" role="alert">
          {{ errors.dueDate }}
        </p>
      </div>

      <div class="tf4-preview tf4-field--wide" aria-live="polite">
        <strong>Попередній перегляд</strong>
        <p>{{ form.title || 'Назва нового завдання' }}</p>
        <span>
          {{ statusLabels[form.status] }} · {{ priorityLabels[form.priority] }}
          <template v-if="form.category"> · {{ categoryLabels[form.category] }}</template>
        </span>
      </div>

      <div class="tf4-actions tf4-field--wide">
        <button type="submit" class="tf4-save">
          {{ isEditing ? 'Зберегти зміни' : 'Створити завдання' }}
        </button>
        <button v-if="!isEditing" type="button" class="tf4-cancel tf4-clear" @click="clearForm">
          Очистити форму
        </button>
        <button type="button" class="tf4-cancel" @click="emit('cancel')">
          Скасувати
        </button>
      </div>
    </form>
  </div>
</template>
