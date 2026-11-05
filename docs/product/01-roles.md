<!-- source: Drive 1JrpXr6UVuqPt7t85lXSeiOnID03GA_4T, synced: 2026-11-05. Не редактировать — источник в Drive. -->
# 01 · Роли и права

**Проект:** Tadum · **Раздел:** Требования к продукту · **Версия:** 1.4 · **Дата:** 2026-11-04 · **Статус:** согласовано (все вопросы R-1…R-4 закрыты)
**Источники:** требования к кабинету клиента и поставщика (Business requirements), журнал решений D-010, D-013, D-020, D-021, D-022, D-038. **Связанные документы:** `01-cabinet-structure.md`, `01-entities.md`, `01-statuses.md`.

> Как читать: идентификаторы (`role_id`, имена полей, enum-значения) — на английском и переносятся в код без изменений. Таблицы с пометкой **→ код** превращаются в типы и константы `src/entities/*`. Блоки YAML — контракт для `shared/api/ports` и фикстур. Открытые вопросы — в конце, с владельцем и значением по умолчанию, которое действует до ответа.

---

## 1. Модель идентичности

Пользователь портала = **подтверждённый номер телефона KSA** (`+966 5X XXX XXXX`). Логина, пароля и профиля нет. Роли не хранятся в портале — они **вычисляются** при входе по тому, что знает Odoo об этом номере. В портале нет ни своих ролей команды, ни админки: Sales, UW, Ops и поддержка работают в Odoo, и всё, что видит пользователь, — проекция данных Odoo.

```yaml
# → код: src/entities/session/model/types.ts
Session:
  phone: string            # E.164, +9665XXXXXXXX; показывается в UI как +966 5X XXX XXXX
  roles: Role[]            # 1..2 элемента, см. раздел 2; пустой список → unknown
  active_role: Role        # текущая роль в оболочке; для dual при первом входе — клиентская (D-020), далее — последняя выбранная
  language: 'ar' | 'en'    # по умолчанию 'ar'; ?lang= из ссылки перекрывает сохранённый выбор
  theme: 'system' | 'light' | 'dark'
  issued_at: datetime
  expires_at: datetime     # issued_at + 30 дней (D-007), без таймаута неактивности
  client_context?:         # заполнено, если среди ролей есть клиентская
    application_id: string
    company_id: string
  supplier_context?:       # заполнено, если среди ролей есть supplier
    supplier_id: string
```

Правила сессии (из NFR и D-007): сессия переживает перезагрузку и открывается в новой вкладке; «Выйти» завершает её на этом устройстве; по истечении 30 дней — экран «Сессия истекла» со входом заново; таймаута по неактивности в MVP нет.

---

## 2. Роли

| `role_id` | Название (RU) | Кто это | Как определяется по телефону | Кабинет | Источник в Odoo |
|---|---|---|---|---|---|
| `client_contact` | Контактное лицо заявки | Человек, оставивший заявку | Телефон = `crm.lead.phone` активной заявки | `/c/*` | `crm.lead.phone` |
| `client_owner` | Основной владелец | Владелец компании-заявителя | Телефон = `lead_main_owner_phone` активной заявки | `/c/*` | `crm.lead.lead_main_owner_phone` (поиск по обоим полям — TADUM-629) |
| `supplier` | Поставщик | Поставщик, приводящий клиентов | Телефон привязан к записи поставщика (нормализованный, D-013) | `/s/*` | `tadum.supplier` (SFL-846) |
| `dual` | Клиент и поставщик | Один номер с обеими ролями | Сработали оба условия выше | `/c/*` и `/s/*` с переключателем | — |
| `unknown` | Неизвестный номер | Номер без заявки и без поставщика | Ни одно условие не сработало | экран «Заявка не найдена» | — |

Замечания к модели:

- `client_contact` и `client_owner` в MVP **имеют одинаковые права**; различие сохраняем в типах (для аналитики и будущих сценариев), но в UI не показываем. В коде это одна семья `ClientRole = 'client_contact' | 'client_owner'`.
- `dual` — не отдельная роль в данных, а состояние сессии, когда `roles` содержит и клиентскую, и `supplier`. В таблице она ради UI: у неё есть переключатель ролей.
- `unknown` не создаёт сессии: показываем экран с двумя действиями — «Подать заявку» (ссылка на лендинг) и «Связаться с поддержкой».
- **Один пользователь на компанию** (D-010): несколько телефонов с доступом к одной заявке возможны только через два поля выше; сценарий «бухгалтер» вне MVP.
- Для клиента действует правило **1 телефон = 1 активная заявка = 1 кабинет**. Если у номера оказалось больше одной активной заявки (ошибка данных), берём последнюю по дате и пишем событие `auth_multiple_applications_detected` — для мока это сценарий не нужен.

```yaml
# → код: src/entities/session/model/roles.ts
Role: 'client_contact' | 'client_owner' | 'supplier'
ClientRole: 'client_contact' | 'client_owner'
RoleFamily: 'client' | 'supplier'          # префикс маршрута: client → /c, supplier → /s

resolveRoles(phone) -> Role[]:
  roles = []
  lead = findActiveLeadByPhone(phone)       # ищет по crm.lead.phone и lead_main_owner_phone
  if lead and lead.phone == phone: roles += client_contact
  if lead and lead.lead_main_owner_phone == phone: roles += client_owner   # оба могут совпасть — тогда обе роли
  if findSupplierByPhone(phone): roles += supplier
  return roles                               # [] → unknown
```

---

## 3. Вход и выбор роли

| Шаг | Поведение | Ошибки (ключи i18n — в сценарии SC-01) |
|---|---|---|
| Ввод телефона | Маска `+966 5X XXX XXXX`, `inputmode="tel"`, поле всегда LTR | неверный формат; слишком много запросов кода |
| Отправка кода | SMS или WhatsApp (канал выбирает бэкенд; в моке — любой) | — |
| Ввод кода | **4 цифры**, живёт **5 минут**, **5 попыток** ввода, повторная отправка через **40 с** (D-021); автопереход между ячейками | `otp_invalid`, `otp_expired`, `otp_too_many_attempts`, `phone_unknown` |
| Определение ролей | `resolveRoles(phone)` | `[]` → экран «Заявка не найдена» |
| Одна роль | Сразу в кабинет этой роли, `active_role` установлен | — |
| Две роли (`dual`) | Отдельного экрана выбора нет (D-020): при первом входе открывается **клиентский кабинет** (`/c/home`), `active_role` = клиентская роль, переключатель «Клиент | Поставщик» заметен в шапке; далее — последняя выбранная роль | — |

Переключение ролей для `dual` — бесшовное: один тап в шапке, язык/тема/сессия сохраняются, меняется только префикс маршрута и данные. Подробно — в `01-cabinet-structure.md`, раздел 4.

---

## 4. Матрица прав клиента

Права зависят не от роли (обе клиентские роли равны), а от **клиентского статуса заявки** (`client_status`, см. `01-statuses.md`). Четыре состояния прав группируют пять статусов.

| Состояние прав | `client_status` | Стадии Odoo (для маппинга) |
|---|---|---|
| `collecting` — сбор документов | `docs_required` | New lead, Processing lead, Document collection, Need more docs for UW |
| `reviewing` — после отправки на проверку | `under_review` | Ready for UW, Company risk assessment, Risk committee |
| `active` — одобрено / лимит активен | `approved`, `first_purchase` | Approved, Offer confirmation, Signing SPA & PN, Client Approved, Payment done |
| `closed` — заявка закрыта | `closed` | отказ UW или Lost по любой причине |

```yaml
# → код: src/entities/application/model/permissions.ts
ClientPermission:
  view_status_and_next_step:  { collecting: true,  reviewing: true,  active: true,  closed: true }
  view_documents:             { collecting: true,  reviewing: true,  active: true,  closed: true }
  upload_or_replace_file:     { collecting: true,  reviewing: false, active: false, closed: false }
  reupload_rejected:          { collecting: true,  reviewing: false, active: false, closed: false }
  delete_uploaded_file:       { collecting: true,  reviewing: false, active: false, closed: false }
  submit_document_set:        { collecting: true,  reviewing: false, active: false, closed: false }
  download_own_documents:     { collecting: true,  reviewing: true,  active: true,  closed: true }
  view_limit:                 { collecting: false, reviewing: false, active: true,  closed: false }
  open_sadq_or_nafith_links:  { collecting: false, reviewing: false, active: true,  closed: false }
  view_how_to_buy:            { collecting: false, reviewing: false, active: true,  closed: false }
  change_language:            { collecting: true,  reviewing: true,  active: true,  closed: true }
  contact_support:            { collecting: true,  reviewing: true,  active: true,  closed: true }
  logout:                     { collecting: true,  reviewing: true,  active: true,  closed: true }
  create_reapplication:       { collecting: false, reviewing: false, active: false, closed: true }   # /c/reapply, D-038
```

Уточнения, которые нельзя потерять при реализации:

- В `collecting` загрузка разрешена **только пока комплект не отправлен** (`DocumentSet.locked == false`). После нажатия «Отправить» комплект блокируется ещё до смены стадии в Odoo — см. `01-statuses.md`, раздел 4.
- Повторная загрузка файла, который уже отклоняли, **не принимается** (TADUM-536): проверка по хэшу файла в рамках документа.
- `delete_uploaded_file` относится только к файлам, которые ещё не отправлены на проверку.
- `view_limit` показывает одобренный / использованный / доступный лимит; при `limit.status in [cancelled, rejected]` вместо графиков — нейтральный текст (см. `01-statuses.md`, раздел 6).

---

## 5. Матрица прав поставщика

Права поставщика зависят от его собственного статуса (`supplier_status`, см. `01-statuses.md`, раздел 3) только в части документов; всё остальное доступно всегда.

```yaml
# → код: src/entities/supplier/model/permissions.ts
SupplierPermission:
  view_own_status_and_next_step: always
  view_documents:                always
  upload_or_replace_file:        when supplier_status == 'docs_required' and !document_set.locked
  reupload_rejected:             when supplier_status == 'docs_required' and !document_set.locked
  submit_document_set:           when supplier_status == 'docs_required' and !document_set.locked
  view_referral_link:            always          # ссылка активна всегда, независимо от любого статуса поставщика (D-022)
  copy_referral_link:            always
  share_referral_whatsapp:       always
  download_referral_qr:          always
  view_referred_clients:         always
  filter_sort_referred_clients:  always
  view_offer_terms:              always
  download_materials:            always
  edit_referral_page:            never           # SFL-850, вне MVP
  change_language / contact_support / logout: always
```

---

## 6. Что пользователю не показываем никогда

Этот список — инвариант для всех экранов, тестов и фикстур. Нарушение — блокирующее замечание на ревью.

| Данные | Кому не показываем | Как обеспечиваем в коде |
|---|---|---|
| Внутренние стадии Odoo (`odoo_stage`) | клиент, поставщик | Поле есть в сущности только для маппинга; в UI-компоненты передаётся уже `client_status` / `supplier_view_status`; lint-правило запрещает импорт `odoo_stage` в `widgets/` и `pages/` |
| Скоринг, риск-оценка, решения комитета | клиент, поставщик | Полей нет в портах вообще |
| Причины закрытия заявки (Lost reason, причина отказа UW) | клиент, поставщик | Полей нет в портах; экран «Закрыта» — нейтральный текст |
| Ручные заметки андеррайтера | клиент, поставщик | В порт попадает только `reject_reason_key` — ключ согласованного клиентского текста тега UW; свободный текст заметки не передаётся |
| Причина отказа по документу без согласованного текста | клиент | Если `reject_reason_key` пуст — показываем нейтральный текст `document.rejected.generic`, ничего не выдумываем |
| Английская версия причины, если её нет | клиент | Не подставляем арабский в английский интерфейс — показываем нейтральный текст |
| Телефон клиента, одобренный лимит клиента, причина закрытия заявки клиента | поставщик | В `ReferredClient` этих полей нет |
| Другие поставщики клиента и оборот с ними | поставщик | `turnover_sar` считается только по сделкам, где этот поставщик указан поставщиком |
| Персональные данные в URL, логах, аналитике | все | Правило DoD «нет PII»; телефон маскируется `+966 5• ••• ••12` везде, кроме поля ввода |

---

## 7. Служебные роли (вне портала)

| Роль | Где работает | Что делает с данными портала |
|---|---|---|
| Sales | Odoo | согласует условия лимита по телефону, берёт заявку, если клиент не загрузил базовый пакет за 12 часов |
| UW (андеррайтер) | Odoo | проверяет документы, ставит `rejected` с тегом причины, создаёт дозапрос (новый комплект) |
| Ops / поддержка | Odoo, WhatsApp `+966 57 976 8881`, `info@tadum.sa` | отвечает на обращения из «Связаться с поддержкой» |

В портале у этих ролей нет входа и нет интерфейса. В моке их действия имитирует демо-панель (например, «отклонить документ», «одобрить заявку»).

---

## 8. Открытые вопросы

Решено (Кирилл, 2026-11-04): R-1 — отдельного экрана выбора роли при первом входе `dual` нет, сразу открывается клиентский кабинет с заметным переключателем; чаще всего у пользователя одна роль (D-020). R-2 — код OTP: 4 цифры, 5 минут, 5 попыток, повтор через 40 с (D-021). R-3 (`unknown`-номер с давно закрытой заявкой) снят: в MVP показываем «Заявка не найдена», дальнейшее поведение решит команда разработки при подключении бэкенда. R-4 — реферальная ссылка поставщика активна всегда, независимо от любого его статуса, включая возможный `closed` (D-022).

Открытых вопросов по ролям нет.
