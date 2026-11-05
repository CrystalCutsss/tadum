# docs/product — снимок документов Drive

> **Снимок, не редактировать.** Файлы этой папки — дословная копия документов из Google Drive `Tadum/`. Источник правды — Drive; обновление только скиллом `/sync-product-docs` (появится в блоке 8a). Снимок делается в блоке 1b. ID из таблиц могут устареть: в блоке 1b они сверяются поиском по имени внутри папки.

## Документы

| Документ | Drive ID | Что брать |
| :---- | :---- | :---- |
| План проекта Tadum.md | ищется по имени в папке `00` | §3 целиком — обоснования решений этого промпта |
| Журнал решений.md | ищется по имени в папке `00` | D-001…D-075 — при любом сомнении искать здесь |
| 00-roadmap.md | ищется по имени в папке `00` | состав v1 и критерии готовности |
| 01-roles.md | `1JrpXr6UVuqPt7t85lXSeiOnID03GA_4T` | `resolveRoles`, матрицы прав, «что не показываем» |
| 01-cabinet-structure.md | `1R3DUZww5_JF8pBDNpBlwGMLjZXWwkoYP` | маршруты и `screen_id`, оболочка (§2 — черновик), шкала, карточка шага |
| 01-entities.md | `1xZavpWQsvcmYFBK1utr423NIxh_64W1d` | YAML сущностей → типы и Zod; персоны |
| 01-statuses.md | `1s3nhsFgvXYpRRtNmtG18AwowmsdUk7LG` | маппинг стадий, машины состояний, мок-действия §10 |
| 01-nfr-locale-brand.md | ищется по имени в папке `01` | локаль, форматтеры, NFR, токены, TOV |
| tov-lexicon.json | `1W2G4zoLEu8kqJkmeGs3gZoK98GNXo1r7` | копируется в репозиторий побайтно |
| 04-metrics-and-events.md | `1GbdRrWcAa_vqZi20FHLMACGHKIDtATKF` | словарь событий → `events.ts` |
| Сценарии SC-01…SC-10, SP-01…SP-05 | папка `1aZic7MiF3mXDjwlP8ii4bBpD-D5aSRcX` | для v1: SC-01, SC-05, SC-10, SP-01 (часть) |
| Шаблон брифа фичи (Claude Code).md | `1evxCl6LwyKliUFmp_4GRwG4FUj9ioLLp` | → `docs/templates/feature-brief.md` |
| Definition of Done для PR.md | `1Khr1JkbcTTGnmzJw9fGlQmx3r-noZi8X` | → `.github/PULL_REQUEST_TEMPLATE.md` |
| Требования к кабинету — клиент / поставщик | `1RhWLbD8PIPTYq5HcjOaSifV9JgLN2128` / `1m7p6aNOBqaZYZ7DDkHhjc6hMRziYxJAi` | исходные требования, только для контекста |

## Папки Drive

| Папка Drive | ID | Что туда кладёт агент |
| :---- | :---- | :---- |
| `Tadum/` (корень) | `12ocVUApnD-KvXbsLA-f9-PWJ7EKC-1-E` | — |
| `00 Управление проектом` | `1K8PD3IAS4w6yGxGIzWPKXRWNIyI2lQ9V` | — |
| `01 Требования к продукту` | `1tN-xzFloaCDJ673K0l5DAKID5h_EgG3d` | — |
| `02 Дизайн-система и бренд` | `1i2RYOPmbJdlBjhoGxBFA0YH35D9xVzfL` | `02-design-system.md` — пресет и токены Tadum (блок 4a) |
| `04 Аналитика и метрики` | `1nM7hJ8imM9AU9RnSza1nsmNF9ClICs-y` | — |
| `05 Разработка` | `19icVaCN1pyAZs5MeDuNv9N8ahrzgOu6w` | `05-claude-code-environment.md`, `05-backend-contract.md`, `05-migration-to-gitlab.md` (блоки 7b, 8b) |
| `05 Разработка/Фичи` | `1avpWsSHxsypPO5w0qL0gyue7P5ZNGtZr` | брифы `TD-###` (скилл `/feature-brief`) |
| `05 Разработка/ADR` | `1V4wbfmUgvKfdf9K4gDU1Bbk8BFeYX-Yw` | ADR-001…003 уже лежат; новые ADR |
| `06 Версии прототипа` | `1jaJlwTatckcrnzIE-qZBLDSDhWDejDFT` | `v1.md` (блок 9\) |

## Файлы снимка

| Файл | Drive ID | Дата синхронизации |
| :--- | :--- | :--- |
| — | — | заполняется в блоке 1b |
