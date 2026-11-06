import { describe, expect, it } from 'vitest';

import { createI18n, directionOf, initialLanguage, resolveLanguage } from './config';
import ar from './locales/ar.json';

describe('resolveLanguage', () => {
  it('?lang= сильнее сохранённого выбора', () => {
    expect(resolveLanguage('?lang=en', 'ar')).toEqual({ lang: 'en', source: 'url' });
  });
  it('без параметра — сохранённый выбор', () => {
    expect(resolveLanguage('', 'en')).toEqual({ lang: 'en', source: 'stored' });
  });
  it('по умолчанию — арабский; язык браузера не используется', () => {
    expect(resolveLanguage('', null)).toEqual({ lang: 'ar', source: 'default' });
    expect(resolveLanguage('?lang=fr', 'de')).toEqual({ lang: 'ar', source: 'default' });
  });
  it('направление', () => {
    expect(directionOf('ar')).toBe('rtl');
    expect(directionOf('en')).toBe('ltr');
  });
});

describe('множественное число', () => {
  const counts = [0, 1, 2, 3, 11, 100];
  const pluralKeys = ['relative.minutes_ago', 'relative.hours_ago', 'relative.days_ago'] as const;

  it('для каждого count есть строка без сырого плейсхолдера (AR и EN)', () => {
    for (const lang of ['ar', 'en'] as const) {
      const i18n = createI18n(lang);
      for (const key of pluralKeys) {
        for (const count of counts) {
          const out = i18n.t(key, { count });
          expect(out, `${lang} ${key} ${count}`).not.toBe(key);
          expect(out).not.toContain('{count}');
        }
      }
    }
  });

  it('AR выбирает правильную форму', () => {
    const i18n = createI18n('ar');
    expect(i18n.t('relative.days_ago', { count: 1 })).toBe(ar.relative.days_ago_one);
    expect(i18n.t('relative.days_ago', { count: 2 })).toBe(ar.relative.days_ago_two);
    expect(i18n.t('relative.days_ago', { count: 3 })).toBe('منذ 3 أيام');
    expect(i18n.t('relative.days_ago', { count: 11 })).toBe('منذ 11 يومًا');
    expect(i18n.t('relative.days_ago', { count: 100 })).toBe('منذ 100 يوم');
  });
});

describe('язык по умолчанию сборки (A-056)', () => {
  it('без переменной — арабский; витрина задаёт английский; мусор игнорируется', () => {
    expect(initialLanguage(undefined)).toBe('ar');
    expect(initialLanguage('en')).toBe('en');
    expect(initialLanguage('fr')).toBe('ar');
  });
  it('fallback сборки срабатывает только без ?lang= и сохранённого выбора', () => {
    expect(resolveLanguage('', null, 'en')).toEqual({ lang: 'en', source: 'default' });
    expect(resolveLanguage('', 'ar', 'en')).toEqual({ lang: 'ar', source: 'stored' });
    expect(resolveLanguage('?lang=ar', null, 'en')).toEqual({ lang: 'ar', source: 'url' });
  });
});
