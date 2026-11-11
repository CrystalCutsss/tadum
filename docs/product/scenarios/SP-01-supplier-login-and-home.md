<!-- source: Drive 1HD80cuXlQFZ3nvvxvH7FNXWUHO8cu8Vf, synced: 2026-11-11. Не редактировать — источник в Drive. -->
# SP-01 · Вход поставщика, главная и переключение роли

| Поле | Значение |
|---|---|
| **ID** | `SP-01` |
| **Роли** | `supplier`, `dual` |
| **Экраны** | `auth.*` (общие, см. SC-01), `supplier.home` (`/s/home`), переключатель ролей в шапке, `supplier.help` (`/s/help`) |
| **Предусловие** | Телефон привязан к записи поставщика (`resolveRoles(phone)` вернул `supplier`); у `dual` — ещё и к клиентской заявке |
| **Статусы** | `supplier_status`: `docs_required` · `under_review` · `active` (`01-statuses.md` §3, модель-предложение) |
| **Цель** | Поставщик за два экрана попадает в свой кабинет и сразу видит, на каком он шаге, что делать дальше и сколько клиентов он привёл |
| **Метрика** | Доля поставщиков, заходящих в кабинет хотя бы раз в месяц (`auth_login_succeeded {active_role: supplier}` по уникальным `supplier_id`); доля входов, где за сессию сделано хотя бы одно действие с ссылкой (SP-02) |
| **Версия прототипа** | v3 |
| **Персоны мока** | `supplier_new` (`docs_required`, 0 клиентов), `supplier_active` (`active`, 14 клиентов) |
| **Связанные документы** | `SC-01` (вход), `SC-10` (язык, тема, выход, сессия); `01-roles.md` §2–3, §5 (D-020, D-022); `01-cabinet-structure.md` §1, §4–6; `01-entities.md` §2.10; `01-statuses.md` §3 |
| **Статус** | черновик — живой каркас |

---

## 1. Основной сценарий

```
Дано:  сессии нет; пользователь открыл tadum.sa/portal (или /s/… по ссылке из WhatsApp с ?lang=)
Когда: проходит вход по SC-01 (телефон → код)
Тогда: resolveRoles(phone) = [supplier]; сессия на 30 дней; редирект на /s/home
       (или на returnTo, если он из семьи /s/*); событие auth_login_succeeded {role_count: 1, active_role: supplier}

Дано:  supplier_status = docs_required (персона supplier_new), counters = {referred_total: 0, under_review: 0, approved: 0}
Когда: открывается /s/home
Тогда: в шапке — название поставщика; SupplierTimeline: «Документы» current, «Проверка», «Активен» upcoming;
       карточка NextStepCard: next_step.supplier.upload_documents (owner = user), CTA → /s/documents;
       блок счётчиков: три нуля с подписями и подсказкой «Поделитесь ссылкой — первые клиенты появятся здесь»;
       короткая реферальная карточка: ссылка (LTR, <bdi>), кнопки «Скопировать» и «Поделиться в WhatsApp»,
       ссылка «QR-код и подробнее» → /s/referral; ссылка активна уже сейчас (D-022);
       событие screen_viewed {screen_id: supplier.home, supplier_status, referred_bucket: '0'}

Дано:  supplier_status = under_review (комплект отправлен, locked)
Когда: открывается /s/home
Тогда: «Документы» done, «Проверка» current; карточка next_step.supplier.under_review (owner = tadum), без CTA,
       SupportBar виден; срок показываем только если пришёл meta.hours (D-033); остальное без изменений

Дано:  supplier_status = active (персона supplier_active), counters = {14, 3, 6}
Когда: открывается /s/home
Тогда: все шаги done, «Активен» current; карточка next_step.supplier.share_link (owner = user), CTA → /s/referral;
       счётчики: «Приведено 14 · На проверке 3 · Одобрено 6», каждый — ссылка на /s/clients с предустановленным
       фильтром; реферальная карточка; событие screen_viewed {…, referred_bucket: '11-25'}

Дано:  пользователь dual
Когда: входит впервые
Тогда: редирект на /c/home (D-020); в шапке переключатель «Клиент | Поставщик»; один раз — подсказка
       «У вас есть и кабинет поставщика — переключайтесь здесь» (хранится флаг hint_role_switch_seen)
Когда: нажимает «Поставщик»
Тогда: переход на /s/home без перезагрузки; язык и тема сохраняются; последняя роль запоминается в сессии
       (active_role = supplier) — при следующем входе откроется /s/home; событие role_switched {from: client, to: supplier}
```

Отдельного экрана выбора роли нет (D-020). Главная поставщика — один экран с четырьмя блоками: шкала, следующий шаг, счётчики, реферальная карточка; порядок блоков фиксирован, на мобильном — вертикально.

---

## 2. Альтернативные сценарии и ошибки

| # | Условие | Что видит (ключ) | Действие | Событие |
|---|---|---|---|---|
| A1 | `docs_required`, есть `rejected` документы | Карточка `next_step.supplier.reupload_rejected {count}`, бейдж на пункте «Документы» в навигации | → `/s/documents` | — |
| A2 | `docs_required`, комплект отправлен, но Odoo ещё не перевёл запись (гонка) | Статус считается из `document_set.locked` → `under_review`; UI не ждёт бэкенд | — | — |
| A3 | `under_review`, `meta.hours` нет | Текст без срока: `next_step.supplier.under_review` | — | — |
| A4 | Клиент (без роли supplier) открывает `/s/home` по ссылке | Редирект на `/c/home`, без ошибки | — | — |
| A5 | `dual`: переключение роли во время загрузки файла в клиентском кабинете | Загрузка продолжается в фоне; при возврате — состояние актуально (см. SC-10 A1) | — | `role_switched` |
| A6 | `dual`: клиентская заявка `closed`, поставщик `active` | Переключатель работает; кабинет поставщика не затронут (SC-08 A4) | — | — |
| A7 | Счётчики не сходятся со списком (`referred_total` < строк в `/s/clients`) | Показываем данные как есть; событие несогласованности; UI не падает | — | `data_inconsistency {kind: counters_mismatch}` |
| A8 | Офлайн | Шкала, карточка и счётчики из кэша с подписью `common.cached_at {time}`; кнопки реферальной карточки работают (ссылка статична) | — | — |
| A9 | Ошибка загрузки `/s/home` | Карточка «Не удалось загрузить» + «Повторить» + SupportBar; оболочка остаётся | повторить | — |
| A10 | Сессия истекла | Экран `auth.expired` → `/login?returnTo=/s/home` (SC-10) | войти | `session_expired` |
| A11 | Поставщик с несколькими телефонами (`phones[]`) | Любой из них даёт вход в тот же кабинет; в UI телефоны не показываем | — | — |
| A12 | Очень длинное название поставщика (арабское) | В шапке — обрезка с многоточием, полное название в `title`/тултипе; на 360 px не ломает переключатель ролей | — | — |

---

## 3. Состояния экранов

| Экран / блок | Состояние | Что показываем |
|---|---|---|
| `supplier.home` | loading | Скелетоны шкалы, карточки, трёх счётчиков, реферальной карточки |
| `supplier.home` | docs_required | Шкала шаг 1, карточка с CTA «К документам», счётчики (возможно нули) |
| `supplier.home` | docs_required + rejected (A1) | То же, карточка про отклонённые с count |
| `supplier.home` | under_review | Шаг 2 current, карточка без CTA, SupportBar |
| `supplier.home` | active | Шаг 3 current, карточка «делитесь ссылкой» с CTA |
| `#counters` | empty (0/0/0) | Нули + подсказка `supplier.counters.empty_hint` |
| `#counters` | normal | Три числа-ссылки с подписями (формы множественного числа) |
| `#referral-card` | normal | Ссылка LTR, «Скопировать», «WhatsApp», ссылка на `/s/referral` |
| `supplier.home` | error / offline | См. A8–A9 |
| шапка | dual | Переключатель «Клиент | Поставщик» (сегментированный контрол), название активного контекста |
| все | RTL / LTR, light / dark | Шкала зеркалится; URL в `<bdi dir="ltr">`; переключатель ролей — порядок сегментов по направлению письма |

---

## 4. Тексты интерфейса (AR / EN) — предложение

| Ключ | EN | AR | Примечание |
|---|---|---|---|
| `supplier.home.title` | Your supplier account | حساب المورّد الخاص بك | |
| `timeline.supplier.documents` | Documents | المستندات | |
| `timeline.supplier.review` | Review | المراجعة | |
| `timeline.supplier.active` | Active | نشط | |
| `next_step.supplier.upload_documents` | Upload your documents so we can activate your account | ارفع مستنداتك لنتمكن من تفعيل حسابك | owner = user |
| `next_step.supplier.reupload_rejected` | {count} documents need a new file | {count} مستندات تحتاج ملفًا جديدًا | A1; формы множ. числа |
| `next_step.supplier.under_review` | We're reviewing your documents. You can already share your link | نراجع مستنداتك الآن. يمكنك مشاركة رابطك منذ الآن | owner = tadum; без сроков |
| `next_step.supplier.under_review_eta` | We're reviewing your documents — usually up to {hours} hours. You can already share your link | نراجع مستنداتك — عادةً خلال {hours} ساعة. يمكنك مشاركة رابطك منذ الآن | только при `meta.hours` (D-033) |
| `next_step.supplier.share_link` | You're active. Share your link with clients | حسابك نشط. شارك رابطك مع عملائك | owner = user |
| `supplier.counters.referred` | Referred | العملاء المُحالون | |
| `supplier.counters.under_review` | Under review | قيد المراجعة | |
| `supplier.counters.approved` | Approved | المعتمدون | approved + first_purchase |
| `supplier.counters.empty_hint` | Share your link — your first clients will appear here | شارك رابطك — سيظهر عملاؤك الأوائل هنا | |
| `supplier.referral_card.title` | Your referral link | رابط الإحالة الخاص بك | |
| `supplier.referral_card.more` | QR code and details | رمز QR والتفاصيل | → `/s/referral` |
| `role.client` | Client | عميل | переключатель |
| `role.supplier` | Supplier | مورّد | |
| `role.hint_supplier` | You also have a supplier account — switch here | لديك أيضًا حساب مورّد — بدّل من هنا | показываем один раз |
| `role.hint_dismiss` | Got it | فهمت | |

Проверка TOV: «активировать аккаунт», «делитесь ссылкой», «клиенты» — нейтральные; нет «партнёрская программа / комиссия / вознаграждение» (вознаграждение — фаза 2, в MVP не упоминаем).

---

## 5. События аналитики

| Событие | Когда | Свойства |
|---|---|---|
| `auth_login_succeeded` | вход (общее с SC-01) | `{ role_count, active_role }` |
| `screen_viewed` | открыт `/s/home` | `{ screen_id: 'supplier.home', supplier_status, referred_bucket: '0' \| '1-5' \| '6-10' \| '11-25' \| '26+' }` |
| `next_step_cta_clicked` | нажат CTA карточки | `{ screen_id, step: 'supplier.upload_documents' \| 'supplier.reupload_rejected' \| 'supplier.share_link' }` |
| `supplier_counter_clicked` | нажат счётчик | `{ counter: 'referred' \| 'under_review' \| 'approved' }` |
| `role_switched` | переключение роли | `{ from, to }` |
| `role_hint_shown` / `role_hint_dismissed` | подсказка для `dual` | `{}` |
| `data_inconsistency` | A7 | `{ kind }` |

`supplier_id`, телефоны и названия в события не отправляем. События реферальной карточки — в SP-02 (одни и те же имена, свойство `source: 'home' | 'referral'`).

---

## 6. Критерии приёмки

- [ ] Поставщик с одной ролью после входа попадает на `/s/home`; `dual` — на `/c/home` с переключателем в шапке (D-020); повторный вход `dual` открывает последнюю выбранную роль.
- [ ] `supplier_status` вычисляется из состояния комплекта документов (`01-statuses.md` §3) и не зависит от бэкенда в моке; три состояния шкалы и карточки соответствуют таблице §1.
- [ ] Счётчики согласованы с `/s/clients` на персоне `supplier_active` (14 / 3 / 6) и ведут на список с фильтром; при нулях — подсказка.
- [ ] Реферальная карточка на главной работает в любом статусе (D-022), включая `docs_required` у `supplier_new`.
- [ ] Переключение роли не сбрасывает язык и тему и не перезагружает страницу; событие `role_switched` вызывается.
- [ ] Текст срока проверки показывается только при `meta.hours`.
- [ ] Тексты в `ar` и `en`; axe без нарушений; переключатель ролей — кнопки с подписями, доступен с клавиатуры.
- [ ] Storybook: `SupplierHome` docs_required / rejected / under_review / active / empty-counters / loading × AR/EN × light/dark; `RoleSwitcher` client / supplier.
- [ ] Playwright: `supplier_new` → вход → `/s/home` → CTA → `/s/documents`.

---

## 7. Заметки для реализации

- `resolveRoles` и гард маршрутов — общие с клиентом (`SC-01`); для `/s/*` гард проверяет семью `supplier`.
- Короткая реферальная карточка на главной и экран `/s/referral` используют один компонент `ReferralActions` с пропом `compact`; события те же с `source`.
- Счётчики приходят агрегатом в `Supplier.counters` (не считаются на фронтенде из списка); расхождение фиксируется как `data_inconsistency`.
- `referred_bucket` вычисляется в слое аналитики.
- Подсказка для `dual` — `Popover` у переключателя, флаг в `localStorage` рядом с языком и темой.

## 8. Открытые вопросы

Решено (Кирилл, 2026-11-04):

- **SP1-1** — в реферальной карточке на главной только ссылка и кнопки «Скопировать» / «Поделиться в WhatsApp»; QR-код живёт на `/s/referral` (D-043).
- **SP1-2** — счётчик «Одобрено» = `approved + first_purchase` (как в `01-entities.md` §2.10); отдельный счётчик «купили» — фаза 2 вместе с разделом сделок (D-044).

Открытых вопросов по сценарию нет.

## 9. Бенчмарки

Главные экраны партнёрских/реферальных кабинетов со счётчиками и статусом аккаунта (Mobbin: referral dashboards, partner portals, MENA fintech) — сессия 8.
