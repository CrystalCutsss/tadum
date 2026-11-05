---
paths:
  - "src/**/*.test.ts"
  - "src/**/*.test.tsx"
  - "src/**/*.stories.tsx"
  - "tests/**"
  - "playwright.config.ts"
  - "vitest.config.ts"
---

# Тесты

- Unit (Vitest, `pnpm test`): чистая логика — статусы, гарды, форматтеры, корзины, мок. Для роутера — `// @vitest-environment happy-dom`.
- Истории (Storybook + Vitest, `pnpm test:stories`): каждое состояние компонента в матрице AR/EN × light/dark, axe без нарушений, play-тесты для взаимодействий.
- E2E (Playwright, `pnpm test:e2e`): сценарии брифа в `android-chrome`, `iphone-safari`, `desktop-chrome`; axe на экранах (`a11y.spec.ts`). Быстрые — тег `@smoke` (входят в `verify`).
- Время зафиксировано (`page.clock`, `setClock`); ждать состояние, а не таймаут. Ленивые экраны: после смены URL ждать заголовок экрана (`enterCode` в `tests/e2e/fixtures.ts`).
- Ошибку исправлять с регрессионным тестом, который падает без исправления.
- Тесты не удаляются и не ослабляются ради зелёного; изменение теста — с причиной в PR.
- Скриншоты — артефакты, не эталоны (D-074); `toHaveScreenshot` — только с эталонами из docker-образа (`pnpm screenshots:update`).
