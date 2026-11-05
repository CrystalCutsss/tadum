---
paths:
  - "src/**/*.tsx"
  - "src/**/*.css"
---

# RTL и LTR

- Только логические свойства: `ms-/me-/ps-/pe-`, `start-/end-`, `text-start/text-end`, `rounded-s/e`, `border-s/e`. Физические (`ml-`, `pr-`, `left-`, `text-right`, `rounded-l`) запрещены — ESLint (`rtl-friendly`) и `pnpm lint:rtl`. Осознанное исключение — `// eslint-disable-next-line rtl-friendly/no-physical-properties` с причиной.
- Зеркалятся только направленные иконки (стрелки, шевроны, «назад», «далее», вход/выход) — список `mirroredIcons` в `src/shared/ui/icon/icon.tsx`, иконка рисуется через `Icon`; нейтральные — нет.
- Порталы (Dialog, Sheet, Popover, Select, Toast) получают направление от `Direction.Provider` Radix в `src/app/providers.tsx` — не обходить его.
- Смешанный текст: числа, телефоны, коды, латиница внутри арабского — изоляция `bdi`/`dir="ltr"`.
- Порядок фокуса и клавиатура проверяются в обоих направлениях. Скриншоты AR и EN сравниваются глазами (`pnpm screenshots`, скилл `/rtl-qa`).
