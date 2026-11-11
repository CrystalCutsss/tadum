// pnpm contract:md — генерирует docs/05-backend-contract.md из портов (src/shared/api/ports/*.ts).
// pnpm contract:md --check — падает, если документ отстал от кода (входит в verify).
// Сигнатуры, схемы ответов и коды ошибок берутся из кода; пояснения — из этого скрипта.
import { readFileSync, writeFileSync } from 'node:fs';

import ts from 'typescript';

const OUT = 'docs/05-backend-contract.md';
const PORTS = 'src/shared/api/ports/ports.ts';
const RESPONSES = 'src/shared/api/ports/response-schemas.ts';
const CONSTANTS = 'src/shared/api/ports/constants.ts';
const ERRORS = 'src/shared/api/ports/errors.ts';

const parse = (file) => ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
const ports = parse(PORTS);
const responses = parse(RESPONSES);
const constants = parse(CONSTANTS);
const errors = parse(ERRORS);
const oneLine = (s) => s.replace(/\s+/g, ' ').replace(/\(\s/g, '(').replace(/\s\)/g, ')').trim();

function jsdoc(node, sf) {
  const ranges = ts.getLeadingCommentRanges(sf.text, node.pos) ?? [];
  return ranges
    .map((r) => sf.text.slice(r.pos, r.end))
    .filter((c) => c.startsWith('/**'))
    .map((c) =>
      c
        .replace(/^\/\*\*|\*\/$/g, '')
        .split('\n')
        .map((l) => l.replace(/^\s*\*\s?/, '').trim())
        .filter(Boolean)
        .join(' '),
    )
    .join(' ');
}

// ---------- Порты ----------

const PORT_ORDER = ['auth', 'application', 'documents', 'limit', 'supplier', 'referredClients', 'offer'];
const interfaces = new Map();
ports.forEachChild((n) => {
  if (ts.isInterfaceDeclaration(n)) interfaces.set(n.name.text, n);
});

const portsIface = interfaces.get('Ports');
const portTypes = new Map(portsIface.members.map((m) => [m.name.getText(ports), m.type.getText(ports)]));

/** Где описан тип ответа. */
const ENTITY_LINKS = {
  Session: '`01-roles.md` §1',
  Application: '`01-entities.md` §2.3',
  Company: '`01-entities.md` §2.2',
  DocumentSet: '`01-entities.md` §2.4',
  Document: '`01-entities.md` §2.5',
  Limit: '`01-entities.md` §2.7',
  OnboardingChecklist: '`01-entities.md` §2.8',
  Supplier: '`01-entities.md` §2.10',
  SupplierCounters: '`01-entities.md` §2.10 (`counters`)',
  ReferredClientsPage: '`01-entities.md` §2.11 (страница)',
  OfferContent: '`01-entities.md` §2.12',
  OtpChallenge: 'ниже, «Вспомогательные типы»',
  UploadResult: 'ниже, «Вспомогательные типы»',
  DownloadLink: 'ниже, «Вспомогательные типы»',
};

/** Код в ячейке таблицы: `|` из типов экранируется. */
const cell = (s) => `\`${s.replace(/\|/g, '\\|')}\``;

function portSection(key) {
  const typeName = portTypes.get(key);
  const iface = interfaces.get(typeName);
  const lines = [`### \`${key}\` — \`${typeName}\``, '', '| Метод | Сигнатура | Ответ описан в | Примечание |', '|---|---|---|---|'];
  for (const m of iface.members) {
    if (!ts.isMethodSignature(m)) continue;
    const name = m.name.getText(ports);
    const params = m.parameters.map((p) => oneLine(p.getText(ports))).join(', ');
    const ret = oneLine(m.type.getText(ports));
    const inner = ret.replace(/^Promise<(.*)>$/, '$1');
    const links = [...new Set(inner.match(/[A-Z][A-Za-z]+/g) ?? [])].map((t) => ENTITY_LINKS[t]).filter(Boolean);
    lines.push(`| \`${name}\` | ${cell(`${name}(${params}): ${ret}`)} | ${links.join(', ') || '—'} | ${jsdoc(m, ports) || '—'} |`);
  }
  return lines.join('\n');
}

// ---------- Вспомогательные схемы ответов ----------

function schemaText(name) {
  let text = null;
  responses.forEachChild((n) => {
    if (!ts.isVariableStatement(n)) return;
    for (const d of n.declarationList.declarations) if (d.name.getText(responses) === name) text = d.initializer.getText(responses);
  });
  if (!text) throw new Error(`${RESPONSES}: нет схемы ${name}`);
  return text;
}

const AUX = ['OtpChannelSchema', 'OtpChallengeSchema', 'UploadResultSchema', 'DownloadLinkSchema', 'ReferredClientsPageSchema'];

/** Входные типы методов — текстом объявлений из ports.ts. */
const INPUT_TYPES = ['DocumentSetOwner', 'UploadFile', 'UploadOptions', 'ReferredClientsSort', 'ReferredClientsQuery', 'REFERRED_CLIENTS_PAGE_SIZE'];
function declarationText(name) {
  for (const sf of [ports, constants]) {
    let text = null;
    sf.forEachChild((n) => {
      if (ts.isExportDeclaration(n)) return;
      const id = n.name?.getText?.(sf) ?? (ts.isVariableStatement(n) ? n.declarationList.declarations[0].name.getText(sf) : null);
      if (id === name) text = n.getText(sf).replace(/^export /, '');
    });
    if (text) return text;
  }
  throw new Error(`${PORTS}, ${CONSTANTS}: нет объявления ${name}`);
}

// ---------- Ошибки ----------

const errorClasses = [];
errors.forEachChild((n) => {
  if (!ts.isClassDeclaration(n) || !n.heritageClauses) return;
  const kind = n.members.find((m) => ts.isPropertyDeclaration(m) && m.name.getText(errors) === 'kind')?.initializer?.getText(errors);
  if (kind) errorClasses.push({ name: n.name.text, kind: kind.replace(/'/g, ''), doc: jsdoc(n, errors) });
});

let domainCodes = [];
errors.forEachChild((n) => {
  if (ts.isTypeAliasDeclaration(n) && n.name.text === 'DomainErrorCode') {
    domainCodes = n.type.types.map((t) => t.literal.text);
  }
});

const HTTP = {
  network: 'нет ответа (сеть, CORS, таймаут)',
  server: '5xx или ответ не прошёл Zod-валидацию',
  not_found: '404',
  forbidden: '403',
  unauthorized: '401 — сессии нет или истекла',
  not_implemented: '— (метод ещё не подключён)',
  domain: 'предложение: 409 / 422 с телом `{ "code": DomainErrorCode, "details"?: Record<string, number> }`',
};

// ---------- Документ ----------

const doc = `<!-- Генерируется: pnpm contract:md (scripts/contract-md.mjs) из src/shared/api/ports/*. Не редактировать вручную. -->
# Контракт бэкенда для портала Tadum

Документ для команды, которая подключит API над Odoo вместо мока. Фронтенд работает только через порты
\`src/shared/api/ports/ports.ts\`; сейчас их реализует \`MockAdapter\`, а \`HttpAdapter\` — каркас, где каждый метод
бросает \`NotImplementedError(port, method)\`. Переключение — переменная \`VITE_API_MODE=http\`; код экранов не меняется,
если API отдаёт данные в форме, описанной ниже. OpenAPI и клиент \`openapi-ts\` появятся позже, по этому документу.

## 1. Общие правила

- Имена полей и значения перечислений — **ровно** как в \`docs/product/01-entities.md\` §2 и §4 и \`01-statuses.md\`; Zod-схемы \`src/shared/api/ports/schemas.ts\` — их копия в коде. Ответ, не прошедший схему, фронтенд считает ошибкой сервера.
- Даты — ISO 8601 в UTC. Деньги — \`{ amount_minor: целые халалы, currency: 'SAR' }\`.
- Бэкенд отдаёт уже вычисленные поля: \`client_status\`, \`permission_state\` и \`next_step\` у заявки, \`supplier_status\`, \`next_step\` и \`counters\` у поставщика, \`used\`/\`available\` у лимита. Правила вычисления — \`01-statuses.md\` (маппинг стадий Odoo §1–2, статус поставщика §3, «следующий шаг» — \`01-cabinet-structure.md\` §6); фронтенд реализует их в \`src/entities/*\`, и мок пользуется той же реализацией. \`odoo_stage\` — служебное поле, в интерфейс не выводится.
- Предполагаемые источники полей в Odoo (\`crm.lead\`, Doc Collection Engine, \`tadum.supplier\`) — пометки \`odoo:\` в \`01-entities.md\` §2; это гипотезы, их подтверждает команда бэкенда.
- Видимость полей по ролям — \`01-entities.md\` §5. Поставщик получает только проекцию \`ReferredClient\`, не заявку целиком.

## 2. Порты и методы

${PORT_ORDER.map(portSection).join('\n\n')}

### Вспомогательные типы

Определены в \`src/shared/api/ports/response-schemas.ts\`:

\`\`\`ts
${AUX.map((n) => `const ${n} = ${schemaText(n)};`).join('\n\n')}
\`\`\`

Входные типы методов (\`ports.ts\`, \`constants.ts\`):

\`\`\`ts
${INPUT_TYPES.map(declarationText).join('\n\n')}
\`\`\`

## 3. Ошибки

Соответствие HTTP-кодам — предложение фронтенда; окончательно его фиксирует бэкенд.

| Класс | \`kind\` | HTTP | Когда |
|---|---|---|---|
${errorClasses.map((e) => `| \`${e.name}\` | \`${e.kind}\` | ${HTTP[e.kind] ?? '—'} | ${e.doc || '—'} |`).join('\n')}

Коды бизнес-отказов (\`DomainError.code\`) — ключи ошибок из сценариев и \`01-roles.md\` §3:
${domainCodes.map((c) => `\`${c}\``).join(', ')}.

## 4. Вход и сессия

- OTP: 4 цифры, живёт 5 минут, 5 попыток, повторная отправка через 40 с (D-021); канал (SMS или WhatsApp) выбирает бэкенд и сообщает в ответе \`requestOtp\` (D-027). Ограничение частоты запросов — на стороне бэкенда (в моке — больше 3 за 10 минут).
- Роли не хранятся в портале: бэкенд вычисляет их по номеру при каждом входе — \`crm.lead.phone\` → \`client_contact\`, \`lead_main_owner_phone\` → \`client_owner\`, номер в записи поставщика → \`supplier\` (\`01-roles.md\` §2, TADUM-629). Номер без заявки и поставщика — \`phone_unknown\`, сессия не создаётся.
- Если у номера несколько заявок, текущая — последняя по дате создания (SC-09); закрытая заявка остаётся доступной для чтения.
- Сессия — 30 дней, без таймаута неактивности (D-007); истёкшая сессия — 401 на любом методе. Способ хранения сессии решает бэкенд; предложение — httpOnly cookie, чтобы фронтенд не держал токен в хранилище браузера.

## 5. Документы

- Состав комплекта и обязательность задаёт Odoo; каталог типов открыт (\`01-entities.md\` §3) — новый \`portal_key\` не требует правок фронтенда, кроме текстов.
- Статусы документа \`pending / received / rejected / approved\` — все четыре обязательны в ответе, включая \`rejected\` (SP-03 A10, SFL-489). Если Odoo не различает \`approved\`, после \`completed\` все не-\`rejected\` отдаются как \`approved\` (S-2).
- После \`submit\` комплект блокируется **сразу** (\`locked = true\`), любые правки файлов — \`document_set_locked\` (\`01-statuses.md\` §4). Автополноты в прототипе нет (A-061): комплект уходит на проверку только по \`submit\`; поле \`completion_grace_until\` зарезервировано.
- Дозапрос создаёт новый комплект с \`round + 1\`, в нём только запрошенные документы (D-031); прежние комплекты нужны для истории (SC-04: в данных заявки или отдельным методом — решает бэкенд).
- \`upload\` возвращает результат предвалидации; при \`failed\` файл не сохраняется. Повторная загрузка файла, который уже отклоняли, — \`document.same_file_rejected\` (по SHA-256, TADUM-536).
- Скачивание — прямой URL с \`Content-Disposition\`, не \`blob:\`: встроенный браузер WhatsApp иначе не скачает файл.

## 6. Обновление статусов

Отдельного канала событий нет: фронтенд перезапрашивает заявку, лимит и чек-лист по интервалу и при возврате на вкладку (D-035; в моке — 30 с, в проде — по согласованию с бэкендом). Статус берётся только из ответа бэкенда.

## 7. Условия и материалы поставщика

Текст условий и список материалов — статический JSON в репозитории портала (\`content/offer.{ar,en}.json\`), обновляется PR-ом (D-041). Эндпоинт не нужен, пока нет CMS.

## 8. Требование к лендингу (D-039)

Портал первичные заявки не создаёт. Лендинг обязан до создания заявки проверить, нет ли активной заявки на этот номер телефона, и если есть — передать клиента в портал редиректом
\`/login?returnTo=/c/home&src=landing&lang=<ar|en>\`. Новая заявка из портала возможна только после закрытой (\`createApplication\`, D-038).

## 9. Открытые вопросы к бэкенду

Из \`01-entities.md\` §7 и \`01-statuses.md\` §11 — по умолчанию фронтенд работает так, как указано в этих таблицах:

- E-1 — отдаёт ли бэкенд текст причины отказа (\`reject_reason_text\`) или только ключ тега (\`reject_reason_key\`); поддержаны оба, приоритет у текста.
- E-3 — \`sup_vat\` — отдельный ключ (по умолчанию да).
- S-1 — статус записи поставщика в Odoo и его маппинг (по умолчанию вычисляется из комплекта документов, \`01-statuses.md\` §3).
- S-2 — есть ли у документа статус \`approved\` в Odoo.
`;

const check = process.argv.includes('--check');
if (check) {
  let current = '';
  try {
    current = readFileSync(OUT, 'utf8');
  } catch {
    // нет файла
  }
  if (current !== doc) {
    console.error(`contract:md — ${OUT} отстал от портов. Запустите pnpm contract:md и закоммитьте результат.`);
    process.exit(1);
  }
  console.log(`contract:md — ${OUT} актуален`);
} else {
  writeFileSync(OUT, doc);
  console.log(`contract:md — записан ${OUT}`);
}
