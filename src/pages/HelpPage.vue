<template>
  <f7-page name="help">
    <f7-navbar title="Довідка" back-link="Назад" />

    <div class="app-content">
      <div class="page-heading">
        <h1>Правила використання</h1>
        <p>Як працювати з TaskFlow</p>
      </div>

      <div class="info-card">
        <h3>Навігація</h3>
        <ol class="help-list">
          <li>Нижня панель перемикає розділи «Головна», «Завдання» та «Про застосунок».</li>
          <li>Активний розділ виділяється синім кольором.</li>
          <li>Кнопка «Назад» у верхній панелі повертає на попередню сторінку.</li>
        </ol>
      </div>

      <div class="info-card">
        <h3>Завдання</h3>
        <ol class="help-list">
          <li>На головній сторінці показано загальну кількість завдань, виконані та ті, що очікують виконання.</li>
          <li>Зелена позначка біля завдання означає, що його виконано.</li>
          <li>Повний список з описами відкривається в розділі «Завдання».</li>
        </ol>
      </div>

      <div class="info-card">
        <h3>Встановлення</h3>
        <p>TaskFlow — PWA: його можна встановити на комп’ютер або телефон через меню браузера «Установити додаток».</p>
      </div>
    </div>

    <!-- слот fixed: панель поза областю прокрутки, завжди внизу екрана -->
    <template #fixed>
      <AppTabbar active="about" />
    </template>
  </f7-page>
</template>

<script setup>
import AppTabbar from '../components/AppTabbar.vue';
</script>
