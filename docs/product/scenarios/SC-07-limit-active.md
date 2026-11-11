<!-- source: Drive 10W4gPvl-k6YbznAa5sBPlyaNGURHgfm3, synced: 2026-11-11. Не редактировать — источник в Drive. -->
# SC-07 · Лимит одобрен

| Поле | Значение |
|---|---|
| **ID** | `SC-07` |
| **Роли** | `client_contact`, `client_owner` |
| **Экраны** | `client.home` (блоки `#limit`, `#how-to-buy`), `client.documents` (карточка «Лимит одобрен», `?view=details` — D-081), `client.help` |
| **Предусловие** | Чек-лист завершён (SC-06); `client_status = approved` с лимитом `active`, либо `client_status = first_purchase` |
| **Статусы** | Odoo: Client Approved → Payment done; лимит `active` |
| **Цель** | Клиент видит, сколько у него есть и сколько доступно, и понимает, как оформить покупку у поставщика через Tadum |
| **Метрика** | Доля клиентов с активным лимитом, совершивших первую покупку за 30 дней (Client Approved → Payment done); доля открытий «Как оформить покупку» и переходов в WhatsApp из него |
| **Версия прототипа** | v4 |
| **Персоны мока** | `client_active` (150 000 SAR, использовано 42 500), `client_first_purchase` (одна сделка `payment_done`), вариант `used = 0` |
| **Связанные документы** | `01-cabinet-structure.md` §1 (D-023), §5–6; `01-entities.md` §2.7, §2.9; `01-statuses.md` §6, §8 |
| **Статус** | черновик — живой каркас (вопросы закрыты) |

---

## 1. Основной сценарий

На экране «Заявка» при лимите `active` — карточка «Your limit»: сумма, «Limit approved» с датой, «Sent for review» с датой, «Open application» → подробности заявки (D-081). Блоки главной — отдельной задачей.

```
Дано:  лимит active: approved 150 000, used 42 500, available 107 500 (SAR); client_status = approved
Когда: клиент открывает /c/home
Тогда: шкала: все шаги done, «Лимит активен» current; карточка next_step.how_to_buy (owner = user)
       с CTA → #how-to-buy;
       блок #limit в режиме active: три величины — одобренный, использованный, доступный — и
       горизонтальная полоса доли использованного (D-037); суммы через formatMoney;
       блок #how-to-buy: три шага текстом и кнопка «Написать в WhatsApp» с предзаполненным текстом;
       событие screen_viewed {status: approved, limit_status: active, used_share_bucket}

Когда: клиент нажимает «Написать в WhatsApp» в блоке #how-to-buy
Тогда: открывается wa.me/966579768881 с текстом support.prefill.quotation {company};
       событие how_to_buy_whatsapp_clicked

Дано:  первая сделка дошла до оплаты (мок: createDeal(25000, supplier) → payDeal); odoo_stage = Payment done;
       client_status = first_purchase; used пересчитан
Когда: клиент открывает /c/home
Тогда: шкала полностью done; карточка next_step.first_purchase_done (owner = none) с поздравлением без
       пафоса; блок #limit обновлён; блок #how-to-buy остаётся (следующие покупки — так же);
       событие screen_viewed {status: first_purchase}
```

Раздел сделок, график платежей и загрузка квотации — вне MVP (фаза 2); здесь только агрегаты лимита и инструкция.

---

## 2. Альтернативные сценарии и ошибки

| # | Условие | Что видит (ключ) | Действие | Событие |
|---|---|---|---|---|
| A1 | `used = 0` | Вместо пустого графика — текст `limit.not_used_yet`; доступный = одобренный | — | — |
| A2 | `available = 0` (лимит выбран полностью) | Визуализация 100 %, текст `limit.fully_used`; «Как оформить покупку» остаётся, но с подписью `limit.fully_used_hint` | поддержка | `limit_fully_used_viewed` |
| A3 | `used > approved` (ошибка данных) | `available` показываем как 0, визуализация 100 %; событие несогласованности; UI не падает | — | `data_inconsistency {kind: used_exceeds_approved}` |
| A4 | Лимит `cancelled` после активации | Блок `#limit` → `limit.cancelled`; `#how-to-buy` скрыт; шкала остаётся done до «Подписание», «Лимит активен» → `closed` | поддержка | `limit_cancelled_viewed` |
| A5 | Клиент открывает `/c/documents` | Режим чтения, баннер `documents.approved_banner` | — | — |
| A6 | Офлайн | Последние известные суммы из кэша с подписью `common.cached_at {time}`; кнопка WhatsApp работает (внешняя) | — | — |
| A7 | Очень большие суммы (≥ 10 000 000) | Форматирование с разделителями групп, без сокращений «M»; макет не ломается на 360 px | — | — |
| A8 | Английский интерфейс | Валюта «SAR 107,500»; арабский — «107,500 ر.س» (D-006), цифры западные | — | — |
| A9 | `dual`: клиент — ещё и поставщик | В `#how-to-buy` без изменений; переключение в кабинет поставщика — через шапку | — | — |

---

## 3. Состояния экранов

| Экран / блок | Состояние | Что показываем |
|---|---|---|
| `#limit` | active | Три суммы, визуализация доли, подпись «обновлено {time}» |
| `#limit` | active-not-used (A1) | Суммы, текст вместо графика |
| `#limit` | active-fully-used (A2) | 100 %, подсказка |
| `#limit` | loading | Скелетон трёх сумм |
| `#limit` | cancelled (A4) | Нейтральный текст |
| `#how-to-buy` | normal | Три шага, кнопка WhatsApp, подпись про сроки отсутствует |
| `#how-to-buy` | fully-used | То же + подпись |
| `client.home` | first-purchase | Шкала завершена, карточка «первая покупка прошла» |
| все | длинный арабский текст | Шаги инструкции до 3 строк каждый |
| все | RTL / LTR, light / dark | Полоса прогресса зеркалится по направлению заполнения; подписи сумм выровнены по началу строки; цвета визуализации — из токенов, контраст проверен в тёмной теме |

---

## 4. Тексты интерфейса (AR / EN) — предложение

| Ключ | EN | AR | Примечание |
|---|---|---|---|
| `limit.active_title` | Your trade limit is active | حدّك التجاري نشط | |
| `limit.approved` | Approved | المعتمد | подпись суммы |
| `limit.used` | Used | المستخدم | |
| `limit.available` | Available | المتاح | |
| `limit.used_share` | {percent}% used | تم استخدام {percent}% | подпись визуализации |
| `limit.not_used_yet` | You haven't used your limit yet. Your full amount is available | لم تستخدم حدّك بعد. المبلغ كامل متاح لك | A1 |
| `limit.fully_used` | Your limit is fully used | تم استخدام حدّك بالكامل | A2 |
| `limit.fully_used_hint` | As payments are made, the available amount will grow again | مع سداد الدفعات سيزداد المبلغ المتاح مجددًا | A2; без сроков |
| `limit.updated_at` | Updated {time} | آخر تحديث {time} | относительное время |
| `next_step.how_to_buy` | Ready to buy? Here's how it works with your supplier | جاهز للشراء؟ إليك كيف يتم ذلك مع مورّدك | owner = user |
| `next_step.first_purchase_done` | Your first purchase is complete. You can keep buying the same way | اكتملت عمليتك الأولى. يمكنك مواصلة الشراء بالطريقة نفسها | owner = none |
| `how_to_buy.title` | How to make a purchase | كيف تتم عملية الشراء | |
| `how_to_buy.step1` | Agree on the goods and price with your supplier | اتفق مع مورّدك على البضاعة والسعر | |
| `how_to_buy.step2` | Ask the supplier for a quotation in your company's name | اطلب من المورّد عرض سعر باسم شركتك | |
| `how_to_buy.step3` | Send the quotation to us on WhatsApp. Tadum buys the goods from your supplier, and you pay in parts | أرسل عرض السعر إلينا عبر واتساب. تشتري تدوم البضاعة من مورّدك وتسدد أنت على دفعات | разрешённые формулировки: «Tadum покупает товар у вашего поставщика», «платите частями» |
| `how_to_buy.whatsapp` | Send a quotation on WhatsApp | إرسال عرض السعر عبر واتساب | |
| `support.prefill.quotation` | Hello, I'd like to make a purchase through Tadum for {company}. Here is the quotation: | مرحبًا، أرغب في إجراء عملية شراء عبر تدوم لشركة {company}. إليكم عرض السعر: | |
| `common.cached_at` | Shown as of {time} | البيانات كما في {time} | A6 |

Проверка TOV: «торговый лимит», «купите сейчас — платите частями», «Tadum покупает товар у вашего поставщика» — из разрешённого списка; нет «кредит / процент / BNPL».

---

## 5. События аналитики

| Событие | Когда | Свойства |
|---|---|---|
| `screen_viewed` | `home` с активным лимитом | `{ screen_id, status, limit_status: 'active', used_share_bucket: '0' \| '1-25' \| '26-50' \| '51-75' \| '76-99' \| '100' }` |
| `how_to_buy_viewed` | блок попал в область видимости | `{}` |
| `how_to_buy_whatsapp_clicked` | нажата кнопка WhatsApp | `{ used_share_bucket }` |
| `limit_fully_used_viewed` | показано состояние A2 | `{}` |
| `limit_cancelled_viewed` | показано A4 | `{}` |
| `data_inconsistency` | A3 | `{ kind }` |

Суммы в события не отправляем — только корзины долей.

---

## 6. Критерии приёмки

- [ ] Три величины согласованы: `available = max(approved − used, 0)`; `used` — сумма непогашенных сделок (из мока); при `used = 0` — текст вместо графика.
- [ ] Форматирование денег по D-006: «SAR 107,500» в EN, «107,500 ر.س» в AR, западные цифры, разделители групп; суммы в `<bdi dir="ltr">` внутри арабского текста.
- [ ] Визуализация доли зеркалится в RTL, цвета из токенов, контраст в обеих темах; величина продублирована текстом (`{percent}% used`).
- [ ] Инструкция «Как оформить покупку» — три шага и кнопка WhatsApp с предзаполненным текстом на языке интерфейса; в тексте нет запрещённых слов.
- [ ] Переход `approved(active) → first_purchase` обновляет шкалу и карточку без перезагрузки; блок инструкции остаётся.
- [ ] `cancelled` и несогласованные данные (A3, A4) не ломают макет и дают нейтральные тексты.
- [ ] Тексты в `ar` и `en`; axe без нарушений; визуализация имеет текстовую альтернативу.
- [ ] Storybook: `LimitBlock` active / not-used / fully-used / cancelled / loading; `HowToBuy` normal / fully-used × AR/EN × light/dark; экстремальные суммы.
- [ ] Playwright: `client_active` → проверка сумм и формата в обеих локалях → `createDeal`+`payDeal` из демо-панели → `first_purchase`.

---

## 7. Заметки для реализации

- Визуализация — простой компонент на SVG/CSS без тяжёлых графических библиотек (бюджет размера); при появлении раздела сделок в фазе 2 решить про библиотеку отдельно.
- `used_share_bucket` вычисляется в слое аналитики, не в компоненте.
- Кнопка WhatsApp — обычная ссылка `wa.me` с `target=_blank`; в IAB WhatsApp открывается сам мессенджер.

## 8. Открытые вопросы

Решено (Кирилл, 2026-11-04): SC7-1 — визуализация доли лимита: горизонтальная полоса (D-037). SC7-2 — истории сделок на `home` в MVP нет, это фаза 2 (подтверждение рамок MVP).

Открытых вопросов по сценарию нет.

## 9. Бенчмарки

Экраны лимита/баланса с долей использования (Mobbin: BNPL, credit line dashboards, MENA) — сессия 8.
