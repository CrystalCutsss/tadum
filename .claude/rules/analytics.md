---
paths:
  - "src/shared/analytics/**"
  - "src/features/**"
  - "src/widgets/**"
  - "src/pages/**"
---

# Аналитика

- События — только из словаря `src/shared/analytics/events.ts`; имя — строковый литерал (`track('auth_otp_requested', …)`). Новое событие сначала появляется в `docs/product/04-metrics-and-events.md` (Drive → синхронизация), иначе `pnpm check:events` упадёт.
- Свойства — без PII: ни телефонов, имён, компаний, идентификаторов, ссылок, точных сумм. Деньги и количества — корзинами из `buckets.ts`. В dev `pii-guard` бросает ошибку.
- `shared/ui` событий не шлёт — только `features` и `widgets` (и экраны `pages`).
- События — на успешном и ошибочном пути; вызов покрыт unit-тестом (`setAnalyticsProviders`).
- На витрине — только провайдер `console` (D-059; режим `demo` снят с демо-панелью 2026-11-06). Подробности — `docs/analytics.md`.
