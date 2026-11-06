# Слои и границы (FSD-lite)

Архитектура — облегчённый Feature-Sliced Design (план §3.1, ADR-001). Границы проверяются машинно: ESLint (`eslint-plugin-boundaries`, `pnpm lint`) и dependency-cruiser (`pnpm deps:check`); оба входят в `pnpm verify`.

## Слои

Импорт разрешён только сверху вниз:

```
app → pages → widgets → features → entities → shared
```

| Слой | Где | Что лежит |
| :--- | :--- | :--- |
| `app` | `src/app/` | точка входа, провайдеры, роутер, `routeTree.gen.ts` (генерируется и коммитится), i18n, тема, PWA, аналитика |
| `pages` | `src/pages/` | файловые маршруты TanStack Router; `index.ts` здесь нет — публичный API слоя это сами маршруты |
| `widgets` | `src/widgets/<срез>/` | крупные блоки экрана: шкала статуса, карточка шага, оболочка кабинета, SupportBar, переключатели |
| `features` | `src/features/<срез>/` | действия пользователя: запрос и проверка OTP, выход, смена роли, языка, темы |
| `entities` | `src/entities/<срез>/` | бизнес-сущности: сессия, заявка, документ, лимит, поставщик, приведённый клиент, оффер |
| `shared` | `src/shared/<сегмент>/` | `ui` (shadcn и проектные примитивы), `api` (порты и адаптеры), `i18n`, `analytics`, `config`, `lib` |

`src/styles/` (токены, шрифты, глобальные стили) доступен всем слоям.

## Правила

1. **Публичный API среза — только `index.ts`.** Снаружи нельзя импортировать файл внутри среза `widgets/*`, `features/*`, `entities/*`. Из `shared/*` можно `index.ts` и `utils.ts`: shadcn CLI импортирует `@/shared/lib/utils` напрямую.
2. **Нет горизонтальных импортов.** Срезы одного слоя не импортируют друг друга (кроме сегментов `shared`). Общий код опускается слоем ниже.
3. **`shared/ui` не вызывает аналитику.** Импорт `shared/analytics` из `shared/ui` запрещён: события отправляют `features` и `widgets`.
4. **`odoo_stage` не доходит до `widgets/` и `pages/`** (`01-roles.md` §6): там используется только клиентский статус.
5. **Хранилище браузера — только через `@/shared/lib`** (`storage.ts`, D-072): `localStorage`/`sessionStorage` в других файлах запрещены.
6. **Время — только через `@/shared/lib`** (`clock.ts`): `new Date()` и `Date.now()` в других файлах запрещены. Демо-режим подменяет часы.
7. **Циклы запрещены** (dependency-cruiser `no-circular`).
8. **Мок не знает о `entities`.** `MockAdapter` лежит в `shared/api`, а бизнес-правила (статусы, «следующий шаг», переходы документа, лимит, роли) получает через интерфейс `MockDomain`, который заполняет `app/api.ts` (A-024). Адаптеры и фикстуры грузятся динамическим `import()` из `shared/api/client.ts` и не реэкспортируются из `shared/api/index.ts`.

Импорты внутри одного среза (и внутри `app`, `pages`) не ограничены.

## Где что проверяется

| Правило | ESLint | dependency-cruiser |
| :--- | :--- | :--- |
| Направление слоёв | `boundaries/dependencies` | `*-down-only`, `shared-is-bottom` |
| Только `index.ts` | `boundaries/dependencies` (`fileInternalPath`) | — |
| Горизонтальные импорты | `boundaries/dependencies` | `no-cross-slice` |
| `shared/ui` → `shared/analytics` | `boundaries/dependencies` | — |
| `odoo_stage` | `no-restricted-syntax` | — |
| Хранилище, время | `no-restricted-globals`, `no-restricted-properties`, `no-restricted-syntax` | — |
| Циклы, неразрешимые импорты | — | `no-circular`, `not-to-unresolvable` |

## Граф зависимостей

`pnpm deps:graph` пишет `docs/architecture/deps.mmd` (Mermaid; Graphviz `dot` в среде нет).

## Неиспользуемый код и дубли

- `knip` (`knip.config.ts`) — неиспользуемые файлы, зависимости и экспорты. Публичный API срезов (`index.ts`) — точка входа: это контракт среза, его экспорты для следующих версий не считаются мёртвыми (A-047). Внутренние экспорты без потребителя — ошибка.
- `jscpd` (`.jscpd.json`) — дубли кода в `src/`, порог 3 %.

Оба входят в `pnpm verify` и CI (job `lint`).
