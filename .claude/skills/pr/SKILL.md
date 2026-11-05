---
name: pr
description: "Подготовить и открыть PR — описание по шаблону Definition of Done, changeset, проверки; merge делает Кирилл."
disable-model-invocation: true
---

# Pull request

1. `/verify` — зелёный `pnpm verify` со свежим выводом.
2. Changeset: изменение поведения — `pnpm exec changeset` (тип и описание для человека); только документация, тесты, CI — `pnpm exec changeset add --empty`.
3. Коммиты — Conventional Commits (`CONTRIBUTING.md`); ветка запушена.
4. Описание — по `.github/PULL_REQUEST_TEMPLATE.md`: бриф и сценарии, что сделано (3–5 строк), скриншоты (артефакт CI `screenshots` или вложения 360 и 1280, AR и EN, обе темы), как проверить (персона, маршрут), отклонения; чек-лист DoD с «н/п» и причиной там, где пункт не применим.
5. Открыть PR в `main`: GitHub MCP (`create_pull_request`) или `gh pr create`, если `gh` авторизован. Не делать merge и не просить об одобрении от имени Кирилла.
6. Дождаться зелёного `ci`; красное — разобрать причину и исправить в этой же ветке. Сообщить Кириллу ссылку и что PR готов к merge (merge-коммитом).
