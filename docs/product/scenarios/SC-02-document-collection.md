<!-- source: Drive 1bHiZEuDuVDpXqeW7ZeKjAYXS8Fem_I4s, synced: 2026-11-05. Не редактировать — источник в Drive. -->
# SC-02 · Сбор документов

| Поле | Значение |
|---|---|
| **ID** | `SC-02` |
| **Роли** | `client_contact`, `client_owner` (поставщик — тот же механизм, см. `SP-03`) |
| **Экраны** | `client.home` (`/c/home`), `client.documents` (`/c/documents`), `client.document` (`/c/documents/:portalKey`) |
| **Предусловие** | `client_status = docs_required`, `permission_state = collecting`, текущий `DocumentSet.status = draft`, `round = 1` |
| **Статусы** | Odoo: New lead / Processing lead / Document collection |
| **Цель** | Клиент за один заход понимает, какие документы нужны, загружает их с подсказками и отправляет комплект на проверку |
| **Метрика** | Главная: Doc collection → Assessed. Промежуточные: доля комплектов, собранных за 12 часов; среднее число загрузок на документ; доля файлов, отклонённых предвалидацией |
| **Версия прототипа** | v2 |
| **Персоны мока** | `client_new`, `client_partial` |
| **Связанные документы** | `01-roles.md` §4, `01-entities.md` §2.4–2.6, §3, `01-statuses.md` §4–5, §9 |
| **Статус** | черновик — живой каркас (вопросы закрыты) |

---

## 1. Основной сценарий

```
Дано:  клиент вошёл, client_status = docs_required, комплект round 1 в draft, все документы pending
Когда: открывается /c/home
Тогда: шкала прогресса: «Документы» current; карточка следующего шага next_step.upload_documents {count: N}
       с CTA → /c/documents; событие screen_viewed {screen_id: client.home}

Дано:  экран /c/documents
Тогда: список документов комплекта в порядке каталога (все pending → порядок каталога), у каждого:
       название, короткая подсказка, статус-бейдж, кнопка «Загрузить»; сверху прогресс «Загружено 0 из N»;
       внизу кнопка «Отправить на проверку» задизейблена с подписью documents.submit_hint_remaining {count}

Дано:  клиент открыл карточку документа /c/documents/bs
Тогда: заголовок, подсказка «что это и где взять», пример PDF (кнопка «Посмотреть пример»),
       видео на арабском (если есть), зона загрузки «PDF, JPG, PNG до 10 МБ»

Когда: клиент выбирает файл (камера / галерея / файлы)
Тогда: состояние uploading с процентом; затем validating (предвалидация); при passed/warning —
       документ → received, файл в списке с именем, размером, кнопками «Заменить» и «Удалить»;
       событие document_upload_succeeded {portal_key, prevalidation: passed|warning}

Когда: клиент возвращается к списку
Тогда: прогресс «Загружено 1 из N», документ с бейджем received перемещается ниже pending

Дано:  все required документы в received
Тогда: кнопка «Отправить на проверку» активна; next_step на home меняется на next_step.submit_ready

Когда: клиент нажимает «Отправить на проверку» (одна кнопка, без диалога подтверждения — D-029;
       кнопка активна только после валидации комплекта)
Тогда: DocumentSet → submitted, locked = true; все действия загрузки скрыты; экран документов
       показывает баннер documents.submitted_banner; через задержку мока client_status → under_review;
       редирект на /c/home, где шкала: «Документы» done, «Проверка» current (→ SC-05);
       событие document_set_submitted {documents_count, duration_from_first_upload}
```

Автополнота (правило из `01-statuses.md` §4): если клиент загрузил все обязательные документы и не нажал «Отправить» в течение 10 минут после последней загрузки, комплект переходит в `submitted` сам; клиент при следующем открытии видит баннер `documents.auto_submitted_banner`. В демо-режиме грейс 10 секунд.

---

## 2. Альтернативные сценарии и ошибки

| # | Условие | Что видит (ключ) | Действие | Событие |
|---|---|---|---|---|
| A1 | Файл > 10 МБ | `upload.error.too_large {max}` в зоне загрузки, файл не отправляется | выбрать другой | `document_upload_failed {portal_key, reason: too_large}` |
| A2 | Неподдерживаемый тип (не PDF/JPG/PNG) | `upload.error.unsupported_type` | выбрать другой | `document_upload_failed {reason: unsupported_type}` |
| A3 | Предвалидация `failed` (например, выписка не за нужный период) | Документ остаётся `pending`; карточка показывает `prevalidation.failed.title` + текст правила `prevalidation.<rule_key>`; кнопка «Загрузить другой файл» | загрузить другой | `document_prevalidation_failed {portal_key, rule_key}` |
| A4 | Предвалидация `warning` | Документ → `received`, но с предупреждением `prevalidation.warning.title` + правило; можно заменить или оставить | опционально заменить | `document_upload_succeeded {prevalidation: warning}` |
| A5 | Обрыв сети во время загрузки | Файл в состоянии `failed` с `upload.error.network` и кнопкой «Повторить»; прогресс сохранён визуально | повторить | `document_upload_failed {reason: network}` |
| A6 | Ошибка сервера при загрузке | `upload.error.server` + «Повторить» + SupportBar | повторить | `document_upload_failed {reason: server_error}` |
| A7 | Клиент удаляет загруженный файл | Диалог подтверждения `document.delete_confirm`; документ → `pending`; прогресс уменьшается | — | `document_file_deleted {portal_key}` |
| A8 | Клиент заменяет файл | Новый файл проходит тот же путь; старый удаляется после успеха нового | — | `document_upload_succeeded {replace: true}` |
| A9 | Несколько файлов на один документ (например, выписка из двух частей) | Лимита на число файлов нет (D-028); список файлов в карточке; ограничение только по размеру каждого файла (10 МБ) | — | `document_upload_succeeded {file_index}` |
| A10 | Документ без примера и видео (`aoa`, D-026) | Карточка без блока «Пример» и «Видео»; только подсказка-текст | — | — |
| A11 | Английский интерфейс, видео только AR (D-026) | Блок видео с пометкой `document.video_arabic_only` | — | `document_video_opened {lang_ui: en, lang_video: ar}` |
| A12 | Клиент пытается загрузить, когда комплект уже `submitted` (вторая вкладка) | Действия скрыты; тост `documents.locked_toast` | — | — |
| A13 | Комплект не содержит обязательных документов (Odoo ещё не сформировал список) | Пустое состояние `documents.empty_waiting` + SupportBar | — | — |
| A14 | Клиент открывает экран офлайн | Список и статусы из кэша; загрузка и отправка задизейблены с подсказкой `common.offline_actions_disabled` | — | — |
| A16 | `required = false` документ не загружен | Не блокирует отправку; бейдж `document.optional` | — | — |

---

## 3. Состояния экранов

| Экран | Состояние | Что показываем |
|---|---|---|
| `client.documents` | loading | Скелетон списка из 4–6 карточек |
| `client.documents` | empty (A13) | Иллюстрация-плейсхолдер отсутствует, только текст и поддержка |
| `client.documents` | normal / partial | Список, прогресс, кнопка отправки (disabled / enabled) |
| `client.documents` | submitted / locked | Баннер, список только для чтения, кнопок загрузки нет |
| `client.documents` | error | «Не удалось загрузить список» + «Повторить» |
| `client.document` | normal | Подсказка, пример, видео, зона загрузки, список файлов |
| `client.document` | uploading | Прогресс-бар с процентом, кнопка «Отмена» |
| `client.document` | validating | Индикатор «Проверяем файл» |
| `client.document` | received | Файл(ы), «Заменить», «Удалить» |
| `client.document` | warning | Как received + жёлтое предупреждение |
| `client.document` | failed (A1–A3, A5, A6) | Текст ошибки, «Повторить» или «Выбрать другой файл» |
| `client.document` | no-assets (A10) | Без блоков примера/видео |
| `client.document` | locked | Только просмотр файлов, кнопка «Скачать» |
| все | длинный арабский текст | Названия документов и подсказки переносятся, не обрезаются; длинные имена файлов обрезаются посередине |
| все | RTL / LTR, light / dark | Иконки загрузки/галочки не зеркалятся; стрелки «назад» зеркалятся |

---

## 4. Тексты интерфейса (AR / EN) — предложение

| Ключ | EN | AR | Примечание |
|---|---|---|---|
| `documents.title` | Your documents | مستنداتك | |
| `documents.progress` | {uploaded} of {total} uploaded | تم رفع {uploaded} من {total} | |
| `documents.submit` | Send for review | إرسال للمراجعة | |
| `documents.submit_hint_remaining` | {count} documents left to upload | تبقّى {count} مستندات للرفع | формы множ. числа |
| `documents.submit_note` | After sending, files can't be changed until the review is done | بعد الإرسال لا يمكن تعديل الملفات حتى انتهاء المراجعة | подпись под кнопкой вместо диалога (D-029) |
| `documents.submitted_banner` | Thank you. Your documents are with our team | شكرًا لك. مستنداتك الآن لدى فريقنا | без сроков |
| `documents.auto_submitted_banner` | Your documents were sent for review automatically | تم إرسال مستنداتك للمراجعة تلقائيًا | |
| `documents.locked_toast` | Documents are under review and can't be changed right now | المستندات قيد المراجعة ولا يمكن تعديلها حاليًا | |
| `documents.empty_waiting` | We're preparing your document list. It will appear here shortly | نُجهّز قائمة مستنداتك وستظهر هنا قريبًا | «shortly» без конкретного срока — проверить TOV |
| `document.status.pending` | Needed | مطلوب | бейдж |
| `document.status.received` | Uploaded | تم الرفع | |
| `document.status.rejected` | Needs a new file | يحتاج ملفًا جديدًا | |
| `document.status.approved` | Accepted | مقبول | |
| `document.optional` | Optional | اختياري | |
| `document.upload` | Upload | رفع الملف | |
| `document.replace` | Replace | استبدال | |
| `document.delete` | Delete | حذف | |
| `document.download` | Download | تنزيل | |
| `document.delete_confirm` | Delete this file? | هل تريد حذف هذا الملف؟ | |
| `document.view_example` | See an example | عرض مثال | |
| `document.watch_video` | How to get this document (video) | كيف تحصل على هذا المستند (فيديو) | |
| `document.video_arabic_only` | Video is in Arabic | الفيديو باللغة العربية | в EN-интерфейсе |
| `document.dropzone` | PDF, JPG or PNG, up to 10 MB | PDF أو JPG أو PNG بحجم حتى 10 ميجابايت | |
| `document.uploading` | Uploading… {percent}% | جارٍ الرفع… {percent}% | |
| `document.validating` | Checking the file… | نتحقق من الملف… | |
| `upload.error.too_large` | The file is larger than {max} MB | حجم الملف أكبر من {max} ميجابايت | |
| `upload.error.unsupported_type` | Use PDF, JPG or PNG | استخدم ملفًا بصيغة PDF أو JPG أو PNG | |
| `upload.error.network` | Upload interrupted. Check your connection and try again | انقطع الرفع. تحقق من الاتصال وحاول مجددًا | |
| `upload.error.server` | We couldn't save the file. Please try again | لم نتمكن من حفظ الملف. يرجى المحاولة مرة أخرى | |
| `prevalidation.failed.title` | This file doesn't match what we need | هذا الملف لا يطابق المطلوب | |
| `prevalidation.warning.title` | Please double-check this file | يرجى التحقق من هذا الملف | |
| `prevalidation.bs.period_too_short` | The statement should cover the last 6 months | يجب أن تغطي كشف الحساب آخر 6 أشهر | пример правила; полный список правил — из upload-портала |
| `prevalidation.bs.not_a_statement` | This doesn't look like a bank statement | لا يبدو هذا كشف حساب بنكي | |
| `prevalidation.national_id.expired` | This ID appears to be expired | يبدو أن الهوية منتهية الصلاحية | |
| `document.bs.title` | Bank statement | كشف الحساب البنكي | названия документов — по каталогу |
| `document.bs.hint` | Last 6 months, from your company's main account, as a PDF from the bank app | آخر 6 أشهر من الحساب الرئيسي للشركة، بصيغة PDF من تطبيق البنك | |
| `document.national_id.title` | Owner's national ID | هوية المالك الوطنية | |
| `document.vat.title` | VAT certificate | شهادة ضريبة القيمة المضافة | |
| `document.vat_sales.title` | VAT returns | إقرارات ضريبة القيمة المضافة | |
| `document.ch_owner.title` | Owner's credit report (Molim) | التقرير الائتماني للمالك (مُلِم) | третьи стороны — текстом |
| `document.ch_company.title` | Company credit report (SIMAH) | التقرير الائتماني للشركة (سمة) | |
| `document.aoa.title` | Articles of association | عقد التأسيس | |
| `next_step.upload_documents` | Upload {count} documents to continue | ارفع {count} مستندات للمتابعة | на home |
| `next_step.submit_ready` | Everything is uploaded. Send the documents for review | تم رفع كل المستندات. أرسلها للمراجعة | |
| `common.offline_actions_disabled` | You're offline. Uploads will be available when you're back online | أنت غير متصل. سيتوفر الرفع عند عودة الاتصال | |

Подсказки `document.<key>.hint` для остальных документов переносятся с текущего upload-портала без изменений (требование) — заполнить при доступе к его текстам.

---

## 5. События аналитики

| Событие | Когда | Свойства |
|---|---|---|
| `screen_viewed` | открытие `client.documents` / `client.document` | `{ screen_id, portal_key? }` |
| `document_upload_started` | файл выбран и отправка началась | `{ portal_key, size_kb, mime, source: 'camera' \| 'gallery' \| 'files' \| 'unknown' }` |
| `document_upload_succeeded` | файл сохранён, документ `received` | `{ portal_key, prevalidation: 'passed' \| 'warning', replace, file_index, duration_ms }` |
| `document_upload_failed` | любая ошибка загрузки | `{ portal_key, reason: 'too_large' \| 'unsupported_type' \| 'network' \| 'server_error' \| 'cancelled' }` |
| `document_prevalidation_failed` | предвалидация `failed` | `{ portal_key, rule_key }` |
| `document_file_deleted` | файл удалён | `{ portal_key }` |
| `document_example_opened` / `document_video_opened` | открыт пример / видео | `{ portal_key, lang_ui, lang_video? }` |
| `document_set_submitted` | комплект отправлен (вручную или авто) | `{ documents_count, auto: boolean, duration_from_first_upload_min }` |

---

## 6. Критерии приёмки

- [ ] Список документов строится из `DocumentSet`, а не из каталога: добавление нового `portal_key` в фикстуру отображается без правок UI.
- [ ] Загрузка работает с камеры, из галереи и из файлов на iOS Safari и Android Chrome, включая встроенный браузер WhatsApp; прогресс виден для файлов от 1 МБ.
- [ ] Файл > 10 МБ и неподдерживаемый тип отклоняются до отправки, с понятным текстом.
- [ ] Предвалидация `failed` не переводит документ в `received`; `warning` переводит, но показывает предупреждение.
- [ ] Кнопка «Отправить на проверку» активна только когда все `required` в `received`/`approved` и нет `rejected`; необязательные документы не блокируют; отправка — одним нажатием, без диалога подтверждения, с подписью `documents.submit_note` под кнопкой (D-029).
- [ ] После отправки комплект заблокирован мгновенно во всех вкладках; попытка загрузить даёт тост, а не ошибку сервера.
- [ ] Автополнота срабатывает через грейс и показывает отдельный баннер.
- [ ] Документы без ассетов (`aoa`) и английский интерфейс с арабским видео (D-026) отображаются корректно.
- [ ] Все тексты раздела 4 в `ar` и `en`; формы множественного числа для `{count}` заданы.
- [ ] axe без нарушений; зона загрузки доступна с клавиатуры; прогресс и смена статуса объявляются через `aria-live`.
- [ ] Storybook: `DocumentCard` во всех статусах × AR/EN × light/dark; `UploadDropzone` в idle/uploading/validating/failed; `client.documents` в empty/partial/complete/locked.
- [ ] Playwright: счастливый путь (загрузка 3 документов → отправка → `under_review`), A1, A3, A5, A7, A12, автополнота — в `android-chrome` и `iphone-safari`.

---

## 7. Заметки для реализации

- Предвалидация в моке — имитация по имени файла (`*_fail.pdf` → `failed`, `*_warn.pdf` → `warning`), чтобы тесты были детерминированными; реальные правила придут с бэкендом.
- Хэш файла считается на клиенте (`crypto.subtle.digest`) для проверки повторной загрузки отклонённого файла (нужно в SC-03).
- Прямые ссылки на пример PDF и видео — из `Assets/` Drive через стабильные URL в `DocumentType`; в проде заменятся на CDN.
- Загрузка нескольких файлов в один документ — последовательно, не параллельно (стабильнее в WhatsApp-браузере).

## 8. Открытые вопросы

Решено (Кирилл, 2026-11-04): SC2-1 — правила предвалидации: три примера выше, остальные добавим при доступе к upload-порталу (не блокирует). SC2-2 — лимита на число файлов в одном документе нет (D-028). SC2-3 — отправка одной кнопкой после валидации комплекта, без диалога подтверждения (D-029).

Открытых вопросов по сценарию нет.

## 9. Бенчмарки

Паттерны загрузки документов и чек-листов онбординга (Mobbin: fintech KYC, MENA) — в сессии 8.
