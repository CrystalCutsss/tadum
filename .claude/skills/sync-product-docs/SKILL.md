---
name: sync-product-docs
description: "Синхронизировать docs/product/ с Google Drive дословно (процедура блока 1b) и открыть PR «docs: sync product docs YYYY-MM-DD». Запускает Кирилл или агент после правки Drive по решению Кирилла; merge — Кирилл."
disable-model-invocation: false
---

# Синхронизация продуктовых документов

Единственный разрешённый способ менять `docs/product/**`. Хук `protect-paths.sh` пропускает правки `docs/product/**`, `tov-lexicon.json` и `.github/PULL_REQUEST_TEMPLATE.md` только в ветке `docs/sync-product-docs-*` (или в сессии `TADUM_DOCS_SYNC=1`). Агент запускает скилл сам после правки в Drive (процедура — `.claude/rules/product-docs.md`), без отдельной команды на PR (решение Кирилла 2026-11-09). Merge — только Кирилл.

1. Ветка `docs/sync-product-docs-YYYY-MM-DD` от свежего `main`.
2. Список документов — `docs/product/README.md` (плюс все файлы папки «Сценарии»). Drive ID в таблице могут устареть: правка в Drive создаёт новый файл, поэтому файл ищется **по имени в своей папке** (`search_files`), прежние версии лежат в подпапке `_Архив версий` и не берутся. Для каждого файла — отдельный субагент:
   - скачать содержимое коннектором Google Drive, записать в `docs/product/<имя>` **без пересказа и правок**;
   - первой строкой — `<!-- source: Drive <id>, synced: YYYY-MM-DD. Не редактировать — источник в Drive. -->` (для JSON шапки нет);
   - сверить размер тела с `fileSize` Drive; содержимое в ответ не печатать.
3. `tov-lexicon.json` — дополнительно в корень репозитория; `JSON.parse` проходит, `version` совпадает.
4. Шаблоны из Drive: `docs/templates/feature-brief.md`, `docs/dod.md` и `.github/PULL_REQUEST_TEMPLATE.md` — с той же шапкой.
5. Обнови таблицу в `docs/product/README.md` (файл · Drive ID · дата) — с новыми ID.
6. `pnpm verify` — изменения документов могут уронить `check:events`, `lint:i18n`, тесты таблиц; это сигнал о расхождении кода и требований: перечисли расхождения Кириллу, код в этом PR не меняй.
7. Коммит `docs: sync product docs YYYY-MM-DD`, PR с таблицей изменённых файлов. Сообщить Кириллу ссылку; merge — Кирилл.
