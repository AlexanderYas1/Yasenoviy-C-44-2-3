<!-- Додаткове завдання 3: лічильник, що отримує число завдань через Props -->
<script setup>
defineProps({
  label: { type: String, required: true },
  count: { type: Number, required: true },
  variant: { type: String, default: 'default' }, // default | todo | progress | done
})
</script>

<template>
  <div class="tf3-stat" :class="`tf3-stat--${variant}`">
    <span class="tf3-stat-label">{{ label }}</span>
    <strong>{{ count }}</strong>
  </div>
</template>
