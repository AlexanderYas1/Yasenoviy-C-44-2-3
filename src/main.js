import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Framework7 from 'framework7/lite-bundle';
import Framework7Vue, { registerComponents } from 'framework7-vue/bundle';

import 'framework7/css/bundle';
import 'framework7-icons/css/framework7-icons.css';
import './css/app.css';
import App from './App.vue';

// Framework7 має бути підключено, інакше f7-app/f7-view не працюватимуть.
Framework7.use(Framework7Vue);

const app = createApp(App);

// Робота 2.9: підключаємо Pinia до спільного екземпляра Vue-застосунку.
app.use(createPinia());

// Зберігаємо реєстрацію всіх Framework7-компонентів з попередніх робіт.
registerComponents(app);

app.mount('#app');
