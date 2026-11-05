<!-- source: Drive 1KrxQawcS7rbPNlXYx6jIBa9mQy0N68gp, synced: 2026-11-05. Не редактировать — источник в Drive. -->
# SC-08 · Заявка закрыта (cancelled, rejected)

| Поле | Значение |
|---|---|
| **ID** | `SC-08` |
| **Роли** | `client_contact`, `client_owner` |
| **Экраны** | `client.closed` (`/c/closed`), `client.reapply` (`/c/reapply`, D-038), `client.documents` (только чтение), `client.help` |
| **Предусловие** | `client_status = closed`, `permission_state = closed`; лимит (если был) `rejected` или `cancelled` |
| **Статусы** | Odoo: Rejected by UW или Lost (любая причина). Клиенту обе стадии показываются одинаково |
| **Цель** | Клиент спокойно узнаёт, что заявка закрыта, без причины и без ощущения тупика: видит путь к новой заявке и к поддержке; свои документы может скачать |
| **Метрика** | Доля закрытых, нажавших «Подать заявку» или написавших в поддержку; доля обращений с вопросом «почему» (сигнал, что текст непонятен) |
| **Версия прототипа** | v4 |
| **Персоны мока** | `client_closed_rejected` (Rejected by UW, лимит `rejected`), `client_closed_lost` (Lost, лимита не было) |
| **Связанные документы** | `01-roles.md` §4 (`closed`), §6 (причины не показываем); `01-cabinet-structure.md` §1, §5; `01-statuses.md` §2, §6 |
| **Статус** | черновик — живой каркас (вопросы закрыты) |

---

## 1. Основной сценарий

```
Дано:  client_status = closed (мок: uwReject() или salesLose())
Когда: клиент входит или открывает любой маршрут /c/*
Тогда: редирект на /c/closed (гард client_status == closed);
       экран client.closed: шкала скрыта; карточка closed.title + closed.body — нейтрально,
       без причины и без слов «отказ»/«отклонена» в заголовке;
       два действия: «Подать новую заявку» (→ /c/reapply, D-038) и «Связаться с поддержкой» (WhatsApp);
       ссылка «Мои документы» → /c/documents (режим чтения, можно скачать);
       событие screen_viewed {screen_id: client.closed, closed_kind: internal-only}

Когда: клиент нажимает «Подать новую заявку»
Тогда: открывается страница /c/reapply внутри кабинета (D-038): в первой версии — заглушка с коротким
       текстом reapply.body и одной кнопкой «Создать заявку»; событие closed_reapply_clicked

Когда: клиент нажимает «Создать заявку» на /c/reapply
Тогда: мок создаёт новую заявку для этого номера (старая остаётся closed; правило «1 активная заявка
       на пользователя» соблюдено); client_status новой заявки = docs_required; редирект на /c/home
       (SC-02); событие reapply_submitted. С бэкендом: вызов порта createApplication(), содержимое формы
       определим позже — пока без полей

Когда: клиент открывает /c/documents
Тогда: баннер documents.closed_banner; список документов только для чтения со «Скачать»;
       событие documents_viewed_locked {status: closed}
```

`closed_kind` (rejected / lost) в UI **не** различается и в аналитику отправляется только как `internal` категория без причины — для воронки, не для показа.

---

## 2. Альтернативные сценарии и ошибки

| # | Условие | Что видит (ключ) | Действие | Событие |
|---|---|---|---|---|
| A1 | Заявка закрыта как `Lost` до загрузки документов (клиент так и не вернулся) | Тот же экран; «Мои документы» ведёт на пустой список с `documents.none_uploaded` | — | — |
| A2 | У клиента был активный лимит, затем `cancelled` | Экран `client.closed` с дополнительной строкой `closed.limit_cancelled_hint` (нейтрально) | поддержка | `limit_cancelled_viewed` |
| A3 | Клиент пытается открыть `/c/home`, `/c/documents/:key` для загрузки | Редирект на `/c/closed`; документы — только чтение | — | — |
| A4 | Клиент — `dual` (есть кабинет поставщика) | Экран закрытой клиентской заявки; переключатель ролей в шапке работает; кабинет поставщика не затронут | переключить роль | `role_switched` |
| A5 | Через время у того же номера появилась новая активная заявка (Odoo) | При следующем входе `resolveRoles` находит новую заявку → обычный кабинет (SC-01/SC-02); старая не показывается | — | `auth_login_succeeded` |
| A6 | Клиент пишет в поддержку | WhatsApp с `support.prefill.closed {company}` | — | `support_contact_clicked {status: closed}` |
| A7 | Сессия истекает в `closed` | Обычный `auth.expired` → вход → снова `/c/closed` | — | — |
| A8 | Офлайн | Экран из кэша; обе кнопки — внешние ссылки, работают | — | — |

---

## 3. Состояния экранов

| Экран | Состояние | Что показываем |
|---|---|---|
| `client.closed` | normal | Заголовок, нейтральный текст, две кнопки, ссылка на документы, SupportBar |
| `client.closed` | with-limit-hint (A2) | + строка про лимит |
| `client.reapply` | stub (v1) | Заголовок, короткий текст, одна кнопка «Создать заявку», SupportBar |
| `client.reapply` | submitting | Кнопка в состоянии загрузки |
| `client.documents` | closed-read-only | Баннер `documents.closed_banner`, список со «Скачать» |
| `client.documents` | closed-empty (A1) | `documents.none_uploaded` |
| все | длинный арабский текст | Текст карточки до 4 строк |
| все | RTL / LTR, light / dark | Иконка состояния нейтральная (не «ошибка»), не зеркалится |

Навигация: нижняя панель в `closed` сокращена до «Главная» (= `/c/closed`), «Документы», «Помощь».

---

## 4. Тексты интерфейса (AR / EN) — предложение

| Ключ | EN | AR | Примечание |
|---|---|---|---|
| `status.client.closed` | Closed | مغلق | статус |
| `closed.title` | This application is closed | تم إغلاق هذا الطلب | нейтрально, без «отказ» |
| `closed.body` | We're not able to continue with this application right now. You're welcome to apply again, and our team is here if you have questions | لا يمكننا المتابعة في هذا الطلب حاليًا. يسعدنا استقبال طلب جديد منك، وفريقنا جاهز للإجابة عن أسئلتك | без причины, без сроков, без обещаний одобрения |
| `closed.reapply` | Apply again | تقديم طلب جديد | → `/c/reapply` |
| `reapply.title` | New application | طلب جديد | страница `/c/reapply` |
| `reapply.body` | You can submit a new application for {company}. Our team will review it the same way | يمكنك تقديم طلب جديد لشركة {company}. سيراجعه فريقنا بالطريقة نفسها | заглушка v1; без обещаний исхода |
| `reapply.submit` | Create application | إنشاء الطلب | |
| `closed.support` | Contact support | تواصل مع الدعم | |
| `closed.documents_link` | My documents | مستنداتي | |
| `closed.limit_cancelled_hint` | Your trade limit is no longer active | حدّك التجاري لم يعد نشطًا | A2 |
| `documents.closed_banner` | Your documents are available for download | مستنداتك متاحة للتنزيل | |
| `documents.none_uploaded` | No documents were uploaded for this application | لم يتم رفع أي مستندات لهذا الطلب | A1 |
| `support.prefill.closed` | Hello, I have a question about my Tadum application for {company}. | مرحبًا، لديّ سؤال بخصوص طلبي في تدوم لشركة {company}. | |

Правило: причина закрытия, стадия Odoo, заметки UW и скоринг не передаются в порт и не показываются (`01-roles.md` §6). Фраза «подать снова» не обещает другого исхода.

---

## 5. События аналитики

| Событие | Когда | Свойства |
|---|---|---|
| `screen_viewed` | показан `client.closed` | `{ screen_id, had_limit: boolean }` |
| `closed_reapply_clicked` | нажата «Подать новую заявку» | `{}` |
| `reapply_submitted` | нажата «Создать заявку» на `/c/reapply` | `{}` |
| `support_contact_clicked` | из закрытого состояния | `{ channel, screen_id, status: 'closed' }` |
| `documents_viewed_locked` | открыт список документов | `{ status: 'closed', documents_count }` |
| `document_file_downloaded` | скачан файл | `{ portal_key, status: 'closed' }` |

Причина закрытия в аналитику **не** отправляется.

---

## 6. Критерии приёмки

- [ ] Любой маршрут `/c/*` в `closed` ведёт на `/c/closed`, кроме `/c/reapply`, `/c/documents*` (чтение) и `/c/help`.
- [ ] На экране нет причины, стадии, слов «отказ» / «отклонена» в заголовке; текст нейтральный и одинаковый для Rejected by UW и Lost.
- [ ] Две кнопки работают: «Подать новую заявку» открывает `/c/reapply`, где кнопка «Создать заявку» в моке создаёт новую заявку и ведёт на `/c/home`; WhatsApp — с предзаполненным текстом без PII кроме названия компании.
- [ ] Документы доступны для скачивания; загрузка невозможна; пустой список имеет своё состояние.
- [ ] `dual` сохраняет доступ к кабинету поставщика.
- [ ] Шкала прогресса скрыта (таблица истинности: `closed` → карточка вместо шкалы).
- [ ] Тексты в `ar` и `en`; axe без нарушений.
- [ ] Storybook: `client.closed` normal / with-limit-hint; `client.documents` closed-read-only / closed-empty × AR/EN × light/dark.
- [ ] Playwright: `client_closed_rejected` и `client_closed_lost` — редиректы, кнопки, документы; `dual` + закрытая заявка — переключение роли.

---

## 7. Заметки для реализации

- Гард `closed` — на уровне layout `/c`, чтобы не дублировать в каждом маршруте.
- Нижняя навигация строится от `permission_state`, а не от статуса, чтобы правило «что доступно в closed» жило в одном месте (`01-roles.md` §4).
- `/c/reapply` доступен только при `permission_state == closed`; из других состояний — редирект на `home`. Порт `createApplication()` в моке возвращает новую заявку `docs_required` с пустым комплектом раунда 1; персона `client_closed_lost` после нажатия ведёт себя как `client_new`.

## 8. Открытые вопросы

Решено (Кирилл, 2026-11-04): SC8-1 — «Подать новую заявку» ведёт на отдельную страницу внутри кабинета `/c/reapply`; в первой версии это заглушка с текстом и кнопкой «Создать заявку» (правило «1 заявка = 1 пользователь = 1 лимит» сохраняется: новая заявка создаётся только когда старая закрыта) — D-038. SC8-2 — закрытая заявка и её документы доступны в кабинете без ограничения по времени в MVP; срок хранения решит бэкенд.

Открытых вопросов по сценарию нет.

## 9. Бенчмарки

Экраны «заявка закрыта / не одобрена» с нейтральным тоном и путём дальше (Mobbin: fintech decline states) — сессия 8.
