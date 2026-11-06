# Публикация версии на витрину Proto

Как версия Tadum попадает на https://proto.kirillgloba.workers.dev/p/tadum/vN/ (ADR-003, A-052). Выполняет `pnpm run release:proto` (скилл `/release-proto`, субагент `release-manager`); каждое действие с общими ресурсами — после «да» Кирилла.

## Как это устроено в Proto

- Каждая версия прототипа — workspace-пакет `prototypes/<slug>/versions/<vN>/` в репозитории Proto. Список прототипов и версий (`registry.json`) Proto собирает сам из `prototype.json` и `version.json` — руками его не правят.
- Tadum собирается в своём репозитории, поэтому кладётся в Proto **замороженной версией** (механизм Proto ADR-0010): готовая сборка в `.frozen/site`, sha256 каждого файла в `.frozen/manifest.json`, `package.json` со скриптом `proto-frozen-build` — сборка Proto только копирует снимок и проверяет, что он не изменился. Опубликованную версию нельзя поменять — только выпустить следующую.
- В `index.html` сборки добавляются теги, которые Proto ставит во все версии: `proto:prototype`, `proto:version`, `robots` и загрузчик оболочки `/_shell/loader.js` (просмотрщик с рамкой телефона и меню).
- Меню просмотрщика передаёт в прототип оси: **Персона** (`?persona=`, первый пункт «Вход по номеру» — без персоны) и **Язык** (`?lang=ar|en`). Ограничения Proto: у оси не больше 6 пунктов, id через дефис — поэтому в меню вход и пять ключевых персон, а Tadum принимает `?persona=client-active` так же, как `client_active`. «Сценарии» меню не используются: у версии с осями меню их не показывает.
- В `main` Proto изменения попадают только через PR, который мержит Кирилл. Деплой витрины — Cloudflare Workers Builds после merge, отдельной команды деплоя нет.
- Пароль Tadum (`separatePassword: true`) — ключ `"tadum"` в секрете `PROTOTYPE_PASSWORDS` воркера `proto`.
- Вид в просмотрщике (Кирилл 2026-11-06): `platform: desktop`, `platforms: [desktop]` — всё окно, без контрола «Экран»; `menu: { versions: false, style: shadcn }` — меню оболочки в стиле shadcn DropdownMenu, без переключения версий (ADR-0027 Proto). В меню одна ось — «Сценарии и роли» (`PERSONA_ITEMS`); языка в меню нет, его меняет кнопка в шапке. Демо-панели нет: персона, язык и тема — только через меню оболочки и интерфейс кабинета.

## Шаги

1. **Release notes** `docs/releases/vN.md`: заголовок `# Tadum vN — <название>`, раздел `## Что вошло` (из него — changelog версии в меню), «Что отложено», «Известные ограничения», «Как смотреть», «Что проверить команде». Копия — Drive `06 Версии прототипа/vN.md`.
2. **Подготовка** (с `main` или `chore/release-*`, чистое дерево):

   ```bash
   pnpm run release:proto vN --proto-dir ../proto
   ```

   Скрипт: `pnpm verify` → ветка Proto `feat/tadum-vN` от свежего `origin/main` → сборка Tadum с `VITE_BASE_PATH=/p/tadum/vN/ VITE_DEMO_PANEL=1 VITE_ANALYTICS=console VITE_PROTO_VERSION=vN` → теги Proto в `index.html`, без `_headers` → `prototypes/tadum/…` → в Proto `pnpm install`, Prettier по метаданным, `pnpm registry:validate`, `pnpm lint`, `pnpm site:build --no-previews` → коммит в ветке Proto (без push).
3. **⏸ Решение Кирилла:** diff Proto (`git -C ../proto show --stat`), локальный просмотр (`cd ../proto && pnpm site:preview` → `/p/tadum/vN/`).
4. **Push ветки и PR** (после «да»):

   ```bash
   pnpm run release:proto vN --proto-dir ../proto --publish
   ```

   PR в `main` Proto — GitHub MCP или `gh pr create`; merge — Кирилл; Workers Builds деплоит.
5. **⏸ Пароль Tadum — ставит Кирилл** (агент пароль не видит и не задаёт): Cloudflare → Workers & Pages → `proto` → Settings → Variables and Secrets → `PROTOTYPE_PASSWORDS` → значение — JSON всех отдельных паролей, например `{"tadum": "…"}`; если там уже есть пароли других прототипов, сохраните их в том же JSON — значение секрета нельзя прочитать обратно, и запись только с `tadum` удалит остальные.
6. **Проверка и тег:** `/p/tadum/vN/` открывается после двух паролей, персоны из меню работают, другие прототипы витрины открываются по своим паролям; затем

   ```bash
   pnpm run release:proto vN --tag
   ```

   В облачной сессии Claude push тегов закрыт (git-прокси отвечает 403) — тег ставит человек: GitHub → Releases → **Draft a new release** → тег `vN` на `main`, заголовок `Tadum vN`, текст из `docs/releases/vN.md` → **Publish release**.

## Права для самостоятельной работы (Кирилл 2026-11-06)

Чтобы агент обновлял статусы и записывал релизы без отказов и вопросов:

- **Proto:** в `.claude/settings.json` разрешены `mcp__Google_Docs__update_doc`, `mcp__Google_Drive__create_file`, `mcp__Google_Drive__update_file` и чтение Drive. Хук `drive-guard` по-прежнему пускает запись только в Proto/Docs. Так облачный STATUS и ADR в Proto/Docs обновляются сами.
- **Tadum:** те же правила в `.claude/settings.json` (копия release notes в Drive «06 Версии прототипа»). Файл защищён хуком `protect-paths`: правку вносит Кирилл или сессия с `TADUM_ALLOW_PROTECTED=1`.
- **Ограничение облака:** правила из `.claude/settings.json` читаются только в сессии с одним репозиторием. Сессия выпуска подключает и Tadum, и Proto, поэтому в ней запись в Drive может быть отклонена режимом auto. Тогда агент отдаёт Кириллу готовый текст и место вставки; другой вариант — режим, в котором запрос приходит Кириллу на подтверждение.
- **Тег `vN`** из облачной сессии не пушится (git-прокси отвечает 403): тег ставит Кирилл через GitHub Releases, текст — из `docs/releases/vN.md`.

## Откат

Revert PR публикации в Proto (merge — Кирилл); Workers Builds задеплоит предыдущее состояние. Кнопка «Rollback» в дашборде Cloudflare (Deployments) — быстрый вариант до revert.
