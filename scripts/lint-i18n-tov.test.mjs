// Тесты scripts/lint-i18n-tov.mjs на минимальных словарях и настоящем лексиконе.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { lintLocales } from './lint-i18n-tov.mjs';

const lexicon = JSON.parse(readFileSync(new URL('../tov-lexicon.json', import.meta.url), 'utf8'));
const codes = (issues, severity = 'error') => issues.filter((i) => i.severity === severity).map((i) => i.code);

describe('lint-i18n-tov', () => {
  it('чистые словари проходят', () => {
    expect(codes(lintLocales({ ar: { a: { title: 'مستنداتك' } }, en: { a: { title: 'Your documents' } } }, lexicon))).toEqual([]);
  });
  it('«credit» в en.json → credit_loan', () => {
    const issues = lintLocales({ ar: { a: 'الحد التجاري' }, en: { a: 'Your credit limit' } }, lexicon);
    expect(codes(issues)).toContain('credit_loan');
  });
  it('ключ только в en.json → parity', () => {
    const issues = lintLocales({ ar: { a: 'أ' }, en: { a: 'A', b: 'B' } }, lexicon);
    expect(codes(issues)).toContain('parity');
  });
  it('не все арабские формы множественного числа → plural_forms', () => {
    const issues = lintLocales(
      { ar: { n_one: 'واحد', n_other: '{count}' }, en: { n_one: '{count} item', n_other: '{count} items' } },
      lexicon,
    );
    expect(codes(issues)).toContain('plural_forms');
  });
  it('исключение из лексикона снимает запрет для ключа', () => {
    const issues = lintLocales({ ar: { limit: { used_share: '{percent}٪ مستخدم' } }, en: { limit: { used_share: '{percent}% used' } } }, lexicon);
    expect(codes(issues)).not.toContain('interest_percent');
  });
  it('разные плейсхолдеры → placeholders', () => {
    const issues = lintLocales({ ar: { a: 'مرحبًا {company}' }, en: { a: 'Hello {name}' } }, lexicon);
    expect(codes(issues)).toContain('placeholders');
  });
});
