<!-- Генерируется: pnpm contract:md (scripts/contract-md.mjs) из src/shared/api/ports/*. Не редактировать вручную. -->
# Контракт бэкенда для портала Tadum

Документ для команды, которая подключит API над Odoo вместо мока. Фронтенд работает только через порты
`src/shared/api/ports/ports.ts`; сейчас их реализует `MockAdapter`, а `HttpAdapter` — каркас, где каждый метод
бросает `NotImplementedError(port, method)`. Переключение — переменная `VITE_API_MODE=http`; код экранов не меняется,
если API отдаёт данные в форме, описанной ниже. OpenAPI и клиент `openapi-ts` появятся позже, по этому документу.

## 1. Общие правила

- Имена полей и значения перечислений — **ровно** как в `docs/product/01-entities.md` §2 и §4 и `01-statuses.md`; Zod-схемы `src/shared/api/ports/schemas.ts` — их копия в коде. Ответ, не прошедший схему, фронтенд считает ошибкой сервера.
- Даты — ISO 8601 в UTC. Деньги — `{ amount_minor: целые халалы, currency: 'SAR' }`.
- Бэкенд отдаёт уже вычисленные поля: `client_status`, `permission_state` и `next_step` у заявки, `supplier_status`, `next_step` и `counters` у поставщика, `used`/`available` у лимита. Правила вычисления — `01-statuses.md` (маппинг стадий Odoo §1–2, статус поставщика §3, «следующий шаг» — `01-cabinet-structure.md` §6); фронтенд реализует их в `src/entities/*`, и мок пользуется той же реализацией. `odoo_stage` — служебное поле, в интерфейс не выводится.
- Предполагаемые источники полей в Odoo (`crm.lead`, Doc Collection Engine, `tadum.supplier`) — пометки `odoo:` в `01-entities.md` §2; это гипотезы, их подтверждает команда бэкенда.
- Видимость полей по ролям — `01-entities.md` §5. Поставщик получает только проекцию `ReferredClient`, не заявку целиком.

## 2. Порты и методы

### `auth` — `AuthPort`

| Метод | Сигнатура | Ответ описан в | Примечание |
|---|---|---|---|
| `requestOtp` | `requestOtp(phone: string): Promise<OtpChallenge>` | ниже, «Вспомогательные типы» | — |
| `verifyOtp` | `verifyOtp(phone: string, code: string): Promise<Session>` | `01-roles.md` §1 | Неверный код, истёк, попытки, неизвестный номер — DomainError с кодом из 01-roles.md §3. |
| `getSession` | `getSession(): Promise<Session \| null>` | `01-roles.md` §1 | — |
| `logout` | `logout(): Promise<void>` | — | — |

### `application` — `ApplicationPort`

| Метод | Сигнатура | Ответ описан в | Примечание |
|---|---|---|---|
| `getCurrent` | `getCurrent(): Promise<Application>` | `01-entities.md` §2.3 | — |
| `createApplication` | `createApplication(): Promise<Application>` | `01-entities.md` §2.3 | Только из `closed` (D-038): новая заявка, старая остаётся закрытой. |

### `documents` — `DocumentsPort`

| Метод | Сигнатура | Ответ описан в | Примечание |
|---|---|---|---|
| `getSet` | `getSet(owner: DocumentSetOwner): Promise<DocumentSet>` | `01-entities.md` §2.4 | — |
| `upload` | `upload(documentId: string, file: UploadFile, options?: UploadOptions): Promise<UploadResult>` | ниже, «Вспомогательные типы» | — |
| `replace` | `replace(documentId: string, fileId: string, file: UploadFile, options?: UploadOptions): Promise<UploadResult>` | ниже, «Вспомогательные типы» | — |
| `delete` | `delete(documentId: string, fileId: string): Promise<Document>` | `01-entities.md` §2.5 | — |
| `submit` | `submit(setId: string): Promise<DocumentSet>` | `01-entities.md` §2.4 | — |
| `download` | `download(fileId: string): Promise<DownloadLink>` | ниже, «Вспомогательные типы» | Прямая ссылка (не blob:), DoD. |

### `limit` — `LimitPort`

| Метод | Сигнатура | Ответ описан в | Примечание |
|---|---|---|---|
| `get` | `get(): Promise<Limit>` | `01-entities.md` §2.7 | — |
| `getChecklist` | `getChecklist(): Promise<OnboardingChecklist>` | `01-entities.md` §2.8 | — |

### `supplier` — `SupplierPort`

| Метод | Сигнатура | Ответ описан в | Примечание |
|---|---|---|---|
| `get` | `get(): Promise<Supplier>` | `01-entities.md` §2.10 | — |
| `getCounters` | `getCounters(): Promise<SupplierCounters>` | `01-entities.md` §2.10 (`counters`) | — |

### `referredClients` — `ReferredClientsPort`

| Метод | Сигнатура | Ответ описан в | Примечание |
|---|---|---|---|
| `list` | `list(query?: ReferredClientsQuery): Promise<ReferredClientsPage>` | `01-entities.md` §2.11 (страница) | Только проекция ReferredClient; фильтр и сортировка — на стороне порта. |

### `offer` — `OfferPort`

| Метод | Сигнатура | Ответ описан в | Примечание |
|---|---|---|---|
| `get` | `get(): Promise<OfferContent>` | `01-entities.md` §2.12 | — |

### Вспомогательные типы

Определены в `src/shared/api/ports/ports.ts`:

```ts
const OtpChannelSchema = z.enum(['sms', 'whatsapp']);

const OtpChallengeSchema = z.object({
  channel: OtpChannelSchema,
  length: z.number().int(),
  expires_at: DateTimeSchema,
  resend_available_at: DateTimeSchema,
  attempts_left: z.number().int().nonnegative(),
});

const UploadResultSchema = z.object({
  document: DocumentSchema,
  /** `failed` — файл не принят, документ не изменился (SC-02 A3). */
  prevalidation: PrevalidationResultSchema,
});

const DownloadLinkSchema = z.object({ url: z.string() });

const ReferredClientsPageSchema = z.object({
  items: z.array(ReferredClientSchema),
  next_cursor: z.string().nullable(),
  total: z.number().int().nonnegative(),
});
```

Входные типы методов:

```ts
type DocumentSetOwner = DocumentSet['owner'];

interface UploadFile {
  readonly name: string;
  readonly type: string;
  readonly size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
}

type ReferredClientsSort = 'applied' | 'updated';

interface ReferredClientsQuery {
  statuses?: readonly SupplierViewStatus[];
  /** По умолчанию `applied` (applied_at desc), SP-04. */
  sort?: ReferredClientsSort;
  cursor?: string | null;
}

const REFERRED_CLIENTS_PAGE_SIZE = 20;
```

## 3. Ошибки

Соответствие HTTP-кодам — предложение фронтенда; окончательно его фиксирует бэкенд.

| Класс | `kind` | HTTP | Когда |
|---|---|---|---|
| `NetworkError` | `network` | нет ответа (сеть, CORS, таймаут) | Нет сети (офлайн, обрыв). |
| `ServerError` | `server` | 5xx или ответ не прошёл Zod-валидацию | 5xx или ответ, не прошедший Zod-валидацию. |
| `NotFound` | `not_found` | 404 | — |
| `Forbidden` | `forbidden` | 403 | Нет прав на ресурс (чужая семья ролей). |
| `Unauthorized` | `unauthorized` | 401 — сессии нет или истекла | 401: сессия истекла или отсутствует (SC-01 A11, `expireSession()`). |
| `NotImplementedError` | `not_implemented` | — (метод ещё не подключён) | Метод HttpAdapter ещё не подключён к бэкенду. |
| `DomainError` | `domain` | предложение: 409 / 422 с телом `{ "code": DomainErrorCode, "details"?: Record<string, number> }` | Бизнес-отказ (4xx с кодом). `details` — числа для текста (попытки, секунды). |

Коды бизнес-отказов (`DomainError.code`) — ключи ошибок из сценариев и `01-roles.md` §3:
`otp_invalid`, `otp_expired`, `otp_too_many_attempts`, `otp_rate_limited`, `otp_resend_too_early`, `phone_unknown`, `document_set_locked`, `document.same_file_rejected`, `upload.error.too_large`, `upload.error.unsupported_type`, `documents.submit_incomplete`, `application_not_closed`, `limit_exceeded`, `not_allowed`.

## 4. Вход и сессия

- OTP: 4 цифры, живёт 5 минут, 5 попыток, повторная отправка через 40 с (D-021); канал (SMS или WhatsApp) выбирает бэкенд и сообщает в ответе `requestOtp` (D-027). Ограничение частоты запросов — на стороне бэкенда (в моке — больше 3 за 10 минут).
- Роли не хранятся в портале: бэкенд вычисляет их по номеру при каждом входе — `crm.lead.phone` → `client_contact`, `lead_main_owner_phone` → `client_owner`, номер в записи поставщика → `supplier` (`01-roles.md` §2, TADUM-629). Номер без заявки и поставщика — `phone_unknown`, сессия не создаётся.
- Если у номера несколько заявок, текущая — последняя по дате создания (SC-09); закрытая заявка остаётся доступной для чтения.
- Сессия — 30 дней, без таймаута неактивности (D-007); истёкшая сессия — 401 на любом методе. Способ хранения сессии решает бэкенд; предложение — httpOnly cookie, чтобы фронтенд не держал токен в хранилище браузера.

## 5. Документы

- Состав комплекта и обязательность задаёт Odoo; каталог типов открыт (`01-entities.md` §3) — новый `portal_key` не требует правок фронтенда, кроме текстов.
- Статусы документа `pending / received / rejected / approved` — все четыре обязательны в ответе, включая `rejected` (SP-03 A10, SFL-489). Если Odoo не различает `approved`, после `completed` все не-`rejected` отдаются как `approved` (S-2).
- После `submit` комплект блокируется **сразу** (`locked = true`), любые правки файлов — `document_set_locked` (`01-statuses.md` §4). Автополнота — 10 минут после последней загрузки (`completion_grace_until`).
- Дозапрос создаёт новый комплект с `round + 1`, в нём только запрошенные документы (D-031); прежние комплекты нужны для истории (SC-04: в данных заявки или отдельным методом — решает бэкенд).
- `upload` возвращает результат предвалидации; при `failed` файл не сохраняется. Повторная загрузка файла, который уже отклоняли, — `document.same_file_rejected` (по SHA-256, TADUM-536).
- Скачивание — прямой URL с `Content-Disposition`, не `blob:`: встроенный браузер WhatsApp иначе не скачает файл.

## 6. Обновление статусов

Отдельного канала событий нет: фронтенд перезапрашивает заявку, лимит и чек-лист по интервалу и при возврате на вкладку (D-035; в моке — 30 с, в проде — по согласованию с бэкендом). Статус берётся только из ответа бэкенда.

## 7. Условия и материалы поставщика

Текст условий и список материалов — статический JSON в репозитории портала (`content/offer.{ar,en}.json`), обновляется PR-ом (D-041). Эндпоинт не нужен, пока нет CMS.

## 8. Требование к лендингу (D-039)

Портал первичные заявки не создаёт. Лендинг обязан до создания заявки проверить, нет ли активной заявки на этот номер телефона, и если есть — передать клиента в портал редиректом
`/login?returnTo=/c/home&src=landing&lang=<ar|en>`. Новая заявка из портала возможна только после закрытой (`createApplication`, D-038).

## 9. Открытые вопросы к бэкенду

Из `01-entities.md` §7 и `01-statuses.md` §11 — по умолчанию фронтенд работает так, как указано в этих таблицах:

- E-1 — отдаёт ли бэкенд текст причины отказа (`reject_reason_text`) или только ключ тега (`reject_reason_key`); поддержаны оба, приоритет у текста.
- E-3 — `sup_vat` — отдельный ключ (по умолчанию да).
- S-1 — статус записи поставщика в Odoo и его маппинг (по умолчанию вычисляется из комплекта документов, `01-statuses.md` §3).
- S-2 — есть ли у документа статус `approved` в Odoo.
