<script setup>
defineProps({
  search: { type: String, default: '' },
  status: { type: String, default: 'all' },
  priority: { type: String, default: 'all' },
  sort: { type: String, default: 'newest' },
  // Дод. завдання 1: швидкий фільтр «Тільки невиконані»
  onlyActive: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:search',
  'update:status',
  'update:priority',
  'update:sort',
  'update:onlyActive',
  'reset',
])
</script>

<template>
  <section class="tf5-panel" aria-label="Пошук і фільтри">
    <h2>Пошук і впорядкування</h2>

    <div class="tf5-controls-grid">
      <div class="tf5-search">
        <label for="tf5-search-input">Пошук за назвою та описом</label>
        <!-- Дод. завдання 4: «Очистити пошук» видно лише за непорожнього тексту -->
        <div class="tf5-search-row">
          <input
            id="tf5-search-input"
            type="search"
            :value="search"
            placeholder="Наприклад: інтерфейс"
            autocomplete="off"
            @input="emit('update:search', $event.target.value)"
          />
          <button v-if="search" type="button" class="tf5-btn tf5-clear-search"
            @click="emit('update:search', '')">
            Очистити пошук
          </button>
        </div>
      </div>

      <label>
        Статус
        <select :value="status" @change="emit('update:status', $event.target.value)">
          <option value="all">Усі статуси</option>
          <option value="todo">Заплановано</option>
          <option value="progress">У роботі</option>
          <option value="done">Виконано</option>
        </select>
      </label>

      <label>
        Пріоритет
        <select :value="priority" @change="emit('update:priority', $event.target.value)">
          <option value="all">Усі пріоритети</option>
          <option value="low">Низький</option>
          <option value="medium">Середній</option>
          <option value="high">Високий</option>
        </select>
      </label>

      <label>
        Сортування
        <select :value="sort" @change="emit('update:sort', $event.target.value)">
          <option value="newest">Спочатку нові</option>
          <option value="title">За назвою (А–Я)</option>
          <option value="priority">За пріоритетом (високий перший)</option>
          <!-- збережено з роботи 2.5: зворотний порядок пріоритету -->
          <option value="priority-asc">За пріоритетом (низький перший)</option>
          <!-- Дод. завдання 2 -->
          <option value="status">За статусом (у роботі → заплановано → виконано)</option>
          <option value="dueDate">За терміном (найближчий перший)</option>
          <!-- Дод. завдання 6 -->
          <option value="dueDate-desc">За терміном (найпізніший перший)</option>
        </select>
      </label>
    </div>

    <div class="tf5-actions tf5-controls-actions">
      <button type="button" class="tf5-btn tf5-toggle"
        :class="{ 'is-active': onlyActive }" :aria-pressed="onlyActive"
        @click="emit('update:onlyActive', !onlyActive)">
        {{ onlyActive ? '✓ ' : '' }}Тільки невиконані
      </button>
      <button type="button" class="tf5-btn" @click="emit('reset')">
        Скинути фільтри
      </button>
    </div>
  </section>
</template>
