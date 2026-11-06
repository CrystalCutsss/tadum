# Перенос репозитория из GitHub в GitLab

Чек-лист плана §3.5. Цель — переезд одной командой `git push` на новый remote, без изменений кода. Пункты, отмеченные ✅, выполнены в репозитории заранее; остальные делаются в день переезда. Копия документа — Drive `05 Разработка`.

## Что уже готово

- ✅ **В коде нет ничего GitHub-специфичного.** `src/`, `scripts/` и `tests/` не обращаются к API GitHub. Деплой превью — `pnpm run deploy:preview` (`wrangler deploy`), одинаковый в обоих CI.
- ✅ **Два CI с одинаковыми jobs.** `.github/workflows/ci.yml` и `.gitlab-ci.yml`: `install → typecheck → lint → test → build → e2e → size`, плюс `commits` (commitlint, changeset — только в MR), `audit`, `gitleaks` и итоговый `ci`. Lighthouse — на `main` и по расписанию (`lighthouse.yml` ↔ job `lighthouse`). Превью — `deploy-preview.yml` ↔ job `deploy-preview`; превью веток — job `branch-preview` ↔ `deploy-branch` (в MR) и `deploy-branch-stop` (environment `preview/<ветка>`).
- ✅ **`.gitlab-ci.yml` проверяется в каждом PR** — `pnpm lint:gitlab-ci` по JSON-схеме GitLab CI из SchemaStore (`scripts/schemas/gitlab-ci.json`). Проверку через API GitLab (`ci lint`) включить после переезда.
- ✅ **Браузеры — из одного образа** `mcr.microsoft.com/playwright:v1.63.0-noble` в обоих CI. В образе Node 24, проект закреплён на 22: в GitLab Node 22 ставит `pnpm env use --global 22`.
- ✅ **Версии инструментов зафиксированы:** `packageManager: pnpm@10.28.0`, `.nvmrc` (22), `engine-strict`, точные версии зависимостей (`save-exact`), `pnpm-lock.yaml`.
- ✅ **Запуск без Claude** описан в `README.md` и `CONTRIBUTING.md`.
- ✅ **Слой Claude Code** (`.claude/`, `CLAUDE.md`, хуки — блоки 8a–8b) не зависит от хостинга.
- ✅ **Секреты** — только `CLOUDFLARE_API_TOKEN` и `CLOUDFLARE_ACCOUNT_ID`; в коде и файлах их нет.

## В день переезда

1. **Создать проект в GitLab** (пустой, без README). Ветка по умолчанию — `main`.
2. **Перенести код с историей и тегами:**

   ```bash
   git remote add gitlab <url-проекта-gitlab>
   ```

   ```bash
   git push gitlab --all && git push gitlab --tags
   ```

3. **Переменные CI/CD** (Settings → CI/CD → Variables): `CLOUDFLARE_API_TOKEN` (Masked, Protected), `CLOUDFLARE_ACCOUNT_ID` (Protected). Ставит владелец — как и в GitHub, агенты секреты не задают. Защищённые переменные доступны только защищённым веткам — `main` должен быть protected (п. 4). Для превью веток (`deploy-branch` в MR) переменные нужны и в незащищённых ветках: снять Protected или защитить шаблон веток `feat/*`, `fix/*`, `chore/*`, `docs/*` — решает владелец.
4. **Защита `main`** (Settings → Repository → Protected branches): push — No one, merge — Maintainers, force push — выключен. Обязательный пайплайн: Settings → Merge requests → «Pipelines must succeed». Merge-метод — «Merge commit» (не squash, не fast-forward), как сейчас в GitHub (D-070). В GitHub на бесплатном тарифе защита не действовала (A-048) — в GitLab она доступна.
5. **Расписания** (Build → Pipeline schedules): ночной прогон — `17 1 * * *` UTC (полный e2e, включая desktop-safari и desktop-edge через `PW_SCHEDULED`) и Lighthouse — `43 2 * * *`, ветка `main`.
6. **Runner.** Нужен Linux-runner с Docker executor (shared runners GitLab.com подходят). Образы: `node:22-bookworm`, Playwright, `zricethezav/gitleaks:v8.30.1`, `alpine`.
7. **Первый пайплайн** на `main` — убедиться, что все jobs зелёные; затем включить проверку `.gitlab-ci.yml` через API: `glab ci lint` или `POST /projects/:id/ci/lint`.
8. **Шаблон MR.** Скопировать `.github/PULL_REQUEST_TEMPLATE.md` в `.gitlab/merge_request_templates/Default.md`.
9. **Issues** — импорт GitHub → GitLab (Import project → GitHub переносит issues, MR и комментарии). Брифы фич остаются в Drive.
10. **Ссылки в документации** — заменить `github.com/CrystalCutsss/tadum` на адрес GitLab (`README.md`, `CONTRIBUTING.md`, `docs/`); `pnpm check:docs`.
11. **Удалить GitHub-часть**, когда GitLab отработал неделю: `.github/`, пункт про `claude-code-action` в DoD (в GitLab его заменяет `/code-review` в сессии Claude Code), архивировать репозиторий GitHub.

## Что теряется и чем заменяется

| В GitHub | В GitLab |
| :--- | :--- |
| `claude-code-action` (автоматическое ревью Claude в PR) | `/code-review` в сессии Claude Code перед MR |
| GitHub MCP в `.mcp.json` | GitLab MCP или `glab`; список разрешений в `.claude/settings.json` поправить |
| Артефакты Actions (скриншоты, отчёты) | `artifacts:` jobs `e2e`, `lighthouse` — уже описаны |
| Workflow `deploy-preview` | job `deploy-preview` — уже описан |
| Комментарий со ссылкой на превью ветки в PR | ссылка в environment `preview/<ветка>` MR (Deployments) и в логе job `deploy-branch` |

## Чего не трогаем

- **Proto** (витрина) остаётся в GitHub навсегда (ADR-003). `pnpm release:proto vN` работает с локальным клоном Proto и от хостинга Tadum не зависит.
- **Бэкенд** — по `docs/05-backend-contract.md`: команда реализует `HttpAdapter` и переключает `VITE_API_MODE=http`; фронтенд не меняется.
