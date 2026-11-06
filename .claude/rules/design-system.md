---
paths:
  - "src/shared/ui/**"
  - "src/styles/**"
  - "components.json"
---

# Дизайн-система

- `src/styles/tokens.css` и `src/shared/ui/**` меняет только субагент `design-system-owner` (после блока 8b это проверяет хук). Остальные предлагают изменение и делегируют.
- Только токены: цвета, радиусы, тени, отступы, типографика, длительности — CSS-переменные и классы Tailwind на их основе. Сырые hex/rgb/px/мс в компонентах — ошибка (Stylelint, ESLint).
- Основа — пресет shadcn `b1ZQ7Gl9c` (D-077, ADR-002); иконки — Remix Icon через `Icon`. Новые компоненты shadcn — `pnpm dlx shadcn@latest add …` только у `design-system-owner`.
- Контраст пресета не меняется (решение Кирилла, A-019): если вариант компонента не проходит AA, выбирается другой вариант, а не правится токен.
- У каждого компонента — история Storybook в матрице AR/EN × light/dark (`...matrix` из `.storybook/decorators.tsx`) с проверкой axe.
- Документ — `docs/design/02-design-system.md`; решение — ADR-002.
- Вызовы на верхнем уровне модуля в `shared/ui` (`React.createContext`, `cva`, фабрики) помечаются `/* @__PURE__ */`. Иначе Rollup считает их побочным эффектом, и общий экспорт `@/shared/ui` затягивает лениво загружаемый компонент в первый чанк (так сайдбар превысил бюджет 200 kB, D-054). Бюджеты проверяет `pnpm size` — он входит в `pnpm verify`.
