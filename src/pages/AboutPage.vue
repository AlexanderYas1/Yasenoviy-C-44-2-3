<template>
  <f7-page name="about">
    <f7-navbar title="Про застосунок" />

    <div class="app-content">
      <div class="page-heading">
        <h1>Про TaskFlow</h1>
        <p>Інформація про застосунок</p>
      </div>

      <div class="info-card">
        <div class="app-logo"><f7-icon f7="checkmark_circle_fill" aria-hidden="true" /></div>
        <h2>TaskFlow</h2>
        <p>Прогресивний вебзастосунок для організації завдань.</p>
      </div>

      <div class="info-card">
        <h3>Використані технології</h3>
        <div class="technology-list">
          <span>Vue 3</span><span>Framework7</span><span>Vite</span><span>PWA</span>
        </div>
      </div>

      <div class="info-card">
        <h3>Версія</h3><p>1.0.0 — навчальний проєкт</p>
      </div>

      <!-- Додаткове завдання 1: посилання на сторінку довідки -->
      <f7-button fill large href="/help/" class="page-action">
        <f7-icon f7="question_circle" aria-hidden="true" />
        Довідка та правила
      </f7-button>
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
