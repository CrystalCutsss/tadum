---
name: feature-brief
description: "Создать бриф фичи TD-### по шаблону docs/templates/feature-brief.md, положить в Drive «05 Разработка/Фичи» и завести Issue."
argument-hint: "<TD-###> [название]"
disable-model-invocation: true
---

# Бриф фичи $ARGUMENTS

1. Возьми шаблон `docs/templates/feature-brief.md` (разделы 1–12; 13 «План реализации» и 14 «Итог» пока пустые).
2. Заполни по источникам, не выдумывая: сценарий из `docs/product/scenarios/`, требования `docs/product/requirements-*.md`, статусы и права `01-statuses.md`, `01-roles.md`, сущности `01-entities.md`, события `04-metrics-and-events.md`, тексты — ключи и черновики AR/EN по TOV (`.claude/rules/tov.md`).
3. Чего нет в документах — в раздел «Открытые вопросы» с вариантом «По умолчанию» из соответствующего `01-*.md`; ничего не решай за Кирилла.
4. Покажи бриф Кириллу. После «да»:
   - сохрани в Drive `05 Разработка/Фичи` (`1avpWsSHxsypPO5w0qL0gyue7P5ZNGtZr`) файлом `TD-###-<коротко>.md` (коннектор Google Drive; размер сверить с `wc -c`);
   - создай Issue в репозитории (GitHub MCP): заголовок `TD-### <название>`, тело — цель, критерии приёмки и ссылка на бриф в Drive.
5. Ответ: ссылки на бриф и Issue, открытые вопросы.
