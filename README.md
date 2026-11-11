# Tadum

B2B-портал для рынка KSA: кабинет клиента (заявка на торговый лимит, документы, статус, лимит) и кабинет поставщика (статус, реферальная ссылка и QR, приведённые клиенты, документы, условия) в одной оболочке. Фронтенд-прототип без бэкенда: данные приходят из мок-адаптера, позже поверх тех же портов подключится API (`docs/05-backend-contract.md`).

Интерфейс по умолчанию на арабском (RTL), английский (LTR) равноправен; светлая и тёмная темы.

- Превью ветки `main`: https://tadum.kirillgloba.workers.dev (без пароля, `noindex`, только мок-данные).
- Витрина версий: `https://proto.kirillgloba.workers.dev/p/tadum/vN/` (вход по паролю).
- Где какие документы — [`docs/README.md`](docs/README.md); как работать с репозиторием — [`CONTRIBUTING.md`](CONTRIBUTING.md).

Эта инструкция не требует Claude Code: всё ниже выполняется обычными командами.

## Что нужно установить

| Что | Версия | Откуда |
| :--- | :--- | :--- |
| Node.js | 22 (`.nvmrc`) | https://nodejs.org или `nvm use` |
| pnpm | 10.28.0 (`packageManager` в `package.json`) | `corepack enable` — Node поставит нужную версию сам |
| Git | 2.4x | — |
| jq | любая | для хуков Claude Code (`scripts/hooks`) и их тестов; `apt install jq` / `brew install jq` |
| Браузеры Playwright | — | `pnpm exec playwright install chromium webkit` (для e2e и Storybook-тестов) |

В `.npmrc` включён `engine-strict`: с другой мажорной версией Node установка зависимостей остановится с ошибкой.

## Первый запуск

```bash
corepack enable
```

```bash
pnpm install
```

`pnpm install` ставит зависимости и git-хуки (husky): проверку сообщения коммита и ESLint/Stylelint на изменённых файлах.

```bash
pnpm dev
```

Откройте адрес из вывода (обычно http://localhost:5173).

## Как войти

Бэкенда нет: вход работает на мок-данных. Номер — любой из таблицы (9 цифр после `+966`), код подтверждения — всегда `0000`.

| Персона | Номер | Что показывает |
| :--- | :--- | :--- |
| `client_new` | 500000001 | клиент, документы ещё не загружены |
| `client_partial` | 500000002 | часть документов загружена |
| `client_rejected` | 500000003 | документ отклонён, нужна перезагрузка |
| `client_submitted` | 500000004 | комплект на проверке |
| `client_more_docs` | 500000005 | запрошены дополнительные документы |
| `client_approved_unsigned` | 500000006 | одобрено, ждёт подписания |
| `client_offer_pending` | 500000015 | одобрено, условия согласует менеджер (этап «Решение», A-063) |
| `client_signing_partial` | 500000016 | подписание: договор подписан, вексель компании ждёт подтверждения (A-063) |
| `client_limit_cancelled` | 500000017 | лимит отменён на этапе подписания (A-063) |
| `client_active` | 500000007 | лимит одобрен (активен) |
| `client_first_purchase` | 500000008 | первая покупка |
| `client_closed_rejected` | 500000009 | заявка закрыта (отказ) |
| `client_closed_lost` | 500000010 | заявка закрыта (клиент ушёл) |
| `supplier_new` | 500000011 | поставщик, новый |
| `supplier_active` | 500000012 | поставщик, активный |
| `dual_active` | 500000013 | клиент и поставщик одновременно (переключатель ролей) |
| `unknown_phone` | 500000014 | номера нет в системе |

Без ввода номера: `http://localhost:5173/?persona=client_active` (можно добавить `&lang=en`). Демо-панель (кнопка «Демо» в углу экрана) переключает персону и выполняет действия команды Tadum «за бэкенд»: одобрить или отклонить документ, одобрить заявку, истечь сессию и т. п.; там же режим сети (медленно, офлайн, ошибка сервера) и лента событий аналитики. Состояние мока хранится в `localStorage` браузера; выбор персоны в панели (или `?persona=`) всегда начинает её с исходных данных.

## Команды

| Команда | Что делает |
| :--- | :--- |
| `pnpm dev` | dev-сервер Vite |
| `pnpm build` | сборка в `dist/` |
| `pnpm preview` | раздаёт `dist/` локально (порт 4173) |
| `pnpm verify` | все проверки, которые должны быть зелёными перед PR (см. ниже) |
| `pnpm typecheck` | генерация дерева маршрутов и `tsc` |
| `pnpm lint` | ESLint (включая границы слоёв, RTL, i18n) и Stylelint |
| `pnpm lint:rtl` | поиск физических классов (`ml-`, `text-left` и т. п.) |
| `pnpm lint:i18n` | паритет ключей ar/en, лексикон TOV |
| `pnpm lint:gitlab-ci` | `.gitlab-ci.yml` против схемы GitLab CI |
| `pnpm deps:check` / `pnpm deps:graph` | границы и циклы (dependency-cruiser) / граф в `docs/architecture/deps.mmd` |
| `pnpm knip` / `pnpm jscpd` | неиспользуемый код / дубли (порог 3 %) |
| `pnpm check:events` | словарь аналитики против `docs/product/04-metrics-and-events.md` |
| `pnpm contract:md` | перегенерировать `docs/05-backend-contract.md` из портов (`--check` — только сверить) |
| `pnpm check:docs` | относительные ссылки в документации не битые |
| `pnpm test` | unit-тесты (Vitest) |
| `pnpm storybook` / `pnpm test:stories` | Storybook на порту 6006 / истории как тесты с axe |
| `pnpm test:e2e` | Playwright: сценарии v1 и axe во всех проектах |
| `pnpm test:e2e:smoke` | быстрые сценарии в `android-chrome` (входит в `verify`) |
| `pnpm test:a11y` | только axe на экранах v1 |
| `pnpm screenshots` | скриншоты 360/768/1280 × ar/en × light/dark в `tests/screenshots/` |
| `pnpm screenshots:update` | то же внутри docker-образа Playwright (нужен Docker) |
| `pnpm size` / `pnpm lhci` | бюджеты размера / Lighthouse CI (нужна сборка) |
| `pnpm deploy:preview` | сборка и `wrangler deploy` превью-воркера (обычно делает CI) |
| `pnpm deploy:branch <ветка> [--delete]` | сборка и `wrangler preview` — превью ветки (делает CI) |
| `pnpm release:proto vN` | публикация версии на витрину Proto (блок 9) |

`pnpm verify` = typecheck, lint, `lint:rtl`, `lint:gitlab-ci`, `deps:check`, knip, jscpd, `lint:i18n`, `check:events`, `contract:md --check`, `check:contrast`, `check:docs`, unit-тесты, сборка Storybook и истории, сборка, проверка первого чанка, e2e smoke, проверка, что демо-код не попадает в прод-сборку. Занимает несколько минут.

## Переменные окружения

Пример — `.env.example`; для своих значений скопируйте его в `.env.local`. Секретов в переменных `VITE_*` нет и быть не может: они попадают в сборку.

| Переменная | Значение по умолчанию | Смысл |
| :--- | :--- | :--- |
| `VITE_BASE_PATH` | `/` | базовый путь сборки; на витрине `/p/tadum/vN/` |
| `VITE_API_MODE` | `mock` | `mock` — фикстуры; `http` — каркас будущего API |
| `VITE_DEMO_PANEL` | `1` | `0` — сборка без выбора персоны по `?persona=` (демо-панели нет с 2026-11-06) |
| `VITE_ANALYTICS` | `console` | `console` / `posthog` |
| `VITE_PROTO_VERSION` | — | подпись версии на витрине (`v1`) |
| `VITE_SUPPORT_WHATSAPP`, `VITE_SUPPORT_EMAIL` | см. `.env.example` | контакты поддержки |
| `VITE_LANDING_URL` | `https://tadum.sa` | куда ведёт «Подать заявку» |

Сборка под витрину:

```bash
VITE_BASE_PATH=/p/tadum/v1/ pnpm build
```

## CI и деплой

- `.github/workflows/ci.yml` и зеркальный `.gitlab-ci.yml`: install → typecheck → lint → test → build → e2e (+ axe, скриншоты-артефакты) → size, плюс commitlint и changeset в PR, `pnpm audit`, gitleaks. Итоговый job `ci` — обязательная проверка. Ночью и при ручном запуске (Actions → ci → Run workflow) e2e идёт ещё и в desktop-safari и desktop-edge (Edge ставится в job).
- `lighthouse.yml` — Lighthouse CI на `main` и по ночам (в v1 только отчёт).
- `deploy-preview.yml` — каждый push в `main` выкладывает превью-воркер `tadum`. Push в любую другую ветку и открытие PR выкладывают **превью ветки** на свой адрес `https://<ветка>-tadum.kirillgloba.workers.dev` (`/` и `_` в имени ветки становятся `-`): ссылка — комментарием в PR и в сводке запуска Actions, прод не меняется; удаление ветки удаляет превью. Нужны секреты репозитория `CLOUDFLARE_API_TOKEN` и `CLOUDFLARE_ACCOUNT_ID`; без них деплой пропускается.

## Частые проблемы

- **`ERR_PNPM_UNSUPPORTED_ENGINE`** — не та версия Node. `nvm use` (или установите Node 22).
- **e2e падают с «Executable doesn't exist»** — не установлены браузеры: `pnpm exec playwright install chromium webkit`.
- **Мок в неожиданном состоянии** — откройте персону заново ссылкой `?persona=<id>` (она начнётся с исходных данных) или очистите `localStorage` сайта.
- **Коммит отклонён `commitlint`** — формат `type(scope): описание`, см. `CONTRIBUTING.md`.
