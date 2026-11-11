<!-- source: Drive 1hNrIpW0SrBtYCkJhWs24zwKJI1Oky1c0, synced: 2026-11-11. Не редактировать — источник в Drive. -->
# Метрики и словарь событий — Tadum

**Версия:** 1.1 (черновик — живой каркас) · **Дата:** 2026-11-04 · **Статус:** все вопросы закрыты (D-057…D-059).
**Источники:** требования к кабинетам (Success metrics, OKR), план §2.2 «Аналитика и метрики», решения D-011, D-033–D-035, D-044, D-046, D-055, разделы «Метрика» и «5. События аналитики» всех сценариев `SC-01…SC-10`, `SP-01…SP-05`. **Связанные документы:** `01-cabinet-structure.md` (`screen_id`), `01-statuses.md` (значения статусов), `01-nfr-locale-brand.md` §2.4 (PII), `00-roadmap.md` (версии).

> Это единственный источник имён событий и их свойств. Словарь переносится в `src/shared/analytics/events.ts` как discriminated union; событие, которого нет здесь, не компилируется. Сценарии ссылаются сюда, а не наоборот: если в сценарии событие названо иначе — прав словарь (расхождения перечислены в §6).

---

## 1. Дерево метрик

### 1.1 Клиент

```
O3 KR3  Конверсия Doc collection → Assessed: 0,7–5,7 % → 20 %          (источник: Odoo; портал влияет)
├── M-C1  Доля заявок, у которых комплект отправлен ≤ 12 ч после первого входа
│         = document_set_submitted / auth_login_succeeded{role=client, first_login}     (SC-02)
├── M-C2  Доля отклонённых документов, перезагруженных ≤ 24 ч
│         = rejected_document_reuploaded{hours_since_rejection ≤ 24} / rejected_document_viewed   (SC-03)
├── M-C3  Среднее число загрузок на документ до approved                          (SC-02, SC-03)
│         = document_upload_succeeded / документов approved (из данных)
├── M-C4  Доля файлов, остановленных предвалидацией                                (SC-02)
│         = document_prevalidation_failed / document_upload_started
├── M-C5  Доля дозапросов, закрытых ≤ 48 ч; доля заявок с ≥ 2 раундами             (SC-04)
│         = document_set_submitted{round ≥ 2, hours_since_request ≤ 48} / more_docs_banner_viewed{first}
├── M-C6  Конверсия входа: auth_login_succeeded / auth_otp_requested{resend=false} (SC-01)
│         └── доля входов из WhatsApp: auth_otp_requested{source=whatsapp_link}
├── M-C7  Обращения в поддержку из under_review (чем меньше — тем понятнее экран)  (SC-05)
│         = support_contact_clicked{status=under_review} / screen_viewed{status=under_review}
├── M-C8  Approved → лимит active: limit_activated / screen_viewed{status=approved, first}; медиана days_since_approved (SC-06)
├── M-C9  Client Approved → Payment done за 30 дней (из данных) и доля how_to_buy_whatsapp_clicked (SC-07)
└── M-C10 Закрытые: доля closed_reapply_clicked ∪ support_contact_clicked{status=closed} (SC-08); дубликаты заявок → 0 (SC-09)
```

### 1.2 Поставщик

```
O1 KR2  Assessed leads от малых поставщиков: 12 → 30 / 70 / 150                  (источник: Odoo)
Главная портала: доля приводящих поставщиков, заходящих в кабинет ≥ 1 раза в месяц
         = uniq(supplier) auth_login_succeeded{active_role=supplier} за 30 дней / активных поставщиков (из данных)   (SP-01)
├── M-S1  Доля поставщиков с ≥ 1 действием с ссылкой за месяц                       (SP-02)
│         = uniq(referral_link_copied ∪ referral_shared_whatsapp ∪ referral_qr_downloaded) / вошедших
├── M-S2  Заявки по ссылке на активного поставщика (из данных: source.channel = referral_link)
├── M-S3  Комплект поставщика отправлен ≤ 7 дней после первого входа; доля принятых с первого раза (SP-03)
├── M-S4  Доля поставщиков, открывающих список клиентов ≥ 1 раза в неделю: screen_viewed{supplier.clients} (SP-04)
├── M-S5  Сравнение Doc collection → Assessed у клиентов поставщиков с кабинетом и без (через 4–6 недель, Odoo)
└── M-S6  Доля скачавших материал за месяц: material_downloaded (SP-05, v5)
```

### 1.3 Качество продукта (не цели, а сигналы)

| Сигнал | Формула | Порог внимания |
|---|---|---|
| Ошибки входа | `auth_otp_failed` / `auth_otp_requested` по `reason` | `invalid` > 15 % — пересмотреть ввод кода |
| Истечения сессии | `session_expired` на пользователя в месяц | > 1 — проверить хранение сессии (IAB) |
| Смена языка | доля сессий с `language_changed{source=switch}` | > 20 % — язык по умолчанию выбран неверно для сегмента |
| Несогласованные данные | `data_inconsistency` по `kind` | любое — тикет бэкенду |
| Заблокированные внешние ссылки | `external_link_blocked` / `checklist_link_opened` | > 10 % — усилить подсказку «открыть в браузере» |
| Установки PWA | `pwa_installed` / `pwa_install_prompted` | информационно (SC10-2: карточка на `home` не раньше v5) |
| Офлайн | `network_offline` на сессию, медиана `offline_seconds` | информационно |
| Web Vitals | LCP / INP / CLS по `screen_id` (провайдер собирает сам) | бюджеты из `01-nfr-locale-brand.md` §2.2 |

Границы: конверсии стадий Odoo (Assessed, Payment done) считаются из данных Odoo; портал даёт только анонимные события и агрегаты, `application_id` в события **не отправляется** (§2.3). Сопоставление событий портала с конкретными заявками Odoo — за пределами этого проекта (D-057): метрики M-C1…M-C10 и M-S1…M-S6 считаются по событиям портала без привязки к стадиям Odoo, а O3 KR3 / O1 KR2 — отдельно, из Odoo.

---

## 2. Правила словаря

### 2.1 Имена

- `snake_case`, английский, форма `объект_действие` или `объект_состояние`: `document_upload_succeeded`, `limit_activated`, `referral_link_copied`.
- Экранные просмотры — одно событие `screen_viewed` с `screen_id` из `01-cabinet-structure.md` §1; отдельных `*_opened` для экранов нет (`clients_list_opened` из плана заменён на `screen_viewed{screen_id: 'supplier.clients'}`).
- Пары успех/ошибка — суффиксы `_succeeded` / `_failed` с обязательным `reason` у ошибки.
- Имя события стабильно: переименование = новое событие + пометка старого `deprecated` в словаре на одну версию.

### 2.2 Общие свойства (контекст)

Добавляются функцией `track()` автоматически к каждому событию; в сценариях не перечисляются.

| Свойство | Тип | Источник |
|---|---|---|
| `screen_id` | `ScreenId` | текущий маршрут (`01-cabinet-structure.md` §1) |
| `role` | `'client' \| 'supplier' \| 'anon'` | семья активной роли |
| `lang` | `'ar' \| 'en'` | i18n |
| `dir` | `'rtl' \| 'ltr'` | — |
| `theme` | `'light' \| 'dark'` | применённая тема (не выбор) |
| `platform` | `'ios' \| 'android' \| 'desktop'` | UA |
| `in_iab` | `boolean` | `isInAppBrowser()` |
| `is_pwa` | `boolean` | `display-mode: standalone` |
| `viewport` | `'xs' \| 'md' \| 'lg'` | 360 / 768 / 1280 |
| `app_version` | `string` | `package.json` + короткий хеш сборки |
| `proto_version` | `string?` | `vN` на витрине; в проде отсутствует |
| `persona` | `string?` | только в демо-режиме; в проде отсутствует |
| `session_id` | `string` | случайный id сессии аналитики (не сессия входа) |

### 2.3 Что не отправляем никогда

Телефон (даже маскированный), имена, названия компаний, `application_id`, `supplier_id`, `slug`, URL реферальной ссылки, суммы и лимиты, имена файлов, свободный текст причин, содержимое полей, `returnTo`/пути с параметрами (только `path_hash`). Деньги и количества — только корзины (§2.4). Проверяется типом: свойства событий — `string | number | boolean | enum | string[]`, без полей с этими именами; lint запрещает `track()` с нетипизированным объектом.

### 2.4 Корзины

| Корзина | Значения | Где |
|---|---|---|
| `amount_bucket` (SAR) | `'<50k' \| '50-100k' \| '100-250k' \| '250-500k' \| '500k+'` | `limit_activated` |
| `used_share_bucket` | `'0' \| '1-25' \| '26-50' \| '51-75' \| '76-99' \| '100'` | `screen_viewed{client.home}`, `how_to_buy_whatsapp_clicked` |
| `referred_bucket` / `total_bucket` | `'0' \| '1-5' \| '6-10' \| '11-25' \| '26+'` | `screen_viewed{supplier.home / supplier.clients}` |
| `size_kb` | число, округлено до 100 КБ | `document_upload_started` |
| длительности | `duration_ms` (точно), часы — число, округлено до 1 ч | загрузка, статусы |

Корзины считаются в `shared/analytics/buckets.ts`, не в компонентах.

### 2.5 Провайдер

`track(event)` → `AnalyticsProvider.capture(name, props)`; в MVP провайдеры `ConsoleProvider` (dev) и `DemoPanelProvider` (лента событий в демо-панели витрины); боевой — по D-011 (кандидат PostHog) через тот же интерфейс, без PII, с анонимизацией IP и без session replay (D-055). Переключение — переменной окружения; код событий не меняется.

---

## 3. Словарь событий

Колонки: событие · когда срабатывает · свойства (кроме общих) · сценарий · версия (из `00-roadmap.md`). Типы значений — как в коде.

### 3.1 Вход, сессия, оболочка

| Событие | Когда | Свойства | Сценарий | v |
|---|---|---|---|---|
| `app_loaded` | первая отрисовка оболочки в сессии | `{ cold_start: boolean, sw_state: 'none' \| 'installed' \| 'updated' }` | NFR §2.6 | v1 |
| `auth_otp_requested` | нажата «Получить код» / «Отправить новый код», запрос ушёл | `{ channel: 'sms' \| 'whatsapp', resend: boolean, source: 'whatsapp_link' \| 'landing' \| 'direct' }` | SC-01 | v1 |
| `auth_otp_failed` | любая ошибка входа | `{ reason: 'invalid' \| 'expired' \| 'too_many_attempts' \| 'rate_limited' \| 'phone_unknown' \| 'server_error', attempt?: number }` | SC-01 | v1 |
| `auth_login_succeeded` | сессия создана | `{ role_count: 1 \| 2, active_role: 'client' \| 'supplier', returned_to: boolean, first_login: boolean, from_landing: boolean }` | SC-01, SC-09, SP-01 | v1 |
| `auth_multiple_applications_detected` | у номера > 1 активной заявки | `{ count: number }` | SC-09 | v4 |
| `session_expired` | показан `auth.expired` | `{ last_screen_id: ScreenId }` | SC-01, SC-10 | v1 |
| `logout` | подтверждён выход | `{ offline: boolean }` | SC-10 | v1 |
| `role_switched` | переключение роли в шапке | `{ from: 'client' \| 'supplier', to: 'client' \| 'supplier' }` | SP-01, SC-08 | v1 (D-067) |
| `role_hint_shown` / `role_hint_dismissed` | подсказка `dual` показана / закрыта | `{}` | SP-01 | v1 (D-067) |
| `language_changed` | смена языка | `{ to: 'ar' \| 'en', source: 'switch' \| 'url' }` | SC-01, SC-10 | v1 |
| `theme_changed` | смена темы в настройках | `{ to: 'system' \| 'light' \| 'dark' }` | SC-10 | v1 |
| `support_contact_clicked` | любой контакт поддержки | `{ channel: 'whatsapp' \| 'email', status?: ClientStatus \| SupplierStatus, context?: 'closed' \| 'under_review' \| 'auth' \| 'error' }` | SC-01, SC-05, SC-08 | v1 |
| `network_offline` / `network_restored` | смена состояния сети | `{ offline_seconds?: number }` | SC-10 | v5 |
| `storage_unavailable` | `localStorage` недоступен | `{}` | SC-10 | v1 |
| `pwa_install_prompted` | показана карточка/подсказка установки | `{ platform, in_iab }` (общие) | SC-10 | v5 |
| `pwa_installed` | `appinstalled` или первый запуск в standalone | `{}` | SC-10 | v5 |
| `pwa_update_prompted` | тост «новая версия» (только major, D-024) | `{ from_version: string, to_version: string }` | SC-10 | v5 |
| `screen_viewed` | открытие любого экрана | `{ screen_id }` + контекст экрана, см. §3.6 | все | v1 |
| `next_step_cta_clicked` | нажат CTA карточки следующего шага | `{ step: NextStepKey }` | SP-01 (и клиент) | v1 |
| `data_inconsistency` | данные противоречат друг другу, UI показал нейтральное состояние | `{ kind: 'empty_round' \| 'used_exceeds_approved' \| 'counters_mismatch' \| 'missing_slug' \| string }` | SC-04, SC-07, SP-01, SP-02 | v1 |

### 3.2 Документы (клиент и поставщик — одни события, `owner`)

Все события раздела имеют свойство `owner: 'client' | 'supplier'`.

| Событие | Когда | Свойства | Сценарий | v |
|---|---|---|---|---|
| `document_upload_started` | файл выбран, отправка началась | `{ portal_key, size_kb, mime: 'pdf' \| 'jpg' \| 'png', source: 'camera' \| 'gallery' \| 'files' \| 'unknown' }` | SC-02 | v2 |
| `document_upload_succeeded` | файл сохранён, документ `received` | `{ portal_key, prevalidation: 'passed' \| 'warning', replace: boolean, file_index: number, duration_ms }` | SC-02 | v2 |
| `document_upload_failed` | любая ошибка загрузки | `{ portal_key, reason: 'too_large' \| 'unsupported_type' \| 'network' \| 'offline' \| 'server_error' \| 'cancelled' \| 'same_file_rejected' }` | SC-02, SC-03 | v2 |
| `document_prevalidation_failed` | предвалидация остановила файл | `{ portal_key, rule_key: string }` | SC-02 | v2 |
| `document_file_deleted` | файл удалён до отправки | `{ portal_key }` | SC-02 | v2 |
| `document_file_downloaded` | скачан свой файл (режим чтения) | `{ portal_key, status: DocumentStatus }` | SC-03, SC-05, SC-08 | v2 |
| `document_example_opened` | открыт пример PDF | `{ portal_key }` | SC-02 | v2 |
| `document_video_opened` | открыто видео-подсказка | `{ portal_key, lang_video: 'ar' }` | SC-02 | v2 |
| `document_set_submitted` | комплект отправлен (вручную или авто) | `{ documents_count, optional_uploaded: boolean, auto: boolean, round: number, duration_from_first_upload_min: number }` | SC-02, SC-04, SP-03 | v2 |
| `documents_viewed_locked` | список открыт в режиме чтения | `{ documents_count }` | SC-05, SC-08 | v2 |
| `rejected_document_viewed` | открыта карточка `rejected` | `{ portal_key, has_reason: boolean, reason_key?: string, reason_lang_missing?: 'en', source: 'home' \| 'list' \| 'banner' }` | SC-03, SP-03 | v2 |
| `rejected_document_reuploaded` | `rejected → received` | `{ portal_key, attempt: number, reason_key?: string, hours_since_rejection: number }` | SC-03, SP-03 | v2 |
| `more_docs_banner_viewed` | баннер дозапроса показан | `{ round, requested_count, repeated_count }` | SC-04 | v2 |
| `previous_round_expanded` | раскрыт прошлый раунд | `{ round }` | SC-04 | v2 |
| `document_added_by_odoo` | в комплект добавлен документ из Odoo | `{ portal_key }` | SP-03 | v3 |

### 3.3 Статус, проверка, лимит (клиент)

| Событие | Когда | Свойства | Сценарий | v |
|---|---|---|---|---|
| `status_changed_while_open` | статус сменился без перезагрузки (опрос, D-035) | `{ from: ClientStatus, to: ClientStatus }` | SC-05 | v1 |
| `status_change_banner_viewed` / `status_change_banner_dismissed` | баннер смены статуса (D-034) | `{ from, to }` | SC-05 | v1 |
| `review_overdue_viewed` | показана строка «дольше обычного» | `{ hours_over: number }` | SC-05 | v1 |
| `checklist_link_opened` | нажата «Открыть» у пункта | `{ item: 'spa_sadq' \| 'pn_company_nafith' \| 'pn_owner_nafith', position: number }` | SC-06 | v4 |
| `checklist_item_completed` | пункт стал `done` (по данным) | `{ item, hours_since_ready: number }` | SC-06 | v4 |
| `checklist_item_failed_viewed` | показан `failed` | `{ item }` | SC-06 | v4 |
| `checklist_item_stale` | `in_progress` > 24 ч | `{ item, hours: number }` | SC-06 | v4 |
| `external_link_blocked` | внешняя ссылка не открылась в IAB | `{ item?: string, href_host: string }` | SC-06 | v4 |
| `limit_activated` | лимит стал `active` | `{ days_since_approved?: number, amount_bucket }` | SC-06 | v4 |
| `limit_cancelled_viewed` | показан `cancelled` | `{}` | SC-06, SC-07 | v4 |
| `limit_fully_used_viewed` | доступный = 0 | `{}` | SC-07 | v4 |
| `how_to_buy_viewed` | блок в области видимости | `{}` | SC-07 | v4 |
| `how_to_buy_whatsapp_clicked` | нажата кнопка WhatsApp в инструкции | `{ used_share_bucket }` | SC-07 | v4 |
| `closed_reapply_clicked` | «Подать новую заявку» на `/c/closed` | `{}` | SC-08, SC-09 | v4 |
| `reapply_submitted` | «Создать заявку» на `/c/reapply` (D-038) | `{}` | SC-08 | v4 |
| `reapply_pending_viewed` | показано состояние «заявка создаётся» | `{}` | SC-09 | v4 |
| `returning_redirected_to_cabinet` | вход с `src=landing` (D-039) | `{ status: ClientStatus }` | SC-09 | v4 |

### 3.4 Поставщик: главная, ссылка, клиенты

| Событие | Когда | Свойства | Сценарий | v |
|---|---|---|---|---|
| `supplier_counter_clicked` | нажат счётчик на главной | `{ counter: 'referred' \| 'under_review' \| 'approved' }` | SP-01 | v3 |
| `referral_link_copied` | ссылка скопирована | `{ source: 'home' \| 'referral', method: 'clipboard' \| 'manual' }` | SP-02 | v3 |
| `referral_shared_whatsapp` | отправка в WhatsApp | `{ source, method: 'web_share' \| 'wa_me' }` | SP-02 | v3 |
| `referral_share_cancelled` | лист Web Share отменён | `{ source }` | SP-02 | v3 |
| `referral_qr_downloaded` | QR скачан / показана подсказка сохранения | `{ format: 'png', method: 'download' \| 'long_press_hint' }` | SP-02 | v3 |
| `referral_open_page_clicked` | «Открыть мою страницу» | `{}` | SP-02 | v3 |
| `referral_printed` | `beforeprint` на `/s/referral` | `{}` | SP-02 | v3 |
| `clients_filtered` | изменён фильтр | `{ statuses: SupplierViewStatus[], source: 'chip' \| 'url' }` | SP-04 | v3 |
| `clients_sorted` | изменена сортировка | `{ by: 'applied' \| 'updated' }` | SP-04 | v3 |
| `client_card_expanded` | раскрыта карточка клиента | `{ status: SupplierViewStatus }` | SP-04 | v3 |
| `clients_empty_cta_clicked` | CTA пустого состояния | `{}` | SP-04 | v3 |
| `clients_page_loaded` | подгружена следующая порция | `{ page: number }` | SP-04 | v3 |

### 3.5 Условия и материалы (v5)

| Событие | Когда | Свойства | Сценарий | v |
|---|---|---|---|---|
| `offer_tab_changed` | переключение вкладки | `{ tab: 'terms' \| 'materials' }` | SP-05 | v5 |
| `material_downloaded` | скачан PDF | `{ id: string, kind: 'pdf', lang: 'ar' \| 'en' \| 'both', method: 'download' \| 'external' }` | SP-05 | v5 |
| `material_opened` | открыто видео | `{ id, kind: 'video', lang }` | SP-05 | v5 |
| `material_shared` | «Поделиться» у материала | `{ id, method: 'web_share' \| 'copy' }` | SP-05 | v5 |
| `material_download_failed` | ошибка скачивания | `{ id }` | SP-05 | v5 |
| `offer_external_link_clicked` | внешняя ссылка из условий | `{ href_host: string }` | SP-05 | v5 |

### 3.6 Контекст `screen_viewed` по экранам

| `screen_id` | Дополнительные свойства | Сценарий |
|---|---|---|
| `client.home` | `{ status: ClientStatus, round?: number, requested_count?: number, has_eta?: boolean, hours_since_submit?: number, limit_status?: LimitStatus, checklist_done_count?: number, used_share_bucket?: string }` | SC-04…SC-07 |
| `client.documents` / `client.document` | `{ portal_key?: string, locked: boolean, round: number }` | SC-02 |
| `client.closed` | `{ had_limit: boolean }` | SC-08 |
| `client.reapply` | `{}` | SC-08 |
| `supplier.home` | `{ supplier_status: SupplierStatus, referred_bucket }` | SP-01 |
| `supplier.referral` | `{ supplier_status }` | SP-02 |
| `supplier.documents` / `supplier.document` | `{ uploaded: number, total: number, has_rejected: boolean }` | SP-03 |
| `supplier.clients` | `{ total_bucket, by_status: Record<SupplierViewStatus, number> }` | SP-04 |
| `supplier.offer` | `{ tab }` | SP-05 |
| `auth.*`, `*.help`, `system.404` | `{}`; для 404 — `{ path_hash: string }` | SC-01, SC-10 |

---

## 4. Перенос в код

```ts
// src/shared/analytics/events.ts — генерируется из §3 (один объект на событие)
export type AnalyticsEvent =
  | { name: 'auth_otp_requested'; props: { channel: 'sms' | 'whatsapp'; resend: boolean; source: 'whatsapp_link' | 'landing' | 'direct' } }
  | { name: 'auth_otp_failed'; props: { reason: 'invalid' | 'expired' | 'too_many_attempts' | 'rate_limited' | 'phone_unknown' | 'server_error'; attempt?: number } }
  | { name: 'screen_viewed'; props: ScreenViewedProps }           // discriminated by screen_id, §3.6
  | { name: 'document_upload_failed'; props: { owner: Owner; portal_key: string; reason: UploadFailReason } }
  // …все события §3
export type EventName = AnalyticsEvent['name'];

// src/shared/analytics/track.ts
export function track<E extends AnalyticsEvent>(name: E['name'], props: E['props']): void; // добавляет контекст §2.2
```

| Артефакт | Содержимое |
|---|---|
| `shared/analytics/events.ts` | типы событий из §3; `EVENT_VERSIONS: Record<EventName, 'v1'…'v5'>` для проверки «событие объявлено не раньше своей версии» |
| `shared/analytics/context.ts` | сбор общих свойств §2.2 |
| `shared/analytics/buckets.ts` | корзины §2.4 с unit-тестами границ |
| `shared/analytics/providers/{console,demo-panel,posthog}.ts` | интерфейс `AnalyticsProvider`; PostHog — заглушка до SFL-895 |
| `shared/analytics/pii-guard.ts` | dev-проверка: свойства не содержат `+966`, `@`, `https://`, чисел > 6 знаков вне корзин |
| ESLint | `track()` только с литеральным именем из `EventName`; запрет `track` в `shared/ui` (события — из `features`/`widgets`) |
| Тесты | каждая фича: unit на вызов `track` на успешном и ошибочном пути (DoD §8); снапшот-тест, что словарь в коде совпадает с §3 (скрипт сравнивает имена) |
| Демо-панель | лента событий с фильтром по имени и копированием JSON — главный способ проверить события на витрине без провайдера |

---

## 5. Правила ведения

- Новое событие — сначала строка здесь (PR в Drive-документ и в `docs/product/`), затем тип в коде; бриф фичи ссылается на имя из словаря.
- Свойство добавляется как опциональное; удаление свойства или события — через `deprecated` на одну версию витрины.
- Раз в версию скрипт `scripts/check-events-dictionary.mjs` сверяет `events.ts` с таблицами §3 (имена и обязательные свойства) — расхождение блокирует релиз версии.

---

## 6. Расхождения со сценариями (исправлено в словаре)

| Где | Было | Стало |
|---|---|---|
| SP-03 §2 A1 | `document_rejected_viewed` | `rejected_document_viewed` (как в SC-03) |
| План §2.2 | `clients_list_opened` | `screen_viewed{screen_id: 'supplier.clients'}` |
| План §2.2 | `auth_login_succeeded {role}` | `{ active_role, role_count, … }` (как в SC-01) |
| SC-01 / SP-01 | `support_contact_clicked` с разными наборами | единый набор `{ channel, status?, context? }` |
| SC-10 резолюция SC10-2 | `pwa_install_prompt_shown` | `pwa_install_prompted` (как в SC-10 §5) |
| SP-02 | `referral_qr_downloaded { source }` | `source` убран (QR только на `/s/referral`, D-043) |

Сценарии не переписываем ради этого — при реализации действует словарь.

---

## 7. Открытые вопросы

Решено (Кирилл, 2026-11-04): **A-1** — связывание событий портала с заявками в Odoo (воронка Doc collection → Assessed по конкретным заявкам) в рамках этого проекта не делается; портал даёт только анонимные события и агрегаты, стыковка с Odoo — за пределами проекта (D-057). **A-2** — Web Vitals собираются автосбором провайдера аналитики; отдельных событий в словаре нет (D-058). **A-3** — события витрины (демо-режим) в боевой провайдер не отправляются: на витрине только `DemoPanelProvider` и консоль; боевой провайдер включается только в проде (D-059).

Открытых вопросов по документу нет.

## 8. Бенчмарки

Не применимо (внутренний документ).
