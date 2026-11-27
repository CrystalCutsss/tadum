// Форма новой покупки: три ошибки и текст WhatsApp (бриф TD-002 §3, §9; D-100).
import { describe, expect, it } from 'vitest';

import { createI18n, formatMoney } from '@/shared/i18n';

import { checkPurchase, purchaseRequestUrl } from './purchase-request';

const sar = (amount_minor: number) => ({ amount_minor, currency: 'SAR' as const });
const AVAILABLE = sar(10_750_000);

describe('checkPurchase', () => {
  it('сумма и поставщик в порядке — можно отправить', () => {
    expect(checkPurchase({ amount: '25,000', supplier: 'Al Noor' }, AVAILABLE)).toEqual({ amount: sar(2_500_000), amountError: null, supplierError: null, valid: true });
  });
  it.each(['', '0', 'abc'])('сумма %j — amount_error', (amount) => {
    const r = checkPurchase({ amount, supplier: 'Al Noor' }, AVAILABLE);
    expect(r.amountError).toBe('home.purchase.amount_error');
    expect(r.valid).toBe(false);
  });
  it('больше доступной — amount_over, отправка недоступна', () => {
    const r = checkPurchase({ amount: '107500.01', supplier: 'Al Noor' }, AVAILABLE);
    expect(r.amountError).toBe('home.purchase.amount_over');
    expect(r.valid).toBe(false);
  });
  it('ровно доступная сумма — можно', () => expect(checkPurchase({ amount: '107500', supplier: 'Al Noor' }, AVAILABLE).valid).toBe(true));
  it.each(['', ' A ', 'x'.repeat(81)])('поставщик %j — supplier_error', (supplier) => {
    expect(checkPurchase({ amount: '100', supplier }, AVAILABLE).supplierError).toBe('home.purchase.supplier_error');
  });
});

describe('purchaseRequestUrl', () => {
  it.each(['en', 'ar'] as const)('%s: текст на языке интерфейса с компанией, поставщиком и суммой', (lang) => {
    const i18n = createI18n(lang);
    const url = new URL(purchaseRequestUrl(i18n.t, lang, { company: 'Ufuq', supplier: '  Al Noor  ', amount: sar(2_500_050) }));
    expect(url.origin + url.pathname).toBe('https://wa.me/966579768881');
    const text = url.searchParams.get('text') ?? '';
    expect(text).toContain('Ufuq');
    expect(text).toContain('Al Noor');
    expect(text).toContain('25,000.50');
    expect(text).toBe(i18n.t('support.prefill.purchase_request', { company: 'Ufuq', supplier: 'Al Noor', amount: formatMoney(25_000.5, lang, { cents: true }) }));
  });
});
