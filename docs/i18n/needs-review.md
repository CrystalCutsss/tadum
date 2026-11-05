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
