<!-- source: Drive 1NICzXnAFGML9tRvNkmW-mMno83tpM0qR, synced: 2026-11-11. Не редактировать — источник в Drive. -->
# SC-06 · Одобрение и подключение лимита

| Поле | Значение |
|---|---|
| **ID** | `SC-06` |
| **Роли** | `client_contact`, `client_owner` |
| **Экраны** | `client.documents` (этапы «Решение» и «Подписание», D-081), `client.help` |
| **Предусловие** | UW одобрил заявку: `client_status = approved`, `permission_state = active`; лимит `pending` → `ready`; чек-лист не завершён |
| **Статусы** | Odoo: Approved → Offer confirmation → Signing SPA & PN; лимит `pending` → `ready`; чек-лист `spa_sadq`, `pn_company_nafith`, `pn_owner_nafith` |
| **Цель** | Клиент понимает, что заявка одобрена, какие три шага остались до активного лимита и где их сделать; переходит по внешним ссылкам и возвращается, видя прогресс |
| **Метрика** | Доля одобренных заявок, дошедших до `limit.active` (конверсия Approved → Client Approved); время от `approved` до `active`; доля открытий внешних ссылок из портала |
| **Версия прототипа** | v4 |
| **Персоны мока** | `client_approved_unsigned` (лимит `ready`, SPA `in_progress`, PN `pending`), `client_offer_pending` (лимит `pending`, `Offer confirmation`), `client_signing_partial` (SPA `done`, вексель компании `in_progress`), `client_limit_cancelled` (A7) |
| **Связанные документы** | `01-cabinet-structure.md` §1 (D-023: лимит на `home`), §5–6; `01-entities.md` §2.7–2.8; `01-statuses.md` §6–8, §10 |
| **Статус** | черновик — живой каркас (вопросы закрыты) |

---

## 1. Основной сценарий

```
Дано:  UW одобрил заявку (мок: uwApproveApplication(150000)); odoo_stage = Approved → Offer confirmation;
       client_status = approved; лимит pending, approved = 150 000 SAR (условия ещё согласуются)
Когда: клиент открывает /c/documents
Тогда: шкала: «Документы» done, «Проверка» done, «Решение» current, «Подписание» upcoming;
       карточка next_step.offer_confirmation (owner = tadum): «Заявка одобрена. Наш менеджер свяжется
       с вами, чтобы подтвердить условия» — без CTA; карточка лимита показывает статус «согласуем условия»,
       сумму показываем (approved задан); чек-лист ещё не активен (все пункты pending, ссылок нет);
       событие screen_viewed {status: approved, limit_status: pending}

Дано:  продажи согласовали условия (мок: salesConfirmOffer()); odoo_stage = Signing SPA & PN; лимит ready;
       чек-лист: spa_sadq pending с external_url, pn_company_nafith pending, pn_owner_nafith pending
Когда: клиент открывает /c/documents
Тогда: карточка next_step.sign_documents (owner = user) с CTA → /c/documents;
       карточка лимита и блок «Documents to sign»: одобренный лимит 150 000 SAR, чек-лист из трёх пунктов
       в фиксированном порядке, у каждого статус и кнопка «Перейти» (если есть external_url)

Когда: клиент нажимает «Перейти» у spa_sadq
Тогда: открывается внешняя ссылка (новая вкладка / системный браузер); пункт локально → in_progress;
       событие checklist_link_opened {item: spa_sadq}

Когда: клиент возвращается; подпись подтверждена на бэкенде (мок: externalSign('spa_sadq'))
Тогда: при обновлении данных пункт → done; тост status.updated; следующий пункт становится акцентным

Когда: все три пункта done (мок: externalSign для pn_company_nafith и pn_owner_nafith)
Тогда: odoo_stage = Client Approved; лимит active; шкала: «Подписание» done, «Лимит активен» current;
       карточка next_step.how_to_buy; блок #limit переключается на режим SC-07;
       событие limit_activated {days_since_approved}
```

---

## 2. Альтернативные сценарии и ошибки

| # | Условие | Что видит (ключ) | Действие | Событие |
|---|---|---|---|---|
| A1 | Лимит `pending`, `approved` не задан | Блок `#limit` без суммы: `limit.pending_no_amount` | — | — |
| A2 | У пункта нет `external_url` (вексель подтверждается в приложении Nafith) | Вместо кнопки — инструкция `checklist.nafith_instruction` текстом; третьи стороны без логотипов | — | — |
| A3 | Пункт `failed` | Нейтральный текст `checklist.item_failed` + «Написать в поддержку»; причину не показываем | поддержка | `checklist_item_failed_viewed {item}` |
| A4 | Клиент открыл ссылку, но подпись не подтвердилась (бэкенд не обновил) | Пункт остаётся `in_progress` с подписью `checklist.waiting_confirmation`; через 24 часа без подтверждения — мягкая строка «если вы уже подписали, напишите нам» | — | `checklist_item_stale {item, hours}` |
| A5 | Пункты выполняются не по порядку (владелец подписал вексель раньше SPA) | Разрешено; порядок отображения фиксированный, акцент — на первом незавершённом | — | — |
| A6 | Внешняя ссылка не открывается во встроенном браузере WhatsApp | Подсказка `common.open_in_browser` с кнопкой «Скопировать ссылку» | скопировать | `external_link_blocked {item}` |
| A7 | Лимит стал `cancelled` на этапе подписания | Нейтральная карточка без причины и «Apply again» на лендинг; чек-лист скрыт | поддержка | `limit_cancelled_viewed` |
| A9 | Клиент открывает `/c/documents` в `approved` | Режим чтения (как SC-05), баннер `documents.approved_banner` | — | — |
| A10 | Статус сменился, пока экран открыт | Тост `status.updated` (D-034), блок `#limit` перерисовывается | — | `status_changed_while_open` |

---

## 3. Состояния экранов

| Экран / блок | Состояние | Что показываем |
|---|---|---|
| `client.documents` | approved-pending-offer | Шкала (decision current), карточка «менеджер свяжется», `#limit` со статусом «согласуем условия» |
| `client.documents` | approved-ready | Карточка «подпишите документы», `#limit` с суммой и чек-листом |
| `#limit` чек-лист | item pending / in_progress / done / failed | Иконка состояния, подпись, кнопка «Перейти» или инструкция |
| `#limit` чек-лист | stale (A4) | Пункт `in_progress` + строка про поддержку |
| `#limit` | cancelled (A7) | Нейтральный текст, поддержка |
| все | длинный арабский текст | Названия пунктов в 2 строки без обрезки |
| все | RTL / LTR, light / dark | Галочки не зеркалятся; стрелка «Перейти» (внешняя ссылка) зеркалится |

---

## 4. Тексты интерфейса (AR / EN) — предложение

| Ключ | EN | AR | Примечание |
|---|---|---|---|
| `status.client.approved` | Approved | تمت الموافقة | статус |
| `next_step.offer_confirmation` | Your application is approved. Our team will call you to confirm the terms | تمت الموافقة على طلبك. سيتواصل معك فريقنا هاتفيًا لتأكيد الشروط | owner = tadum |
| `next_step.sign_documents` | Almost done — sign the documents to activate your limit | اقتربت من النهاية — وقّع المستندات لتفعيل حدّك | owner = user; «limit» → «торговый лимит», не «кредит» |
| `limit.title` | Your trade limit | حدّك التجاري | «торговый лимит» — разрешённый термин |
| `limit.approved_amount` | Approved: {amount} | المعتمد: {amount} | `{amount}` через `formatMoney` (SAR / ر.س) |
| `limit.pending_offer` | We're confirming the terms with you | نؤكد الشروط معك حاليًا | лимит `pending` |
| `limit.pending_no_amount` | Your application is approved. The limit amount will appear here after we confirm the terms | تمت الموافقة على طلبك. سيظهر مبلغ الحد هنا بعد تأكيد الشروط | A1 |
| `limit.cancelled` | This limit is no longer active. Our team can tell you more | هذا الحد لم يعد نشطًا. يمكن لفريقنا توضيح المزيد | A7, без причины |
| `checklist.title` | Documents to sign | مستندات للتوقيع | D-081 |
| `checklist.spa_sadq` | Sign the agreement (Sadq) | توقيع الاتفاقية (صادق) | третьи стороны — текстом |
| `checklist.pn_company_nafith` | Approve the company note (Nafith) | اعتماد سند الشركة (نافذ) | |
| `checklist.pn_owner_nafith` | Approve the owner's note (Nafith) | اعتماد سند المالك (نافذ) | |
| `checklist.status.pending` | To do | مطلوب | |
| `checklist.status.in_progress` | Waiting for confirmation | بانتظار التأكيد | D-081 |
| `checklist.status.done` | Done | تم | |
| `checklist.status.failed` | Needs attention | يحتاج متابعة | |
| `checklist.open` | Open | فتح | кнопка внешней ссылки |
| `checklist.nafith_instruction` | Open the Nafith app and approve the note sent to you | افتح تطبيق نافذ واعتمد السند المرسل إليك | A2 |
| `checklist.waiting_confirmation` | We're waiting for confirmation | بانتظار التأكيد | A4 |
| `checklist.stale_hint` | Already signed? Message us and we'll check | هل وقّعت بالفعل؟ راسلنا وسنتحقق | A4, 24 ч |
| `checklist.item_failed` | We couldn't confirm this step. Our team will help | لم نتمكن من تأكيد هذه الخطوة. فريقنا جاهز للمساعدة | A3 |
| `common.open_in_browser` | This link opens best in your browser | يُفضَّل فتح هذا الرابط في المتصفح | A6 |
| `common.copy_link` | Copy link | نسخ الرابط | |
| `documents.approved_banner` | Your documents are accepted | تم قبول مستنداتك | A9 |

Запрещённые слова не используются: нет «кредит», «заём», «финансирование», «процент», «BNPL», нет обещаний сроков.

---

## 5. События аналитики

| Событие | Когда | Свойства |
|---|---|---|
| `screen_viewed` | `home` в `approved` | `{ screen_id, status: 'approved', limit_status, checklist_done_count }` |
| `checklist_link_opened` | нажата «Открыть» у пункта | `{ item, position }` |
| `checklist_item_completed` | пункт стал `done` (по данным) | `{ item, hours_since_ready }` |
| `checklist_item_failed_viewed` | показан `failed` | `{ item }` |
| `checklist_item_stale` | `in_progress` > 24 ч | `{ item, hours }` |
| `external_link_blocked` | ссылка не открылась в IAB | `{ item }` |
| `limit_activated` | лимит стал `active` | `{ days_since_approved?, amount_bucket }` — сумма в корзинах, не точное значение; `days_since_approved` — когда бэкенд отдаёт дату одобрения |
| `limit_cancelled_viewed` | показан `cancelled` | `{}` |

`amount_bucket` вместо суммы — чтобы не отправлять финансовые данные клиента в аналитику.

---

## 6. Критерии приёмки

- [ ] Решение и подписание — на `/c/documents` (D-081); CTA карточки ведёт туда; отдельного маршрута нет.
- [ ] Порядок пунктов фиксирован (SPA → вексель компании → вексель владельца); акцент на первом незавершённом; выполнение не по порядку не ломает отображение.
- [ ] Внешние ссылки открываются в новой вкладке с `rel="noopener"`; во встроенном браузере WhatsApp есть запасной путь «Скопировать ссылку».
- [ ] Третьи стороны (Sadq, Nafith) только текстом, без логотипов и скриншотов.
- [ ] Статусы пунктов приходят из данных; локальный `in_progress` после клика не считается подтверждением и сбрасывается при обновлении данных, если бэкенд говорит `pending`.
- [ ] `failed` и `cancelled` — нейтральные тексты без причин, с путём в поддержку.
- [ ] Сумма — через `formatMoney` (D-006): «SAR 150,000» в EN, «150,000 ر.س» в AR, западные цифры.
- [ ] При завершении всех пунктов блок переключается в режим активного лимита (SC-07) без перезагрузки.
- [ ] Тексты в `ar` и `en`; axe без нарушений; статусы пунктов доступны тексту, не только иконкой.
- [ ] Storybook: `LimitBlock` pending-offer / pending-no-amount / ready / cancelled; `ChecklistItem` × 4 статуса × stale × AR/EN × light/dark.
- [ ] Playwright: `client_approved_unsigned` → открыть ссылку → `externalSign` × 3 на демо-странице `/demo/sign` → лимит `active`; A3, A6.

---

## 7. Заметки для реализации

- Локальное состояние `in_progress` хранится в `sessionStorage` с меткой времени — для A4 и для UI сразу после клика.
- `external_url` может содержать одноразовый код — не логировать и не отправлять в аналитику.
- Блок `#limit` — один виджет `LimitBlock` с режимами `pending | ready | active | cancelled | rejected`; режим `active` описан в SC-07.

## 8. Открытые вопросы

Решено (Кирилл, 2026-11-04): SC6-1 — статусы пунктов чек-листа обновляются опросом по интервалу и при возврате на вкладку; статус берётся только из данных, локальный `in_progress` подтверждением не считается (D-035). SC6-2 — срок, согласованный с продажами, в MVP клиенту не показываем; поле `term_months` убрано из сущности `Limit` до фазы 2 (D-036).

Открытых вопросов по сценарию нет.

## 9. Бенчмарки

Чек-листы активации с внешними шагами (Mobbin: fintech onboarding, e-sign handoff) — сессия 8.
