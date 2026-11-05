# Прогресс настройки среды Tadum

Источник порядка — `docs/setup/master-prompt.md` §0.5. Допущения — [`docs/decisions/assumptions.md`](../decisions/assumptions.md).

| Блок | Статус | Коммит | Заметки |
| :--- | :--- | :--- | :--- |
| 0 | done | `0e3fcfa` | Репозиторий создал Кирилл; `main` создан из коммита блока 0 без push (A-003) |
| 1 | done | `37ad462` | `verify` = `typecheck && build`; `wrangler deploy --dry-run` проходит без токена; `account_id` — до 7a (A-005) |
| 1b | done | `80e3461` | 31 файл (28 в `docs/product/` + шаблоны), побайтно с Drive (A-008) |
| 2 | done | `06c166a` | `verify` += `lint && deps:check`; boundaries 7.x — правило `dependencies` (A-010) |
| 3 | done | `3939ac8` | `verify` += `lint:i18n && test`; `i18next-cli` (A-012) |
| 4a | done | `44249f8` | пресет применён CLI; иконки Remix (A-015); `verify` += `check:contrast && storybook:build && test:stories` |
| 5a | done | `9424c28` | 261 unit-тест; таблицы документов разбираются в тестах (A-021) |
| 5b | done | `1ecb0e9` | 14 персон, мок по §10; бизнес-правила мока — из `entities` через `MockDomain` (A-024) |
| 5c | done | `6d3575a` | 73 события и 18 экранов сверены с §3; `verify` += `check:events`, `contract:md --check` |
| 6a | done | см. git log | вход SC-01 A1–A14; гарды — чистые функции + роутер в памяти; формы — истории с play-тестами |
| 6b | todo | — | |
| 6c | todo | — | |
| 6d | todo | — | |
| 7a | todo | — | |
| 7b | todo | — | |
| 8a | todo | — | |
| 8b | todo | — | |
| 9 | todo | — | |
| 10 | todo | — | |

## План блока 0

1. Создать приватный репозиторий `tadum` и склонировать его. Итог: создал Кирилл на github.com (у сессии нет прав), агент подключил его к сессии.
2. Сохранить мастер-промпт дословно в `docs/setup/master-prompt.md`. Сделано: `cmp` с переданным файлом — без различий.
3. Создать этот файл.
4. Проверить среду §0.4 и записать результат.
5. Коммит в `main` и push. Итог: push в `main` отклонён режимом разрешений сессии; коммит запушен в `chore/setup`, `main` создан из него через GitHub API (A-003).

**Проверка блока 0:** `CrystalCutsss/tadum` — `private`, `main` = `0e3fcfa`; `cmp` мастер-промпта с переданным файлом — без различий; в таблице все блоки §0.5; доступ к Cloudflare проверен (см. ниже).

## План блока 1

1. Конфиги репозитория: `.nvmrc`, `.npmrc`, `.editorconfig`, `.gitignore`, `package.json`.
2. Vite 7 + React 19 + TS 5.9 strict вручную; TanStack Router (`src/pages`, дерево в `src/app/routeTree.gen.ts`), TanStack Query, Tailwind 4, vite-plugin-pwa 1.
3. Базовый путь из `VITE_BASE_PATH`, `basepath` роутера из `BASE_URL`; `.env.example`.
4. `wrangler.jsonc` (только статика), `public/_headers` с `noindex`, `deploy:preview`.
5. `src/shared/lib/storage.ts` с префиксом `tadum:<base>:` и запасным хранилищем в памяти.
6. `README.md`, `docs/product/README.md`, `docs/decisions/ADR-001-stack.md` с таблицей версий.
7. `verify` = `typecheck && build`; проверки блока 1.

**Проверка блока 1 (2026-11-05):** `pnpm install` — без вопросов и без предупреждений о сборке пакетов; `pnpm verify` зелёный; `dist/index.html` — `<html lang="ar" dir="rtl">`; при `VITE_BASE_PATH=/p/tadum/v1/` все `src`/`href` в `dist/index.html`, `start_url` и `scope` манифеста, `navigateFallback` начинаются с `/p/tadum/v1/`, манифест подключён с `crossorigin="use-credentials"`; `pnpm exec wrangler deploy --dry-run` — «Read 14 files from the assets directory», выход без ошибок; `origin` → `CrystalCutsss/tadum`.

## План блока 1b

1. Найти файлы по `parentId` в папках Drive (ID из §0.2 подтвердились; найденные ID — в `docs/product/README.md`).
2. Скачать каждый файл коннектором (`download_file_content`, base64) и записать побайтно: раскодирование, сверка размера с `fileSize` Drive, проверка UTF-8 и шапка источника — скриптом, без пересказа. Файлы раздаются субагентам группами по 2–5 (A-008).
3. `tov-lexicon.json` — в `docs/product/` и в корень; `JSON.parse` и совпадение `version`.
4. Шаблоны: `docs/templates/feature-brief.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `docs/dod.md`.
5. Таблица «файл · Drive ID · дата» в `docs/product/README.md`.

**Проверка блока 1b (2026-11-05):** все 28 файлов `docs/product/` и 3 шаблона на месте; размер тела каждого совпадает с `fileSize` Drive. Дополнительно каждый файл сверен побайтно с исходным ответом коннектора: 31/31 MATCH. `JSON.parse` для `tov-lexicon.json` проходит, `version` = `1.0.0` в обеих копиях. Файлов без шапки в `docs/product/` нет, кроме JSON и `README.md`. `pnpm verify` зелёный.

## План блока 2

1. Сверить мастер-промпт с Drive (решение Кирилла: источник — Drive; A-009).
2. ESLint 10 (flat) + `typescript-eslint` + `boundaries` + `react-hooks`; dependency-cruiser.
3. Срезы `widgets/features/entities/shared/*` с `index.ts`; `shared/lib/clock.ts`, `shared/lib/index.ts`; `content/offer.{ar,en}.json`.
4. Запреты: слои, только `index.ts`, горизонтальные импорты, `shared/ui` → `shared/analytics`, `odoo_stage` в `widgets/pages`, прямое хранилище и `Date`.
5. `deps:graph` → `docs/architecture/deps.mmd`; `docs/architecture/layers.md`.

**Проверка блока 2 (2026-11-05):** 26 срезов с `index.ts` (в `pages/` его нет); `routeTree.gen.ts` содержит только `/`. На временной ветке `test/guards` `pnpm lint` упал на всех нарушениях: `features → pages`, `localStorage.getItem`, `window.sessionStorage`, `Date.now()`, `features → features`, глубокий импорт `@/entities/session/model`, `shared/ui → shared/analytics`, `odoo_stage` в виджете. Разрешённые импорты (`widget → @/entities/session`, `@/shared/lib`) прошли. `deps:check` поймал `no-cross-slice` и `features-down-only`. Ветка удалена. `pnpm verify` (состав блока 2) зелёный.

Примечание: при удалении временной ветки `git clean`/`git checkout` стёрли незакоммиченную работу блока; её восстановили и перепроверили. Дальше — коммит до любых проверок на временных ветках.

## План блока 3

1. `shared/i18n/config.ts`: `ar`/`en`, `fallbackLng: 'ar'`, `?lang=` → `storage('lang')` → `ar`, плейсхолдеры `{…}`, `lang`/`dir` на `<html>`, `track('language_changed')` через заглушку `shared/analytics/track.ts`.
2. `types.d.ts` — типы ключей по `ar.json`.
3. `format.ts` по §1.3 (D-071) и побайтные unit-тесты.
4. `shared/ui/ltr.tsx`, `shared/ui/icon/` со списком `mirroredIcons`.
5. ESLint: `Intl`/`toLocale*` вне `shared/i18n`, `i18next/no-literal-string`, `rtl-friendly`.
6. `i18next-cli` + `scripts/lint-i18n-tov.mjs` → `pnpm lint:i18n`.
7. Стартовые ключи `common/lang/theme/nav/support/relative/units`; дописанные формы — в `docs/i18n/needs-review.md`.

## План блока 4a

1. `shadcn init` с пресетом `b1ZQ7Gl9c` (Radix, RTL, pointer) без `--template`; алиасы `components.json` → `@/shared/ui`, `@/shared/lib`.
2. 20 компонентов `shadcn add` в `src/shared/ui`; проверить логические классы.
3. `tokens.css` = токены пресета без изменений + токены Tadum (статусы, лимит, тени, движение); скрипт контраста.
4. Шрифты: Geist (пресет) + IBM Plex Sans Arabic; `app/theme.tsx`; `DirectionProvider`.
5. Запрет сырых значений: ESLint (`className`, `style`) и Stylelint.
6. Примитивы `Ltr`, `Icon`, `Wordmark`, `StatusBadge`.
7. Storybook 10 (a11y, docs, Vitest-аддон, вьюпорты 360/768/1280, глобалы `locale`/`theme`), истории всех компонентов `shared/ui`.
8. `docs/design/02-design-system.md` + копия в Drive.

**Проверка блока 4a (2026-11-05):** токены `tokens.css` побайтно совпали с выводом CLI и с файлом Кирилла (64 строки). `pnpm check:contrast` — AA для всех токенов Tadum в обеих темах. `pnpm storybook:build` собирается, `storybook-static/index.json` — 64 записи `shared/ui`. `pnpm test:stories` — 40/40, в том числе: в `locale=ar` стрелка и шеврон зеркалятся (`scale: -1 1`), часы — нет; `document.fonts.check` для `"IBM Plex Sans Arabic"` и `"Geist Variable"` — `true`. На временной ветке `className="ml-4"` и `style={{color:'#333'}}` валят `pnpm lint` (см. ниже). `pnpm verify` зелёный.

Блокер по ходу: `ui.shadcn.com` был закрыт сетевой политикой окружения; Кирилл добавил домен в Allowed domains, после этого CLI отработал.

## План блока 5a

1. Zod-схемы всех сущностей `01-entities.md` §2 и перечислений `01-statuses.md` в `shared/api/ports/schemas.ts`; типы в `entities/*/model/types.ts` — из схем.
2. Чистые функции: `mapOdooStage` (`odoo-stage-map.ts`), `deriveClientStatus`, `deriveSupplierStatus`, `resolveRoles`, `computeClientTimeline`/`computeSupplierTimeline`, `clientNextStep`/`supplierNextStep`, права клиента и поставщика, машина состояний документа, сортировка, расчёты лимита и оборота.
3. Тесты, которые разбирают таблицы из `docs/product/*.md` и проверяют каждую строку.

**Проверка блока 5a (2026-11-05):** 261 unit-тест зелёный. Каждая строка покрыта: маппинг стадий (§1 — 14, §2 — 14), состояния прав (`01-roles.md` §4 — 4 строки и 56 ячеек матрицы), права поставщика (§5 — 17 прав × 6 контекстов), правила блокировок (§9 — 7), переходы документа (§5 — 8), статус поставщика (§3 — 3), таблица истинности шкалы (§8 — 7 строк со всеми комбинациями `any`/`≥2`), шкала `01-cabinet-structure.md` §5 (7), «следующий шаг» §6 (11), роли (`01-roles.md` §2 — 5), перечисления (`01-entities.md` §4 — 8), каталог документов (§3 — 11), статусы лимита (§6 — 5). Мутация одной строки маппинга валит ровно один тест. `pnpm verify` зелёный.

## План блока 5b

1. Порты `shared/api/ports/ports.ts` (Auth, Application, Documents, Limit, Supplier, ReferredClients, Offer) и типизированные ошибки `errors.ts`; ответы валидируются Zod-обёрткой в `client.ts`.
2. `shared/api/client.ts`: адаптер по `VITE_API_MODE`, `MockAdapter` и фикстуры — динамическим `import()`; `HttpAdapter` — каркас с `NotImplementedError`.
3. 14 персон `01-entities.md` §6 — рукописные графы в `shared/api/fixtures/personas/*.ts`, даты от `clock.now()`, телефоны `+966 50 000 0XXX`, суммы кратны 500 SAR.
4. `MockAdapter`: состояние в памяти + `storage('mock:<persona>')` со `schemaVersion`; детерминированные задержки и канал OTP от `hash(persona_id)`; OTP по D-021; `demoActions` строго по `01-statuses.md` §10 + SP-03 §7 + `cancelLimit` + `setPersona`. Бизнес-правила (статусы, «следующий шаг», переходы документа, лимит) мок берёт из `entities` через внедрённый `MockDomain` — `shared` не импортирует `entities`.
5. `useStatusPolling` (TanStack Query, интервал из `shared/config/timings.ts`, `refetchOnWindowFocus`).
6. Тесты: Zod каждой персоны и согласованность производных полей; каждое `demoAction`; инварианты §10; OTP.

**Проверка блока 5b (2026-11-05):**
- каждая из 14 персон проходит Zod (`PersonaGraphSchema`), и её производные поля совпадают с правилами `entities`; проверены роли и статус из таблицы §6, телефоны, суммы кратны 500, даты сдвигаются вместе с `clock.now()`;
- 54 теста адаптера зелёные: OTP (D-021), сессия и `expireSession`, сеть, хранилище со `schemaVersion`, документы, каждое из 19 демо-действий (набор сверяется с таблицей §10 и SP-03 §7), инварианты §10 (правки после `submitted`, `available ≥ 0`, состав нового комплекта, `turnover`);
- мутация фикстуры и мутация правила `available ≥ 0` валят ровно по одному тесту;
- `pnpm check:first-chunk`: в первом чанке (172 КБ gzip) кода мока и фикстур нет, мок — отдельный чанк 38 КБ;
- `@faker-js/*` в `src/` нет и запрещён ESLint;
- `pnpm verify` зелёный: 337 unit-тестов, 40 тестов историй.

## План блока 5c

1. `shared/analytics/events.ts` — все события `04-metrics-and-events.md` §3 как discriminated union и `EVENT_VERSIONS`; `screen_viewed` различается по `screen_id` (§3.6).
2. `context.ts` (общие свойства §2.2), `buckets.ts` (§2.4, тесты границ), провайдеры `console`, `demo` (лента для демо-панели), `posthog` (заглушка до SFL-895), `pii-guard.ts` (dev, §2.3); `track()` заменяет заглушку блока 3. ESLint: имя в `track()` — только литерал.
3. `scripts/check-events.mjs` (`pnpm check:events`, в `verify`): имена, обязательные и необязательные свойства и версии в `events.ts` против таблиц §3 и §3.6.
4. `HttpAdapter` — явный каркас всех портов: каждый метод бросает `NotImplementedError(port, method)`.
5. `scripts/contract-md.mjs` (`pnpm contract:md`) → `docs/05-backend-contract.md` из `ports.ts` и `errors.ts`; в `verify` — проверка, что документ актуален.

**Проверка блока 5c (2026-11-05):**
- `pnpm check:events` зелёный: 73 события и 18 экранов `screen_viewed` совпадают с `04-metrics-and-events.md`; порча имени, свойства, версии и экрана даёт 6 расхождений;
- `VITE_API_MODE=http pnpm build` собирается; каждый метод `HttpAdapter` бросает `NotImplementedError(port, method)` (тест на все 16 методов);
- корзины §2.4 покрыты тестами границ, PII-guard — на телефон, e-mail, ссылку, сумму, запрещённые поля;
- `docs/05-backend-contract.md` сгенерирован, `pnpm contract:md --check` зелёный;
- `pnpm verify` зелёный: 403 unit-теста, 40 тестов историй; первый чанк — 169 КБ gzip.

## План блока 6a

1. `shared/config/routes.ts`: пути v1, `screen_id`, семья маршрута, проверка внутреннего `returnTo`.
2. `entities/session`: запрос сессии (TanStack Query), активная семья для `dual` (последний выбор), чистые решения гардов, состояние входа (номер и вызов OTP — только в памяти), `returnTo` и источник входа — в `sessionStore`.
3. `features/request-otp`, `features/verify-otp`: формы `PhoneForm` (маска `+966 5X XXX XXXX`, LTR, `inputmode=tel`) и `OtpForm` (4 ячейки, автоотправка, вставка целиком, таймер 40 с, 5 попыток, `one-time-code`), разбор ошибок A1–A10, A13, события входа.
4. Маршруты v1 (D-067) в `src/pages`: `/`, `/login`, `/login/code`, `/not-found`, `/session-expired`, `/c/home`, `/c/documents`, `/c/help`, `/s/home`, `/s/help`, `*`; гарды в `beforeLoad` макетов `/c` и `/s`; `screen_viewed` в `__root`, 404 с `path_hash`.
5. Тексты SC-01 §4 и SC-10 (`notfound.*`) AR/EN, формы множественного числа — в `needs-review.md`.
6. Тесты: unit — гарды, разбор номера, разбор ошибок (каждая альтернатива A1–A14 — отдельный кейс); маршрутизация — роутер в памяти против мока (A8, A11, A12, A14, `returnTo`, чужая семья, 404); истории с play-тестами для экранов входа.

**Проверка блока 6a (2026-11-05):**
- `src/app/sc-01.test.ts` — 25 кейсов: основной сценарий, A1–A14 по отдельности и критерии приёмки маршрутов;
- `guards.test.ts` — 16 кейсов гардов, `routes.test.ts` сверяет `screen_id` каждого пути с `01-cabinet-structure.md` §1;
- 20 историй `PhoneForm` и `OtpForm` с play-тестами против мока, axe — без нарушений; мутация «не очищать ячейки» валит ровно одну историю;
- `pnpm lint:i18n` зелёный (0 ошибок, 4 предупреждения `please_filler` — тексты сценариев, A-014);
- `pnpm verify` зелёный: 481 unit-тест, 60 историй; первый чанк — 186 КБ gzip из 200 (запас сокращается — смотреть в 7a, `size-limit`).

## Решения Кирилла по ходу

- 2026-11-05 — источник мастер-промпта — Drive, а не переданный файл (A-009).
- 2026-11-05 — контраст не менять нигде: замечания к контрасту пресета приняты как есть (A-019, `docs/design/02-design-system.md` §4). Копия документа в Drive: `1AGowEl76u6Tn-mnHFcSv-_Y8SSpHO48V` (с этим решением; прежняя `1KUkT3KnC34_j6lhtgVrugF2FZLeu82Nj` — в корзине).

## Проверка среды (§0.4), 2026-11-05

| Что | Результат |
| :--- | :--- |
| Node | v22.23.4 — ок |
| pnpm | 10.28.0 — ок |
| git | 2.43.0 — ниже требуемых 2.45; для нужд проекта достаточно, см. assumptions A-002 |
| jq | 1.7 — ок |
| gh | 2.89.0 установлен, но токен `GH_TOKEN` сессии недействителен; в этой облачной среде `gh` разрешён только для поиска. GitHub доступен через MCP-инструменты, ограниченные репозиторием `crystalcutsss/proto` |
| wrangler | не установлен (ставится dev-зависимостью в блоке 1) |
| Graphviz `dot` | нет — граф зависимостей будет в Mermaid |
| Cloudflare | коннектор Cloudflare работает: в аккаунте видны воркеры `proto`, `portfolio`. У `wrangler` в сессии токена нет (`CLOUDFLARE_API_TOKEN` не задан), поэтому `wrangler whoami` и `deploy --dry-run` из CLI пока не пройдут |
| Proto | клон в `/home/user/proto` (нужен только в блоке 9) |
| Google Drive | коннектор есть (используется в блоке 1b) |

## Входные данные от Кирилла

- **Пресет shadcn (D-077):** `pnpm dlx shadcn@latest init --preset b1ZQ7Gl9c --base radix --template vite --rtl --pointer`. Токены темы — `docs/setup/inputs/shadcn-theme-tokens.css` (переносить в `src/styles/tokens.css` без изменений). В блоке 4a флаг `--template vite` не используется: проект к тому времени уже создан вручную (§1.2, 4a.1). Остальные флаги (`--preset b1ZQ7Gl9c --base radix --rtl --pointer`) применяются как есть, после сверки с `--help`.

## ⏸ ожидают Кирилла

1. **Токен Cloudflare для `wrangler`** (нужен к блокам 7a и 9; `--dry-run` блока 1 прошёл без него). Кирилл сам ставит его в переменные окружения облачной сессии; агент токен не видит. Блоки без Cloudflare продолжаются.
