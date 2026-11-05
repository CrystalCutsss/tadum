<!-- source: Drive 1AsDtblK9cnPAZynjX8W180tNx50acj92, synced: 2026-11-05. Не редактировать — источник в Drive. -->
# SC-05 · Ожидание проверки

| Поле | Значение |
|---|---|
| **ID** | `SC-05` |
| **Роли** | `client_contact`, `client_owner` |
| **Экраны** | `client.home`, `client.documents` (только чтение), `client.help` |
| **Предусловие** | Комплект отправлен (SC-02 или SC-04); `client_status = under_review`, `permission_state = reviewing`, `DocumentSet.status ∈ {submitted, in_review}`, `locked = true` |
| **Статусы** | Odoo: Ready for UW / Company risk assessment / Risk committee (клиенту не различаются) |
| **Цель** | Клиент понимает, что шаг на стороне Tadum, ничего делать не нужно, и знает, как связаться, если есть вопрос; не пытается менять документы |
| **Метрика** | Доля обращений в поддержку со статусом `under_review` (чем меньше, тем понятнее экран); доля повторных заходов в кабинет без действия (ожидаемо высокая — не оптимизируем) |
| **Версия прототипа** | v1 (состояние на `home`), v2 (режим чтения документов) |
| **Персоны мока** | `client_submitted` (`review_eta_hours = 24`) и вариант без `review_eta_hours` |
| **Связанные документы** | `01-roles.md` §4 (`reviewing`), `01-cabinet-structure.md` §5–6, `01-statuses.md` §2, §4 |
| **Статус** | черновик — живой каркас (вопросы закрыты) |

---

## 1. Основной сценарий

```
Дано:  client_status = under_review; комплект locked
Когда: клиент открывает /c/home
Тогда: шкала: «Документы» done, «Проверка» current, остальные upcoming;
       карточка следующего шага с owner = tadum: next_step.under_review
       (+ next_step.under_review_eta {hours}, только если review_eta_hours пришёл из данных);
       без CTA; под карточкой — SupportBar с акцентом «Есть вопрос? Напишите нам»;
       сводка документов: «Отправлено {n} документов» со ссылкой «Посмотреть»;
       событие screen_viewed {screen_id: client.home, status: under_review}

Когда: клиент открывает /c/documents
Тогда: баннер documents.submitted_banner; список документов только для чтения:
       статусы received / approved, у каждого «Скачать»; кнопок загрузки/удаления нет;
       кнопки «Отправить» нет

Когда: клиент открывает карточку документа
Тогда: файлы с «Скачать», подсказка и пример доступны (для справки), зоны загрузки нет

Когда: UW завершает проверку (мок: uwApproveApplication / uwRequestMoreDocs / uwReject)
Тогда: при следующем открытии или обновлении данных клиент попадает в SC-06 / SC-04 / SC-08 соответственно
```

Обновление данных: при возврате на вкладку (`visibilitychange`) и по интервалу (мок — 30 с, прод — по решению с бэкендом) данные заявки перезапрашиваются; смена статуса не требует перезагрузки страницы.

---

## 2. Альтернативные сценарии и ошибки

| # | Условие | Что видит (ключ) | Действие | Событие |
|---|---|---|---|---|
| A1 | `review_eta_hours` отсутствует | Текст без срока: `next_step.under_review` | — | — |
| A2 | `review_eta_hours` есть | `next_step.under_review_eta {hours}` — формулировка «обычно занимает до N часов», не обещание | — | — |
| A3 | Проверка длится дольше `review_eta_hours` | Текст не меняется на тревожный; добавляется строка `next_step.under_review_longer` «Если прошло больше времени, напишите нам» | поддержка | `review_overdue_viewed {hours_over}` |
| A4 | Клиент пытается открыть зону загрузки (старая вкладка, кэш) | Тост `documents.locked_toast` | — | — |
| A5 | Клиент пишет в поддержку | WhatsApp с готовым текстом `support.prefill.under_review` (без PII кроме названия компании) | — | `support_contact_clicked {channel, screen_id, status}` |
| A6 | Статус изменился, пока экран открыт | Данные обновились; на `home` короткий тост `status.updated` и новая шкала; без модальных окон (D-034) | — | `status_changed_while_open {from, to}` |
| A6a | Статус изменился, пока клиента не было | При следующем входе на `home` закрываемый баннер `status.changed_banner {status}` над шкалой; закрытие запоминается для этого перехода статуса (D-034) | закрыть | `status_change_banner_viewed {from, to}`, `status_change_banner_dismissed` |
| A7 | Офлайн | Шкала и статус из кэша; баннер офлайн; поддержка доступна (внешние ссылки) | — | — |
| A8 | Клиент на `Offer confirmation` (уже `approved`, но условия согласуются по телефону) | Это уже SC-06; здесь упоминание для границы: карточка `next_step.offer_confirmation` с owner = tadum | — | — |

---

## 3. Состояния экранов

| Экран | Состояние | Что показываем |
|---|---|---|
| `client.home` | under-review | Шкала, карточка «на нашей стороне», SupportBar с акцентом, сводка документов |
| `client.home` | under-review-eta | То же + строка со сроком |
| `client.home` | under-review-overdue (A3) | То же + мягкая строка про поддержку |
| `client.documents` | locked / read-only | Баннер, список со статусами и «Скачать» |
| `client.document` | read-only | Файлы, «Скачать», подсказка; без загрузки |
| все | длинный арабский текст | Карточка следующего шага до 4 строк |
| все | RTL / LTR, light / dark | Иконка «часы/ожидание» не зеркалится |

---

## 4. Тексты интерфейса (AR / EN) — предложение

| Ключ | EN | AR | Примечание |
|---|---|---|---|
| `status.client.under_review` | Under review | قيد المراجعة | статус |
| `next_step.under_review` | Our team is reviewing your documents. Nothing is needed from you right now | فريقنا يراجع مستنداتك الآن. لا حاجة لأي إجراء منك حاليًا | owner = tadum |
| `next_step.under_review_eta` | Our team is reviewing your documents. This usually takes up to {hours} hours | فريقنا يراجع مستنداتك. يستغرق ذلك عادةً حتى {hours} ساعة | только при `review_eta_hours`; «usually» — не обещание |
| `next_step.under_review_longer` | Taking longer than expected? Message us and we'll check | هل استغرق الأمر وقتًا أطول من المتوقع؟ راسلنا وسنتحقق | A3 |
| `next_step.offer_confirmation` | Your application is approved. Our team will call you to confirm the terms | تمت الموافقة على طلبك. سيتواصل معك فريقنا هاتفيًا لتأكيد الشروط | граница с SC-06 |
| `home.documents_summary` | {count} documents sent | تم إرسال {count} مستندات | сводка |
| `home.documents_view` | View | عرض | |
| `documents.submitted_banner` | Thank you. Your documents are with our team | شكرًا لك. مستنداتك الآن لدى فريقنا | = SC-02 |
| `documents.read_only_hint` | Documents can't be changed during the review | لا يمكن تعديل المستندات أثناء المراجعة | подпись под списком |
| `support.cta.question` | Have a question? Message us | لديك سؤال؟ راسلنا | акцент в SupportBar |
| `support.prefill.under_review` | Hello, I have a question about my Tadum application for {company}. | مرحبًا، لديّ سؤال بخصوص طلبي في تدوم لشركة {company}. | текст в WhatsApp |
| `status.updated` | Your status was updated | تم تحديث حالة طلبك | тост A6 |
| `status.changed_banner` | Since your last visit: {status} | منذ زيارتك الأخيرة: {status} | баннер A6a; `{status}` — текст нового статуса |
| `status.changed_banner.dismiss` | Got it | حسنًا | |

---

## 5. События аналитики

| Событие | Когда | Свойства |
|---|---|---|
| `screen_viewed` | `home` в `under_review` | `{ screen_id, status: 'under_review', has_eta, hours_since_submit }` |
| `review_overdue_viewed` | показана строка A3 | `{ hours_over }` |
| `support_contact_clicked` | из любого экрана в этом статусе | `{ channel, screen_id, status: 'under_review' }` |
| `documents_viewed_locked` | открыт список документов в режиме чтения | `{ documents_count }` |
| `status_changed_while_open` | статус сменился без перезагрузки | `{ from, to }` |
| `status_change_banner_viewed` / `status_change_banner_dismissed` | баннер о смене статуса показан / закрыт | `{ from, to }` |
| `document_file_downloaded` | скачан файл | `{ portal_key, status }` |

---

## 6. Критерии приёмки

- [ ] В `under_review` нет ни одного элемента управления загрузкой/удалением/отправкой ни на одном экране; попытка через старую вкладку даёт тост.
- [ ] Карточка следующего шага явно говорит, что шаг на стороне Tadum и действий не нужно; срок показывается только при наличии `review_eta_hours` и формулируется как «обычно».
- [ ] SupportBar на этом экране заметнее, чем на других (акцентная строка), и открывает WhatsApp с предзаполненным текстом без телефона клиента.
- [ ] Смена статуса подхватывается при возврате на вкладку и по интервалу без перезагрузки; переходы в SC-04 / SC-06 / SC-08 работают из этого состояния.
- [ ] Уведомление о смене статуса внутри портала (D-034): тост при открытом экране, закрываемый баннер на `home` при следующем входе; закрытие баннера запоминается.
- [ ] Шкала соответствует таблице истинности (`under_review`: documents done, review current).
- [ ] Тексты в `ar` и `en`; никаких обещаний сроков вне `review_eta_hours`.
- [ ] axe без нарушений; смена статуса объявляется через `aria-live="polite"`.
- [ ] Storybook: `client.home` under-review / with-eta / overdue; `client.documents` read-only × AR/EN × light/dark.
- [ ] Playwright: `client_submitted` → проверка отсутствия контролов → `uwApproveApplication` из демо-панели → шкала обновилась без перезагрузки.

---

## 7. Заметки для реализации

- `review_eta_hours` — единственный источник срока; в моке у `client_submitted` он есть, у второго варианта персоны — нет (обе истории в Storybook).
- Интервал обновления данных — константа в `shared/config`, разная для демо и прода; в тестах — отключается.
- Текст для WhatsApp формируется на языке интерфейса и кодируется в `wa.me/966579768881?text=…`.

## 8. Открытые вопросы

Решено (Кирилл, 2026-11-04): SC5-1 — `review_eta_hours` поддерживаем как опциональное поле; если бэкенд его не отдаёт — текст без срока (D-033). SC5-2 — уведомление о смене статуса **внутри портала нужно** (D-034): тост, если экран открыт (A6), и закрываемый баннер `status.changed_banner` на `home` при следующем входе, пока клиент его не закрыл; push и WhatsApp из портала — нет, это каналы вне портала.

Открытых вопросов по сценарию нет.

## 9. Бенчмарки

Экраны «заявка на рассмотрении» с понятным ожиданием (Mobbin: fintech onboarding, application status) — сессия 8.
