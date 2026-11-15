<!-- source: Drive 1sf4HYZ06JrXnptGdMQXKn2ijPDl_q7Q5, synced: 2026-11-15. Не редактировать — источник в Drive. -->
# SC-06 · Одобрение и подключение лимита

| Поле | Значение |
|---|---|
| **ID** | `SC-06` |
| **Роли** | `client_contact`, `client_owner` |
| **Экраны** | `client.documents` (этапы «Решение» и «Подписание», D-081), `client.signing` (`/c/documents/sign` — сценарий подписания, D-083), `client.help` |
| **Предусловие** | UW одобрил заявку: `client_status = approved`, `permission_state = active`; лимит `pending` → `ready`; чек-лист не завершён |
| **Статусы** | Odoo: Approved → Offer confirmation → Signing SPA & PN; лимит `pending` → `ready`; чек-лист `spa`, `pn_nafith` (D-083) |
| **Цель** | Клиент понимает, что заявка одобрена, какие два шага остались до активного лимита и как их сделать: скачать договор (SPA), подписать от руки и отправить нам в WhatsApp; подтвердить вексель в приложении Nafith. Возвращается и видит прогресс |
| **Метрика** | Доля одобренных заявок, дошедших до `limit.active` (конверсия Approved → Client Approved); время от `approved` до `active`; доля скачиваний SPA и переходов в WhatsApp из сценария подписания |
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
       с вами, чтобы подтвердить условия» — без CTA; карточка лимита показывает статус «согласуем условия»,
       сумму показываем (approved задан); блока подписей и кнопки подписания нет (D-083);
       событие screen_viewed {status: approved, limit_status: pending}

Дано:  продажи согласовали условия (мок: salesConfirmOffer()); odoo_stage = Signing SPA & PN; лимит ready;
       чек-лист: spa pending с document_url (PDF договора), pn_nafith pending (запрос в Nafith отправлен)
Когда: клиент открывает /c/documents
Тогда: карточка next_step.sign_documents (owner = user) с CTA → /c/documents/sign;
       в карточке лимита — одобренный лимит 150 000 SAR, прогресс «0 из 2» и кнопка «Подписать документы»

Когда: клиент нажимает «Подписать документы»
Тогда: экран /c/documents/sign (client.signing): заголовок, два шага в фиксированном порядке —
       1) договор SPA: «Скачать договор (PDF)» и «Отправить подписанный в WhatsApp»;
       2) вексель: инструкция «откройте приложение Nafith и подтвердите вексель от Tadum»;
       у каждого шага статус текстом; событие screen_viewed {screen_id: client.signing, done_count: 0}

Когда: клиент скачивает договор, подписывает его от руки и нажимает «Отправить подписанный в WhatsApp»
Тогда: открывается WhatsApp с готовым текстом (название компании); шаг SPA локально → in_progress
       «Проверяем вашу копию»; события spa_downloaded, spa_whatsapp_clicked

Когда: команда проверила скан (мок: externalSign('spa')); клиент возвращается на экран
Тогда: при обновлении данных шаг SPA → done; тост status.updated

Когда: клиент подтвердил вексель в Nafith (мок: externalSign('pn_nafith'))
Тогда: odoo_stage = Client Approved; лимит active; экран подписания показывает «Лимит одобрен»
       и «Вернуться к заявке»; шкала: «Подписание» done, «Лимит одобрен» current;
       событие limit_activated {amount_bucket}
```

---

## 2. Альтернативные сценарии и ошибки

| # | Условие | Что видит (ключ) | Действие | Событие |
|---|---|---|---|---|
| A1 | Лимит `pending`, `approved` не задан | Карточка лимита без суммы: `limit.pending_no_amount` | — | — |
| A2 | Запрос в Nafith не пришёл клиенту | Под инструкцией шага векселя — строка `signing.pn.not_received` и путь в поддержку | поддержка | — |
| A3 | Пункт `failed` | Нейтральный текст `checklist.item_failed` + «Написать в поддержку»; причину не показываем | поддержка | `checklist_item_failed_viewed {item}` |
| A4 | SPA отправлен в WhatsApp, но команда не подтвердила за 24 часа | Шаг остаётся «Проверяем вашу копию»; через 24 часа — мягкая строка «уже отправили? напишите нам» | поддержка | `checklist_item_stale {item, hours}` |
| A5 | Шаги выполняются не по порядку (вексель подтверждён раньше SPA) | Разрешено; порядок отображения фиксированный | — | — |
| A6 | Экран `/c/documents/sign` открыт не на этапе подписания (лимит не `ready`) | Переход на `/c/documents` без ошибки | — | — |
| A7 | Лимит стал `cancelled` на этапе подписания | Нейтральная карточка без причины и «Apply again» на лендинг; кнопки подписания нет | поддержка | `limit_cancelled_viewed` |
| A9 | Клиент открывает `/c/documents` в `approved` | Режим чтения (как SC-05), баннер `documents.approved_banner` | — | — |
| A10 | Статус сменился, пока экран открыт | Тост `status.updated` (D-034), экран перерисовывается | — | `status_changed_while_open` |

---

## 3. Состояния экранов

| Экран / блок | Состояние | Что показываем |
|---|---|---|
| `client.documents` | approved-pending-offer | Шкала (decision current), карточка лимита «менеджер свяжется»; подписей нет |
| `client.documents` | approved-ready | Карточка лимита с суммой, прогрессом «N из 2» и кнопкой «Подписать документы» |
| `client.signing` | шаг pending / in_progress / done / failed | Статус текстом и иконкой; у SPA — кнопки «Скачать» и «Отправить в WhatsApp», у векселя — инструкция |
| `client.signing` | stale (A4) | Шаг SPA «проверяем» + строка про поддержку |
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
| `signing.cta` | Sign documents | توقيع المستندات | кнопка в карточке лимита |
| `signing.progress` | {done} of 2 done | تم {done} من 2 | прогресс в карточке |
| `signing.title` | Sign documents | توقيع المستندات | заголовок экрана |
| `checklist.spa` | Agreement (SPA) | الاتفاقية (SPA) | шаг 1 |
| `signing.spa.body` | Download the agreement, print it, sign it by hand and send us a photo or scan in WhatsApp | حمّل الاتفاقية واطبعها ووقّعها بخط اليد، ثم أرسل لنا صورتها أو نسخة ممسوحة عبر واتساب | |
| `signing.spa.download` | Download agreement (PDF) | تحميل الاتفاقية (PDF) | |
| `signing.spa.send` | Send signed copy in WhatsApp | إرسال النسخة الموقّعة عبر واتساب | |
| `checklist.pn_nafith` | Promissory note (Nafith) | السند لأمر (نافذ) | шаг 2 |
| `signing.pn.body` | We've sent the note to Nafith. Open the Nafith app and approve the note from Tadum | أرسلنا السند إلى نافذ. افتح تطبيق نافذ واعتمد السند المرسل من تدوم | третьи стороны — текстом |
| `signing.pn.not_received` | Don't see the note in Nafith? Message us | لا ترى السند في نافذ؟ راسلنا | A2 |
| `checklist.status.in_progress` | Waiting for confirmation | بانتظار التأكيد | |
| `checklist.status.done` | Done | تم | |
| `checklist.status.failed` | Needs attention | يحتاج متابعة | |
| `checklist.stale_hint` | Already sent? Message us and we'll check | هل أرسلتها بالفعل؟ راسلنا وسنتحقق | A4, 24 ч |
| `checklist.item_failed` | We couldn't confirm this step. Our team will help | لم نتمكن من تأكيد هذه الخطوة. فريقنا جاهز للمساعدة | A3 |
| `signing.done` | Your limit is approved | تم اعتماد حدّك | оба шага done |
| `signing.back` | Back to application | العودة إلى الطلب | |
| `documents.approved_banner` | Your documents are accepted | تم قبول مستنداتك | A9 |

Окончательные тексты проверяет владелец текстов (`docs/i18n/needs-review.md`). Запрещённые слова не используются: нет «кредит», «заём», «финансирование», «процент», «BNPL», нет обещаний сроков.

---

## 5. События аналитики

| Событие | Когда | Свойства |
|---|---|---|
| `screen_viewed` | `client.documents` в `approved`; `client.signing` | `{ screen_id, … }`; для `client.signing` — `{ done_count }` |
| `spa_downloaded` | нажата «Скачать договор» | `{}` |
| `spa_whatsapp_clicked` | нажата «Отправить подписанный в WhatsApp» | `{}` |
| `checklist_item_completed` | пункт стал `done` (по данным) | `{ item, hours_since_ready }` |
| `checklist_item_failed_viewed` | показан `failed` | `{ item }` |
| `checklist_item_stale` | SPA «проверяем» > 24 ч | `{ item, hours }` |
| `limit_activated` | лимит стал `active` | `{ days_since_approved?, amount_bucket }` — сумма в корзинах, не точное значение |
| `limit_cancelled_viewed` | показан `cancelled` | `{}` |

`amount_bucket` вместо суммы — чтобы не отправлять финансовые данные клиента в аналитику. Текст сообщения WhatsApp и название компании в события не попадают.

---

## 6. Критерии приёмки

- [ ] На этапе «Решение» блока подписей и кнопки подписания нет; на «Подписании» в карточке лимита — кнопка «Подписать документы» и прогресс «N из 2» (D-083).
- [ ] Сценарий подписания — отдельный экран `/c/documents/sign` с крошками «Заявка › Подписание документов»; открыт не на этапе подписания — переход на `/c/documents`.
- [ ] Шаги в фиксированном порядке: SPA → вексель; выполнение не по порядку не ломает отображение.
- [ ] SPA скачивается PDF-файлом; «Отправить в WhatsApp» открывает `wa.me` с готовым текстом; после нажатия шаг показывает «Проверяем вашу копию».
- [ ] Шаг векселя — инструкция текстом, без ссылок и логотипов Nafith.
- [ ] Статусы шагов приходят из данных; локальная отметка «отправлено» не считается подтверждением (D-035).
- [ ] `failed` и `cancelled` — нейтральные тексты без причин, с путём в поддержку.
- [ ] Сумма — через `formatMoney` (D-006): «SAR 150,000» в EN, «150,000 ر.س» в AR, западные цифры.
- [ ] Когда оба шага `done`, экран и «Заявка» переключаются на «Лимит одобрен» без перезагрузки.
- [ ] Тексты в `ar` и `en`; axe без нарушений; статусы шагов доступны тексту, не только иконкой.
- [ ] Storybook: карточка лимита pending / ready / cancelled; шаги подписания × статусы × stale × AR/EN × light/dark.
- [ ] Playwright: `client_approved_unsigned` → «Подписать документы» → подтверждение двух шагов на демо-странице `/demo/sign` → лимит `active`; A6, A7.

---

## 7. Заметки для реализации

- Локальная отметка «SPA отправлен в WhatsApp» хранится в `sessionStorage` с меткой времени — для A4 и для UI сразу после нажатия.
- `document_url` может быть подписанной ссылкой — не логировать и не отправлять в аналитику.
- В демо витрины у каждого шага есть ссылка на демо-страницу `/demo/sign?item=…`, которая имитирует подтверждение командой или Nafith.

## 8. Открытые вопросы

Решено (Кирилл, 2026-11-04): SC6-1 — статусы пунктов чек-листа обновляются опросом по интервалу и при возврате на вкладку; статус берётся только из данных, локальный `in_progress` подтверждением не считается (D-035). SC6-2 — срок, согласованный с продажами, в MVP клиенту не показываем; поле `term_months` убрано из сущности `Limit` до фазы 2 (D-036).

Открытых вопросов по сценарию нет.

## 9. Бенчмарки

Чек-листы активации с внешними шагами (Mobbin: fintech onboarding, e-sign handoff) — сессия 8.
