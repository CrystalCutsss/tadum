<!-- source: Drive 1uRtGlHaRhUlpUGDWnuWVoQIfEwBuEgpI, synced: 2026-11-18. Не редактировать — источник в Drive. -->
# SC-06 · Одобрение и подключение лимита

| Поле | Значение |
|---|---|
| **ID** | `SC-06` |
| **Роли** | `client_contact`, `client_owner` |
| **Экраны** | `client.documents` (этапы «Решение» и «Подписание», D-081, D-084), `client.signing` (`/c/documents/sign` — сценарий подписания, D-083), `client.help` |
| **Предусловие** | UW одобрил заявку: `client_status = approved`, `permission_state = active`; лимит `pending` → `ready`; чек-лист не завершён |
| **Статусы** | Odoo: Approved → Offer confirmation → Signing SPA & PN; лимит `pending` → `ready`; чек-лист `spa`, `pn_nafith` (D-083, D-085) |
| **Цель** | Клиент понимает, что заявка одобрена, какие два шага остались до активного лимита и как их сделать: подписать договор (SPA) в Sadq по ссылке из SMS от менеджера; подтвердить вексель в приложении Nafith. Возвращается и видит прогресс |
| **Метрика** | Доля одобренных заявок, дошедших до `limit.active` (конверсия Approved → Client Approved); время от `approved` до `active`; время от `ready` до подписи SPA; доля скачиваний подписанной копии SPA |
| **Версия прототипа** | v4 |
| **Персоны мока** | `client_approved_unsigned` (лимит `ready`, SPA и вексель `pending`), `client_offer_pending` (лимит `pending`, `Offer confirmation`), `client_signing_partial` (SPA `done`, вексель `pending`), `client_limit_cancelled` (A7) |
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
       с вами, чтобы подтвердить условия» — без CTA; карточка лимита — на всю ширину колонки, как
       на этапе «Лимит одобрен»; заголовок «Одобренный лимит · ещё не активен», сумма (approved задан),
       подсказка с иконкой info: «От вас сейчас ничего не нужно. Наш менеджер позвонит, чтобы
       подтвердить условия»; папки документов, блока подписей и кнопки подписания нет (D-083, D-084);
       событие screen_viewed {status: approved, limit_status: pending}

Дано:  продажи согласовали условия (мок: salesConfirmOffer()); odoo_stage = Signing SPA & PN; лимит ready;
       менеджер отправил клиенту SMS со ссылкой на подписание SPA в Sadq (вне портала);
       чек-лист: spa pending, pn_nafith pending (запрос в Nafith отправлен)
Когда: клиент открывает /c/documents
Тогда: карточка next_step.sign_documents (owner = user) с CTA → /c/documents/sign;
       карточка лимита на всю ширину: заголовок «Одобренный лимит · ещё не активен», сумма 150 000 SAR,
       над кнопкой — подсказка с иконкой info «Чтобы активировать лимит, подпишите договор и подтвердите
       вексель в Nafith», кнопка «Подписать документы»; прогресса «N из 2» нет; папки документов нет (D-084)

Когда: клиент нажимает «Подписать документы»
Тогда: экран /c/documents/sign (client.signing): заголовок, два шага в фиксированном порядке, без номеров —
       1) договор SPA: бейдж «Требуется подпись» (серый), подзаголовок «менеджер прислал SMS со ссылкой
          на Sadq» и два шага в серых кругах — «откройте ссылку на Sadq из SMS», «подпишите договор»;
          кнопок нет (D-085);
       2) вексель: инструкция «откройте приложение Nafith и подтвердите вексель от Tadum» и кнопка
          «Открыть Nafith» (сайт Nafith в новой вкладке);
       у начатого шага — статус текстом; событие screen_viewed {screen_id: client.signing, done_count: 0}

Когда: клиент подписал договор в Sadq по ссылке из SMS (мок: externalSign('spa')); клиент возвращается на экран
Тогда: при обновлении данных шаг SPA → done: бейдж «Подписан» (зелёный), текст «Договор подписан, можно
       скачать копию» и нейтральная кнопка «Скачать» (document_url — подписанная копия, PDF);
       подзаголовок экрана — «Больше подписывать нечего — осталось подтвердить вексель в Nafith»; тост status.updated
       (D-085); при скачивании — событие spa_downloaded

Когда: клиент нажимает «Открыть Nafith»
Тогда: сайт Nafith в новой вкладке; шаг векселя локально → in_progress «Ждём подтверждения»

Когда: клиент подтвердил вексель в Nafith (мок: externalSign('pn_nafith'))
Тогда: odoo_stage = Client Approved; лимит active; экран подписания показывает «Лимит одобрен»
       и «Вернуться к заявке», подзаголовок «Больше подписывать нечего»; шкала: «Подписание» done, «Лимит одобрен» current;
       событие limit_activated {amount_bucket}
```

---

## 2. Альтернативные сценарии и ошибки

| # | Условие | Что видит (ключ) | Действие | Событие |
|---|---|---|---|---|
| A1 | Лимит `pending`, `approved` не задан | Карточка лимита без суммы: `limit.pending_no_amount` | — | — |
| A2 | Вексель не подтверждён за 24 часа после «Открыть Nafith» | Шаг остаётся «Ждём подтверждения»; под карточкой — `checklist.stale_hint_pn` ссылкой в поддержку | поддержка | `checklist_item_stale {item, hours}` |
| A3 | Пункт `failed` | Нейтральный текст `checklist.item_failed` + «Написать в поддержку»; причину не показываем | поддержка | `checklist_item_failed_viewed {item}` |
| A4 | Клиент не получил SMS со ссылкой на Sadq | Шаг остаётся «Требуется подпись»; помощь — через блок поддержки (WhatsApp) | поддержка | — |
| A5 | Шаги выполняются не по порядку (вексель подтверждён раньше SPA) | Разрешено; порядок отображения фиксированный | — | — |
| A6 | Экран `/c/documents/sign` открыт не на этапе подписания (лимит не `ready`) | Переход на `/c/documents` без ошибки | — | — |
| A7 | Лимит стал `cancelled` на этапе подписания | Нейтральная карточка без причины и «Apply again» на лендинг; кнопки подписания нет | поддержка | `limit_cancelled_viewed` |
| A9 | Клиент открывает `/c/documents` в `approved` | Режим чтения (как SC-05), баннер `documents.approved_banner` | — | — |
| A10 | Статус сменился, пока экран открыт | Тост `status.updated` (D-034), экран перерисовывается | — | `status_changed_while_open` |

---

## 3. Состояния экранов

| Экран / блок | Состояние | Что показываем |
|---|---|---|
| `client.documents` | approved-pending-offer | Шкала (decision current); карточка лимита на всю ширину: «Одобренный лимит · ещё не активен», сумма, подсказка «менеджер позвонит»; папки и подписей нет (D-084) |
| `client.documents` | approved-ready | Карточка лимита на всю ширину: заголовок, сумма, подсказка «подпишите договор и вексель», кнопка «Подписать документы»; без прогресса и папки (D-084) |
| `client.documents` | подсказка в карточке | Иконка info 20 px в полупрозрачном круге 40 px — того же размера, что подложка иконки в блоках документов; текст не шире половины карточки на ≥640 px |
| `client.signing` | SPA: требуется подпись | Бейдж «Требуется подпись» (серый, без иконки); подзаголовок про SMS и Sadq на всю ширину карточки; два шага с номерами в серых кругах, круги выровнены по верху текста; кнопок нет (D-085) |
| `client.signing` | SPA: подписан | Бейдж «Подписан» (зелёный, без иконки); «Договор подписан, можно скачать копию»; нейтральная кнопка «Скачать» (не основная синяя) |
| `client.signing` | вексель pending / in_progress / done / failed | Статус текстом и иконкой у начатого шага; инструкция и «Открыть Nafith» |
| `client.signing` | stale (A2) | Шаг «ждём подтверждения» + строка-ссылка в поддержку |
| `client.signing` | оба done | «Лимит одобрен» и «Вернуться к заявке» |
| все | длинный арабский текст | Названия шагов в 2 строки без обрезки |
| все | RTL / LTR, light / dark | Галочки не зеркалятся; стрелка «назад» в крошках зеркалится |

---

## 4. Тексты интерфейса (AR / EN) — предложение

| Ключ | EN | AR | Примечание |
|---|---|---|---|
| `status.client.approved` | Approved | تمت الموافقة | статус |
| `next_step.offer_confirmation` | Your application is approved. Our team will call you to confirm the terms | تمت الموافقة على طلبك. سيتواصل معك فريقنا هاتفيًا لتأكيد الشروط | owner = tadum |
| `next_step.sign_documents` | Almost done — sign the documents to activate your limit | اقتربت من النهاية — وقّع المستندات لتفعيل حدّك | owner = user |
| `limit.pending_no_amount` | Your application is approved. The limit amount will appear here after we confirm the terms | تمت الموافقة على طلبك. سيظهر مبلغ الحد هنا بعد تأكيد الشروط | A1 |
| `limit.cancelled` | This limit is no longer active. Our team can tell you more | هذا الحد لم يعد نشطًا. يمكن لفريقنا توضيح المزيد | A7, без причины |
| `application.limit_label_approved` | Approved limit · not active yet | الحد المعتمد · غير مفعّل بعد | заголовок карточки на «Решении» и «Подписании» (D-084) |
| `application.decision.body` | Nothing is needed from you right now. Our team will call you to confirm the terms | لا حاجة لأي إجراء منك حاليًا. سيتواصل معك فريقنا هاتفيًا لتأكيد الشروط | подсказка на «Решении» |
| `application.signing.info` | To activate your limit, sign the agreement and approve the promissory note in Nafith | لتفعيل حدّك، وقّع الاتفاقية واعتمد السند لأمر في نافذ | подсказка над кнопкой на «Подписании» (D-084) |
| `signing.cta` | Sign documents | توقيع المستندات | кнопка в карточке лимита |
| `signing.title` | Sign documents | توقيع المستندات | заголовок экрана |
| `checklist.spa` | Agreement (SPA) | الاتفاقية (SPA) | шаг 1 |
| `signing.spa.status_required` | Signature required | بانتظار التوقيع | бейдж, серый (D-085) |
| `signing.spa.status_signed` | Signed | تم التوقيع | бейдж, зелёный |
| `signing.spa.body` | Your manager has sent you an SMS with a link to sign the agreement in Sadq | أرسل إليك مديرك رسالة نصية فيها رابط لتوقيع الاتفاقية في صادق | до подписи |
| `signing.spa.step_sms` | Open the Sadq link in the SMS | افتح رابط صادق في الرسالة | шаг 1, в одну строку |
| `signing.spa.step_sign` | Sign the agreement | وقّع الاتفاقية | шаг 2 |
| `signing.spa.signed_body` | The agreement is signed. You can download a copy | تم توقيع الاتفاقية. يمكنك تنزيل نسخة منها | после подписи |
| `signing.spa.download` | Download | تنزيل | нейтральная кнопка |
| `signing.subtitle_signed` | Nothing else to sign — just approve the note in Nafith | لا يوجد ما توقّعه بعد الآن — بقي اعتماد السند في نافذ | подзаголовок экрана: SPA подписан, вексель ждёт |
| `signing.subtitle_all_done` | Nothing else to sign | لا يوجد ما توقّعه بعد الآن | подзаголовок экрана: оба шага done |
| `checklist.pn_nafith` | Promissory note (Nafith) | السند لأمر (نافذ) | шаг 2 |
| `signing.pn.body` | We've sent the note to Nafith. Open the Nafith app and approve the note from Tadum | أرسلنا السند إلى نافذ. افتح تطبيق نافذ واعتمد السند المرسل من تدوم | третьи стороны — текстом |
| `signing.pn.open` | Open Nafith | فتح نافذ | сайт Nafith, новая вкладка |
| `checklist.status.in_progress` | Waiting for confirmation | بانتظار التأكيد | |
| `checklist.status.done` | Done | تم | |
| `checklist.status.failed` | Needs attention | يحتاج متابعة | |
| `checklist.stale_hint_pn` | Already approved in Nafith? Message us and we'll check | هل اعتمدت السند في نافذ؟ راسلنا وسنتحقق | A2, 24 ч |
| `checklist.item_failed` | We couldn't confirm this step. Message us and our team will help | لم نتمكن من تأكيد هذه الخطوة. راسلنا وسيساعدك فريقنا | A3 |
| `signing.done` | Your limit is approved | تم اعتماد حدّك | оба шага done |
| `signing.back` | Back to application | العودة إلى الطلب | |
| `documents.approved_banner` | Your documents are accepted | تم قبول مستنداتك | A9 |

Окончательные тексты проверяет владелец текстов (`docs/i18n/needs-review.md`). Запрещённые слова не используются: нет «кредит», «заём», «финансирование», «процент», «BNPL», нет обещаний сроков.

---

## 5. События аналитики

| Событие | Когда | Свойства |
|---|---|---|
| `screen_viewed` | `client.documents` в `approved`; `client.signing` | `{ screen_id, … }`; для `client.signing` — `{ done_count }` |
| `spa_downloaded` | нажата «Скачать» у подписанного договора | `{}` |
| `checklist_item_completed` | пункт стал `done` (по данным) | `{ item, hours_since_ready }` |
| `checklist_item_failed_viewed` | показан `failed` | `{ item }` |
| `checklist_item_stale` | шаг «ждём подтверждения» > 24 ч | `{ item, hours }` |
| `limit_activated` | лимит стал `active` | `{ days_since_approved?, amount_bucket }` — сумма в корзинах, не точное значение |
| `limit_cancelled_viewed` | показан `cancelled` | `{}` |

`amount_bucket` вместо суммы — чтобы не отправлять финансовые данные клиента в аналитику. Ссылка на Sadq и `document_url` в события не попадают.

---

## 6. Критерии приёмки

- [ ] На этапе «Решение» блока подписей и кнопки подписания нет; на «Подписании» в карточке лимита — подсказка и кнопка «Подписать документы», прогресса нет (D-083, D-084).
- [ ] На «Решении» и «Подписании» папки документов нет; карточка лимита на всю ширину колонки, заголовок «Одобренный лимит · ещё не активен»; подсказка — иконка info в полупрозрачном круге, текст не шире половины карточки (D-084).
- [ ] Сценарий подписания — отдельный экран `/c/documents/sign` с крошками «Заявка › Подписание документов»; открыт не на этапе подписания — переход на `/c/documents`.
- [ ] Шаги в фиксированном порядке: SPA → вексель; выполнение не по порядку не ломает отображение.
- [ ] У SPA два состояния: «Требуется подпись» (серый бейдж, инструкция про SMS и Sadq, без кнопок) и «Подписан» (зелёный бейдж, «Скачать» копию PDF нейтральной кнопкой); после подписи подзаголовок экрана — «больше подписывать нечего» (D-085).
- [ ] Шаг векселя — инструкция текстом и кнопка «Открыть Nafith» (сайт в новой вкладке), без логотипов Nafith; номеров шагов нет.
- [ ] Статусы шагов приходят из данных; у векселя локальная отметка «открыт Nafith» не считается подтверждением (D-035); у SPA локальной отметки нет.
- [ ] `failed` и `cancelled` — нейтральные тексты без причин, с путём в поддержку.
- [ ] Сумма — через `formatMoney` (D-006): «SAR 150,000» в EN, «150,000 ر.س» в AR, западные цифры.
- [ ] Когда оба шага `done`, экран и «Заявка» переключаются на «Лимит одобрен» без перезагрузки.
- [ ] Тексты в `ar` и `en`; axe без нарушений; статусы шагов доступны тексту, не только иконкой.
- [ ] Storybook: карточка лимита pending / ready / cancelled; шаги подписания × статусы × stale × AR/EN × light/dark.
- [ ] Playwright: `client_approved_unsigned` → «Подписать документы» → SPA «Требуется подпись» без кнопок и без автоперехода → «Открыть Nafith» → вексель ждёт; `client_signing_partial` — SPA «Подписан» и «Скачать»; A6, A7; итог «Лимит одобрен» — персона `client_active`.

---

## 7. Заметки для реализации

- Локальная отметка «открыт Nafith» хранится в `sessionStorage` с меткой времени — для A2 и для UI сразу после нажатия. У SPA отметки нет: подпись в Sadq портал не видит до обновления данных.
- `document_url` может быть подписанной ссылкой — не логировать и не отправлять в аналитику.
- Демо витрины: автоперехода нет — договор и вексель сами не подтверждаются; состояние «Подписан» показывает персона `client_signing_partial` (D-085, A-066). Демо-ссылок и демо-страницы нет.
- Компонент папки документов остаётся в коде (D-084), на этапах «Решение» и «Подписание» не показывается; принятые документы — в «Открыть заявку» на этапе «Лимит одобрен».

## 8. Открытые вопросы

Решено (Кирилл, 2026-11-04): SC6-1 — статусы пунктов чек-листа обновляются опросом по интервалу и при возврате на вкладку; статус берётся только из данных, локальный `in_progress` подтверждением не считается (D-035). SC6-2 — срок, согласованный с продажами, в MVP клиенту не показываем; поле `term_months` убрано из сущности `Limit` до фазы 2 (D-036).

Открытых вопросов по сценарию нет.

## 9. Бенчмарки

Чек-листы активации с внешними шагами (Mobbin: fintech onboarding, e-sign handoff) — сессия 8.
