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
| `demo.*` | ar, en | подписи демо-панели (персона, сеть, действия, лента событий) | служебный инструмент витрины; в продовую сборку не попадает |
| `nav.home` | ar, en | Dashboard / لوحة التحكم (было Home / الرئيسية) | решение Кирилла 2026-11-06: новый каркас с сайдбаром; в `01-cabinet-structure.md` §2 пункт назван по-русски. Альтернатива для ar — «لوحة المعلومات» |
| `nav.settings` | ar, en | Settings / الإعدادات | пункт меню аккаунта, ведёт на экран `help.title`; в документах не задан |
| `nav.toggle_sidebar` | ar, en | Show or hide menu / إظهار القائمة أو إخفاؤها | aria-label кнопки сайдбара (desktop — скрыть/показать, телефон — открыть шторку) |
| `nav.account` | ar, en | Account / الحساب | aria-label кнопки меню аккаунта |
| `nav.switch_role` | ar, en | Switch role / تبديل الدور | подпись группы «Клиент / Поставщик» в меню аккаунта; Кирилл 2026-11-06: оставить «Switch role» (не «Switch account») |
| `nav.breadcrumb` | ar, en | Breadcrumb / مسار التنقل | aria-label `<nav>` хлебных крошек; en по WAI-ARIA APG, ar — общепринятый термин; Кирилл 2026-11-06: оставить |
| `nav.mobile_title` | ar, en | Menu / القائمة | заголовок шторки меню на телефоне (только для скринридера) |
| `nav.mobile_description` | ar, en | Main menu and account / القائمة الرئيسية والحساب | описание шторки для скринридера |
| `notfound.home` | ar, en | Go to dashboard / الانتقال إلى لوحة التحكم | кнопка экрана 404 — единообразно с «Dashboard» (решение Кирилла 2026-11-06) |
