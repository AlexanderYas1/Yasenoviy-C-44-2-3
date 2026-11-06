# TaskFlow Demo

PWA-застосунок для управління завданнями на Vue 3 + Framework7 + Vite. Спільний стан (завдання, проєкти, фільтри) зберігається у сховищах Pinia.

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
