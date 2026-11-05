---
paths:
  - "src/shared/api/**"
  - "src/entities/**"
---

# Данные: порты и мок

- Компоненты и фичи получают данные только через порты `src/shared/api/ports` и запросы TanStack Query в `entities/*/api`. Импорт адаптеров и фикстур снаружи `shared/api` запрещён.
- `MockAdapter` бизнес-правил не дублирует: статусы, «следующий шаг», переходы документов и лимита берёт из `entities` через `MockDomain` (`src/app/api.ts`, A-024).
- Мок и фикстуры грузятся динамическим `import()` и не попадают в первый чанк (`pnpm check:first-chunk`).
- Персоны — рукописные фикстуры `fixtures/personas/*.ts` (`01-entities.md` §6); телефоны вымышленные `+966 5000 000NN`. Новая персона — в реестр `index.ts`, в таблицу `README.md`, тест `personas.test.ts`.
- Изменение порта = изменение контракта бэкенда: `pnpm contract:md` и закоммитить `docs/05-backend-contract.md`; новый порт — только с согласия Кирилла.
- Ответы валидируются схемами Zod (`response-schemas.ts`), ошибки — классы из `ports/errors.ts`; 401 ведёт на `/session-expired` глобально (`src/app/query-client.ts`).
- `odoo_stage` не доходит до `widgets/` и `pages/`: только клиентский статус.
