# Тексты на проверку носителем

Сюда попадают ключи, которые агент дописал сам: арабские формы множественного числа (в сценариях дана одна форма) и тексты, которых нет в документах. Проверка не блокирует блоки; после проверки строка удаляется, а правка вносится в `src/shared/i18n/locales/*.json`.

| Ключ | Язык | Что дописано | Почему |
| :--- | :--- | :--- | :--- |
| `relative.minutes_ago_*` | ar | все 6 форм: `zero` «منذ {count} دقيقة», `one` «منذ دقيقة», `two` «منذ دقيقتين», `few` «منذ {count} دقائق», `many`/`other` «منذ {count} دقيقة» | в §1.3 только пример «منذ 3 أيام» |
| `relative.hours_ago_*` | ar | все 6 форм: `one` «منذ ساعة», `two` «منذ ساعتين», `few` «منذ {count} ساعات», `zero`/`many`/`other` «منذ {count} ساعة» | то же |
| `relative.days_ago_*` | ar | все 6 форм: `one` «منذ يوم», `two` «منذ يومين», `few` «منذ {count} أيام», `many` «منذ {count} يومًا», `zero`/`other` «منذ {count} يوم» | то же |
| `relative.*_ago_one/_other` | en | «{count} minute(s)/hour(s)/day(s) ago» | в §1.3 только «3 days ago» |
| `nav.*` | ar, en | Home/الرئيسية, Documents/المستندات, Help/المساعدة, Link/الرابط, Clients/العملاء, Terms/الشروط, More/المزيد | в `01-cabinet-structure.md` §2 пункты навигации названы по-русски; термины — из глоссария §1.5 |
| `support.whatsapp`, `support.email` | ar, en | WhatsApp/واتساب, Email/البريد الإلكتروني | подписи каналов SupportBar в документах не заданы |
| `units.mb`, `units.kb` | ar, en | MB/ميجابايت, KB/كيلوبايت | `units.kb` в §1.3 не показан |
| `auth.phone.too_many_requests_*` | ar, en | ar: `one` «…بعد دقيقة», `two` «…بعد دقيقتين», `few` «…بعد {minutes} دقائق», `zero`/`many`/`other` «…بعد {minutes} دقيقة»; en: `one`/`other` — текст из SC-01 §4 | в SC-01 §4 одна форма |
| `auth.otp.invalid_*` | ar, en | ar: `zero` «…لم تتبقَّ لديك محاولات», `one` «…تبقّت لديك محاولة واحدة», `two` «…تبقّت لديك محاولتان», `few` «…تبقّى لديك {attempts_left} محاولات», `many`/`other` «…{attempts_left} محاولة»; en: `one` «…attempt left», `other` «…attempts left» | то же |
| `auth.otp.invalid_retry` | ar, en | «The code is not correct. Try again» / «الرمز غير صحيح. حاول مرة أخرى» | SC-01 §4: остаток попыток показываем только после 3-й ошибки — для 1-й и 2-й нужен текст без числа |
| `auth.not_found.title` | en | «No application found for this number» вместо «We couldn't find an application for this number» | лексикон: заголовок не длиннее 6 слов (`length_words`) |
| `stub.coming_soon.title`, `.body` | ar, en | «This section is being prepared» / «هذا القسم قيد التجهيز»; «We're preparing this section. The rest of your account works as usual» / «نعمل على تجهيز هذا القسم. باقي حسابك يعمل كالمعتاد» | тексты заглушек v1 (D-067) в документах не заданы; «скоро / قريبًا» лексикон запрещает (D-033) |
| `help.logout_hint` | ar, en | «You'll need a new code to sign in again» / «ستحتاج إلى رمز جديد لتسجيل الدخول مرة أخرى» | у диалога выхода нужно описание (a11y); в SC-10 §4 только вопрос |
| `common.cancel` | ar, en | Cancel / إلغاء | кнопка отмены в диалоге выхода; в документах не задана |
| `nav.main` | ar, en | Main menu / القائمة الرئيسية | подпись `<nav>` для скринридера |
| `timeline.title`, `timeline.client.*` | ar, en | Application progress / مراحل الطلب; Documents / المستندات, Review / المراجعة, Decision / القرار, Signing / التوقيع, Limit active / تفعيل الحد | в `01-cabinet-structure.md` §5 есть только ключи шагов |
| `timeline.state.*` | ar, en | Done / مكتملة, In progress / جارية, Next / التالية, Needs your attention / تحتاج إلى انتباهك, Closed / مغلقة | текстовое состояние шага для доступности (§5) |
| `status.client.docs_required`, `.first_purchase` | ar, en | Documents needed / مطلوب مستندات; First purchase done / تمت أول عملية شراء | в сценариях даны только `under_review`, `approved`, `closed` |
| `next_step.owner.user`, `.tadum` | ar, en | Your next step / خطوتك التالية; On our side / من جهتنا | подпись «на чьей стороне шаг» (§6) |
| `next_step.cta.*` | ar, en | Go to documents / الانتقال إلى المستندات, Sign documents / توقيع المستندات, How to buy / طريقة الشراء, Apply again / تقديم طلب جديد, Share my link / مشاركة رابطي | подписи CTA в документах не заданы (A-022) |
| `next_step.closed` | ar, en | = `closed.title` из SC-08 | ключ есть в §6, текст — нет |
| `next_step.reupload_rejected_*`, `.upload_documents_*`, `.more_docs_requested_*`, `.supplier.reupload_rejected_*`, `home.documents_summary_*`, `next_step.under_review_eta_*`, `.supplier.under_review_eta_*` | ar, en | все 6 арабских форм (`one` — «مستند واحد…», `two` — «مستندان/مستندين…», `few` — «{count} مستندات…», `many` — «{count} مستندًا…», `zero`/`other` — «{count} مستند…»; для часов — «ساعة واحدة / ساعتين / {hours} ساعات / {hours} ساعة»); en `one`/`other` | в сценариях одна форма |
| `status.changed_banner_dismiss` | ar, en | Got it / حسنًا — ключ SC-05 `status.changed_banner.dismiss` переименован: строка `status.changed_banner` не может одновременно быть объектом | конфликт ключей i18next |
| `theme.toggle` | ar, en | Toggle theme / تبديل المظهر — подпись кнопки темы в шапке | в документах не задан (кнопка добавлена решением Кирилла 2026-11-06) |
| `nav.settings` | ar, en | Settings / الإعدادات | пункт меню аккаунта, ведёт на экран `help.title`; в документах не задан |
| `nav.toggle_sidebar` | ar, en | Show or hide menu / إظهار القائمة أو إخفاؤها | aria-label кнопки сайдбара (desktop — скрыть/показать, телефон — открыть шторку) |
| `nav.account` | ar, en | Account / الحساب | aria-label кнопки меню аккаунта |
| `nav.switch_role` | ar, en | Switch role / تبديل الدور | подпись группы «Клиент / Поставщик» в меню аккаунта; Кирилл 2026-11-06: оставить «Switch role» (не «Switch account») |
| `nav.breadcrumb` | ar, en | Breadcrumb / مسار التنقل | aria-label `<nav>` хлебных крошек; en по WAI-ARIA APG, ar — общепринятый термин; Кирилл 2026-11-06: оставить |
| `nav.mobile_title` | ar, en | Menu / القائمة | заголовок шторки меню на телефоне (только для скринридера) |
| `nav.mobile_description` | ar, en | Main menu and account / القائمة الرئيسية والحساب | описание шторки для скринридера |
| `nav.home` | ar, en | Home / الرئيسية | пункт основного меню; Кирилл 2026-11-06: вернуть «Home» вместо «Dashboard» |
| `notfound.home` | ar, en | Go to home / الانتقال إلى الرئيسية | кнопка экрана 404 — единообразно с пунктом «Home» |
| `support.cta.title` | ar, en | Have a question? / لديك سؤال؟ | заголовок блока помощи в сайдбаре (первая строка) |
| `support.cta.subtitle` | ar, en | Message us / راسلنا | подзаголовок блока помощи: вторая строка, мельче, regular, серый |
| `documents.*`, `document.*.title/.hint`, `upload.*`, `source_picker.*`, `prevalidation.*`, `reject.*`, `timeline.step_of` | ar, en | тексты экрана «Ваши документы»: заголовки, подсказки документов, загрузка и ошибки, выбор источника, панель шагов, тосты отправки | в сценариях SC-02…SC-04 даны не все строки; черновики по TOV и лексикону, A-058 |
| `common.loading` | ar, en | Loading… / جارٍ التحميل… | подпись спиннера для скринридера: кнопка «Получить код», проверка кода, «Отправить новый код» (SC-01 §3 loading); Кирилл 2026-11-10 |
| `auth.phone.title` | ar, en | Welcome to Tadum / مرحبًا بك في تدوم | заголовок экрана входа; Кирилл 2026-11-10 (было «Sign in to your Tadum account»), A-059 |
| `cr.title` | ar, en | Commercial Registration (CR) number / رقم السجل التجاري | блок ввода CR над документами заявки, Кирилл 2026-11-10; в арабском без латинского «CR» — термин «السجل التجاري» общепринят |
| `cr.hint` | ar, en | You'll find the 10-digit number on your CR certificate / تجد الرقم المكوّن من 10 أرقام في شهادة السجل التجاري | где найти номер; формат 10 цифр — `01-entities.md` (`cr_number`) |
| `cr.label` | ar, en | CR number / رقم السجل التجاري | подпись поля; значение поля — LTR |
| `cr.error.required` | ar, en | Enter your CR number / أدخل رقم السجل التجاري | пустое поле: только действие, без «обязательное поле» |
| `cr.error.length` | ar, en | Enter all 10 digits of your CR number / أدخل رقم السجل التجاري كاملًا من 10 أرقام | не 10 цифр: формулировка через действие, без «неверно» (blame_language) |
| `cr.error.save` | ar, en | We couldn't save your CR number. Try again / لم نتمكن من حفظ رقم السجل التجاري. حاول مرة أخرى | формула ошибки как у `upload.error.server` |
| `cr.missing` | ar, en | Add your CR number to send for review / أضف رقم السجل التجاري لإرسال المستندات للمراجعة | тост при «Отправить на проверку» без валидного CR |
| `upload.error.files_limit` | ar, en | You can add up to {max} files to one document / الحد الأقصى لعدد الملفات في المستند الواحد: {max} | `{max}` — строка, не `count`: в арабском число вынесено в конец, чтобы не согласовывать существительное (ملفات/ملفًا) |
| `upload.error.same_file` | ar, en | You've already uploaded this file. Choose another one / سبق أن رفعت هذا الملف. اختر ملفًا آخر | было «This is the same file as before. Upload a new one» / «هذا هو الملف نفسه. ارفع ملفًا جديدًا»; теперь покрывает и «уже есть в документе», и «ранее не принят»; согласовано с диалогом `upload.same_file.*` |
| `upload.same_file.title` | ar, en | You've already uploaded this file / سبق أن رفعت هذا الملف | диалог «тот же файл», Кирилл 2026-11-10 |
| `upload.same_file.body` | ar, en | We didn't upload {name}: it's already in this document or wasn't accepted earlier. Choose another file / لم نرفع {name} لأنه موجود في هذا المستند أو لم يُقبل سابقًا. اختر ملفًا آخر | что случилось (файл не загружен) + что сделать; оба случая одной фразой |
| `upload.same_file.choose_another` | ar, en | Choose another file / اختيار ملف آخر | кнопка; в арабском — масдар, как другие кнопки |
| `upload.same_file.ok` | ar, en | Got it / حسنًا | как `status.changed_banner_dismiss` |
| `document.source.zatca`, `.molim`, `.simah` | ar, en | Get it on ZATCA / استخراج من هيئة الزكاة والضريبة والجمارك; Get it on Molim / استخراج من مُلِم; Get it on SIMAH / استخراج من سمة | Кирилл 2026-11-10: кнопки «Оформить на …»; было «ZATCA portal», «Molim app», «SIMAH reports»; в арабском масдар без местоимения — кнопка ZATCA общая для شهادة (ж. р.) и إقرارات |
| `nav.application` | ar, en | Application / الطلب | пункт меню клиента; термин из глоссария (`application`); `nav.documents` остаётся у поставщика |
| `documents.submit.ready_title` | ar, en | Everything is ready / كل شيء جاهز | успех липкой панели, когда всё загружено; без «Congratulations / مبروك» (лексикон `success_filler`) и восклицаний |
| `documents.submit.ready_body` | ar, en | You've uploaded all the documents. Now send them for review / رفعت جميع المستندات. أرسلها الآن للمراجعة | то же |
| `application.*`, `checklist.title`, `checklist.where.*`, `checklist.status.locked`, `checklist.status.in_progress`, `checklist.locked_hint`, `checklist.link_copied`, `demo_sign.*` | ar, en | тексты этапов «Решение», «Подписание», «Лимит одобрен» на экране «Заявка» и демо-страницы подписи (A-063); арабские формы `application.documents_accepted_*` (`zero` — «لا توجد مستندات مقبولة بعد», `one` «مستند واحد», `two` «مستندين», `few` «{count} مستندات», `many` «{count} مستندًا», `other` «{count} مستند»); `checklist.title` «Documents to sign / مستندات للتوقيع» и `checklist.status.in_progress` «Waiting for confirmation / بانتظار التأكيد» расходятся с SC-06 §4 («Steps to activate / خطوات التفعيل», «In progress / قيد التنفيذ») — Кирилл подтвердил оба текста 2026-11-11, как и различие «اعتماد» (лимит) / «الموافقة» (заявка) | в SC-06/SC-07 этих текстов нет — экран «Заявка» вместо главной (решение Кирилла 2026-11-11) |
| `application.subtitle.cancelled` | ar, en | Your limit status has changed / تغيّرت حالة حدّك (было Your limit has changed / تغيّر حدّك) | лимит не изменился, а перестал действовать; «изменился» вводит в заблуждение |
| `application.signing.body` | ar, en | Each step opens on the Sadq website or in the Nafith app. When you're done, come back to this page — we'll update the status / تُفتح كل خطوة في موقع صادق أو في تطبيق نافذ. بعد الانتهاء عُد إلى هذه الصفحة وسنحدّث الحالة | «partner / الشريك» намекает на партнёрство с госсервисами (лексикон: без endorsement); третьи стороны — по имени, текстом |
| `application.summary.approved_at` | ar | تم اعتماد الحد (было تاريخ اعتماد الحد) | паритет с EN «Limit approved» и шагом `timeline.client.limit_active`; соседняя строка `summary.sent` тоже без «تاريخ» |
| `application.cancelled.apply` | ar | تقديم طلب جديد (было قدّم طلبًا جديدًا) | кнопки — масдар, как `next_step.cta.apply_again` |
| `demo_sign.badge`, `.body`, `.unknown` | ar, en | Demo — not a real signature / عرض تجريبي — ليس توقيعًا فعليًا; In the real service, this step takes place on the Sadq website or in the Nafith app. Here you can only simulate signing / في الخدمة الفعلية تتم هذه الخطوة في موقع صادق أو في تطبيق نافذ. أما هنا فيمكنك محاكاة التوقيع فقط; This step isn't available here. Go back to your application / هذه الخطوة غير متاحة هنا. عُد إلى طلبك | демо должно читаться однозначно; без «партнёра»; «تعليمها كموقّعة» — калька; ошибка — что случилось + что сделать |
| `timeline.client.limit_active` | ar, en | «Limit approved» / «تم اعتماد الحد» вместо «Limit active» | переименование шага (Кирилл 2026-11-11) |
| `documents.resources.open` | ar, en | Help / مساعدة | одна маленькая кнопка у заголовка документа вместо «How to get it» / «See an example» и ссылок (Кирилл 2026-11-12); суффикс `.open` — не больше 3 слов, поэтому не «How to get it?» (4 слова) |
| `documents.resources.open_label` | ar, en | Help: {title} / مساعدة: {title} | aria-label кнопки; начинается с видимой подписи дословно (WCAG 2.5.3 Label in Name) |
| `documents.resources.dialog_description` | ar, en | How to get this document and what it looks like / كيف تحصل على هذا المستند وكيف يبدو | подзаголовок окна; нейтрален к составу окна — видео, пример или ссылки могут отсутствовать по отдельности |
| `documents.resources.example_pdf` | ar, en | Open the example / فتح المثال | кнопка в табе примера, когда пример только PDF; в арабском — масдар, как другие кнопки |
| `documents.progress_cr_only` | ar, en | Only your CR number is left / لم يتبقَّ سوى رقم السجل التجاري | документы все загружены, осталось поле CR |
| `documents.time_left_*` | ar, en | en `one`/`other` «About {minutes} min left»; ar `one` «يتبقّى نحو دقيقة واحدة», `two` «يتبقّى نحو دقيقتين», `few` «يتبقّى نحو {minutes} دقائق», `zero`/`many`/`other` «يتبقّى نحو {minutes} دقيقة» | оценка времени на заполнение, не обещание срока со стороны تدوم; число — `{minutes}` (отформатировано), плюрализация по `count` |
| удалены `documents.row.reupload`, `documents.row.add_file`, `documents.resources.example_title` | ar, en | — | в коде больше не используются (кнопка всегда «Upload», 2026-11-12); `video_title` оставлен — это title iframe плеера |
