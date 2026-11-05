// Побайтные проверки форматтеров по таблице 01-nfr-locale-brand.md §1.3 (D-071).
import { describe, expect, it } from 'vitest';

import { createI18n } from './config';
import {
  formatDate,
  formatDateLong,
  formatFileSize,
  formatMoney,
  formatNumber,
  formatPercent,
  formatPhone,
  formatRelative,
  formatTime,
  isKsaMobile,
  maskPhone,
} from './format';

const NBSP = ' ';
const ar = createI18n('ar');
const en = createI18n('en');
const NOW = Date.parse('2026-11-04T11:30:00Z'); // 14:30 в Эр-Рияде

describe('числа и деньги', () => {
  it('западные цифры и запятая в обоих языках, без копеек', () => {
    expect(formatNumber(150000)).toBe('150,000');
    expect(formatNumber(42500)).toBe('42,500');
    expect(formatNumber(42500.6)).toBe('42,501');
  });
  it('AR: число, неразрывный пробел, ر.س без точки', () => {
    expect(formatMoney(150000, 'ar')).toBe(`150,000${NBSP}ر.س`);
  });
  it('EN: SAR, неразрывный пробел, число', () => {
    expect(formatMoney(150000, 'en')).toBe(`SAR${NBSP}150,000`);
  });
});

describe('даты и время (Asia/Riyadh)', () => {
  it('короткая дата DD/MM/YYYY одинакова для AR и EN', () => {
    expect(formatDate('2026-11-04T10:00:00Z')).toBe('04/11/2026');
    expect(formatDate(NOW)).toBe('04/11/2026');
  });
  it('день считается по Эр-Рияду, а не по UTC', () => {
    expect(formatDate('2026-11-03T22:30:00Z')).toBe('04/11/2026');
    expect(formatTime('2026-11-03T22:30:00Z')).toBe('01:30');
  });
  it('длинная дата: число, месяц на языке интерфейса, год', () => {
    expect(formatDateLong('2026-11-04T10:00:00Z', 'ar')).toBe('4 نوفمبر 2026');
    expect(formatDateLong('2026-11-04T10:00:00Z', 'en')).toBe('4 November 2026');
  });
  it('время HH:mm, 24 часа', () => {
    expect(formatTime(NOW)).toBe('14:30');
  });
});

describe('относительное время', () => {
  const daysAgo = (d: number) => NOW - d * 24 * 3600 * 1000;
  it('3 дня назад', () => {
    expect(formatRelative(daysAgo(3), ar.t, NOW)).toBe('منذ 3 أيام');
    expect(formatRelative(daysAgo(3), en.t, NOW)).toBe('3 days ago');
  });
  it('минуты и часы', () => {
    expect(formatRelative(NOW - 5 * 60_000, en.t, NOW)).toBe('5 minutes ago');
    expect(formatRelative(NOW - 10_000, en.t, NOW)).toBe('1 minute ago');
    expect(formatRelative(NOW - 2 * 3600_000, ar.t, NOW)).toBe('منذ ساعتين');
  });
  it('старше 7 дней — короткая дата', () => {
    expect(formatRelative(daysAgo(8), ar.t, NOW)).toBe('27/10/2026');
  });
});

describe('проценты и размеры', () => {
  it('AR 28 % с неразрывным пробелом, EN 28%', () => {
    expect(formatPercent(28, 'ar')).toBe(`28${NBSP}%`);
    expect(formatPercent(28, 'en')).toBe('28%');
  });
  it('1 МБ = 1 000 000 байт', () => {
    expect(formatFileSize(10_000_000, ar.t)).toBe(`10${NBSP}ميجابايت`);
    expect(formatFileSize(10_000_000, en.t)).toBe(`10${NBSP}MB`);
    expect(formatFileSize(2_500_000, en.t)).toBe(`2.5${NBSP}MB`);
    expect(formatFileSize(350_000, ar.t)).toBe(`350${NBSP}كيلوبايت`);
  });
});

describe('телефон', () => {
  it('формат +966 50 123 4567', () => {
    expect(formatPhone('+966501234567')).toBe('+966 50 123 4567');
  });
  it('маска: первая цифра и последние три', () => {
    expect(maskPhone('+966501234567')).toBe('+966 5• ••• •567');
  });
  it('валидация только формата +9665XXXXXXXX', () => {
    expect(isKsaMobile('+966501234567')).toBe(true);
    expect(isKsaMobile('0501234567')).toBe(false);
    expect(isKsaMobile('+96650123456')).toBe(false);
  });
});

describe('нет невидимых символов направления', () => {
  it('ни один результат не содержит LRM/RLM', () => {
    const outputs = [
      formatMoney(150000, 'ar'),
      formatDate(NOW),
      formatDateLong(NOW, 'ar'),
      formatTime(NOW),
      formatRelative(NOW - 3 * 86_400_000, ar.t, NOW),
      formatPercent(28, 'ar'),
      formatFileSize(10_000_000, ar.t),
    ];
    for (const out of outputs) expect(out).not.toMatch(/[‎‏]/);
  });
});
