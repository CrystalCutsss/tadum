<!-- source: Drive 1gw1pSx0fkEx3xkpmg5zMcm1dY9qM2Xat, synced: 2026-11-05. Не редактировать — источник в Drive. -->
# SP-04 · Приведённые клиенты

| Поле | Значение |
|---|---|
| **ID** | `SP-04` |
| **Роли** | `supplier`, `dual` |
| **Экраны** | `supplier.clients` (`/s/clients`), счётчики на `supplier.home` (ведут сюда с фильтром) |
| **Предусловие** | Поставщик в кабинете; у него есть привязанные лиды (по ссылке или вручную командой Tadum) — или нет ни одного |
| **Статусы** | `supplier_view_status` клиента: `applied` · `collecting_docs` · `under_review` · `approved` · `first_purchase` · `closed` (`01-statuses.md` §2) |
| **Цель** | Поставщик видит, что происходит с каждым приведённым клиентом, и сколько этот клиент уже купил у него через Tadum, — и перестаёт спрашивать об этом команду продаж |
| **Метрика** | Доля поставщиков, открывающих список хотя бы раз в неделю; доля клиентов, дошедших до `approved`, у поставщиков с кабинетом против без него (сравнение через 4–6 недель) |
| **Версия прототипа** | v3 |
| **Персоны мока** | `supplier_active` (14 клиентов во всех шести статусах, обороты от 0 до 480 000 SAR, два клиента с `attribution = manual`, один клиент общий с другим поставщиком), `supplier_new` (0 клиентов) |
| **Связанные документы** | `01-entities.md` §2.11, §2.9 (D-012), §5 (видимость); `01-statuses.md` §2; `01-roles.md` §5–6 (что не показываем); `SP-01` (счётчики) |
| **Статус** | черновик — живой каркас |

---

## 1. Основной сценарий

```
Дано:  персона supplier_active: 14 ReferredClient
Когда: поставщик открывает /s/clients
Тогда: список карточек (мобильный) / строк (десктоп), по умолчанию сортировка applied_at desc;
       в каждой: company_name, бейдж status.supplier_view.<status>, «Заявка {applied_at}»,
       «Оборот с вами {turnover}» (formatMoney, D-006), «Обновлено {updated_at}» (относительное время);
       сверху — чипы фильтра по статусу (мультивыбор) со счётчиками, переключатель сортировки
       «по дате заявки | по обновлению»; событие screen_viewed {screen_id: supplier.clients, total, by_status}

Когда: выбирает фильтр «На проверке»
Тогда: список сужается до supplier_view_status = under_review; фильтр — в URL (?status=under_review),
       чтобы ссылка из счётчика на главной открывала нужный срез; событие clients_filtered {statuses}

Когда: меняет сортировку на «по обновлению»
Тогда: updated_at desc; выбор хранится в URL (?sort=updated); событие clients_sorted {by}

Когда: нажимает на карточку клиента
Тогда: карточка раскрывается на месте (accordion) — отдельного маршрута нет: те же поля плюс короткая
       подсказка по статусу (status.supplier_view.<status>.hint) и, для first_purchase/approved,
       текст «Клиент может покупать у вас через Tadum»; событие client_card_expanded {status}
```

Поставщик видит только то, что перечислено: ни телефона клиента, ни одобренного лимита, ни причины закрытия, ни других поставщиков клиента (`01-entities.md` §5). Действий над клиентом в MVP нет (ни «напомнить», ни «связаться»).

---

## 2. Альтернативные сценарии и ошибки

| # | Условие | Что видит (ключ) | Действие | Событие |
|---|---|---|---|---|
| A1 | Клиентов нет (`supplier_new`) | Пустое состояние `clients.empty` с кнопкой «Поделиться ссылкой» → `/s/referral` | поделиться | `clients_empty_cta_clicked` |
| A2 | Фильтр дал пустой результат | `clients.empty_filtered` + «Сбросить фильтр» | сбросить | — |
| A3 | `turnover = 0` (клиент ещё не покупал) | Вместо «0 SAR» — текст `clients.no_turnover_yet`; для `closed` — оборот показываем, если был | — | — |
| A4 | Клиент привязан вручную (`attribution = manual`) | Ничем не отличается в UI (поле internal) | — | — |
| A5 | Клиент общий с другим поставщиком | Виден как обычный; `turnover` — только сделки с этим поставщиком; других поставщиков нет | — | — |
| A6 | Статус `closed` | Бейдж нейтральный (не красный), подсказка без причины: «Заявка закрыта» | — | — |
| A7 | Много клиентов (> 50) | Подгрузка порциями по 20 при прокрутке («Показать ещё» как запасной вариант); фильтры и сортировка — на стороне порта (мок — в памяти) | — | `clients_page_loaded {page}` |
| A8 | Длинное арабское название компании | До 2 строк, затем многоточие; полное — в раскрытой карточке | — | — |
| A9 | Офлайн | Последний список из кэша с `common.cached_at {time}`; фильтры работают по кэшу | — | — |
| A10 | Ошибка загрузки | Карточка «Не удалось загрузить» + «Повторить» + SupportBar | повторить | — |
| A11 | Смена статуса клиента при открытом списке (опрос по интервалу + `visibilitychange`, как D-035) | Бейдж и `updated_at` обновляются на месте; тост не показываем (это не статус поставщика) | — | — |
| A12 | `dual`: сам поставщик есть в списке как клиент (подал заявку по своей ссылке) | Показываем как обычного клиента; никаких особых пометок | — | — |

---

## 3. Состояния экранов

| Экран / блок | Состояние | Что показываем |
|---|---|---|
| `supplier.clients` | loading | Скелетон чипов и 5 карточек |
| `supplier.clients` | normal | Чипы, сортировка, список |
| `supplier.clients` | empty (A1) | Иллюстрации нет (D-017): текст + CTA |
| `supplier.clients` | empty-filtered (A2) | Текст + «Сбросить» |
| `supplier.clients` | loading-more (A7) | Скелетон в конце списка |
| `supplier.clients` | error / offline | A9–A10 |
| карточка клиента | collapsed | Название, бейдж, дата, оборот, обновлено |
| карточка клиента | expanded | + подсказка по статусу; для `approved/first_purchase` — фраза про покупки |
| бейдж статуса | 6 вариантов | `applied` нейтральный · `collecting_docs` нейтральный · `under_review` информационный · `approved` успех · `first_purchase` успех · `closed` нейтральный приглушённый; различимы иконкой/текстом, не только цветом |
| все | RTL / LTR, light / dark | Суммы в `<bdi dir="ltr">`; чипы прокручиваются горизонтально на 360 px; таблица на десктопе — столбцы по направлению письма |

---

## 4. Тексты интерфейса (AR / EN) — предложение

| Ключ | EN | AR | Примечание |
|---|---|---|---|
| `clients.title` | Your clients | عملاؤك | |
| `clients.subtitle` | Clients who applied through your link or were linked to you by Tadum | العملاء الذين تقدّموا عبر رابطك أو ربطتهم بك تدوم | |
| `clients.filter.all` | All | الكل | |
| `clients.sort.applied` | By application date | حسب تاريخ الطلب | |
| `clients.sort.updated` | By last update | حسب آخر تحديث | |
| `clients.applied_at` | Applied {date} | تقدّم في {date} | |
| `clients.updated_at` | Updated {time} | آخر تحديث {time} | относительное |
| `clients.turnover` | Purchases from you: {amount} | مشترياته منك: {amount} | D-012 — только оплаченные |
| `clients.no_turnover_yet` | No purchases yet | لا مشتريات بعد | A3 |
| `clients.empty` | No clients yet. Share your link — clients who apply through it will appear here | لا عملاء بعد. شارك رابطك — سيظهر هنا من يتقدّم عبره | A1 |
| `clients.empty_cta` | Share your link | مشاركة رابطك | |
| `clients.empty_filtered` | No clients with this status | لا عملاء بهذه الحالة | A2 |
| `clients.reset_filter` | Reset filter | إعادة ضبط التصفية | |
| `clients.load_more` | Show more | عرض المزيد | A7 |
| `clients.can_buy` | This client can buy from you through Tadum | يمكن لهذا العميل الشراء منك عبر تدوم | expanded, `approved` / `first_purchase` |
| `status.supplier_view.applied` | Applied | تم تقديم الطلب | бейдж |
| `status.supplier_view.collecting_docs` | Collecting documents | يجمع المستندات | |
| `status.supplier_view.under_review` | Under review | قيد المراجعة | |
| `status.supplier_view.approved` | Approved | معتمد | |
| `status.supplier_view.first_purchase` | First purchase | أول عملية شراء | |
| `status.supplier_view.closed` | Closed | مغلق | |
| `status.supplier_view.applied.hint` | The client has applied. We'll contact them about documents | قدّم العميل طلبه وسنتواصل معه بشأن المستندات | expanded |
| `status.supplier_view.collecting_docs.hint` | The client is uploading documents | يرفع العميل مستنداته | |
| `status.supplier_view.under_review.hint` | We're reviewing the client's application | نراجع طلب العميل | без сроков |
| `status.supplier_view.approved.hint` | The client is approved and finishing the paperwork | تمت الموافقة على العميل وهو يستكمل الإجراءات | |
| `status.supplier_view.first_purchase.hint` | The client has made a purchase through Tadum | أجرى العميل عملية شراء عبر تدوم | |
| `status.supplier_view.closed.hint` | The application is closed | تم إغلاق الطلب | без причины |

Проверка TOV: «закрыта» вместо «отказано»; «покупки у вас через Tadum» вместо «кредит/финансирование»; нет обещаний сроков в подсказках.

---

## 5. События аналитики

| Событие | Когда | Свойства |
|---|---|---|
| `screen_viewed` | открыт `/s/clients` | `{ screen_id: 'supplier.clients', total_bucket: '0' \| '1-5' \| '6-10' \| '11-25' \| '26+', by_status: { applied, collecting_docs, under_review, approved, first_purchase, closed } }` |
| `clients_filtered` | изменён фильтр | `{ statuses: string[], source: 'chip' \| 'url' }` |
| `clients_sorted` | изменена сортировка | `{ by: 'applied' \| 'updated' }` |
| `client_card_expanded` | раскрыта карточка | `{ status }` |
| `clients_empty_cta_clicked` | A1 | `{}` |
| `clients_page_loaded` | A7 | `{ page }` |

Названия компаний, суммы и идентификаторы клиентов в события не отправляем; обороты — только как корзины при необходимости (в MVP не нужны).

---

## 6. Критерии приёмки

- [ ] Список показывает ровно поля `company_name`, `supplier_view_status`, `applied_at`, `turnover`, `updated_at`; телефон, лимит, причина закрытия и `attribution` отсутствуют в данных, которые доходят до компонентов (проверить типом проекции и unit-тестом порта).
- [ ] `turnover` = сумма сделок клиента с этим поставщиком со стадии `payment_done` и дальше (D-012); для общего клиента (A5) — только свои сделки.
- [ ] Фильтр (мультивыбор) и сортировка работают и отражаются в URL; ссылки со счётчиков главной (`SP-01`) открывают нужный срез.
- [ ] Шесть бейджей статусов различимы не только цветом; `closed` — нейтральный.
- [ ] Пустые состояния (A1, A2) с корректными CTA; подгрузка порциями на 60+ записях без потери фильтра.
- [ ] Деньги и даты через `shared/i18n/format.ts` (D-005, D-006), относительное время для `updated_at`.
- [ ] Обновление статусов при открытом списке — опросом и по `visibilitychange` (как D-035), без тоста.
- [ ] Тексты в `ar` и `en`; axe без нарушений; раскрытие карточки — `aria-expanded`, доступно с клавиатуры.
- [ ] Storybook: `ClientsList` normal / empty / empty-filtered / loading / loading-more × AR/EN × light/dark; `ClientCard` × 6 статусов × collapsed/expanded; `StatusBadge` × 6.
- [ ] Playwright: `supplier_active` → `/s/clients` → фильтр `under_review` (3 записи) → сортировка → раскрытие → `/s/home` → счётчик «Одобрено» → `/s/clients?status=approved,first_purchase`.

---

## 7. Заметки для реализации

- Порт `ReferredClientsPort.list({statuses, sort, cursor})` возвращает только проекцию `ReferredClient`; мок строит её из `Application` + `Deal` и отбрасывает лишние поля — в `widgets/` и `pages/` тип `Application` для поставщика не импортируется (правило `eslint-plugin-boundaries`).
- Чипы фильтра — `ToggleGroup` (Radix) с `type="multiple"`; состояние — в search params маршрута (TanStack Router `validateSearch`).
- Отдельной страницы клиента нет осознанно: показывать больше нечего (видимость §5), а маршрут провоцировал бы запросы «добавить телефон».
- Опрос обновлений — тот же `useStatusPolling`, что в SC-05/SC-06, с интервалом из `shared/config`.

## 8. Открытые вопросы

Решено (Кирилл, 2026-11-04):

- **SP4-1** — у клиента показываем только сумму оборота; количество сделок — фаза 2 вместе с разделом сделок (D-049).
- **SP4-2** — у клиента `closed` фактический оборот показываем, если покупки были; скрываем только причину закрытия (D-050).

Открытых вопросов по сценарию нет.

## 9. Бенчмарки

Списки лидов/клиентов в партнёрских кабинетах со статусами и фильтрами, мобильные таблицы-карточки (Mobbin: CRM lite, referral tracking, merchant dashboards) — сессия 8.
