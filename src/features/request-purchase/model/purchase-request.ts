// Форма новой покупки на главной (D-100, бриф TD-002 §3, §5): проверка двух полей и текст сообщения в WhatsApp.
// На бэкенд ничего не уходит; значения живут только в состоянии формы — не в хранилище и не в аналитике.
import type { TFunction } from 'i18next';

import { parseAmount } from '@/entities/limit';
import type { Money } from '@/shared/api';
import { supportWhatsappUrl } from '@/shared/config';
import { formatMoney, type Language } from '@/shared/i18n';

export const SUPPLIER_MIN = 2;
export const SUPPLIER_MAX = 80;

type AmountError = 'home.purchase.amount_error' | 'home.purchase.amount_invalid' | 'home.purchase.amount_over';
type SupplierError = 'home.purchase.supplier_error' | 'home.purchase.supplier_short';

export interface PurchaseDraft {
  amount: string;
  supplier: string;
}

export interface PurchaseCheck {
  amount: Money | null;
  amountError: AmountError | null;
  supplierError: SupplierError | null;
  valid: boolean;
}

/** Сумма — положительное число до 2 знаков и не больше доступной (решение Кирилла 2026-11-27); поставщик — 2–80 знаков. */
export function checkPurchase(draft: PurchaseDraft, available: Money): PurchaseCheck {
  const amount = parseAmount(draft.amount);
  // Пусто — «введите сумму»; введено, но 0 или не число — «больше 0» (решение Кирилла 2026-11-27); больше доступной — блок.
  const amountError: AmountError | null = !amount
    ? draft.amount.trim() === ''
      ? 'home.purchase.amount_error'
      : 'home.purchase.amount_invalid'
    : amount.amount_minor > available.amount_minor
      ? 'home.purchase.amount_over'
      : null;
  const name = draft.supplier.trim();
  const supplierError: SupplierError | null =
    name.length === 0 ? 'home.purchase.supplier_error' : name.length < SUPPLIER_MIN || name.length > SUPPLIER_MAX ? 'home.purchase.supplier_short' : null;
  return { amount, amountError, supplierError, valid: amountError === null && supplierError === null };
}

/** Ссылка wa.me с готовым текстом на языке интерфейса: компания, поставщик, сумма (support.prefill.purchase_request). */
export function purchaseRequestUrl(t: TFunction, lang: Language, { company, supplier, amount }: { company: string; supplier: string; amount: Money }): string {
  const text = t('support.prefill.purchase_request', { company, supplier: supplier.trim(), amount: formatMoney(amount.amount_minor / 100, lang, { cents: true }) });
  return supportWhatsappUrl(text);
}
