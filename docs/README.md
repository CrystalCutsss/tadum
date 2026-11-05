# Документация Tadum: что где лежит

Продуктовые документы живут в Google Drive и попадают в репозиторий только синхронизацией. Документация разработки живёт здесь и меняется через PR (план §3.6).

## Источники и правила

| Что | Где лежит | Язык | Кто меняет |
| :--- | :--- | :--- | :--- |
| Продуктовые требования, сценарии, TOV, метрики, брифы фич, release notes, ADR | Google Drive `Tadum/` | русский | люди (Кирилл, команда); Claude — по запросу |
| Снимок продуктовых документов для агентов | `docs/product/` (в каждом файле — шапка «не редактировать, источник — Drive») | русский | только синхронизация `/sync-product-docs` (PR `docs: sync product docs YYYY-MM-DD`) |
| Документация разработки: README, CONTRIBUTING, архитектура, ADR (зеркало), словарь событий, DoD, контракт бэкенда, перенос в GitLab | репозиторий `docs/` и корень | русский; код, идентификаторы, коммиты, ключи i18n, имена событий — английский | люди и агенты через PR |
| Контекст проекта Claude | проект Claude «Tadum» | русский | Claude при изменениях в Drive |

Обратного направления нет: правку продуктового документа агент предлагает текстом, человек вносит её в Drive, затем — синхронизация.

## Карта репозитория

| Файл | О чём |
| :--- | :--- |
| [`../README.md`](../README.md) | запуск без Claude: установка, персоны, команды, переменные, CI |
| [`../CONTRIBUTING.md`](../CONTRIBUTING.md) | ветки, worktree, коммиты, changesets, PR, секреты |
| [`../CLAUDE.md`](../CLAUDE.md) | контекст для Claude Code: инварианты, структура, цикл фичи; правила `.claude/rules/`, агенты `.claude/agents/`, скиллы `.claude/skills/` |
| [`claude-code.md`](claude-code.md) | среда Claude Code: агенты, скиллы, хуки, разрешения, MCP, плагины, как выдать токены (копия — Drive `05-claude-code-environment.md`) |
| [`architecture/layers.md`](architecture/layers.md) | слои FSD-lite, правила импорта, где что проверяется |
| [`architecture/deps.mmd`](architecture/deps.mmd) | граф зависимостей `src/` (Mermaid, `pnpm deps:graph`) |
| [`decisions/ADR-001-stack.md`](decisions/ADR-001-stack.md) | стек и архитектура; таблица версий пакетов |
| [`decisions/ADR-002-design-system.md`](decisions/ADR-002-design-system.md) | дизайн-система: shadcn, токены, темы, шрифты |
| [`decisions/ADR-003-showcase-publishing.md`](decisions/ADR-003-showcase-publishing.md) | витрина Proto, публикация версий, превью-воркер |
| [`decisions/assumptions.md`](decisions/assumptions.md) | допущения, принятые без владельца, и как их проверить |
| [`design/02-design-system.md`](design/02-design-system.md) | пресет, токены Tadum, контраст |
| [`05-backend-contract.md`](05-backend-contract.md) | порты данных и что должен отдавать API (генерируется `pnpm contract:md`) |
| [`05-migration-to-gitlab.md`](05-migration-to-gitlab.md) | чек-лист переноса в GitLab |
| [`analytics.md`](analytics.md) | словарь событий в коде, провайдеры, как добавить событие |
| [`dod.md`](dod.md) | Definition of Done для PR (снимок из Drive; шаблон PR — `.github/PULL_REQUEST_TEMPLATE.md`) |
| [`i18n/needs-review.md`](i18n/needs-review.md) | тексты интерфейса, ждущие проверки владельцем текстов |
| [`templates/feature-brief.md`](templates/feature-brief.md) | шаблон брифа фичи (снимок из Drive) |
| [`product/`](product/README.md) | снимок продуктовых документов (не редактировать) |
| [`setup/progress.md`](setup/progress.md) | ход настройки среды по мастер-промпту, проверки блоков |
| [`setup/master-prompt.md`](setup/master-prompt.md) | мастер-промпт среды (копия; источник — Drive) |

## Копии в Drive

`05-backend-contract.md` и `05-migration-to-gitlab.md` копируются в Drive `05 Разработка` после изменения; ADR — в `05 Разработка/ADR`. Источник для этих файлов — репозиторий.
