# ADR-001 — Стек и архитектура

**Статус:** принят (D-003, D-065) · **Дата:** 2026-11-04

**Контекст.** Нужен фронтенд без бэкенда, который (1) собирается в статику под произвольный базовый путь для витрины `/p/tadum/vN/`, (2) равноправно поддерживает арабский RTL и английский LTR, (3) устанавливается как PWA, (4) переезжает из GitHub в GitLab без изменений кода, (5) состоит из технологий, которые агенты знают хорошо и в актуальных версиях.

**Рассмотрено.** Vite \+ React \+ TanStack Router (SPA) · React Router v7 framework mode (`ssr:false`) · TanStack Start (SPA mode) · Next.js \+ OpenNext. Сравнение — план §3.1.

**Решение.** Vite 7 (проект собран вручную, без шаблона) \+ React 19 \+ TypeScript strict \+ TanStack Router (файловые маршруты в `src/pages`, дерево в `src/app/routeTree.gen.ts`, `basepath` из `import.meta.env.BASE_URL`) \+ TanStack Query как единственный слой данных \+ shadcn/ui на Radix с `rtl: true` \+ Tailwind v4 \+ react-i18next (JSON v4, плейсхолдеры `{…}`) \+ vite-plugin-pwa (`generateSW`, `autoUpdate`, `useCredentials`) \+ Cloudflare Workers static assets \+ Zod 4\. Архитектура FSD-lite (`app/pages/widgets/features/entities/shared`) с машинной проверкой границ (`eslint-plugin-boundaries`, `dependency-cruiser`, `knip`, `jscpd`). Данные — через порты; `MockAdapter` (рукописные фикстуры, динамический импорт) сейчас, `HttpAdapter` потом. Форматирование — собственный `shared/i18n/format.ts` поверх `Intl` для чисел и месяцев. Готовый стартер не используется.

**Последствия.** Плюсы: чистый `dist/`, тривиальный базовый путь, типизированные маршруты, отсутствие серверного кода, одинаковый деплой в обоих CI. Минусы: нет SSR (не нужен — портал за входом); ручная сборка скелета; за актуальностью паттернов TanStack следить через Context7. Пересмотр — при появлении требований SEO или серверных функций.


## Приложение: версии на дату инициализации (2026-11-05)

Версии зафиксированы точно (`save-exact=true`). Пакеты следующих блоков (ESLint, Vitest, Storybook, i18next, Zod и др.) добавляются в таблицу в блоке, где ставятся.

| Пакет | Версия | Блок | Примечание |
| :--- | :--- | :--- | :--- |
| Node | 22 (`.nvmrc`) | 1 | в сессии 22.23.4 |
| pnpm | 10.28.0 | 1 | `packageManager` |
| `vite` | 7.3.7 | 1 | последняя 7.x; 8 — только через ADR |
| `@vitejs/plugin-react` | 5.2.0 | 1 | 6.x требует Vite 8 (A-004) |
| `react`, `react-dom` | 19.3.1 | 1 | |
| `@types/react`, `@types/react-dom` | 19.3.0 | 1 | |
| `typescript` | 5.9.3 | 1 | `~5.9` |
| `@types/node` | 22.20.5 | 1 | по мажору Node |
| `@tanstack/react-router` | 1.170.46 | 1 | |
| `@tanstack/router-plugin` | 1.168.48 | 1 | |
| `@tanstack/router-cli` | 1.167.46 | 1 | `tsr generate` перед `tsc` (A-006) |
| `@tanstack/react-query` | 5.106.0 | 1 | |
| `tailwindcss`, `@tailwindcss/vite` | 4.3.4 | 1 | |
| `vite-plugin-pwa` | 1.3.0 | 1 | 2.x вышел; мажор 1 по §1.2 |
| `workbox-window` | 7.4.1 | 1 | peer `vite-plugin-pwa` |
| `wrangler` | 4.157.0 | 1 | |
| `eslint` | 10.14.0 | 2 | ESLint 10: его поддерживают `typescript-eslint`, `boundaries`, `react-hooks`, `rtl-friendly`, `storybook` (peer) |
| `@eslint/js` | 10.0.1 | 2 | |
| `typescript-eslint` | 8.72.1 | 2 | `recommendedTypeChecked` |
| `eslint-plugin-boundaries` | 7.4.1 | 2 | только правило `dependencies`: `element-types` и `entry-point` в 7.x устарели (A-010) |
| `eslint-plugin-react-hooks` | 7.1.1 | 2 | |
| `eslint-import-resolver-typescript` | 4.4.5 | 2 | алиас `@/` для `boundaries` |
| `globals` | 17.14.0 | 2 | |
| `dependency-cruiser` | 18.7.2 | 2 | |
| `i18next` | 26.7.1 | 3 | плейсхолдеры `{…}` (D-075) |
| `react-i18next` | 17.1.12 | 3 | |
| `lucide-react` | 1.69.0 | 3 | |
| `vitest` | 5.1.0 | 3 | совместим с `@storybook/addon-vitest` 10.6 (peer `^4 \|\| ^5`) |
| `i18next-cli` | 1.83.0 | 3 | заменил устаревший `i18next-parser` (A-012) |
| `eslint-plugin-i18next` | 6.1.5 | 3 | `no-literal-string`, режим `jsx-only` |
| `eslint-plugin-rtl-friendly` | 0.5.1 | 3 | `no-physical-properties` |
