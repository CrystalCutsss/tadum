<!-- source: Drive 1yiEiKa7CuOaKOBoZnrChKo0hHPOrVu9b, synced: 2026-11-05. Не редактировать — источник в Drive. -->
# SC-03 · Документ отклонён

| Поле | Значение |
|---|---|
| **ID** | `SC-03` |
| **Роли** | `client_contact`, `client_owner` (поставщик — те же правила, `SP-03`) |
| **Экраны** | `client.home`, `client.documents`, `client.document` |
| **Предусловие** | UW отклонил один или несколько документов с тегом причины; комплект снова редактируемый (`DocumentSet.status = draft`, `client_status = docs_required`) |
| **Статусы** | Документ `rejected`; остальные `received` / `approved` / `pending` |
| **Цель** | Клиент сразу видит, что именно и почему не подошло, и за одно действие загружает корректный файл |
| **Метрика** | Главная: Doc collection → Assessed. Промежуточная: доля отклонённых документов, перезагруженных в течение 24 часов; среднее число перезагрузок до `approved` |
| **Версия прототипа** | v2 |
| **Персоны мока** | `client_rejected` (три отклонённых документа: с причиной AR+EN, с причиной только AR, без причины; один файл уже отклонялся) |
| **Связанные документы** | `01-roles.md` §6 (что не показываем), `01-entities.md` §2.5, `01-statuses.md` §5 |
| **Бриф-пример** | «Документ отклонён» из исходных требований (цель, состояния, приёмка — перенесены сюда) |
| **Статус** | черновик — живой каркас (вопросы закрыты) |

---

## 1. Основной сценарий

```
Дано:  client_status = docs_required; в комплекте документ bs со статусом rejected,
       reject_reason_text = { ar: "...", en: "..." }; остальные документы received
Когда: клиент открывает /c/home
Тогда: шкала: «Документы» current (round 1) или needs_attention (round > 1, см. SC-04);
       карточка next_step.reupload_rejected {count: 1} с CTA → /c/documents;
       событие screen_viewed

Когда: клиент открывает /c/documents
Тогда: отклонённый документ — первым в списке, с бейджем rejected и причиной под названием;
       действие «Загрузить заново» прямо в строке списка; остальные документы ниже

Когда: клиент открывает карточку /c/documents/bs
Тогда: блок «Почему не подошло» с текстом причины на языке интерфейса; ниже — подсказка, пример,
       видео (как в SC-02); отклонённый файл виден в списке с пометкой rejected и кнопкой «Скачать»

Когда: клиент загружает новый файл (путь SC-02: uploading → validating)
Тогда: предвалидация passed/warning → документ → received; блок причины скрывается;
       бейдж меняется на received; событие rejected_document_reuploaded {portal_key, attempt}

Когда: клиент возвращается к списку
Тогда: документ занимает место среди received; если rejected не осталось и все required
       в received — кнопка «Отправить на проверку» активна (далее SC-02 шаг отправки)
```

---

## 2. Альтернативные сценарии и ошибки

| # | Условие | Что видит (ключ) | Действие | Событие |
|---|---|---|---|---|
| A1 | Причины нет (`reject_reason_key` и `reject_reason_text` пусты) | Нейтральный текст `document.rejected.generic`; ничего не выдумываем | загрузить заново | `rejected_document_viewed {has_reason: false}` |
| A2 | Причина есть только на арабском, интерфейс английский | В EN показываем `document.rejected.generic`, арабский текст не подставляем (требование) | — | `rejected_document_viewed {has_reason: true, reason_lang_missing: en}` |
| A3 | Клиент загружает тот же файл, который уже отклоняли (хэш совпадает с `rejected_file_hashes`, TADUM-536) | Файл не принимается: `document.same_file_rejected`; документ остаётся `rejected` | выбрать другой файл | `document_upload_failed {reason: same_file_rejected}` |
| A4 | Новый файл не проходит предвалидацию | Как SC-02 A3; документ остаётся `rejected`, причина UW остаётся видимой | — | `document_prevalidation_failed` |
| A5 | Несколько отклонённых документов | Все наверху, в порядке каталога; `next_step.reupload_rejected {count: N}`; на `home` сводка «N документов нужно загрузить заново» | — | — |
| A6 | Отклонён документ, а комплект уже `submitted` повторно (гонка) | Действия скрыты, тост `documents.locked_toast` | — | — |
| A7 | Клиент скачивает отклонённый файл | Прямая ссылка с `Content-Disposition` (WhatsApp IAB) | — | `document_file_downloaded {portal_key, status: rejected}` |
| A8 | Причина содержит ссылку или упоминание третьей стороны | Рендерим как текст, без логотипов и без кликабельных ссылок | — | — |
| A9 | Клиент открыл карточку по диплинку из WhatsApp-уведомления `/c/documents/bs` | После входа — сразу карточка; причина видна без прокрутки | — | `screen_viewed {source: whatsapp_link}` |

---

## 3. Состояния экранов

| Экран | Состояние | Что показываем |
|---|---|---|
| `client.documents` | has-rejected | Отклонённые первыми, красный бейдж, причина в одну-две строки (обрезка с «ещё»), кнопка в строке |
| `client.documents` | rejected-generic | То же, но текст причины нейтральный |
| `client.document` | rejected-with-reason | Блок причины (заголовок + текст + относительная дата отклонения, D-030), старый файл с пометкой, зона загрузки |
| `client.document` | rejected-generic | Блок причины с нейтральным текстом |
| `client.document` | rejected-ar-only (EN UI) | Как generic |
| `client.document` | same-file-error (A3) | Ошибка в зоне загрузки, документ остаётся `rejected` |
| `client.document` | reuploaded | Причина скрыта, бейдж `received`, новый файл в списке |
| `client.home` | has-rejected | Карточка следующего шага с акцентом статуса `rejected` (не «ошибка системы») |
| все | длинный арабский текст причины | До 3 строк в списке с раскрытием, полностью — в карточке |
| все | RTL / LTR, light / dark | Цвет `rejected` проверен на контраст в обеих темах |

---

## 4. Тексты интерфейса (AR / EN) — предложение

| Ключ | EN | AR | Примечание |
|---|---|---|---|
| `document.rejected.title` | Why this file didn't work | لماذا لم يُقبل هذا الملف | заголовок блока причины |
| `document.rejected.generic` | This file couldn't be accepted. Please upload a new one following the hint below | لم يُقبل هذا الملف. يرجى رفع ملف جديد وفق الإرشادات أدناه | без выдуманной причины |
| `document.rejected.badge` | Needs a new file | يحتاج ملفًا جديدًا | = `document.status.rejected` |
| `document.reupload` | Upload a new file | رفع ملف جديد | действие |
| `document.rejected.old_file` | Previous file (not accepted) | الملف السابق (غير مقبول) | подпись к старому файлу |
| `document.same_file_rejected` | This is the same file that wasn't accepted. Please choose a different one | هذا هو الملف نفسه الذي لم يُقبل. يرجى اختيار ملف آخر | TADUM-536 |
| `document.rejected.more` | Show more | عرض المزيد | раскрытие длинной причины |
| `document.rejected.when` | Not accepted {relative_time} | لم يُقبل {relative_time} | относительная дата (D-030): «3 days ago» / «منذ 3 أيام»; через `shared/i18n/format.ts` |
| `next_step.reupload_rejected` | {count} documents need a new file | {count} مستندات تحتاج ملفًا جديدًا | формы множ. числа; при 1 — «One document needs a new file» / «مستند واحد يحتاج ملفًا جديدًا» |
| `documents.rejected_summary` | {count} to re-upload | {count} للرفع مجددًا | счётчик в списке |
| `reject_reason.<tag_key>` | *(текст согласованного клиентского тега UW)* | *(текст тега)* | Ключи и тексты — из Odoo (UW tags); в моке 3–4 примера ниже |
| `reject_reason.bs_period_short` | The statement covers less than 6 months | كشف الحساب يغطي أقل من 6 أشهر | пример тега |
| `reject_reason.unreadable` | The file is blurry or cut off | الملف غير واضح أو مقصوص | пример тега |
| `reject_reason.wrong_document` | This is a different document than requested | هذا مستند مختلف عن المطلوب | пример тега |
| `reject_reason.name_mismatch` | The name on the document doesn't match the application | الاسم في المستند لا يطابق الطلب | пример тега |

Правило: тексты причин — **только** из согласованных тегов (`reject_reason.*` или `reject_reason_text` с бэкенда). Свободный текст заметки UW в портал не попадает.

---

## 5. События аналитики

| Событие | Когда | Свойства |
|---|---|---|
| `rejected_document_viewed` | открыта карточка документа в статусе `rejected` | `{ portal_key, has_reason, reason_key?, reason_lang_missing?: 'en', source }` |
| `rejected_document_reuploaded` | новый файл принят (`rejected → received`) | `{ portal_key, attempt, reason_key?, hours_since_rejection }` |
| `document_upload_failed` | в т.ч. `same_file_rejected` | `{ portal_key, reason }` |
| `document_file_downloaded` | скачан старый файл | `{ portal_key, status }` |
| остальные | как в SC-02 | |

---

## 6. Критерии приёмки

- [ ] Отклонённые документы всегда первые в списке и первые по порядку фокуса; на `home` карточка следующего шага ведёт к ним.
- [ ] Причина показывается только из согласованного текста тега; при его отсутствии — нейтральный текст; при отсутствии английского перевода в EN — нейтральный текст, арабский не подставляется.
- [ ] После успешной загрузки нового файла старая причина скрывается, бейдж становится `received`, старый файл остаётся доступным для скачивания с пометкой.
- [ ] Повторная загрузка того же файла (по хэшу) отклоняется с понятным текстом; документ остаётся `rejected`.
- [ ] Предвалидация работает как в SC-02; `failed` не снимает статус `rejected`.
- [ ] Персона `client_rejected` покрывает все три случая причины (AR+EN, только AR, без причины) и случай повторного файла.
- [ ] Тексты в `ar` и `en`; множественное число для `{count}`.
- [ ] axe без нарушений; причина связана с документом через `aria-describedby`; статус объявляется в `aria-live` после перезагрузки.
- [ ] Storybook: `DocumentCard` rejected (with reason / generic / ar-only-in-en / same-file-error / reuploaded) × AR/EN × light/dark; `NextStepCard` reupload_rejected (1 и N).
- [ ] Playwright: счастливый путь, A1, A2, A3 — в `android-chrome` и `iphone-safari`.

---

## 7. Заметки для реализации

- Хэш файла для A3 считается до отправки; сравнение — с `rejected_file_hashes` документа (сервер при подключении бэкенда повторит проверку).
- Мок `uwRejectDocument(id, reason_key?)` из `01-statuses.md` §10 — основной способ воспроизвести сценарий из демо-панели.
- Цвет и иконка `rejected` — из токенов статуса, одинаковые в списке, карточке и шкале.

## 8. Открытые вопросы

Решено (Кирилл, 2026-11-04): SC3-1 — тексты причин: четыре примера выше, полный список согласованных тегов UW придёт из Odoo (не блокирует). SC3-2 — дату отклонения показываем в относительном виде («не подошёл 3 дня назад»), кто проверял — не показываем (D-030).

Открытых вопросов по сценарию нет.

## 9. Бенчмарки

Паттерны «документ отклонён → загрузить заново» в KYC-флоу (Mobbin) — сессия 8.
