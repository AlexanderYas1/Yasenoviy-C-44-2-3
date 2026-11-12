# TaskFlow Demo

PWA-застосунок для управління завданнями на Vue 3 + Framework7 + Vite. Спільний стан (завдання, проєкти, фільтри) зберігається у сховищах Pinia.

Завдання та проєкти постійно зберігаються в браузері — у базі IndexedDB `taskflow-db` (сховища `tasks`, `projects`, `metadata`, бібліотека `idb`). Модулі `src/services/database.js` і `src/services/persistence.js` відновлюють дані до показу інтерфейсу та автоматично записують кожну зміну. Фільтри й пошук у базу не записуються.

Опублікований застосунок: https://yasenoviy-c-44-2-3.sashkadancer2006.workers.dev

## Запуск

```bash
npm install
npm run dev
```

Режим розробки з Vue DevTools (вкладка Pinia — сховища `tasks` і `projects`):

```bash
npm run dev:devtools
```

## Збірка

```bash
npm run build
npm run preview
```

## Розгортання

Cloudflare Workers автоматично збирає та публікує застосунок після `git push` у гілку `main` (`npx wrangler deploy`).
