# Tadum — кабинеты клиента и поставщика (KSA)

Фронтенд-прототип без бэкенда: данные через порты и `MockAdapter`. Арабский по умолчанию, RTL и LTR равноправны, PWA. Превью `main` — https://tadum.kirillgloba.workers.dev; версии публикуются на витрину Proto как `/p/tadum/vN/`.

## Источник правды

- Продуктовые документы — Google Drive `Tadum/` (русский). `docs/product/` — дословный снимок: правится только скиллом `/sync-product-docs`. Документы в Drive агент правит сам только по решению Кирилла в чате, показав правку и получив «да»; затем сразу синхронизация (процедура — `.claude/rules/product-docs.md`).
- Решения — `docs/product/00-decision-log.md` (D-###). Допущения без владельца — `docs/decisions/assumptions.md` (A-###). ADR — `docs/decisions/`.
- Карта документации — `docs/README.md`. История настройки среды — `docs/setup/progress.md`.

## Инварианты

1. Арабский по умолчанию, RTL и LTR равноправны; каждый экран — в ar/en × light/dark.
2. Ни одной пользовательской строки в коде: только ключи i18n с паритетом ar/en; тексты проходят `tov-lexicon.json`.
3. Данные только через порты `src/shared/api/ports`; компоненты не знают про мок.
4. Только токены: сырые hex/px/мс в компонентах запрещены. `src/styles/tokens.css` и `src/shared/ui/**` меняет только субагент `design-system-owner`.
5. Нет PII в URL, хранилище вне сессии, аналитике, логах; хранилище — только через `src/shared/lib/storage.ts`.
6. Английский — код, идентификаторы, имена файлов, коммиты, ключи i18n, имена событий. Русский — `CLAUDE.md`, `.claude/**`, комментарии в коде, `README.md`, `CONTRIBUTING.md`, `docs/**`, release notes, ADR.
7. `docs/product/**` — только через `/sync-product-docs`, никогда вручную.
8. Перед остановкой — `pnpm verify` зелёный.
9. Секреты ставит только Кирилл: никогда `wrangler secret …`, `gh secret …`; не видеть и не записывать пароли и токены — сказать, где и что поставить, и ждать подтверждения.
10. Общие ресурсы — только после явного «да» Кирилла с показанным diff: push в `main` Proto, деплой Proto, деплой превью вне CI, merge в `main` Tadum.
11. Не угадывать: ответа нет в документе — значение «По умолчанию» из «Открытых вопросов» соответствующего `01-*.md` или сценария; нет и его — запись в `docs/decisions/assumptions.md` (что, почему, как проверить) и дальше.
12. Проверять, а не доверять: флаги CLI, ключи конфигов, API библиотек — по `--help` и документации на дату; расхождение — в `assumptions.md`.
13. Одна задача — одна ветка — один PR (ADR-004), для любой задачи и любой сессии. Свои правки смотреть на превью ветки, без PR и публикации; отдельные ветки и PR для release notes, тега или версии в Proto не заводить. Выпуск vN — `docs/releases/vN.md` в той же ветке, публикует merge.

## Структура и команды

Слои FSD-lite: `app → pages → widgets → features → entities → shared`, импорт только вниз и только через `index.ts` среза (`docs/architecture/layers.md`).

- `src/app` — вход, провайдеры, роутер; `src/pages` — файловые маршруты TanStack Router.
- `src/shared/api` — порты, `MockAdapter`, персоны (`fixtures/personas`), `HttpAdapter`-каркас.
- `src/shared/i18n/locales/{ar,en}.json` — тексты; `src/shared/analytics` — словарь событий.
- `tests/e2e` — Playwright; истории — рядом с компонентами (`*.stories.tsx`).

Команды: `pnpm dev` · `pnpm verify` · `pnpm test:e2e` · `pnpm storybook` · `pnpm screenshots` · `pnpm contract:md` · `pnpm run release:proto vN`. Полный список — `README.md`.

Мок: любая персона из `README.md`, код `0000`; `?persona=<id>&lang=en` открывает персону без входа.

## Цикл фичи

`/feature-brief TD-###` → `/plan TD-###` → ветка или worktree → реализация → `/verify` → по необходимости `/rtl-qa`, `/design-review`, `/ux-copy-review`, `/a11y-review` → `/pr` → ревью → merge Кириллом; для выпуска release notes `docs/releases/vN.md` кладутся в ту же ветку до PR.

Выпуск (ADR-004): одна ветка — один PR с кодом и `docs/releases/vN.md`; merge Кириллом публикует версию сам. Просмотр правок (решение Кирилла 2026-11-06): реализация → `/verify` → push в рабочую ветку → Кирилл смотрит превью ветки `https://<ветка>-tadum.kirillgloba.workers.dev` (≈1 мин после push, CI не ждёт) или dev-сервер в сессии → **PR только по его команде** → merge Кириллом. Коммиты в рабочую ветку — можно, PR без команды — нет. Исключение — PR синхронизации `docs: sync product docs …` после правки Drive по решению Кирилла: агент открывает его сам (решение 2026-11-09), merge — Кирилл.

Процедуры — в скиллах `.claude/skills/` (`/feature-brief`, `/pr`, `/release-proto` запускает только человек: они пишут в Drive, GitHub или Proto; `/sync-product-docs` — Кирилл или агент после правки Drive по решению Кирилла); правила по областям — `.claude/rules/` (подгружаются по путям); роли — `.claude/agents/`.

## Когда спрашивать Кирилла

- Решения нет в `docs/product` и журнале решений, а «По умолчанию» тоже нет и допущение рискованно.
- Нужно менять защищённый путь (`docs/product/**`, `tokens.css`, `shared/ui`, порты, CI, `wrangler.jsonc`) без явной задачи.
- Нужен новый порт или изменение контракта бэкенда.
- Нужен секрет, токен или пароль.
- Push или деплой общих ресурсов; merge в `main`.

## Языки

Отвечать Кириллу по-русски. Коммиты — Conventional Commits по-английски (`CONTRIBUTING.md`).

Сообщения Кириллу — только итог этапа работы, то, что требует его действия или ответа, и критически важное. Без отчётов о каждом шаге.
