// Расчёты лимита (01-statuses.md §6, 01-entities.md §2.7, §2.9; D-012).

import type { Deal, Limit, Money, OnboardingChecklist } from '@/shared/api';

const sar = (amount_minor: number): Money => ({ amount_minor, currency: 'SAR' });

/** used = Σ outstanding по сделкам с outstanding > 0; available = max(approved − used, 0). */
export function computeLimitAmounts(approved: Money, deals: readonly Pick<Deal, 'outstanding'>[]): Pick<Limit, 'approved' | 'used' | 'available'> {
  const used = deals.reduce((sum, d) => (d.outstanding.amount_minor > 0 ? sum + d.outstanding.amount_minor : sum), 0);
  return { approved, used: sar(used), available: sar(Math.max(approved.amount_minor - used, 0)) };
}

/** Оборот поставщика по клиенту: только сделки payment_done и repaid (D-012). */
export function computeTurnover(deals: readonly Pick<Deal, 'amount' | 'stage' | 'supplier_id'>[], supplierId: string): Money {
  return sar(
    deals
      .filter((d) => d.supplier_id === supplierId && (d.stage === 'payment_done' || d.stage === 'repaid'))
      .reduce((sum, d) => sum + d.amount.amount_minor, 0),
  );
}

/** Чек-лист завершён, когда все три пункта done. */
export function isChecklistCompleted(items: OnboardingChecklist['items']): boolean {
  return items.length > 0 && items.every((i) => i.status === 'done');
}

/** Графики показываем только для active; при used == 0 — «ещё не использован». */
export function limitView(limit: Pick<Limit, 'status' | 'used'>): 'hidden_amount' | 'checklist' | 'charts' | 'unused' | 'neutral' {
  switch (limit.status) {
    case 'pending':
      return 'hidden_amount';
    case 'ready':
      return 'checklist';
    case 'active':
      return limit.used.amount_minor === 0 ? 'unused' : 'charts';
    case 'cancelled':
    case 'rejected':
      return 'neutral';
  }
}
