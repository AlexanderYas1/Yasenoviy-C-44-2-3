<script setup>
import { computed } from 'vue'
import StatusBadge from './StatusBadge.vue'
import PriorityBadge from './PriorityBadge.vue'

const props = defineProps({
  task: { type: Object, required: true },
  editable: { type: Boolean, default: false },
  selected: { type: Boolean, default: false }, // заняття 2.5, дод. завдання 5
})
const emit = defineEmits([
  'status-change',
  'priority-change',
  'edit',
  'delete', // робота 2.8
  'task-select',
])

const statusSequence = ['todo', 'progress', 'done']
const prioritySequence = ['low', 'medium', 'high']

const statusActionText = computed(() => ({
  todo: 'Взяти в роботу',
  progress: 'Завершити',
  done: 'Повернути в план',
})[props.task.status] || 'Змінити статус')

// Додаткове завдання 1 (2.6): підпис категорії
const categoryText = computed(() => ({
  study: 'Навчання', work: 'Робота', personal: 'Особисте',
})[props.task.category] || '')

const formattedDate = computed(() => {
  if (!props.task.dueDate) return 'Без терміну'
  const date = new Date(`${props.task.dueDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) return 'Дата не визначена'
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(date)
})

function changeStatus() {
  const index = statusSequence.indexOf(props.task.status)
  emit('status-change', {
    id: props.task.id,
    status: statusSequence[(index + 1) % statusSequence.length],
  })
}

function changePriority() {
  const index = prioritySequence.indexOf(props.task.priority)
  emit('priority-change', {
    id: props.task.id,
    priority: prioritySequence[(index + 1) % prioritySequence.length],
  })
}

// Заняття 2.5, дод. завдання 5: подія вибору завдання
function selectTask() {
  emit('task-select', { id: props.task.id })
}
</script>

<template>
  <f7-card class="tf3-task-card" :class="{ 'is-selected': selected }">
    <f7-card-content>
      <div class="tf3-card-heading">
        <h3 class="tf3-card-title">
          <button type="button" class="tf3-title-button" :aria-pressed="selected"
            @click="selectTask">{{ task.title }}</button>
        </h3>
        <StatusBadge :status="task.status" />
      </div>
      <p class="tf3-card-description">{{ task.description || 'Без опису' }}</p>
      <div class="tf3-card-meta">
        <div class="tf3-meta-item">
          <span class="tf3-meta-label">Пріоритет:</span>
          <PriorityBadge :priority="task.priority" />
        </div>
        <div v-if="categoryText" class="tf3-meta-item">
          <span class="tf3-meta-label">Категорія:</span>
          <span class="tf3-badge tf4-category" :class="`tf4-category--${task.category}`">{{ categoryText }}</span>
        </div>
        <div class="tf3-meta-date">Термін: {{ formattedDate }}</div>
      </div>
      <div class="tf3-card-actions tf5-card-actions">
        <button type="button" class="tf3-action tf3-action--primary"
          @click="changeStatus">{{ statusActionText }}</button>
        <button type="button" class="tf3-action"
          @click="changePriority">Пріоритет</button>
        <!-- редагування й видалення — лише на сторінці «Мої завдання» -->
        <template v-if="editable">
          <button type="button" class="tf3-action"
            @click="emit('edit', task.id)">Редагувати</button>
          <button type="button" class="tf3-action tf5-danger"
            @click="emit('delete', task.id)">Видалити</button>
        </template>
      </div>
    </f7-card-content>
  </f7-card>
</template>
