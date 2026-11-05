// Корзины 04-metrics-and-events.md §2.4: деньги и количества в событиях — только так, не точными значениями.
import type { Money } from '@/shared/api';

export type AmountBucket = '<50k' | '50-100k' | '100-250k' | '250-500k' | '500k+';
export type UsedShareBucket = '0' | '1-25' | '26-50' | '51-75' | '76-99' | '100';
export type CountBucket = '0' | '1-5' | '6-10' | '11-25' | '26+';

const SAR = 100; // халал в риале

/** Сумма лимита в SAR → корзина; граница относится к верхней корзине (50 000 → «50-100k»). */
export function amountBucket(amount: Money): AmountBucket {
  const sar = amount.amount_minor / SAR;
  if (sar < 50_000) return '<50k';
  if (sar < 100_000) return '50-100k';
  if (sar < 250_000) return '100-250k';
  if (sar < 500_000) return '250-500k';
  return '500k+';
}

/** Доля использованного лимита: «0» только при нуле, «100» — когда доступно 0; иначе проценты вверх до целого. */
export function usedShareBucket(used: Money, approved: Money): UsedShareBucket {
  if (used.amount_minor <= 0 || approved.amount_minor <= 0) return '0';
  if (used.amount_minor >= approved.amount_minor) return '100';
  const pct = Math.min(Math.ceil((used.amount_minor / approved.amount_minor) * 100), 99);
  if (pct <= 25) return '1-25';
  if (pct <= 50) return '26-50';
  if (pct <= 75) return '51-75';
  return '76-99';
}

/** Число приведённых клиентов / строк списка. */
export function countBucket(n: number): CountBucket {
  if (n <= 0) return '0';
  if (n <= 5) return '1-5';
  if (n <= 10) return '6-10';
  if (n <= 25) return '11-25';
  return '26+';
}

/** Размер файла в КБ, округлённый до 100 КБ. */
export function sizeKb(bytes: number): number {
  return Math.round(bytes / 1024 / 100) * 100;
}

/** Длительность в часах, округлённая до 1 ч. */
export function hoursRounded(ms: number): number {
  return Math.round(ms / 3_600_000);
}
