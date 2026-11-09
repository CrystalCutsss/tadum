<!-- source: Drive 1fRQxjxJrPk30qtIFS3woQPwm4sybCGRt, synced: 2026-11-09. Не редактировать — источник в Drive. -->
# 01 · Статусы и переходы

**Проект:** Tadum · **Раздел:** Требования к продукту · **Версия:** 1.0 · **Дата:** 2026-11-04 · **Статус:** черновик на согласование
**Источники:** таблицы статусов из требований клиента и поставщика, решения D-008, D-012. **Связанные документы:** `01-roles.md`, `01-cabinet-structure.md`, `01-entities.md`.

> Все статусы для UI **вычисляются из стадий Odoo** одной чистой функцией на сущность. Таблицы маппинга и переходов — единственный источник правды и переносятся в `src/entities/*/model/status.ts` и в тесты один в один. «Правила мока» описывают, как `MockAdapter` имитирует действия Odoo/UW, чтобы демо-режим проходил все сценарии без бэкенда.

---

## 1. Стадии Odoo (`OdooStage`) — internal

| Стадия Odoo | Этап процесса | Кто двигает |
|---|---|---|
| `New lead` | заявка создана | система / лендинг |
| `Processing lead` | первичная обработка | Sales |
| `Document collection` | клиент собирает базовый пакет (12 часов самостоятельно, потом подключаются продажи) | клиент / Sales |
| `Need more docs for UW` | дозапрос после проверки — новый комплект | UW |
| `Ready for UW` | комплект отправлен, ждёт андеррайтера | система |
| `Company risk assessment` | проверка компании | UW |
| `Risk committee` | решение комитета | UW |
| `Approved` | лимит одобрен | UW |
| `Offer confirmation` | согласование условий с клиентом (по телефону) | Sales |
| `Signing SPA & PN` | подписание SPA (Sadq) и векселей (Nafith) | клиент |
| `Client Approved` | всё подписано, лимит активен | система |
| `Payment done` | первая сделка дошла до оплаты | система |
| `Rejected by UW` | отказ | UW |
| `Lost` | потерян по любой причине | Sales |

Названия стадий в Odoo могут меняться — маппинг хранится в одном файле `odoo-stage-map.ts` и покрыт тестом «каждая известная стадия имеет маппинг».

---

## 2. Статусы заявки для клиента и для поставщика → код

```yaml
# → код: src/entities/application/model/status.ts
ClientStatus:       docs_required | under_review | approved | first_purchase | closed
SupplierViewStatus: applied | collecting_docs | under_review | approved | first_purchase | closed
```

| Стадия Odoo | `client_status` | `supplier_view_status` | `permission_state` |
|---|---|---|---|
| New lead | `docs_required` | `applied` | `collecting` |
| Processing lead | `docs_required` | `applied` | `collecting` |
| Document collection | `docs_required` | `collecting_docs` | `collecting` |
| Need more docs for UW | `docs_required` | `collecting_docs` | `collecting` |
| Ready for UW | `under_review` | `under_review` | `reviewing` |
| Company risk assessment | `under_review` | `under_review` | `reviewing` |
| Risk committee | `under_review` | `under_review` | `reviewing` |
| Approved | `approved` | `approved` | `active` |
| Offer confirmation | `approved` | `approved` | `active` |
| Signing SPA & PN | `approved` | `approved` | `active` |
| Client Approved | `approved` | `approved` | `active` |
| Payment done | `first_purchase` | `first_purchase` | `active` |
| Rejected by UW | `closed` | `closed` | `closed` |
| Lost | `closed` | `closed` | `closed` |

Клиенту на `New lead` / `Processing lead` показываем тот же экран, что на `Document collection`: для него разницы нет — надо загрузить документы. Поставщику различие видно (`applied` → «Заявка подана»), потому что это его воронка.

Тексты статусов (ключи i18n): `status.client.<client_status>`, `status.supplier_view.<supplier_view_status>`. Русские формулировки из требований: Надо загрузить документы · На проверке · Заявка одобрена · Первая покупка · Закрыта; для поставщика: Заявка подана · Собирает документы · На проверке · Одобрена · Первая покупка · Закрыта.

Переходы `client_status` (направление процесса; обратных переходов, кроме дозапроса, нет):

```
docs_required ──submit──▶ under_review ──approve──▶ approved ──first payment──▶ first_purchase
      ▲                        │
      └────need more docs──────┘            любое состояние ──reject / lost──▶ closed
```

Дозапрос (`under_review → docs_required`, раунд +1) — **единственный шаг назад** в данных; в UI шкала не откатывается (D-008): шаг «Проверка» остаётся текущим, «Документы» — пройдены, без метки (D-078).

---

## 3. Собственный статус поставщика (`SupplierStatus`) — предложение

В требованиях для поставщика задан таймлайн «Документы → Проверка → Активен», но не задан маппинг на стадии его собственной записи в Odoo. Предлагаемая модель до подтверждения (вопрос S-1):

```yaml
SupplierStatus: docs_required | under_review | active
```

| `supplier_status` | Условие (предложение) | Шаг таймлайна | Следующий шаг |
|---|---|---|---|
| `docs_required` | у поставщика есть комплект с `pending`/`rejected` обязательными документами и он не отправлен | documents: current | «Загрузите недостающие документы» |
| `under_review` | комплект отправлен (`locked`), не все документы `approved` | review: current | «Проверяем документы» |
| `active` | все обязательные документы `approved` (или комплект не требуется) | active: current | «Вы активны: делитесь ссылкой» |

Реферальная ссылка и список клиентов доступны в любом статусе (D-022). Закрытого статуса у поставщика в MVP нет.

---

## 4. Комплект документов (`DocumentSet`) — жизненный цикл

```yaml
DocumentSetStatus: draft | submitted | in_review | completed | superseded
```

| Статус | Значение | `locked` | Кто переводит |
|---|---|---|---|
| `draft` | комплект создан, клиент загружает файлы | false | — |
| `submitted` | клиент нажал «Отправить» (или сработал автоподсчёт полноты); ждём подтверждения | **true** | клиент / система |
| `in_review` | Odoo перевёл заявку на `Ready for UW` и дальше | true | Odoo |
| `completed` | все документы `approved`, заявка ушла дальше | true | Odoo |
| `superseded` | UW создал новый комплект (дозапрос); старый остаётся для истории | true | Odoo |

Правила:

- **Отправка** доступна, когда все `required` документы в `received` (или `approved`) и нет `rejected`. Кнопка «Отправить» видна всегда в `draft`, но задизейблена с подсказкой «осталось N документов».
- **Автополнота**: после последней загрузки система ждёт 10 минут (`completion_grace_until`) и считает комплект полным сама — в UI это выглядит как переход в `submitted` без нажатия. В моке грейс сокращён до 10 секунд в демо-режиме.
- После `submitted` редактирование запрещено **сразу**, не дожидаясь смены стадии в Odoo — иначе клиент успеет изменить файлы, которые уже смотрит UW.
- **Дозапрос** создаёт новый `DocumentSet` с `round + 1`; в него входят только документы, которые нужно дозагрузить (их задаёт Odoo). Документы старого комплекта видны в истории, но недоступны для редактирования.
- **12 часов** на базовый пакет (`collection_deadline_at`) клиенту не показываем как таймер; это внутренний срок, после которого продажи помогают клиенту. В UI — только спокойная формулировка без дедлайна.

---

## 5. Документ (`DocumentStatus`) — машина состояний

```yaml
DocumentStatus: pending | received | rejected | approved
```

| Из | Событие | В | Кто | Условие |
|---|---|---|---|---|
| `pending` | загружен файл, предвалидация `passed`/`warning` | `received` | клиент | комплект `draft`, mime и размер в норме |
| `pending` | загружен файл, предвалидация `failed` | `pending` | клиент | файл не принимается, показываем правило; событие `document_prevalidation_failed` |
| `received` | заменён файл | `received` | клиент | комплект `draft` |
| `received` | удалён файл | `pending` | клиент | комплект `draft` |
| `received` | UW принял | `approved` | UW | комплект `in_review` |
| `received` | UW отклонил с тегом | `rejected` | UW | `reject_reason_key` может быть пустым → нейтральный текст |
| `rejected` | загружен новый файл | `received` | клиент | комплект `draft`; хэш файла не входит в `rejected_file_hashes` (TADUM-536), иначе ошибка `document.same_file_rejected` |
| `approved` | — | — | — | терминальный для раунда |

Правила отображения:

- Сортировка в списке: `rejected` → `pending` → `received` → `approved`; внутри группы — порядок каталога.
- У `rejected` рядом причина и действие «Загрузить заново»; после успешной загрузки старая причина **скрывается**.
- Причина — только из `reject_reason_text` / `reject_reason_key`. Нет текста → `document.rejected.generic`. Нет английского перевода → в EN тоже `generic`, арабский не подставляем.
- Прогресс загрузки показываем для файлов до 10 МБ; `failed` с `error_key` (сеть, размер, тип) и кнопкой «Повторить».

---

## 6. Лимит (`LimitStatus`)

```yaml
LimitStatus: pending | ready | active | cancelled | rejected
```

| Статус | Когда | Что показываем клиенту |
|---|---|---|
| `pending` | заявка `approved`, условия ещё согласуются (`Offer confirmation`) | сумму не показываем, если `approved` не задан; текст «согласуем условия» |
| `ready` | условия согласованы, идёт подписание (`Signing SPA & PN`) | одобренный лимит + чек-лист |
| `active` | всё подписано (`Client Approved` и дальше) | графики approved / used / available + «Как оформить покупку» |
| `cancelled` | лимит аннулирован | нейтральный текст, без причины; переход к поддержке |
| `rejected` | отказ | нейтральный текст, как у `closed` заявки |

Расчёты: `used = Σ outstanding` по сделкам с `outstanding > 0`; `available = max(approved − used, 0)`. Графики — только для `active`; при `used == 0` показываем «ещё не использован», не пустой график.

---

## 7. Чек-лист онбординга (`ChecklistItemStatus`)

```yaml
ChecklistItemStatus: pending | in_progress | done | failed
```

| Пункт | Что значит `done` | Ссылка |
|---|---|---|
| `spa_sadq` | SPA подписан в Sadq | внешняя ссылка с кодом, если пришла |
| `pn_company_nafith` | вексель компании одобрен в Nafith | внешняя ссылка или инструкция «откройте приложение Nafith» |
| `pn_owner_nafith` | вексель владельца одобрен в Nafith | то же |

`failed` показываем нейтрально («не удалось подтвердить, свяжитесь с поддержкой») — причину не выводим. Порядок пунктов фиксирован; `in_progress` — когда ссылка открывалась, но статус ещё не подтверждён (клиентское состояние, бэкенд может не знать). Подпись внутри портала — вне MVP: портал только ведёт по ссылкам.

---

## 8. Вычисление шага таймлайна — таблица истинности

Единственная функция `deriveTimeline(application, limit, documentSet)`; тест перебирает все строки.

| `client_status` | `round` | `limit.status` | `checklist.completed` | documents | review | decision | signing | limit_active |
|---|---|---|---|---|---|---|---|---|
| docs_required | 1 | — | — | current | upcoming | upcoming | upcoming | upcoming |
| docs_required | ≥2 | — | — | done | current | upcoming | upcoming | upcoming |
| under_review | any | — | — | done | current | upcoming | upcoming | upcoming |
| approved | any | pending / ready | false | done | done | done | current | upcoming |
| approved | any | active | true | done | done | done | done | current |
| first_purchase | any | active | true | done | done | done | done | done |
| closed | any | any | any | шкала скрыта, карточка «Заявка закрыта» | | | | |

Для поставщика: `docs_required` → documents current; `under_review` → documents done, review current; `active` → все done, active current.

---

## 9. Правила блокировок (сводка для гардов и тестов)

| Действие | Разрешено, когда |
|---|---|
| Загрузить / заменить / удалить файл | `permission_state == collecting` **и** `documentSet.status == draft` |
| Загрузить заново отклонённый | то же **и** `document.status == rejected` **и** хэш нового файла ∉ `rejected_file_hashes` |
| Нажать «Отправить» | `documentSet.status == draft` **и** все `required` ∈ {received, approved} **и** нет `rejected` |
| Видеть блок «Лимит» на главной (D-023) | `permission_state == active` |
| Открыть ссылки Sadq / Nafith | `limit.status ∈ {ready, active}` |
| Скачать свои документы | всегда, пока есть сессия |
| Повторная заявка | только при `permission_state == closed`, со страницы `/c/reapply` (D-038); клиент с активной заявкой вторую создать не может — он видит существующую заявку со статусом (SC-09, D-040) |

---

## 10. Правила мока (`MockAdapter`) — как имитируем Odoo и UW

Демо-панель и тесты вызывают эти действия; переходы — строго по таблицам выше.

| Действие мока | Эффект |
|---|---|
| `submitDocumentSet()` | `draft → submitted`, `locked = true`; через задержку (2 с) → `in_review`, `odoo_stage = Ready for UW`, `client_status = under_review` |
| `uwApproveDocument(id)` | `received → approved` |
| `uwRejectDocument(id, reason_key?)` | `received → rejected`; заявка остаётся `under_review`, пока UW не вызовет `uwRequestMoreDocs` |
| `uwRequestMoreDocs(portal_keys[])` | текущий комплект → `superseded`, новый `draft` с `round + 1`, `odoo_stage = Need more docs for UW`, `client_status = docs_required` |
| `uwApproveApplication(limit_amount)` | `odoo_stage = Approved`, лимит `pending` с `approved = amount` |
| `salesConfirmOffer()` | `odoo_stage = Offer confirmation → Signing SPA & PN`, лимит `ready`, чек-лист `pending` |
| `externalSign(item_key)` | пункт чек-листа → `done`; когда все три `done` → `odoo_stage = Client Approved`, лимит `active` |
| `createDeal(amount, supplier_id)` / `payDeal(id)` | сделка `payment_done`, `odoo_stage = Payment done`, `client_status = first_purchase`; обновляет `used`, `turnover` поставщика |
| `uwReject()` / `salesLose()` | `odoo_stage = Rejected by UW / Lost`, `client_status = closed`, лимит `rejected`/`cancelled` |
| `createApplication()` | только из `closed`: новая заявка `docs_required`, раунд 1, пустой комплект; старая остаётся `closed`; `resolveRoles` далее находит новую |
| `expireSession()` | следующий вызов порта → `401` |
| `setNetwork('offline' | 'slow' | 'error')` | имитация сети для состояний оболочки |

Инварианты, которые мок обязан соблюдать (и которые покрыты тестами адаптера): после `submitted` любая попытка изменить файл → ошибка `document_set_locked`; `available` никогда < 0; новый комплект содержит только запрошенные ключи; `ReferredClient.turnover` считает только `payment_done`/`repaid` (D-012).

---

## 11. Открытые вопросы

Решено (Кирилл, 2026-11-04): S-3 — в новый комплект при дозапросе входят только недостающие документы (D-031).

| # | Вопрос | По умолчанию до ответа | Владелец |
|---|---|---|---|
| S-1 | Как в Odoo устроен статус самого поставщика (стадии записи `tadum.supplier`)? Нужен маппинг, аналогичный клиентскому | Модель из раздела 3 (вычисляем из состояния комплекта документов) | Бэкенд / SFL-846 |
| S-2 | Есть ли статус `approved` у документа в Odoo (Doc Collection Engine упоминает pending / received / rejected), или «принят» = просто не отклонён после проверки? | Поддерживаем `approved`; если Odoo не отдаёт — все не-`rejected` после `completed` считаем `approved` | Бэкенд |
| S-4 | Статус `cancelled` у лимита — когда возникает и что видит клиент? | Нейтральный текст + поддержка | Продукт |
| S-5 | Нужен ли клиенту статус-экран для `Offer confirmation` («продажи свяжутся с вами»)? | Да, через `next_step` с owner = tadum, без отдельного экрана | Продукт |
