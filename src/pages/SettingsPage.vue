<script setup>
import { computed, onMounted, ref } from 'vue'
import AppTabbar from '../components/AppTabbar.vue'
import { useTasksStore } from '../store/tasks'
import { useProjectsStore } from '../store/projects'
import { readStorageInfo } from '../services/database'
import { persistenceState } from '../services/persistence'
import '../css/task-components.css'
import '../css/task-list.css'
import '../css/persistence.css'

// 2.10, дод. завдання 5: відомості читаються безпосередньо з IndexedDB, а не з Pinia.
const taskStore = useTasksStore()
const projectStore = useProjectsStore()
const info = ref(null)
const error = ref('')
const loading = ref(false)
const usage = ref(null)

const dateFormat = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'long', timeStyle: 'medium' })
const lastSavedText = computed(() =>
  info.value?.lastSavedAt ? dateFormat.format(new Date(info.value.lastSavedAt)) : '—')
const writeModeText = computed(() => ({
  snapshot: 'повний знімок (clear() + put())',
  delete: 'точкове видалення (delete())',
})[persistenceState.lastWriteMode] || 'у цьому сеансі запису ще не було')
const inSync = computed(() => info.value &&
  info.value.taskCount === taskStore.tasks.length &&
  info.value.projectCount === projectStore.projects.length)

async function refresh() {
  loading.value = true
  error.value = ''
  try {
    info.value = await readStorageInfo()
    if (navigator.storage?.estimate) {
      const { usage: used = 0 } = await navigator.storage.estimate()
      usage.value = used
    }
  } catch (reason) {
    console.error('TaskFlow: не вдалося прочитати IndexedDB:', reason)
    error.value = 'Не вдалося прочитати локальну базу даних.'
  } finally {
    loading.value = false
  }
}

onMounted(refresh)
</script>

<template>
  <f7-page name="settings" class="tf3-page">
    <f7-navbar title="Налаштування" back-link="Назад" />

    <div class="tf3-container">
      <section class="tf3-hero">
        <div class="tf3-eyebrow">TASKFLOW / SETTINGS</div>
        <h1>Налаштування сховища</h1>
        <p>Значення нижче прочитано безпосередньо з IndexedDB цього браузера.</p>
        <button type="button" class="tf5-btn tf5-btn--primary tf5-new tf7-refresh"
          :disabled="loading" @click="refresh">
          {{ loading ? 'Читання бази…' : 'Оновити дані з IndexedDB' }}
        </button>
      </section>

      <p v-if="error" class="tf5-error" role="alert">{{ error }}</p>

      <template v-if="info">
        <section class="tf5-panel" aria-label="Кількість записів">
          <h2>Збережені записи</h2>
          <div class="tf7-settings-grid">
            <div class="tf7-settings-item">
              <span>Завдань у IndexedDB (tasks)</span>
              <strong class="tf7-db-tasks">{{ info.taskCount }}</strong>
              <small>У Pinia зараз: {{ taskStore.tasks.length }}</small>
            </div>
            <div class="tf7-settings-item">
              <span>Проєктів у IndexedDB (projects)</span>
              <strong class="tf7-db-projects">{{ info.projectCount }}</strong>
              <small>У Pinia зараз: {{ projectStore.projects.length }}</small>
            </div>
          </div>
        </section>

        <section class="tf5-panel" aria-label="Відомості про базу">
          <h2>База даних</h2>
          <table class="tf7-settings-table">
            <tbody>
              <tr><th>Назва та версія</th><td>{{ info.name }}, версія {{ info.version }}</td></tr>
              <tr><th>Сховища (object stores)</th><td>{{ info.storeNames.join(', ') }}</td></tr>
              <tr><th>metadata.initialized</th><td>{{ info.initialized }}</td></tr>
              <tr><th>metadata.nextProjectId</th><td>{{ info.nextProjectId }}</td></tr>
              <tr><th>metadata.lastSavedAt</th><td class="tf7-db-saved">{{ lastSavedText }}</td></tr>
              <tr><th>Спосіб останнього запису</th><td class="tf7-db-mode">{{ writeModeText }}</td></tr>
              <tr>
                <th>Відповідність Pinia</th>
                <td :class="inSync ? 'tf7-settings-ok' : 'tf7-settings-warn'">
                  {{ inSync ? 'Кількість записів у базі й у Pinia збігається' : 'Є незбережені зміни — дочекайтеся збереження й оновіть' }}
                </td>
              </tr>
              <tr v-if="usage !== null">
                <th>Використано сховища сайту</th><td>{{ (usage / 1024).toFixed(1) }} КБ</td>
              </tr>
            </tbody>
          </table>
        </section>
      </template>
    </div>

    <template #fixed>
      <AppTabbar active="settings" />
    </template>
  </f7-page>
</template>
