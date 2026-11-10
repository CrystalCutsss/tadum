# docs/product — снимок документов Drive

> **Снимок, не редактировать.** Файлы этой папки — дословная копия документов из Google Drive `Tadum/`. Источник правды — Drive; обновление только скиллом `/sync-product-docs` (появится в блоке 8a). Снимок делается в блоке 1b. ID из таблиц могут устареть: в блоке 1b они сверяются поиском по имени внутри папки.

## Документы

| Документ | Drive ID | Что брать |
| :---- | :---- | :---- |
| План проекта Tadum.md | ищется по имени в папке `00` | §3 целиком — обоснования решений этого промпта |
| Журнал решений.md | ищется по имени в папке `00` | D-001…D-075 — при любом сомнении искать здесь |
| 00-roadmap.md | ищется по имени в папке `00` | состав v1 и критерии готовности |
| 01-roles.md | `1JrpXr6UVuqPt7t85lXSeiOnID03GA_4T` | `resolveRoles`, матрицы прав, «что не показываем» |
| 01-cabinet-structure.md | `16zYyjbRXNDCoLNomjdoSfwO_UuWMtY3F` | маршруты и `screen_id`, оболочка (§2 — сайдбар `sidebar-08`, решение Кирилла 2026-11-06), шкала, карточка шага |
| 01-entities.md | `1xZavpWQsvcmYFBK1utr423NIxh_64W1d` | YAML сущностей → типы и Zod; персоны |
| 01-statuses.md | `1fRQxjxJrPk30qtIFS3woQPwm4sybCGRt` | маппинг стадий, машины состояний, мок-действия §10 |
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

Размер — тела файла без строки-шапки; совпадает с `fileSize` в Drive. Путь с `/` в начале — от корня репозитория (копии вне `docs/product/`).

| Файл | Drive ID | Байт | Дата синхронизации |
| :--- | :--- | ---: | :--- |
| `00-decision-log.md` | `1USpt_lGAy4lKprF61KfI4D_1Zd73s4bT` | 44902 | 2026-11-09 |
| `00-project-plan.md` | `1bKuGU_8yPYRjrjtCg6dveYTCz6b0jAbt` | 80539 | 2026-11-05 |
| `00-roadmap.md` | `1_jmG1pJcMmq3mzFqDvlRPkvqUaVBw_IH` | 15714 | 2026-11-05 |
| `01-cabinet-structure.md` | `16zYyjbRXNDCoLNomjdoSfwO_UuWMtY3F` | 24016 | 2026-11-09 |
| `01-entities.md` | `1xZavpWQsvcmYFBK1utr423NIxh_64W1d` | 22601 | 2026-11-05 |
| `01-nfr-locale-brand.md` | `1cO-QYx8-xWFkBQtw5gnzC4_L8cl1qrMk` | 49888 | 2026-11-05 |
| `01-roles.md` | `1JrpXr6UVuqPt7t85lXSeiOnID03GA_4T` | 18427 | 2026-11-05 |
| `01-statuses.md` | `1fRQxjxJrPk30qtIFS3woQPwm4sybCGRt` | 21067 | 2026-11-09 |
| `04-metrics-and-events.md` | `1GbdRrWcAa_vqZi20FHLMACGHKIDtATKF` | 28661 | 2026-11-05 |
| `requirements-client.md` | `1RhWLbD8PIPTYq5HcjOaSifV9JgLN2128` | 21795 | 2026-11-05 |
| `requirements-supplier.md` | `1m7p6aNOBqaZYZ7DDkHhjc6hMRziYxJAi` | 9923 | 2026-11-05 |
| `scenarios/SC-01-first-login.md` | `1YXkrKZ3RYTypkBw4MYHABg1rQrRxKTUo` | 18422 | 2026-11-10 |
| `scenarios/SC-02-document-collection.md` | `1bHiZEuDuVDpXqeW7ZeKjAYXS8Fem_I4s` | 22469 | 2026-11-05 |
| `scenarios/SC-03-document-rejected.md` | `1yiEiKa7CuOaKOBoZnrChKo0hHPOrVu9b` | 15093 | 2026-11-05 |
| `scenarios/SC-04-more-docs-requested.md` | `1vYqiAgrrhbuagTwIUxDXiF15_jAovM0A` | 13958 | 2026-11-05 |
| `scenarios/SC-05-under-review.md` | `1AsDtblK9cnPAZynjX8W180tNx50acj92` | 14120 | 2026-11-05 |
| `scenarios/SC-06-approval-and-limit-setup.md` | `1-HFO0m0OaCJ6BmljQ8bMJkSorhTi0r2-` | 16208 | 2026-11-05 |
| `scenarios/SC-07-limit-active.md` | `1uFWNHAfbcV7jdsQhdFglq3xauwPr-7Wo` | 13822 | 2026-11-05 |
| `scenarios/SC-08-application-closed.md` | `1KrxQawcS7rbPNlXYx6jIBa9mQy0N68gp` | 13936 | 2026-11-05 |
| `scenarios/SC-09-returning-client.md` | `1Aa6SK1sG5CNr0oWvQHx8dNSTGjIEnIHF` | 11125 | 2026-11-05 |
| `scenarios/SC-10-service-scenarios.md` | `104cUB2s8iSxw9TJPnCR-bwEbWqC_2XN1` | 18541 | 2026-11-05 |
| `scenarios/SP-01-supplier-login-and-home.md` | `1ScVDC_O_NsCRb1HIlfRMARXQCatWkWgu` | 17748 | 2026-11-05 |
| `scenarios/SP-02-referral-link-and-qr.md` | `1JaSL5c1u4-B20BrvkQF9S1QoE9GmUS-g` | 16075 | 2026-11-05 |
| `scenarios/SP-03-supplier-documents.md` | `1IZgzfWwFu60_c_zm78THwIOCP8xTQc4D` | 17579 | 2026-11-05 |
| `scenarios/SP-04-referred-clients.md` | `1gw1pSx0fkEx3xkpmg5zMcm1dY9qM2Xat` | 16893 | 2026-11-05 |
| `scenarios/SP-05-offer-and-materials.md` | `1M8We-maaBRoZ_wd4iZSp41rdZvYeYMBH` | 15671 | 2026-11-05 |
| `tov-lexicon.json` | `1W2G4zoLEu8kqJkmeGs3gZoK98GNXo1r7` | 27127 | 2026-11-05 |
| `/tov-lexicon.json` | `1W2G4zoLEu8kqJkmeGs3gZoK98GNXo1r7` | 27127 | 2026-11-05 |
| `/docs/templates/feature-brief.md` | `1evxCl6LwyKliUFmp_4GRwG4FUj9ioLLp` | 7666 | 2026-11-05 |
| `/docs/dod.md` | `1Khr1JkbcTTGnmzJw9fGlQmx3r-noZi8X` | 11260 | 2026-11-05 |
| `/.github/PULL_REQUEST_TEMPLATE.md` | `1Khr1JkbcTTGnmzJw9fGlQmx3r-noZi8X` | 11260 | 2026-11-05 |

Папки, которых нет в таблице §0.2: `05 Разработка/Шаблоны` — `1Ab_l7PP0wqYv5GLmeGDsBbwajfFRbksO` (шаблон брифа и DoD), `Business requirements` — `15dryG1NbeZbbSvOmln_dznyRSL0aBufH` (требования к кабинетам).
