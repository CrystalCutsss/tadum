// Главная активного клиента (D-098…D-100, бриф TD-002): кому она доступна, доля использованного лимита и разбор суммы покупки.
import type { Limit, Money } from '@/shared/api';

/**
 * Home доступен при активном лимите и при лимите, отменённом после активации (D-098, D-099; A-078).
 * Лимит, отменённый до активации (на подписании), — Home нет: клиент остаётся в «Заявке».
 */
export function hasClientHome(limit: Pick<Limit, 'status' | 'activated_at'> | null | undefined): boolean {
  if (!limit) return false;
  return limit.status === 'active' || (limit.status === 'cancelled' && limit.activated_at !== undefined);
}

export interface LimitShare {
  /** Доля использованного, 0…1 — для полосы. */
  share: number;
  /** Целый процент для подписи `limit.used_share`; не 0 при любом использовании и не 100, пока что-то доступно. */
  percent: number;
  /** used > approved — ошибка данных (SC-07 A3): показываем 100 % и доступно 0. */
  inconsistent: boolean;
}

/** Доля использованного лимита; available = max(approved − used, 0) считается портом и здесь не пересчитывается. */
export function limitShare(limit: Pick<Limit, 'approved' | 'used'>): LimitShare {
  const approved = limit.approved.amount_minor;
  const used = limit.used.amount_minor;
  const inconsistent = used > approved;
  if (used <= 0) return { share: 0, percent: 0, inconsistent };
  if (used >= approved) return { share: 1, percent: 100, inconsistent };
  const share = used / approved;
  return { share, percent: Math.min(Math.max(Math.round(share * 100), 1), 99), inconsistent };
}

/** Доступно к покупке; при ошибке данных (used > approved) — 0. */
export function availableOf(limit: Pick<Limit, 'approved' | 'used' | 'available'>): Money {
  const computed = Math.max(limit.approved.amount_minor - limit.used.amount_minor, 0);
  return { amount_minor: Math.min(Math.max(limit.available.amount_minor, 0), computed), currency: limit.available.currency };
}

const ARABIC_DIGITS = /[٠-٩۰-۹]/g;

/**
 * Сумма из поля формы → халалы (A-079): западные и арабские цифры, разделители групп (запятая, пробел, «٬»),
 * десятичный разделитель — точка или «٫», до двух знаков после него. Не число, ноль или отрицательное — null.
 */
export function parseAmount(input: string): Money | null {
  const western = input
    .replace(ARABIC_DIGITS, (d) => String((d.charCodeAt(0) & 0xf) % 10))
    .replace(/[\s,٬ ]/g, '')
    .replace('٫', '.');
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(western)) return null;
  const [whole = '0', fraction = ''] = western.split('.');
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return minor > 0 ? { amount_minor: minor, currency: 'SAR' } : null;
}
