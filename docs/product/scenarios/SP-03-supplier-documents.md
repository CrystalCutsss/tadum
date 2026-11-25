<!-- source: Drive 1xS0gpWP0-JPbwlB-e8tWjkJt0ckDZnho, synced: 2026-11-25. Не редактировать — источник в Drive. -->
# SP-03 · Документы поставщика

| Поле | Значение |
|---|---|
| **ID** | `SP-03` |
| **Роли** | `supplier`, `dual` |
| **Экраны** | `supplier.documents` (`/s/documents`), `supplier.document` (`/s/documents/:portalKey`), `supplier.home` (шкала и карточка следующего шага) |
| **Предусловие** | Поставщик в кабинете; у него есть текущий комплект документов (`DocumentSet` с `owner.kind = supplier`), состав которого задаёт Odoo |
| **Статусы** | `supplier_status`: `docs_required` → `under_review` → `active`; документы `pending / received / rejected / approved`; комплект `draft / submitted / in_review / completed` |
| **Цель** | Поставщик загружает документы по тем же правилам, что клиент, видит статус каждого и причину отклонения, и понимает, когда его аккаунт станет активным |
| **Метрика** | Доля поставщиков, отправивших комплект в первые 7 дней после первого входа; доля комплектов, принятых с первого раза (без `rejected`) |
| **Версия прототипа** | v3 |
| **Персоны мока** | `supplier_new` (комплект `draft`: `sup_vat`, `sup_iban_letter`, `sup_national_address` обязательные, `sup_cr` необязательный); вариант с `rejected` после проверки; `supplier_active` (всё `approved`, режим чтения) |
| **Связанные документы** | `SC-02` (загрузка и отправка — правила наследуются целиком), `SC-03` (отклонённый документ), `01-roles.md` §5, `01-entities.md` §2.5–2.6, §3 (ключи `sup_*`, D-026), `01-statuses.md` §3–5 (D-029) |
| **Статус** | черновик — живой каркас |

---

## 1. Основной сценарий

```
Дано:  supplier_status = docs_required; комплект draft: sup_vat, sup_iban_letter, sup_national_address (required);
       у всех документов поставщика нет примера и видео (D-026); над документами — блок «About your business»:
       CR (10 цифр, D-093), email, отрасль, город — по два в ряд, каждое поле проверяется, все обязательны для
       отправки; в панели отправки блок — один сегмент (D-096)
Когда: поставщик открывает /s/documents (с главной по CTA или из навигации)
Тогда: список документов как в SC-02: обязательные сверху, необязательные ниже с пометкой; прогресс
       «загружено X из Y» по обязательным; кнопка «Отправить на проверку» неактивна, подпись — сколько осталось;
       событие screen_viewed {screen_id: supplier.documents, uploaded, total}

Когда: открывает документ sup_iban_letter
Тогда: карточка документа: название, подсказка текстом (без кнопок «пример» и «видео» — их нет), зона загрузки
       PDF/JPG/PNG до 10 МБ, список загруженных файлов; поведение загрузки — SC-02 §1 без изменений

Когда: все обязательные документы в статусе received
Тогда: кнопка «Отправить на проверку» активна; под ней — подпись о блокировке после отправки (D-029)

Когда: нажимает «Отправить на проверку»
Тогда: комплект submitted → locked; supplier_status = under_review; баннер «Спасибо, документы у нашей команды»;
       действия с файлами скрыты; на /s/home шкала: «Документы» done, «Проверка» current;
       событие document_set_submitted {owner: supplier, documents_count, optional_uploaded}

Дано:  проверка завершена, все обязательные approved (мок: uwApproveSupplierSet()); odoo_stage = Processing: Need Contract
Когда: поставщик открывает /s/documents
Тогда: supplier_status = contract_pending; шкала: «Документы» done, «Проверка» current; карточка «Документы приняты.
       Остался договор — менеджер свяжется» (owner = tadum), без CTA; документы только для чтения; ссылки нет (D-087, D-090)

Дано:  договор и данные получены (мок: salesSupplierContractDone()); odoo_stage = Interested
Когда: поставщик открывает /s/documents
Тогда: supplier_status = partner; шкала остаётся: «Партнёр» current с текстом «Active»; карточка «Вы партнёр Tadum» (D-089):
       ссылка (LTR) с копированием (подтверждение — тостом), серые кнопки «Поделиться в WhatsApp» и «QR-код» (выдвижная
       панель, скачивание) — на телефоне друг под другом, на компьютере по ширине текста; «Как это работает» в 3 шага —
       отдельным блоком; кнопки «Документы» нет; тост о смене статуса (D-034, D-092)

Дано:  через поставщика прошла первая сделка (мок: odooSupplierActivated()); odoo_stage = Activated
Тогда: supplier_status = active; экран тот же, что при partner

Дано:  odoo_stage = Declined (мок: odooSupplierDecline())
Тогда: supplier_status = declined; шкала: «Партнёр» — «Не активен» (серый крестик); нейтральная карточка без причины и
       «Связаться с нами», как отменённый лимит у клиента (D-092); документов и ссылки нет

Дано:  odoo_stage = Lost (мок: odooSupplierLost()); возврат — Return to Processing (мок: returnToProcessing())
Тогда: supplier_status = paused; шкала — как при declined; карточка «Работа приостановлена» с текстом «We are not
       prepared to continue the partnership at this time», без «Связаться с нами» (D-094); документов и ссылки нет
```

Все правила загрузки, валидации, замены и удаления файлов, автоотправки и блокировки — из `SC-02`; здесь описаны только отличия поставщика.

---

## 2. Альтернативные сценарии и ошибки

| # | Условие | Что видит (ключ) | Действие | Событие |
|---|---|---|---|---|
| A1 | После проверки часть документов `rejected` (мок: `uwRejectSupplierDocument(key, reason)`) | Комплект возвращается в `draft` (unlocked) **только для отклонённых и `pending` документов**; `approved` — только чтение; `supplier_status = docs_required`; отклонённый документ поднят наверх с причиной (тег UW, как в SC-03); на главной — карточка `next_step.supplier.reupload_rejected {count}` | заменить файл и отправить снова | `document_rejected_viewed {portal_key, reason}` |
| A2 | Odoo добавил в комплект новый обязательный документ (например, `sup_cr` стал `required`) | Документ появляется как `pending` обязательный; если комплект был `completed` — создаётся новый `draft` только с ним (аналог D-031), `supplier_status = docs_required`; предыдущие — в истории только для чтения | загрузить и отправить | `document_added_by_odoo {portal_key}` |
| A3 | Документ без примера и видео (все `sup_*`, D-026) | На карточке только текстовая подсказка `document.<key>.hint`; кнопок «Посмотреть пример» / «Видео» нет; пустого места под них нет | — | — |
| A4 | Поставщик пытается загрузить файл при `locked` (гонка с проверкой) | Тост `documents.locked_toast`; действия скрыты после обновления данных | — | — |
| A5 | Блок «About your business» не заполнен или поле неверно, документы `received` | Кнопка «Отправить» показывает ошибки полей блока, фокус — в первое неверное поле (D-093, D-096) | заполнить блок и отправить | — |
| A6 | `supplier_status = active`, поставщик открывает `/s/documents` | Режим чтения, баннер `documents.supplier_approved_banner`; скачивание своих файлов доступно | — | — |
| A7 | Отклонено несколько документов, часть уже заменена | Прогресс считает заменённые как `received`; кнопка активна, когда `rejected` не осталось | — | — |
| A8 | Офлайн во время загрузки | Как SC-02: ошибка загрузки с «Повторить», очередь не теряется | повторить | `document_upload_failed {reason: offline}` |
| A9 | `dual`: тот же пользователь — клиент с документами | Комплекты независимы: клиентские — в `/c/documents`, поставщика — в `/s/documents`; ключи разные (`vat` ≠ `sup_vat`), файлы не переиспользуются автоматически | — | — |
| A10 | Текущий upload-портал не знал статуса `rejected` (SFL-489) | В кабинете статус `rejected` поддержан с первой версии; при подключении бэкенда контракт обязан его отдавать (зафиксировать в `05-backend-contract.md`) | — | — |

---

## 3. Состояния экранов

| Экран / блок | Состояние | Что показываем |
|---|---|---|
| `supplier.documents` | draft-empty | Все `pending`, прогресс 0 из 3, кнопка неактивна |
| `supplier.documents` | draft-partial | Часть `received`, подпись «осталось N» |
| `supplier.documents` | draft-ready | Все обязательные `received`, кнопка активна, подпись о блокировке |
| `supplier.documents` | submitted / in_review | Баннер «у команды», действия скрыты, статусы `received` |
| `supplier.documents` | rejected (A1) | Отклонённые сверху с причиной, остальные `approved` только чтение |
| `supplier.documents` | completed (A6) | Баннер «приняты», все `approved`, режим чтения |
| `supplier.documents` | empty-waiting | Комплекта ещё нет: `documents.empty_waiting` (SC-02) |
| `supplier.document` | no-assets (A3) | Подсказка текстом, зона загрузки, без медиа |
| `supplier.document` | rejected | Причина сверху, старый файл виден, кнопка «Заменить» |
| все | loading / error / offline | Как SC-02 |
| все | RTL / LTR, light / dark | Как SC-02; названия документов с латинскими аббревиатурами (VAT, IBAN, CR) — в `<bdi>` |

---

## 4. Тексты интерфейса (AR / EN) — предложение

Общие ключи `documents.*` и `document.*` — из `SC-02` и `SC-03`. Ниже — только новые.

| Ключ | EN | AR | Примечание |
|---|---|---|---|
| `documents.supplier_title` | Your documents | مستنداتك | заголовок экрана |
| `documents.supplier_intro` | We need these documents to activate your supplier account | نحتاج هذه المستندات لتفعيل حساب المورّد الخاص بك | над списком в `draft` |
| `documents.supplier_approved_banner` | Your documents are accepted. Your account is active | تم قبول مستنداتك. حسابك نشط | A6 |
| `documents.optional_skipped_hint` | Optional documents can be added later | يمكن إضافة المستندات الاختيارية لاحقًا | A5 |
| `document.sup_vat.title` | VAT certificate | شهادة ضريبة القيمة المضافة | |
| `document.sup_vat.hint` | Your company's VAT registration certificate from ZATCA, as a PDF | شهادة التسجيل في ضريبة القيمة المضافة من هيئة الزكاة والضريبة والجمارك، بصيغة PDF | |
| `document.sup_iban_letter.title` | IBAN letter | خطاب الآيبان | |
| `document.sup_iban_letter.hint` | A bank letter confirming your company's IBAN, issued within the last 3 months | خطاب من البنك يؤكد رقم الآيبان الخاص بشركتك، صادر خلال آخر 3 أشهر | срок «3 месяца» — проверить с Ops |
| `document.sup_national_address.title` | National address | العنوان الوطني | |
| `document.sup_national_address.hint` | Your company's national address certificate from Saudi Post (SPL) | شهادة العنوان الوطني لشركتك من البريد السعودي (سبل) | |
| `document.sup_cr.title` | Commercial registration (CR) | السجل التجاري | |
| `document.sup_cr.hint` | Your company's commercial registration certificate | شهادة السجل التجاري لشركتك | `required` решает Odoo |
| `document.sup_cr.why_optional` | Only needed in some cases — we'll ask if required | مطلوب في بعض الحالات فقط — سنطلبه عند الحاجة | подпись у необязательного |
| `next_step.supplier.reupload_rejected` | {count} documents need a new file | {count} مستندات تحتاج ملفًا جديدًا | см. SP-01 |

Проверка TOV: «активировать аккаунт», «приняты», «нужен новый файл» — как у клиента; нет «отказ / отклонено навсегда»; третьи стороны (ZATCA, SPL) — только текстом, без логотипов.

---

## 5. События аналитики

Те же события, что в `SC-02` / `SC-03` (`document_upload_started/succeeded/failed`, `document_replaced`, `document_set_submitted`, `document_rejected_viewed`), со свойством `owner: 'supplier'`. Дополнительно:

| Событие | Когда | Свойства |
|---|---|---|
| `screen_viewed` | открыт `/s/documents` | `{ screen_id: 'supplier.documents', uploaded, total, has_rejected }` |
| `document_added_by_odoo` | A2 | `{ portal_key }` |

Имена файлов, содержимое и причины в свободной форме не отправляем; `reason` — только код тега UW.

---

## 6. Критерии приёмки

- [ ] Экран документов поставщика собран из тех же компонентов, что клиентский (`DocumentList`, `DocumentCard`, `UploadZone`), различаются только данные (`owner.kind`, ключи `sup_*`) и тексты.
- [ ] Для `sup_*` нет кнопок примера и видео (D-026); макет карточки без пустых зон.
- [ ] `supplier_status` переключается `docs_required → under_review → active` строго по состоянию комплекта (`01-statuses.md` §3); при `rejected` после проверки возвращается в `docs_required`, редактируются только отклонённые и `pending`, `approved` — только чтение.
- [ ] Отправка одной кнопкой без диалога (D-029); без блока «About your business» — CR (10 цифр), email, отрасль, город — комплект не отправить (D-093, D-096).
- [ ] Новый обязательный документ от Odoo (A2) появляется без перезагрузки и переводит статус в `docs_required`.
- [ ] Реферальная ссылка и список клиентов появляются только при `partner` / `active` (D-087); на `supplier_new` их нет.
- [ ] Тексты в `ar` и `en`; axe без нарушений; `aria-live` для статусов загрузки — как в SC-02.
- [ ] Storybook: `SupplierDocuments` draft-empty / partial / ready / in_review / rejected / completed / no-assets × AR/EN × light/dark.
- [ ] Playwright: `supplier_new` → загрузка трёх файлов → отправка → `under_review` → демо-панель `uwRejectSupplierDocument('sup_iban_letter')` → `docs_required` с причиной → замена → отправка → `uwApproveSupplierSet()` → `active`. Обновлено (D-088): после `uwApproveSupplierSet()` → `contract_pending` без ссылки → `salesSupplierContractDone()` → `partner` с карточкой «Вы партнёр Tadum».

---

## 7. Заметки для реализации

- Порт `DocumentsPort` общий; выбор комплекта — по `owner: {kind: 'supplier', id: supplier_id}`. Мок хранит комплекты клиента и поставщика раздельно (важно для пользователя `dual`).
- Мок-действия демо-панели: `uwApproveSupplierSet()`, `uwRejectSupplierDocument(portal_key, reason_tag)`, `odooRequireDocument('sup_cr')` — добавить в `01-statuses.md` §10 при следующей правке.
- Вычисление `supplier_status` — чистая функция `deriveSupplierStatus(documentSet)` в `entities/supplier/model`; покрыть unit-тестами на всех переходах, включая A1 и A2.
- Подсказки `document.sup_*.hint` — предложение; точные формулировки (сроки, источники) согласует Ops.

## 8. Открытые вопросы

Решено (Кирилл, 2026-11-04):

- **SP3-1** — при отклонении части документов после проверки редактируются только отклонённые и `pending`; `approved` остаются принятыми и повторно не загружаются (D-047).
- **SP3-2** — отдельного «дозапроса» (раунда) у поставщика нет; новые документы появляются как изменение состава комплекта из Odoo (`required`), см. A2 (D-048).

Открытых вопросов по сценарию нет.

## 9. Бенчмарки

Онбординг мерчанта с загрузкой документов и статусами (Mobbin: merchant onboarding, KYB, Tabby/Tamara/Stripe merchant apps) — сессия 8.
