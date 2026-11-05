// Единственная точка форматирования чисел, денег, дат, процентов, размеров и телефонов
// (01-nfr-locale-brand.md §1.3, D-071). Intl используется только для чисел и названий месяцев:
// остальное собирается вручную, потому что Intl для ar-SA добавляет RLM, точку в «ر.س.» и т. п.
// Из любого результата удаляются невидимые символы направления U+200E (LRM) и U+200F (RLM).

import type { TFunction } from 'i18next';

import { now, toDate } from '@/shared/lib';

import type { Language } from './config';

type DateInput = Date | number | string;

const NBSP = ' ';
const TIME_ZONE = 'Asia/Riyadh';
const DIRECTION_MARKS = /[‎‏]/g;

const clean = (value: string): string => value.replace(DIRECTION_MARKS, '');

const integerFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const fractionFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

const shortDateFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const dayYearFormat = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, day: 'numeric', year: 'numeric' });
const monthFormats: Record<Language, Intl.DateTimeFormat> = {
  ar: new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { month: 'long', timeZone: TIME_ZONE }),
  en: new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: TIME_ZONE }),
};
const timeFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((p) => p.type === type)?.value ?? '';
}

/** Число с западными цифрами и запятой-разделителем в обоих языках; без дробной части. */
export function formatNumber(value: number): string {
  return clean(integerFormat.format(value));
}

/** Деньги: AR `150,000 ر.س`, EN `SAR 150,000` (неразрывный пробел). */
export function formatMoney(value: number, lang: Language): string {
  const amount = formatNumber(value);
  return lang === 'ar' ? `${amount}${NBSP}ر.س` : `SAR${NBSP}${amount}`;
}

/** Короткая дата `DD/MM/YYYY` по Эр-Рияду, одинаково в обоих языках (D-053). */
export function formatDate(input: DateInput): string {
  const parts = shortDateFormat.formatToParts(toDate(input));
  return clean(`${part(parts, 'day')}/${part(parts, 'month')}/${part(parts, 'year')}`);
}

/** Длинная дата: `4 نوفمبر 2026` / `4 November 2026`, григорианский календарь. */
export function formatDateLong(input: DateInput, lang: Language): string {
  const date = toDate(input);
  const parts = dayYearFormat.formatToParts(date);
  const month = monthFormats[lang].format(date);
  return clean(`${part(parts, 'day')} ${month} ${part(parts, 'year')}`);
}

/** Время `HH:mm`, 24 часа, Эр-Рияд. */
export function formatTime(input: DateInput): string {
  return clean(timeFormat.format(toDate(input)));
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Относительное время через ключи `relative.*` (AR — «منذ …»). Меньше минуты считается как 1 минута;
 * старше 7 дней — короткая дата.
 */
export function formatRelative(input: DateInput, t: TFunction, nowMs: number = now()): string {
  const diff = Math.max(0, nowMs - toDate(input).getTime());
  if (diff > 7 * DAY) return formatDate(input);
  if (diff < HOUR) return clean(t('relative.minutes_ago', { count: Math.max(1, Math.floor(diff / MINUTE)) }));
  if (diff < DAY) return clean(t('relative.hours_ago', { count: Math.floor(diff / HOUR) }));
  return clean(t('relative.days_ago', { count: Math.floor(diff / DAY) }));
}

/** Проценты: AR `28 %` (неразрывный пробел), EN `28%`. */
export function formatPercent(value: number, lang: Language): string {
  const n = formatNumber(value);
  return lang === 'ar' ? `${n}${NBSP}%` : `${n}%`;
}

/** Размер файла: 1 МБ = 1 000 000 байт для отображения; `10 ميجابايت` / `10 MB`. */
export function formatFileSize(bytes: number, t: TFunction): string {
  if (bytes >= 1_000_000) return clean(`${fractionFormat.format(bytes / 1_000_000)}${NBSP}${t('units.mb')}`);
  return clean(`${integerFormat.format(Math.max(1, Math.round(bytes / 1000)))}${NBSP}${t('units.kb')}`);
}

const KSA_MOBILE = /^\+9665\d{8}$/;

/** Фронтенд проверяет только формат `+9665XXXXXXXX`; нормализация — на бэкенде (D-013). */
export function isKsaMobile(value: string): boolean {
  return KSA_MOBILE.test(value);
}

/** `+966501234567` → `+966 50 123 4567`. Нераспознанный ввод возвращается как есть. */
export function formatPhone(value: string): string {
  if (!isKsaMobile(value)) return value;
  const d = value.slice(4);
  return `+966 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
}

/** Маска для экрана OTP: видны первая цифра и последние три — `+966 5• ••• •567`. */
export function maskPhone(value: string): string {
  if (!isKsaMobile(value)) return value;
  const d = value.slice(4);
  const dot = '•';
  return `+966 ${d[0] ?? ''}${dot} ${dot.repeat(3)} ${dot}${d.slice(6)}`;
}
