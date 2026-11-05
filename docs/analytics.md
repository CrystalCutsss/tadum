# Аналитика: как устроена в коде

Что и зачем мы измеряем, — продуктовый документ [`docs/product/04-metrics-and-events.md`](product/04-metrics-and-events.md) (источник — Drive). Здесь — как словарь событий реализован в коде и как добавить событие.

## Устройство

| Файл | Что делает |
| :--- | :--- |
| `src/shared/analytics/events.ts` | словарь: все события §3 как размеченное объединение (`name` + `props`), `EVENT_VERSIONS`. Сейчас 73 события; `screen_viewed` — для 18 экранов (`ScreenId` из `src/shared/config/routes.ts`) |
| `src/shared/analytics/track.ts` | `track(name, props)` — добавляет общий контекст и отдаёт событие провайдерам |
| `src/shared/analytics/context.ts` | общий контекст §2.2: `screen_id`, `role`, `lang`, `dir`, `theme`, `platform`, `in_iab`, `is_pwa`, `viewport`, `app_version`, `session_id`. Экран, роль, язык и тему обновляет оболочка; среду читает в момент события |
| `src/shared/analytics/buckets.ts` | корзины §2.4: суммы (`amountBucket`), доля использования лимита (`usedShareBucket`), количества (`countBucket`). Точные суммы и количества в события не попадают |
| `src/shared/analytics/pii-guard.ts` | в dev-сборке бросает ошибку, если в свойствах есть запрещённые ключи (`phone`, `name`, `amount`, `url`, …) или значения, похожие на телефон, e-mail, ссылку. В прод-сборку не входит |
| `src/shared/analytics/providers/` | `console` — вывод в консоль; `demo-panel` — лента в демо-панели; `posthog` — заглушка без SDK (подключение — SFL-895) |

Провайдер выбирает `VITE_ANALYTICS`: `console` (по умолчанию, локально), `demo` (витрина: лента демо-панели + консоль), `posthog` (прод). На витрине боевого провайдера нет (D-059).

`app_version` — версия из `package.json` и короткий хеш коммита (`vite.config.ts`). Событие `app_loaded` отправляется один раз за сессию вкладки после первой отрисовки (`src/app/app-loaded.ts`).

## Правила

- Имя события — только строковый литерал из словаря: `track('auth_otp_requested', {...})`. Динамическое имя запрещено ESLint-правилом.
- `shared/ui` событий не отправляет: это делают `features` и `widgets` (`docs/architecture/layers.md`).
- Никаких персональных данных: телефонов, имён, названий компаний, идентификаторов заявок, ссылок, точных сумм. Идентификаторы пути — только хеш (`pathHash`).
- `screen_viewed` — один раз на вход в экран; опрос статуса событий не плодит.
- Web Vitals (LCP, INP, CLS) событиями словаря не оформляются: их собирает провайдер, бюджеты проверяет Lighthouse CI (D-058).

## Как добавить или изменить событие

1. Событие появляется в `04-metrics-and-events.md` в Drive и приходит в `docs/product/` синхронизацией. Без этого `pnpm check:events` упадёт: словарь в коде обязан совпадать с документом.
2. Добавить вариант в объединение `AnalyticsEvent` и версию в `EVENT_VERSIONS` (`events.ts`). Новый экран — в `ScreenId` (`routes.ts`).
3. Вызвать `track()` на успешном и на ошибочном пути, свойства — корзинами.
4. Unit-тест на вызов (`track.test.ts` и тесты фичи подменяют провайдера через `setAnalyticsProviders`).
5. `pnpm verify` — typecheck проверит свойства, `check:events` — совпадение с документом.

## Проверить руками

- Локально: `pnpm dev`, консоль браузера — строки `[analytics] <событие> {свойства} {контекст}`.
- На витрине и превью: демо-панель → раздел «Event feed» (AR: «سجل الأحداث»); события можно скопировать JSON.
