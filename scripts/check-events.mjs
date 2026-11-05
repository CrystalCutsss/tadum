// pnpm check:events — сверяет словарь src/shared/analytics/events.ts с docs/product/04-metrics-and-events.md:
// имена событий (§3.1–§3.5), обязательные и необязательные свойства, версию (колонка «v»)
// и контекст screen_viewed по экранам (§3.6). Расхождение — код выхода 1.
import { readFileSync } from 'node:fs';

import ts from 'typescript';

const DOC = 'docs/product/04-metrics-and-events.md';
const CODE = 'src/shared/analytics/events.ts';
const ROUTES = 'src/shared/config/routes.ts';

// ---------- Код ----------

const source = ts.createSourceFile(CODE, readFileSync(CODE, 'utf8'), ts.ScriptTarget.Latest, true);
// ScreenId — общий список маршрутов и аналитики, лежит в shared/config.
const routesSource = ts.createSourceFile(ROUTES, readFileSync(ROUTES, 'utf8'), ts.ScriptTarget.Latest, true);

function alias(name, sf = source, file = CODE) {
  let found;
  sf.forEachChild((n) => {
    if (ts.isTypeAliasDeclaration(n) && n.name.text === name) found = n.type;
  });
  if (!found) throw new Error(`${file}: нет типа ${name}`);
  return found;
}

const unionMembers = (t) => (ts.isUnionTypeNode(t) ? t.types : [t]);
const literalText = (t) => (t && ts.isLiteralTypeNode(t) && ts.isStringLiteral(t.literal) ? t.literal.text : null);
const member = (lit, key) => lit.members.find((m) => ts.isPropertySignature(m) && m.name.getText(source) === key);

function propsOf(t, skip = []) {
  if (ts.isTypeReferenceNode(t) && t.typeName.getText(source) === 'Record') return { required: [], optional: [] };
  if (!ts.isTypeLiteralNode(t)) return null;
  const required = [];
  const optional = [];
  for (const m of t.members) {
    if (!ts.isPropertySignature(m)) continue;
    const key = m.name.getText(source);
    if (skip.includes(key)) continue;
    (m.questionToken ? optional : required).push(key);
  }
  return { required, optional };
}

const codeEvents = new Map();
for (const m of unionMembers(alias('AnalyticsEvent'))) {
  if (!ts.isTypeLiteralNode(m)) continue;
  const name = literalText(member(m, 'name')?.type);
  const propsType = member(m, 'props')?.type;
  codeEvents.set(name, propsType && ts.isTypeReferenceNode(propsType) && propsType.typeName.getText(source) === 'ScreenViewedProps' ? 'screen' : propsOf(propsType));
}

const codeScreens = new Map();
for (const m of unionMembers(alias('ScreenViewedProps'))) {
  codeScreens.set(literalText(member(m, 'screen_id')?.type), propsOf(m, ['screen_id']));
}
const screenIds = unionMembers(alias('ScreenId', routesSource, ROUTES)).map((t) => (ts.isLiteralTypeNode(t) ? t.literal.text : null));

const codeVersions = new Map();
source.forEachChild((n) => {
  if (!ts.isVariableStatement(n)) return;
  for (const d of n.declarationList.declarations) {
    if (d.name.getText(source) !== 'EVENT_VERSIONS') continue;
    let init = d.initializer;
    while (init && (ts.isSatisfiesExpression(init) || ts.isAsExpression(init))) init = init.expression;
    for (const p of init.properties) codeVersions.set(p.name.getText(source), p.initializer.text);
  }
});

// ---------- Документ ----------

const doc = readFileSync(DOC, 'utf8');
const sectionOf = (heading) => {
  const start = doc.indexOf(heading);
  if (start === -1) throw new Error(`${DOC}: нет раздела «${heading}»`);
  const next = doc.slice(start + heading.length).search(/\n#{2,3} /);
  return next === -1 ? doc.slice(start) : doc.slice(start, start + heading.length + next);
};

/** Строки таблицы: ячейки без внешних `|`; экранированный `\|` остаётся внутри ячейки. */
function tableRows(text) {
  const lines = text.split('\n').filter((l) => l.startsWith('|'));
  return lines.slice(2).map((l) =>
    l
      .slice(1, -1)
      .split(/(?<!\\)\|/)
      .map((c) => c.trim().replace(/\\\|/g, '|')),
  );
}

/** `{ a: x, b?: y, c }` → имена верхнего уровня. */
function parseProps(group) {
  const inner = group.trim().replace(/^\{/, '').replace(/\}$/, '');
  const parts = [];
  let depth = 0;
  let cur = '';
  for (const ch of inner) {
    if ('{(<['.includes(ch)) depth++;
    if ('})>]'.includes(ch)) depth--;
    if (ch === ',' && depth === 0) {
      parts.push(cur);
      cur = '';
    } else cur += ch;
  }
  parts.push(cur);
  const required = [];
  const optional = [];
  for (const p of parts.map((x) => x.trim()).filter(Boolean)) {
    const m = p.match(/^([a-z_]+)(\?)?/);
    if (!m) throw new Error(`не разобрано свойство «${p}»`);
    (m[2] ? optional : required).push(m[1]);
  }
  return { required, optional };
}

/** Все группы `{…}` верхнего уровня в ячейке. */
function groups(cell) {
  const out = [];
  let depth = 0;
  let start = -1;
  [...cell].forEach((ch, i) => {
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) out.push(cell.slice(start, i + 1));
    }
  });
  return out;
}

const docEvents = new Map();
const docVersions = new Map();
for (const heading of ['### 3.1', '### 3.2', '### 3.3', '### 3.4', '### 3.5']) {
  const text = sectionOf(heading);
  const withOwner = heading === '### 3.2';
  for (const [eventCell, , propsCell, , versionCell] of tableRows(text.slice(text.indexOf('| Событие')))) {
    const names = [...eventCell.matchAll(/`([a-z_]+)`/g)].map((m) => m[1]);
    let props;
    if (propsCell.includes('(общие)')) props = { required: [], optional: [] };
    else if (names.includes('screen_viewed')) props = 'screen';
    else props = parseProps(groups(propsCell)[0] ?? '{}');
    if (withOwner && props !== 'screen') props = { ...props, required: ['owner', ...props.required] };
    for (const n of names) {
      docEvents.set(n, props);
      docVersions.set(n, versionCell.match(/v\d/)?.[0]);
    }
  }
}

const docScreens = new Map();
const s36 = sectionOf('### 3.6');
for (const [idsCell, propsCell] of tableRows(s36.slice(s36.indexOf('| `screen_id`')))) {
  const patterns = [...idsCell.matchAll(/`([a-z0-9_.*]+)`/g)].map((m) => m[1]);
  const ids = patterns.flatMap((p) => {
    const re = new RegExp(`^${p.replace(/\./g, '\\.').replace(/\*/g, '[a-z_]+')}$`);
    return screenIds.filter((id) => re.test(id));
  });
  const [first, second] = groups(propsCell);
  for (const id of ids) {
    // «`{}`; для 404 — `{ path_hash: string }`»
    const group = id === 'system.404' && propsCell.includes('для 404') ? second : first;
    docScreens.set(id, parseProps(group ?? '{}'));
  }
}

// ---------- Сверка ----------

const errors = [];
const same = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const describe = (p) => (p === 'screen' ? 'screen' : `обязательные [${p.required.join(', ')}], необязательные [${p.optional.join(', ')}]`);

for (const n of docEvents.keys()) if (!codeEvents.has(n)) errors.push(`нет в коде: ${n}`);
for (const n of codeEvents.keys()) if (!docEvents.has(n)) errors.push(`нет в словаре §3: ${n}`);
for (const [n, d] of docEvents) {
  const c = codeEvents.get(n);
  if (!c) continue;
  if (d === 'screen' || c === 'screen') {
    if (d !== c) errors.push(`${n}: screen_viewed-свойства только у screen_viewed`);
  } else if (!c) {
    errors.push(`${n}: свойства в коде не разобраны`);
  } else if (!same(d.required, c.required) || !same(d.optional, c.optional)) {
    errors.push(`${n}: в документе ${describe(d)}; в коде ${describe(c)}`);
  }
  if (docVersions.get(n) !== codeVersions.get(n)) errors.push(`${n}: версия ${docVersions.get(n)} в документе, ${codeVersions.get(n)} в EVENT_VERSIONS`);
}
for (const n of codeVersions.keys()) if (!codeEvents.has(n)) errors.push(`EVENT_VERSIONS: лишний ключ ${n}`);

for (const id of screenIds) {
  const d = docScreens.get(id);
  const c = codeScreens.get(id);
  if (!d) errors.push(`screen_viewed: ${id} нет в §3.6`);
  else if (!c) errors.push(`screen_viewed: ${id} нет в ScreenViewedProps`);
  else if (!same(d.required, c.required) || !same(d.optional, c.optional)) errors.push(`screen_viewed{${id}}: в документе ${describe(d)}; в коде ${describe(c)}`);
}
for (const id of codeScreens.keys()) if (!screenIds.includes(id)) errors.push(`ScreenViewedProps: ${id} нет в ScreenId`);

if (errors.length) {
  console.error(`check-events: ${errors.length} расхождени(е/я) с ${DOC}`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`check-events: ${codeEvents.size} событий и ${codeScreens.size} экранов screen_viewed совпадают с ${DOC}`);
