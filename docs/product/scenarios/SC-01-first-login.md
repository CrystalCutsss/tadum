<!-- source: Drive 1PNXh2CjAh20FIxOBnyheoiFENlBA0JWe, synced: 2026-11-11. Не редактировать — источник в Drive. -->
# SC-01 · Первый вход

| Поле | Значение |
|---|---|
| **ID** | `SC-01` |
| **Роли** | `client_contact`, `client_owner`, `supplier`, `dual`, `unknown` (вход общий для всех) |
| **Экраны** | `auth.phone` (`/login`), `auth.otp` (`/login/code`), `auth.not_found` (`/not-found`), `auth.expired` (`/session-expired`) |
| **Предусловие** | Сессии нет (или истекла). Пользователь пришёл по ссылке из WhatsApp (`?lang=`) или нажал «Войти» на лендинге |
| **Статусы** | Любой `client_status`; результат входа — кабинет роли по `resolveRoles(phone)` |
| **Цель** | Клиент без пароля и регистрации попадает в кабинет за два экрана и сразу видит статус заявки |
| **Метрика** | Доля начатых входов, дошедших до `home` (`auth_login_succeeded / auth_otp_requested`); доля входов из WhatsApp |
| **Версия прототипа** | v1 |
| **Персоны мока** | `client_new`, `unknown_phone` |
| **Связанные документы** | `01-roles.md` §1–3 (D-020, D-021), `01-cabinet-structure.md` §1, §8 |
| **Статус** | черновик — живой каркас (вопросы закрыты) |

---

## 1. Основной сценарий

```
Дано:  сессии нет; язык определён из ?lang= или сохранённого выбора, иначе ar
Когда: пользователь открывает любой маршрут кабинета
Тогда: редирект на /login с запоминанием returnTo; экран auth.phone

Дано:  экран auth.phone
Когда: пользователь вводит номер в поле с маской +966 5X XXX XXXX (поле LTR, inputmode=tel) и нажимает «Получить код»
Тогда: событие auth_otp_requested {channel}; переход на /login/code; в шапке экрана — номер в маскированном виде и ссылка «Изменить номер»

Дано:  экран auth.otp, таймер повторной отправки 40 с
Когда: пользователь вводит 4 цифры в 4 ячейки кода (автопереход между ячейками, автоотправка после 4-й)
Тогда: resolveRoles(phone); событие auth_login_succeeded {role_count, active_role}; сессия на 30 дней

Дано:  roles содержит одну роль
Тогда: редирект на returnTo (если есть и принадлежит семье роли) или на home этой роли

Дано:  roles содержит обе семьи (dual)
Тогда: редирект на /c/home (D-020); в шапке виден переключатель ролей; один раз показана подсказка «У вас есть и кабинет поставщика»

Дано:  roles пуст (unknown)
Тогда: экран auth.not_found с действиями «Подать заявку» и «Связаться с поддержкой»; сессия не создаётся
```

Шаги с точки зрения UI: 2 экрана до кабинета в счастливом пути; ввод кода — без кнопки «Подтвердить» (автоотправка), кнопка «Подтвердить» появляется только если автоотправка не сработала (вставка из буфера, экранная клавиатура без событий).

---

## 2. Альтернативные сценарии и ошибки

| # | Условие | Что видит пользователь (ключ) | Действие | Событие |
|---|---|---|---|---|
| A1 | Номер не в формате KSA (`+966 5…`, 9 цифр после кода) | Инлайн-ошибка `auth.phone.invalid_format` под полем, кнопка задизейблена | исправить | — |
| A2 | Слишком много запросов кода (мок: > 3 за 10 минут) | `auth.phone.too_many_requests` с таймером | подождать | `auth_otp_failed {reason: rate_limited}` |
| A3 | Неверный код | `auth.otp.invalid` под ячейками, ячейки очищаются, фокус на первой; счётчик оставшихся попыток после 3-й ошибки | ввести снова | `auth_otp_failed {reason: invalid, attempt}` |
| A4 | Код истёк (5 минут) | `auth.otp.expired` + кнопка «Отправить новый код» активна независимо от таймера | запросить новый | `auth_otp_failed {reason: expired}` |
| A5 | Исчерпаны 5 попыток | `auth.otp.too_many_attempts`; ввод заблокирован до нового кода; кнопка «Отправить новый код» | запросить новый | `auth_otp_failed {reason: too_many_attempts}` |
| A6 | Повторная отправка до истечения 40 с | Кнопка задизейблена с обратным отсчётом `auth.otp.resend_in {seconds}` | ждать | — |
| A7 | Повторная отправка после 40 с | Новый код, таймер перезапущен, тост `auth.otp.resent` | — | `auth_otp_requested {channel, resend: true}` |
| A8 | Номер не найден (`unknown`) | Экран `auth.not_found` | «Подать заявку» → лендинг; «Связаться с поддержкой» → WhatsApp | `auth_otp_failed {reason: phone_unknown}`, `support_contact_clicked` |
| A9 | Нет сети при запросе кода / проверке | Инлайн `common.offline_retry`, кнопка «Повторить»; введённое сохраняется | повторить | — |
| A10 | Ошибка сервера (мок: `setNetwork('error')`) | `common.server_error_retry` + SupportBar | повторить | `auth_otp_failed {reason: server_error}` |
| A11 | Сессия истекла при открытии кабинета | Экран `auth.expired` → «Войти» → `/login` с `returnTo` | войти | `session_expired` |
| A12 | Пользователь уже с сессией открывает `/login` | Редирект на `home` активной роли | — | — |
| A13 | «Изменить номер» на экране кода | Возврат на `auth.phone` с заполненным номером; старый код инвалидируется | — | — |
| A14 | Диплинк `/c/documents?lang=en` без сессии | Язык переключается на `en` до показа `/login`; после входа — `/c/documents` | — | `language_changed {to: en, source: url}` |

Канал доставки кода (SMS или WhatsApp) выбирает бэкенд; UI показывает, куда отправлен код (`auth.otp.sent_to {channel}`), в моке канал задаётся персоной.

---

## 3. Состояния экранов

| Экран | Состояние | Что показываем |
|---|---|---|
| `auth.phone` | normal | Логотип, заголовок, поле номера, кнопка «Получить код», переключатель языка, SupportBar |
| `auth.phone` | loading | Кнопка в состоянии загрузки, поле заблокировано |
| `auth.phone` | error (A1, A2, A9, A10) | Инлайн-ошибка под полем или над кнопкой; поле остаётся заполненным |
| `auth.otp` | normal | Маскированный номер, 4 ячейки кода, таймер повтора, «Изменить номер» |
| `auth.otp` | loading | Ячейки заблокированы, индикатор проверки |
| `auth.otp` | error (A3–A5) | Текст ошибки, ячейки с состоянием ошибки, фокус на первой |
| `auth.otp` | resend-ready | Кнопка «Отправить новый код» активна |
| `auth.not_found` | normal | Нейтральный текст, две кнопки, SupportBar |
| `auth.expired` | normal | Текст, кнопка «Войти» |
| все | offline | Баннер оболочки; действия задизейблены с подсказкой |
| все | RTL / LTR | Поле номера и ячейки кода всегда LTR внутри RTL-макета; стрелка «назад» зеркалится |
| все | light / dark | По системной теме (D-025) |

---

## 4. Тексты интерфейса (AR / EN) — предложение, проверяет владелец текстов

| Ключ | EN | AR | Примечание |
|---|---|---|---|
| `auth.phone.title` | Welcome to Tadum | مرحبًا بك في تدوم | «Tadum» в арабском — تدوم; заголовок под логотипом (Кирилл 2026-11-10) |
| `auth.phone.subtitle` | Enter the phone number you used in your application | أدخل رقم الجوال الذي استخدمته في طلبك | |
| `auth.phone.label` | Mobile number | رقم الجوال | |
| `auth.phone.placeholder` | 5X XXX XXXX | 5X XXX XXXX | Код страны `+966` — отдельный неизменяемый префикс |
| `auth.phone.submit` | Get code | إرسال الرمز | |
| `auth.phone.invalid_format` | Enter a Saudi mobile number starting with 5 | أدخل رقم جوال سعودي يبدأ بالرقم 5 | |
| `auth.phone.too_many_requests` | Too many attempts. Try again in {minutes} min | محاولات كثيرة. حاول مجددًا بعد {minutes} دقيقة | Множественное число — формы `_one/_two/_few/_many/_other` |
| `auth.otp.title` | Enter the code | أدخل الرمز | |
| `auth.otp.sent_to` | We sent a 4-digit code to {phone} via {channel} | أرسلنا رمزًا من 4 أرقام إلى {phone} عبر {channel} | `{channel}` → `auth.channel.sms` / `auth.channel.whatsapp` |
| `auth.channel.sms` | SMS | رسالة نصية | |
| `auth.channel.whatsapp` | WhatsApp | واتساب | Третьи стороны — только текстом |
| `auth.otp.change_phone` | Change number | تغيير الرقم | |
| `auth.otp.resend` | Send a new code | إرسال رمز جديد | |
| `auth.otp.resend_in` | Send a new code in {seconds} s | إرسال رمز جديد بعد {seconds} ث | |
| `auth.otp.resent` | New code sent | تم إرسال رمز جديد | тост |
| `auth.otp.invalid` | The code is not correct. {attempts_left} attempts left | الرمز غير صحيح. تبقّى لديك {attempts_left} محاولات | Показываем остаток после 3-й ошибки |
| `auth.otp.expired` | This code has expired. Request a new one | انتهت صلاحية هذا الرمز. اطلب رمزًا جديدًا | |
| `auth.otp.too_many_attempts` | Too many attempts. Request a new code | محاولات كثيرة. اطلب رمزًا جديدًا | |
| `auth.otp.confirm` | Confirm | تأكيد | Только когда автоотправка не сработала |
| `auth.not_found.title` | We couldn't find an application for this number | لم نجد طلبًا مرتبطًا بهذا الرقم | |
| `auth.not_found.body` | If you haven't applied yet, you can do it now. If you think this is a mistake, our team will help | إذا لم تقدّم طلبًا بعد، يمكنك تقديمه الآن. وإذا كنت تعتقد أن هناك خطأ، فريقنا جاهز للمساعدة | Без обещаний сроков |
| `auth.not_found.apply` | Apply now | قدّم طلبك | → лендинг |
| `auth.not_found.support` | Contact support | تواصل مع الدعم | |
| `auth.expired.title` | Your session has ended | انتهت جلستك | |
| `auth.expired.body` | For your security, please sign in again | لحماية حسابك، يرجى تسجيل الدخول مرة أخرى | |
| `auth.expired.login` | Sign in | تسجيل الدخول | |
| `auth.dual_hint` | You also have a supplier account. Switch here anytime | لديك أيضًا حساب مورّد. يمكنك التبديل من هنا في أي وقت | Подсказка один раз (D-020) |
| `common.offline_retry` | No connection. Check your internet and try again | لا يوجد اتصال. تحقق من الإنترنت وحاول مجددًا | общий |
| `common.server_error_retry` | Something went wrong on our side. Please try again | حدث خطأ من جهتنا. يرجى المحاولة مرة أخرى | общий |
| `common.retry` | Try again | إعادة المحاولة | общий |

Проверка TOV: нет слов «кредит / заём / финансирование / BNPL», нет обещаний сроков, третьи стороны только текстом, формула ошибок «что произошло → что сделать».

---

## 5. События аналитики

| Событие | Когда | Свойства | Путь |
|---|---|---|---|
| `auth_otp_requested` | нажата «Получить код» или «Отправить новый код», запрос ушёл | `{ channel, resend: boolean, source: 'whatsapp_link' \| 'landing' \| 'direct' }` | успех |
| `auth_otp_failed` | любая ошибка входа | `{ reason: 'invalid' \| 'expired' \| 'too_many_attempts' \| 'rate_limited' \| 'phone_unknown' \| 'server_error', attempt? }` | ошибка |
| `auth_login_succeeded` | сессия создана | `{ role_count: 1 \| 2, active_role, returned_to: boolean }` | успех |
| `language_changed` | смена языка на экранах входа или из `?lang=` | `{ to, source: 'switch' \| 'url' }` | — |
| `support_contact_clicked` | с любого экрана входа | `{ channel: 'whatsapp' \| 'email', screen_id }` | — |
| `session_expired` | показан `auth.expired` | `{ last_screen_id }` | — |

Без PII: номер телефона в события не попадает.

---

## 6. Критерии приёмки

- [ ] От открытия диплинка до `home` — два экрана и не более двух действий (ввод номера, ввод кода); кнопка «Подтвердить» в счастливом пути не нужна.
- [ ] Поле номера и ячейки кода отображаются LTR внутри RTL-интерфейса; маска `+966 5X XXX XXXX` работает при вставке номера с пробелами, дефисами и ведущим `0`.
- [ ] Параметры OTP соответствуют D-021: 4 цифры, 5 минут, 5 попыток, повтор через 40 с; после 5-й ошибки ввод заблокирован до нового кода.
- [ ] `dual` после входа попадает на `/c/home` с видимым переключателем и одноразовой подсказкой; при следующем входе — на последнюю выбранную роль.
- [ ] `unknown` видит экран «не найдена» без создания сессии; обе кнопки работают; событие `phone_unknown` отправлено.
- [ ] `returnTo` соблюдается: диплинк на `/c/documents` после входа открывает `/c/documents`; для `supplier` диплинк на `/c/*` ведёт на `/s/home`.
- [ ] Сессия переживает перезагрузку и новую вкладку; через 30 дней — `auth.expired`; «Выйти» завершает сессию на устройстве.
- [ ] Все тексты из раздела 4 присутствуют в `ar` и `en`; паритет ключей проверен.
- [ ] axe без нарушений на трёх экранах входа в обеих локалях; порядок фокуса: поле → кнопка → язык → поддержка; у ячеек кода одна общая подпись (заголовок экрана) и `aria-live` для ошибок.
- [ ] Истории Storybook: `auth.phone` (normal, loading, invalid, rate_limited, offline), `auth.otp` (normal, loading, invalid, expired, too_many, resend_ready), `auth.not_found`, `auth.expired` — каждая в AR и EN, light и dark.
- [ ] Playwright: счастливый путь, A3, A4, A5, A8, A11, A14 — в проектах `android-chrome` и `iphone-safari`.

---

## 7. Заметки для реализации

- Экран кода не хранит код в URL и не логирует его; в моке код любой персоны — `1234`, персона `unknown_phone` — любой номер `+966 50 000 0000`.
- `returnTo` хранится в `sessionStorage`, не в URL; допускаются только внутренние пути.
- Во встроенном браузере WhatsApp автозаполнение кода из SMS может не работать — ячейки кода должны принимать вставку целиком.
- Таймер 40 с идёт от момента успешного запроса, не от открытия экрана; при смене языка таймер не сбрасывается.

## 8. Открытые вопросы

Решено (Кирилл, 2026-11-04): SC1-1 — канал доставки кода (SMS / WhatsApp) всегда выбирает бэкенд; UI только сообщает, куда отправлен код (D-027). SC1-2 — галочки «Запомнить меня» нет, сессия всегда 30 дней (подтверждение D-007).

Открытых вопросов по сценарию нет.

## 9. Бенчмарки

Экраны OTP-входа из Mobbin (финтех MENA/KSA) подбираются в сессии 8; ссылки добавить сюда.
