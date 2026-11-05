#!/usr/bin/env node
// Проверка текстов интерфейса по tov-lexicon.json (01-nfr-locale-brand.md §1.4, §3.6).
// Проверяет: паритет ключей ar/en, пустые значения, алфавитный порядок, формы множественного числа,
// паритет плейсхолдеров, HTML в строках, лимиты длины и запрещённые слова (forbidden + exceptions).
// Код выхода 1, если есть нарушения уровня error; warn только печатаются.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PLURAL_SUFFIXES = ['zero', 'one', 'two', 'few', 'many', 'other'];

/** Плоский словарь `a.b.c` → строка; заодно проверяет порядок ключей на каждом уровне. */
export function flatten(obj, prefix = '', out = {}, issues = []) {
  const keys = Object.keys(obj);
  const sorted = [...keys].sort(compareKeys);
  if (keys.join('\u0000') !== sorted.join('\u0000')) {
    issues.push({ severity: 'error', code: 'key_order', key: prefix || '(root)', message: 'ключи не по алфавиту (формы множественного числа — в порядке CLDR); исправит `pnpm i18n:extract`' });
  }
  for (const k of keys) {
    const full = prefix ? `${prefix}.${k}` : k;
    const v = obj[k];
    if (v && typeof v === 'object') flatten(v, full, out, issues);
    else out[full] = v;
  }
  return out;
}

/** Порядок как у i18next-cli: базовые ключи по алфавиту, формы множественного числа — zero…other. */
export function compareKeys(a, b) {
  const pa = pluralBase(a);
  const pb = pluralBase(b);
  const ba = pa?.base ?? a;
  const bb = pb?.base ?? b;
  if (ba !== bb) return ba < bb ? -1 : 1;
  return (pa ? PLURAL_SUFFIXES.indexOf(pa.form) : -1) - (pb ? PLURAL_SUFFIXES.indexOf(pb.form) : -1);
}

const PLACEHOLDER = /\{(\w+)\}/g;
const placeholders = (s) => [...String(s).matchAll(PLACEHOLDER)].map((m) => m[1]).sort();

/** Базовый ключ без суффикса множественного числа. */
export function pluralBase(key) {
  const m = key.match(new RegExp(`^(.*)_(${PLURAL_SUFFIXES.join('|')})$`));
  return m ? { base: m[1], form: m[2] } : null;
}

/** Glob по ключу i18n: `*` — любая последовательность символов. */
const globToRegExp = (glob) => new RegExp(`^${glob.split('*').map((p) => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`);

function countWords(text) {
  return text.replace(PLACEHOLDER, '').split(/\s+/).filter(Boolean).length;
}
function countSentences(text) {
  return text.replace(PLACEHOLDER, 'x').split(/[.!?؟]+(?:\s|$)/).filter((s) => s.trim()).length;
}

/**
 * Чистая проверка: на вход словари и лексикон, на выход список нарушений.
 * @returns {{severity:'error'|'warn', code:string, key:string, lang?:string, message:string}[]}
 */
export function lintLocales(locales, lexicon) {
  const issues = [];
  const flat = {};
  for (const [lang, data] of Object.entries(locales)) {
    const before = issues.length;
    flat[lang] = flatten(data, '', {}, issues);
    for (const i of issues.slice(before)) i.lang = lang;
  }

  const langs = Object.keys(flat);
  const groupKey = (key) => pluralBase(key)?.base ?? key;

  // 1. Паритет ключей (по базовым ключам, чтобы формы множественного числа не считались расхождением).
  const groups = Object.fromEntries(langs.map((l) => [l, new Set(Object.keys(flat[l]).map(groupKey))]));
  for (const l of langs) {
    for (const g of groups[l]) {
      for (const other of langs) {
        if (other !== l && !groups[other].has(g)) {
          issues.push({ severity: 'error', code: 'parity', key: g, lang: other, message: `ключ есть в ${l}, но нет в ${other}` });
        }
      }
    }
  }

  // 2. Пустые значения, HTML.
  const noHtml = lexicon?.lint?.also_check?.no_html_in_strings;
  for (const l of langs) {
    for (const [key, value] of Object.entries(flat[l])) {
      if (typeof value !== 'string' || value.trim() === '') {
        issues.push({ severity: 'error', code: 'empty', key, lang: l, message: 'пустое значение' });
      } else if (noHtml && /<\/?[a-z][^>]*>/i.test(value)) {
        issues.push({ severity: 'error', code: 'html', key, lang: l, message: 'HTML в строке; выделения — через <Trans> с компонентами' });
      }
    }
  }

  // 3. Формы множественного числа: ar — все формы из лексикона, en — one и other.
  const requiredForms = { ar: lexicon?.lint?.also_check?.plural_forms_ar ?? PLURAL_SUFFIXES, en: ['one', 'other'] };
  for (const l of langs) {
    const forms = {};
    for (const key of Object.keys(flat[l])) {
      const p = pluralBase(key);
      if (p) (forms[p.base] ??= new Set()).add(p.form);
    }
    for (const [base, have] of Object.entries(forms)) {
      const missing = (requiredForms[l] ?? []).filter((f) => !have.has(f));
      if (missing.length) {
        issues.push({ severity: 'error', code: 'plural_forms', key: base, lang: l, message: `нет форм: ${missing.join(', ')}` });
      }
    }
  }

  // 4. Паритет плейсхолдеров: объединение по всем формам ключа.
  if (lexicon?.lint?.also_check?.placeholders_parity) {
    const sets = {};
    for (const l of langs) {
      for (const [key, value] of Object.entries(flat[l])) {
        const g = groupKey(key);
        ((sets[g] ??= {})[l] ??= new Set());
        for (const ph of placeholders(value)) sets[g][l].add(ph);
      }
    }
    for (const [g, byLang] of Object.entries(sets)) {
      const [a, b] = langs;
      if (!byLang[a] || !byLang[b]) continue;
      // В ar формы one/two часто без числа («منذ يوم») — {count} не обязателен в каждой форме, сравниваем без него.
      const strip = (s) => [...s].filter((x) => x !== 'count').sort().join(',');
      if (strip(byLang[a]) !== strip(byLang[b])) {
        issues.push({ severity: 'error', code: 'placeholders', key: g, message: `плейсхолдеры различаются: ${a} {${strip(byLang[a])}} / ${b} {${strip(byLang[b])}}` });
      }
    }
  }

  // 5. Лимиты длины (по суффиксу/префиксу базового ключа).
  for (const rule of lexicon?.length_limits?.rules ?? []) {
    for (const l of langs) {
      for (const [key, value] of Object.entries(flat[l])) {
        const g = groupKey(key);
        const bySuffix = rule.match_suffix?.some((s) => g.endsWith(s));
        const byPrefix = rule.match_prefix?.some((p) => g.startsWith(p));
        if (!bySuffix && !byPrefix) continue;
        const maxWords = rule.max_words?.[l];
        if (maxWords && countWords(value) > maxWords) {
          issues.push({ severity: 'error', code: 'length_words', key, lang: l, message: `больше ${maxWords} слов` });
        }
        if (rule.max_sentences && countSentences(value) > rule.max_sentences) {
          issues.push({ severity: 'error', code: 'length_sentences', key, lang: l, message: `больше ${rule.max_sentences} предложений` });
        }
      }
    }
  }

  // 6. Запрещённые слова с исключениями по ключам.
  const exceptions = (lexicon?.exceptions?.items ?? []).map((e) => ({ ...e, re: globToRegExp(e.key) }));
  for (const rule of lexicon?.forbidden ?? []) {
    for (const l of langs) {
      const spec = rule.patterns?.[l];
      if (!spec?.regex?.length) continue;
      const res = spec.regex.map((r) => new RegExp(r, spec.flags ?? ''));
      for (const [key, value] of Object.entries(flat[l])) {
        if (!res.some((re) => re.test(value))) continue;
        const g = groupKey(key);
        const ex = exceptions.filter((e) => e.re.test(g) || e.re.test(key));
        if (ex.some((e) => e.allow?.includes(rule.id))) continue;
        const downgraded = ex.map((e) => e.downgrade?.[rule.id]).find(Boolean);
        issues.push({
          severity: downgraded ?? rule.severity,
          code: rule.id,
          key,
          lang: l,
          message: `${rule.reason}${rule.replace_with?.length ? ` → ${rule.replace_with.join(' / ')}` : ''}`,
        });
      }
    }
  }

  // 7. Подсказка про LTR-фрагменты.
  const hint = lexicon?.lint?.also_check?.ltr_fragments_hint;
  if (hint?.regex?.length) {
    const res = hint.regex.map((r) => new RegExp(r));
    for (const [key, value] of Object.entries(flat.ar ?? {})) {
      if (res.some((re) => re.test(value))) {
        issues.push({ severity: hint.severity ?? 'warn', code: 'ltr_fragment', key, lang: 'ar', message: hint.note ?? 'рендерить через <Ltr>' });
      }
    }
  }

  return issues;
}

function main() {
  const lexicon = JSON.parse(readFileSync(`${ROOT}/tov-lexicon.json`, 'utf8'));
  const targets = lexicon.lint?.targets ?? ['src/shared/i18n/locales/ar.json', 'src/shared/i18n/locales/en.json'];
  const locales = {};
  for (const t of targets) {
    const lang = t.match(/(\w+)\.json$/)[1];
    locales[lang] = JSON.parse(readFileSync(`${ROOT}/${t}`, 'utf8'));
  }
  const issues = lintLocales(locales, lexicon);
  for (const i of issues) {
    console.log(`${i.severity.toUpperCase()} [${i.code}] ${i.lang ? `${i.lang}:` : ''}${i.key} — ${i.message}`);
  }
  const errors = issues.filter((i) => i.severity === lexicon.lint?.fail_on || i.severity === 'error').length;
  const warns = issues.length - errors;
  console.log(`lint-i18n-tov: ${errors} error(s), ${warns} warning(s)`);
  process.exitCode = errors ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
