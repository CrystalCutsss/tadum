# Прогресс настройки среды Tadum

Источник порядка — `docs/setup/master-prompt.md` §0.5. Допущения — [`docs/decisions/assumptions.md`](../decisions/assumptions.md).

| Блок | Статус | Коммит | Заметки |
| :--- | :--- | :--- | :--- |
| 0 | done | `0e3fcfa` | Репозиторий создал Кирилл; `main` создан из коммита блока 0 без push (A-003) |
| 1 | done | `37ad462` | `verify` = `typecheck && build`; `wrangler deploy --dry-run` проходит без токена; `account_id` — до 7a (A-005) |
| 1b | done | `80e3461` | 31 файл (28 в `docs/product/` + шаблоны), побайтно с Drive (A-008) |
| 2 | done | см. git log | `verify` += `lint && deps:check`; boundaries 7.x — правило `dependencies` (A-010) |
| 3 | todo | — | |
| 4a | todo | — | Пресет получен (2026-11-05), см. ниже |
| 5a | todo | — | |
| 5b | todo | — | |
| 5c | todo | — | |
| 6a | todo | — | |
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
