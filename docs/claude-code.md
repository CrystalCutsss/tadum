# Среда Claude Code в Tadum

Как устроен слой Claude Code в репозитории: что подключено, кто что может, что запрещено и как выдать доступы. Копия — Drive `05 Разработка/05-claude-code-environment.md`. Команде Claude не обязателен: всё ниже — надстройка над обычным процессом (`README.md`, `CONTRIBUTING.md`).

## Из чего состоит

| Что | Где | Зачем |
| :--- | :--- | :--- |
| Контекст проекта | `CLAUDE.md` | инварианты, структура, цикл фичи; читается в каждой сессии |
| Правила по областям | `.claude/rules/*.md` | подгружаются, когда Claude работает с файлами из `paths:` |
| Субагенты | `.claude/agents/*.md` | роли с ограниченными инструментами |
| Скиллы | `.claude/skills/*/SKILL.md` | процедуры: `/feature-brief`, `/plan`, `/verify`, `/pr`, … |
| Хуки и разрешения | `.claude/settings.json`, `scripts/hooks/*.sh` | защищённые пути и опасные команды — не по договорённости, а технически |
| MCP-серверы | `.mcp.json` | shadcn, Playwright, Chrome DevTools, Context7, GitHub, Cloudflare |
| Плагины | `.claude/settings.json` → `enabledPlugins` | предлагаются к установке при первом запуске в проекте |

Проверки слоя: `pnpm check:claude` (фронтматтер, ссылки, длина `CLAUDE.md`), `claude plugin validate .claude`, тесты хуков `scripts/hooks/__tests__` (в `pnpm test`).

## Субагенты

| Агент | Инструменты | Задача |
| :--- | :--- | :--- |
| `design-system-owner` | чтение, правка, Bash, shadcn MCP; память проекта | единственный, кто меняет `tokens.css` и `src/shared/ui/**` (хук пропускает только его) |
| `ux-researcher` | инструменты сессии без правки файлов (Mobbin, Drive, веб) | бенчмарк 5–8 паттернов → Drive `03 Исследования/Бенчмарки и Mobbin` |
| `a11y-usability-reviewer` | чтение, Bash, Playwright и Chrome DevTools MCP; без правки | отчёт WCAG 2.2 AA по экрану |
| `rtl-qa` | чтение, Bash, Playwright MCP; без правки | RTL/LTR: логические свойства, зеркалирование, bidi, скриншоты AR vs EN |
| `ux-writer` | чтение, правка (хук: только `locales` и `docs/i18n`) | тексты AR/EN по TOV и лексикону |
| `code-reviewer` | чтение, Bash; без правки | ревью дифа против брифа и DoD |
| `release-manager` | чтение, Bash, GitHub MCP; без правки | подготовка публикации на витрину; push и деплой — после «да» Кирилла |

## Скиллы

| Скилл | Кто запускает | Что делает |
| :--- | :--- | :--- |
| `/feature-brief TD-###` | человек | бриф по шаблону → Drive `05 Разработка/Фичи` и Issue |
| `/plan TD-###` | человек или Claude | план по слоям, тесты, тексты, события → раздел 13 брифа |
| `/verify` | Claude | `pnpm verify` и доп. проверки со свежим выводом |
| `/design-review`, `/rtl-qa`, `/ux-copy-review`, `/a11y-review` | человек или Claude | ревью через профильных агентов |
| `/mobbin-research <тема>` | человек или Claude | исследование через `ux-researcher` |
| `/adr <title>` | человек или Claude | новый ADR + копия в Drive |
| `/sync-product-docs` | только Кирилл (`TADUM_DOCS_SYNC=1 claude`) | дословный снимок Drive → `docs/product/`, PR |
| `/release-proto vN` | человек | публикация на витрину Proto с остановками |
| `/pr` | человек | PR по шаблону DoD, changeset, `ci` |

## Хуки

Хукам нужны `bash`, `jq` и `realpath` (coreutils). Без `jq` защитные хуки (`protect-paths`, `guard-bash`) блокируют действие, остальные молчат — защита не отключается тихо.

| Событие | Скрипт | Что делает |
| :--- | :--- | :--- |
| `PreToolUse` Edit/Write/MultiEdit/NotebookEdit | `protect-paths.sh` | запрет правки защищённых путей (ниже); `ux-writer` — только тексты |
| `PreToolUse` Bash | `guard-bash.sh` | запрет force-push, push в `main`, коммита в `main`, `rm -rf` вне артефактов сборки, `wrangler secret`/`gh secret`, прямого `wrangler deploy`, `pnpm release:proto` без `run`, `shadcn add` вне `design-system-owner`, записи в защищённые пути через `sed -i`/`>`/`tee`/`cp`/`mv` |
| `PostToolUse` Edit/Write/MultiEdit | `post-edit.sh` | `eslint --fix` файла; для `*.tsx` — физические классы; для `locales/*.json` — паритет ключей ar/en; замечания сразу уходят Claude |
| `Stop` | `verify-on-stop.sh` | если менялся `src/` — `pnpm verify`; красный — Claude не может остановиться |
| `SessionStart` | `session-start.sh` | инварианты из `CLAUDE.md` в контекст |
| `UserPromptSubmit` | `prompt-brief.sh` | при `TD-###` в запросе — напоминание открыть бриф |

### Защищённые пути

| Путь | Кто может менять |
| :--- | :--- |
| `src/styles/tokens.css`, `src/shared/ui/**` | субагент `design-system-owner`; сессия с `TADUM_ALLOW_PROTECTED=1` |
| `src/shared/api/ports/**`, `pnpm-lock.yaml` (только через pnpm), `.github/**`, `.gitlab-ci.yml`, `wrangler.jsonc`, `.claude/settings.json` | сессия с `TADUM_ALLOW_PROTECTED=1` (ставит Кирилл при запуске: `TADUM_ALLOW_PROTECTED=1 claude`) |
| `docs/product/**`, `tov-lexicon.json` | только `/sync-product-docs` в сессии `TADUM_DOCS_SYNC=1` |

Запрет путей сделан хуком, а не правилами `deny`: `deny` нельзя снять даже владельцу, а хук пропускает по переменной окружения.

## Разрешения (`permissions`)

- **allow** — без вопроса: `pnpm install/run/exec/verify/test/lint/typecheck/build`, `pnpm dlx shadcn@*`, чтение и коммиты git, push в `chore/*`, `feat/*`, `fix/*`, `docs/*`, `gh pr view/create/checks`, `gh run`, `gh issue`, `wrangler deploy --dry-run`, `wrangler whoami`.
- **ask** — всегда спросить: `pnpm run release:proto`, `pnpm run deploy:preview`, `gh pr merge`, `gh api`, `git -C … push`, push тегов `v*`.
- **deny** — никогда: force-push, push в `main`, `gh repo delete`, `gh secret`, `wrangler secret`, `wrangler delete`.

Разрешения из `.claude/settings.json` действуют только в доверенной папке: при первом запуске `claude` в репозитории примите диалог доверия. До этого (и в `claude -p` без доверия) Claude Code их игнорирует и спрашивает каждую команду; хуки работают в любом случае.

## MCP-серверы (`.mcp.json`)

| Сервер | Как запускается | Доступ |
| :--- | :--- | :--- |
| `shadcn` | `pnpm exec shadcn mcp` (версия из `package.json`) | без токена |
| `playwright` | `pnpm dlx @playwright/mcp@0.0.84 --headless --isolated` | без токена |
| `chrome-devtools` | `pnpm dlx chrome-devtools-mcp@1.12.0 --headless --isolated` | без токена |
| `context7` | HTTP `https://mcp.context7.com/mcp` | без токена (лимиты бесплатного уровня) |
| `github` | HTTP `https://api.githubcopilot.com/mcp/` | переменная окружения `GITHUB_PERSONAL_ACCESS_TOKEN` (fine-grained токен на репозиторий: Contents, Pull requests, Issues, Actions — read/write) |
| `cloudflare` | HTTP `https://mcp.cloudflare.com/mcp` | вход через браузер (OAuth) при первом вызове |

Google Drive и Mobbin — коннекторы claude.ai (подключаются в настройках claude.ai), в `.mcp.json` не объявляются. Секретов в `.mcp.json` нет: токен GitHub подставляется из окружения пользователя.

### Как выдать токены (делает человек, не агент)

- **GitHub:** github.com → Settings → Developer settings → Fine-grained tokens → Generate (репозиторий `tadum`, права выше) → в профиль оболочки `export GITHUB_PERSONAL_ACCESS_TOKEN=…`. В облачной сессии Claude GitHub уже подключён через приложение Claude — токен не нужен.
- **Cloudflare:** при первом вызове MCP откроется вход в Cloudflare; деплой превью токен из сессии не использует — его делает CI с секретами репозитория.

## Плагины

Объявлены в `.claude/settings.json` (`extraKnownMarketplaces`, `enabledPlugins`) — Claude Code предложит установить их при первом запуске в проекте.

| Плагин | Маркетплейс | Зачем |
| :--- | :--- | :--- |
| `frontend-design` | `claude-plugins-official` | приёмы качественной вёрстки интерфейсов |
| `code-review` | `claude-plugins-official` | `/code-review` — ревью дифа (в GitLab заменяет `claude-code-action`) |
| `typescript-lsp` | `claude-plugins-official` | навигация и диагностика TypeScript через LSP |
| `hookify` | `claude-plugins-official` | быстро оформить повторяющееся замечание в хук |
| `claude-md-management` | `claude-plugins-official` | поддержка `CLAUDE.md` в актуальном и коротком виде |
| `design` | `knowledge-work-plugins` | дизайн-критика, UX-тексты, доступность |

`superpowers` не ставится (D-066): его процессы конфликтуют с нашим циклом фичи.

## Частые ситуации

- **Хук отказал в правке токена** — делегируйте `design-system-owner` или попросите Кирилла запустить сессию с `TADUM_ALLOW_PROTECTED=1`.
- **Claude не может остановиться** — Stop-хук нашёл красный `pnpm verify`; причина — в хвосте лога в сообщении хука.
- **Каждая команда спрашивает разрешение** — папке не дано доверие: запустите `claude` интерактивно и примите диалог.
