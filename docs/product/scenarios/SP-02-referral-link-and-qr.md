<!-- source: Drive 1JaSL5c1u4-B20BrvkQF9S1QoE9GmUS-g, synced: 2026-11-05. Не редактировать — источник в Drive. -->
# SP-02 · Реферальная ссылка и QR-код

| Поле | Значение |
|---|---|
| **ID** | `SP-02` |
| **Роли** | `supplier`, `dual` |
| **Экраны** | `supplier.referral` (`/s/referral`), реферальная карточка на `supplier.home` (компактный режим) |
| **Предусловие** | Поставщик в кабинете; у записи поставщика есть `slug` и `referral_url` |
| **Статусы** | Любой `supplier_status` — ссылка активна всегда (D-022) |
| **Цель** | Поставщик за одно нажатие отправляет клиенту ссылку на заявку или распечатывает QR для точки продаж; каждый такой лид автоматически помечается поставщиком (SFL-488) |
| **Метрика** | Доля поставщиков, сделавших хотя бы одно действие с ссылкой за месяц (`referral_link_copied` ∪ `referral_shared_whatsapp` ∪ `referral_qr_downloaded`); заявки с `source.channel = referral_link` на одного активного поставщика |
| **Версия прототипа** | v3 |
| **Персоны мока** | `supplier_new`, `supplier_active`; демо-панель `setNetwork('offline')`, эмуляция IAB WhatsApp (user-agent) |
| **Связанные документы** | `SP-01` (карточка на главной), `01-roles.md` §5 (D-022), `01-entities.md` §2.10, `01-cabinet-structure.md` §1, §9 (`/s/{slug}` — вне кабинета) |
| **Статус** | черновик — живой каркас |

---

## 1. Основной сценарий

```
Дано:  поставщик открыл /s/referral; referral_url = https://tadum.sa/s/{slug}
Тогда: экран: заголовок, ссылка крупно в <bdi dir="ltr"> (переносится без обрезки), три действия —
       «Скопировать», «Поделиться в WhatsApp», «Скачать QR-код»; ниже — QR-код (сгенерирован на клиенте из
       referral_url), подпись «Распечатайте и разместите у кассы»; ссылка «Открыть мою страницу» (внешняя,
       target=_blank); событие screen_viewed {screen_id: supplier.referral}

Когда: нажимает «Скопировать»
Тогда: referral_url в буфер обмена (navigator.clipboard.writeText); кнопка на 2 с меняет подпись на «Скопировано»,
       тост не нужен; событие referral_link_copied {source: referral}

Когда: нажимает «Поделиться в WhatsApp»
Тогда: если доступен navigator.share — системный лист с {title, text, url}; иначе — wa.me/?text={referral.share_text
       на языке интерфейса + URL}; открывается в новом окне / в самом WhatsApp (из IAB);
       событие referral_shared_whatsapp {source: referral, method: 'web_share' | 'wa_me'}

Когда: нажимает «Скачать QR-код»
Тогда: PNG 1024×1024 с QR и ссылкой текстом под ним, имя файла tadum-{slug}-qr.png; скачивание через
       прямую ссылку на data: URL с атрибутом download (не blob: — ограничение IAB, см. DoD);
       событие referral_qr_downloaded {source: referral, format: 'png'}

Дано:  поставщик — на /s/home (SP-01)
Когда: нажимает «Скопировать» или «WhatsApp» в компактной карточке
Тогда: то же поведение; события с source: home
```

Редактировать `slug`, текст своей реферальной страницы и предзаполненный текст поставщик не может (SFL-850, вне объёма). Ссылка одна на поставщика; персональных ссылок на сотрудников нет.

---

## 2. Альтернативные сценарии и ошибки

| # | Условие | Что видит (ключ) | Действие | Событие |
|---|---|---|---|---|
| A1 | Clipboard API недоступен (IAB WhatsApp на части Android, http-контекст) | Кнопка «Скопировать» выделяет текст ссылки и показывает подсказку `referral.copy_manual` («Удерживайте, чтобы скопировать») | скопировать вручную | `referral_link_copied {method: manual}` |
| A2 | `navigator.share` отклонён пользователем (отмена листа) | Ничего не меняется, ошибки нет | — | `referral_share_cancelled` |
| A3 | Открыто внутри IAB WhatsApp | `wa.me` открывает чат выбора контакта в самом WhatsApp; кнопка «Скачать QR» заменяется на «Сохранить изображение» с подсказкой `referral.qr_long_press` (удерживайте картинку) — скачивание файла в IAB ненадёжно | удержать картинку | `referral_qr_downloaded {method: long_press_hint}` |
| A4 | Офлайн | Экран полностью работает: ссылка статична, QR генерируется локально; «Открыть мою страницу» — внешняя, покажет ошибку браузера | — | — |
| A5 | `slug` отсутствует в данных (ошибка данных) | Экран в состоянии `referral.unavailable` с SupportBar; карточка на главной скрыта | поддержка | `data_inconsistency {kind: missing_slug}` |
| A6 | Очень длинный `slug` | Ссылка переносится по символам (`overflow-wrap: anywhere`), QR остаётся читаемым (версия QR растёт автоматически) | — | — |
| A7 | Английский интерфейс | Текст для WhatsApp — английский; ссылка та же; язык страницы `/s/{slug}` определяет лендинг, не мы | — | — |
| A8 | `supplier_status = docs_required` или `under_review` | Всё доступно без ограничений (D-022); на экране нет упоминаний о статусе документов | — | — |
| A9 | Поставщик открыл свою страницу `/s/{slug}` и подал заявку сам как клиент | Вне кабинета; обрабатывает лендинг (дедупликация по телефону — D-039) | — | — |
| A10 | Печать экрана (`Ctrl+P`) | Печатная версия: только QR, ссылка и название поставщика; навигация и кнопки скрыты (`@media print`) | — | `referral_printed` (по `beforeprint`) |

---

## 3. Состояния экранов

| Экран / блок | Состояние | Что показываем |
|---|---|---|
| `supplier.referral` | normal | Ссылка, три кнопки, QR, подпись, внешняя ссылка |
| `supplier.referral` | copied | Кнопка «Скопировано» 2 с, затем возврат |
| `supplier.referral` | iab (A3) | Кнопка «Сохранить изображение» + подсказка вместо скачивания |
| `supplier.referral` | manual-copy (A1) | Текст выделен, подсказка |
| `supplier.referral` | unavailable (A5) | Нейтральный текст + SupportBar |
| `supplier.referral` | loading | Скелетон ссылки и квадрат QR |
| `supplier.referral` | print | Только QR + ссылка + название |
| `#referral-card` (home) | compact | Ссылка в одну строку с многоточием посередине, две кнопки, ссылка «QR-код и подробнее» |
| все | RTL / LTR, light / dark | URL всегда LTR; QR — тёмные модули на светлом фоне в обеих темах (не инвертировать: часть сканеров не читает инверсию); кнопки в ряд на ≥ 768 px, столбиком на 360 px |

---

## 4. Тексты интерфейса (AR / EN) — предложение

| Ключ | EN | AR | Примечание |
|---|---|---|---|
| `referral.title` | Your referral link | رابط الإحالة الخاص بك | |
| `referral.subtitle` | Clients who apply through this link are linked to you automatically | العملاء الذين يتقدمون عبر هذا الرابط يُربطون بك تلقائيًا | |
| `referral.copy` | Copy link | نسخ الرابط | |
| `referral.copied` | Copied | تم النسخ | 2 с |
| `referral.copy_manual` | Press and hold the link to copy it | اضغط مطوّلًا على الرابط لنسخه | A1 |
| `referral.share_whatsapp` | Share on WhatsApp | مشاركة عبر واتساب | |
| `referral.share_text` | Buy from {supplier} now and pay in parts with Tadum. Apply here: | اشترِ من {supplier} الآن وسدّد على دفعات مع تدوم. قدّم طلبك هنا: | затем URL; разрешённая формула «купите сейчас — платите частями» |
| `referral.qr_title` | QR code for your store | رمز QR لمتجرك | |
| `referral.qr_hint` | Print it and place it at the checkout. Clients scan it to apply | اطبعه وضعه عند نقطة الدفع. يمسحه العملاء لتقديم طلبهم | |
| `referral.qr_download` | Download QR code | تنزيل رمز QR | |
| `referral.qr_save_image` | Save image | حفظ الصورة | A3 |
| `referral.qr_long_press` | Press and hold the image to save it | اضغط مطوّلًا على الصورة لحفظها | A3 |
| `referral.open_page` | Open my page | فتح صفحتي | внешняя ссылка |
| `referral.unavailable` | Your link isn't ready yet. Contact us and we'll sort it out | رابطك غير جاهز بعد. تواصل معنا وسنحلّ الأمر | A5 |
| `referral.print_caption` | Scan to buy now and pay in parts | امسح الرمز للشراء الآن والسداد على دفعات | печатная версия |

Проверка TOV: «платите частями», «подать заявку» — разрешены; нет «кредит / рассрочка под процент / BNPL»; название Tadum в тексте для клиента — по-арабски «تدوم», как на лендинге (проверить с владельцем текстов).

---

## 5. События аналитики

| Событие | Когда | Свойства |
|---|---|---|
| `screen_viewed` | открыт `/s/referral` | `{ screen_id: 'supplier.referral', supplier_status }` |
| `referral_link_copied` | копирование | `{ source: 'home' \| 'referral', method: 'clipboard' \| 'manual' }` |
| `referral_shared_whatsapp` | отправка | `{ source, method: 'web_share' \| 'wa_me' }` |
| `referral_share_cancelled` | A2 | `{ source }` |
| `referral_qr_downloaded` | скачивание / подсказка сохранения | `{ source: 'referral', format: 'png', method: 'download' \| 'long_press_hint' }` |
| `referral_open_page_clicked` | внешняя ссылка | `{}` |
| `referral_printed` | A10 | `{}` |
| `data_inconsistency` | A5 | `{ kind }` |

`slug` и URL в свойства не отправляем (это идентификатор поставщика).

---

## 6. Критерии приёмки

- [ ] Три действия работают в любом `supplier_status` (D-022), на персонах `supplier_new` и `supplier_active`.
- [ ] Копирование: через Clipboard API, с запасным путём выделения текста при недоступности; обратная связь на самой кнопке, без тоста.
- [ ] Отправка в WhatsApp: Web Share при наличии, иначе `wa.me/?text=`; текст на языке интерфейса с подставленным названием поставщика и URL; URL корректно закодирован.
- [ ] QR генерируется на клиенте из `referral_url`, читается стандартным сканером телефона в светлой и тёмной теме; PNG 1024 px с ссылкой текстом; имя файла `tadum-{slug}-qr.png`; в IAB — режим «сохранить изображение».
- [ ] Печатная версия экрана содержит только QR, ссылку и название поставщика.
- [ ] Экран полностью работает офлайн (кроме внешней ссылки).
- [ ] Тексты в `ar` и `en`; URL в `<bdi dir="ltr">`; axe без нарушений; у QR есть `alt` с текстом ссылки.
- [ ] Storybook: `ReferralActions` full / compact × normal / copied / manual-copy / iab × AR/EN × light/dark; `QrCard` normal / long-slug / print.
- [ ] Playwright: `supplier_active` → `/s/referral` → копирование (проверка буфера) → QR скачан и декодируется в `referral_url` → эмуляция IAB → режим «сохранить изображение».

---

## 7. Заметки для реализации

- Генерация QR — лёгкая библиотека без зависимостей (например, `qrcode` → SVG/Canvas), уровень коррекции `M`, тихая зона 4 модуля; проверить вклад в бюджет размера (size-limit).
- PNG собирается на Canvas: QR + подпись с URL (шрифт системный, чтобы не тянуть веб-шрифт в изображение); скачивание через `<a download href="data:…">`.
- Детекция IAB — общая утилита из SC-10 (user-agent WhatsApp); при IAB скрываем `download` и показываем изображение с подсказкой.
- `navigator.share` вызывать только по жесту пользователя (иначе браузер отклонит); проверять `navigator.canShare`.
- Текст `referral.share_text` формируется через i18n с `{supplier}` и URL отдельно, чтобы URL не попал под перенос/RTL-обработку.

## 8. Открытые вопросы

Решено (Кирилл, 2026-11-04):

- **SP2-1** — в MVP QR-изображение простое: QR + ссылка текстом, без логотипа; печатный макет (A5, название поставщика, бренд) — после согласования бренда, сессии 6/8 (D-045).
- **SP2-2** — предзаполненный текст для WhatsApp только на языке интерфейса; двуязычного сообщения нет, поставщик при необходимости переключает язык перед отправкой (D-046).

Открытых вопросов по сценарию нет.

## 9. Бенчмарки

Экраны «поделиться ссылкой / QR» в партнёрских и реферальных программах, печатные QR для точек продаж (Mobbin: referral, invite friends, merchant QR; Tabby/Tamara merchant apps) — сессия 8.
