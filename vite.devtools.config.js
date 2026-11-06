// Робота 2.9, дод. завдання 6: режим розробки з Vue DevTools (вкладка Pinia).
// Основний vite.config.js і production-збірка не змінюються.
import { defineConfig, mergeConfig } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';
import baseConfig from './vite.config.js';

export default mergeConfig(baseConfig, defineConfig({
  plugins: [vueDevTools()],
}));
