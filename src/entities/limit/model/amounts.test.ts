// Расчёты лимита (01-statuses.md §6) и оборот поставщика (D-012).
import { describe, expect, it } from 'vitest';

import type { Deal, DealStage, LimitStatus } from '@/shared/api';
import { readProductDoc, section, tableWithHeader } from '@/test-utils/markdown';

import { computeLimitAmounts, computeTurnover, isChecklistCompleted, limitView } from './amounts';

const sar = (amount_minor: number) => ({ amount_minor, currency: 'SAR' as const });
const deal = (stage: DealStage, amount: number, outstanding: number, supplier_id = 'sup_1'): Deal => ({
  id: `d_${stage}_${amount}`,
  application_id: 'app_1',
  supplier_id,
  amount: sar(amount),
  stage,
  outstanding: sar(outstanding),
});

describe('limit amounts', () => {
  it('used = Σ outstanding > 0; available = approved − used', () => {
    const r = computeLimitAmounts(sar(15_000_000), [deal('payment_done', 4_000_000, 3_000_000), deal('repaid', 2_000_000, 0)]);
    expect(r).toEqual({ approved: sar(15_000_000), used: sar(3_000_000), available: sar(12_000_000) });
  });
  it('available никогда не меньше 0', () => {
    expect(computeLimitAmounts(sar(1_000), [deal('payment_done', 5_000, 5_000)]).available).toEqual(sar(0));
  });
  it('D-012: оборот поставщика — только payment_done и repaid, только свои сделки', () => {
    const deals = [
      deal('quotation', 100, 0),
      deal('approved', 200, 0),
      deal('payment_done', 300, 300),
      deal('repaid', 400, 0),
      deal('cancelled', 500, 0),
      deal('payment_done', 1000, 0, 'sup_2'),
    ];
    expect(computeTurnover(deals, 'sup_1')).toEqual(sar(700));
  });
  it('чек-лист завершён, когда все пункты done', () => {
    expect(isChecklistCompleted([{ key: 'spa_sadq', status: 'done' }, { key: 'pn_company_nafith', status: 'done' }, { key: 'pn_owner_nafith', status: 'done' }])).toBe(true);
    expect(isChecklistCompleted([{ key: 'spa_sadq', status: 'done' }, { key: 'pn_company_nafith', status: 'failed' }, { key: 'pn_owner_nafith', status: 'done' }])).toBe(false);
  });
});

describe('01-statuses.md §6 — что показываем по статусу лимита, каждая строка', () => {
  const expected: Record<LimitStatus, ReturnType<typeof limitView>> = {
    pending: 'hidden_amount',
    ready: 'checklist',
    active: 'charts',
    cancelled: 'neutral',
    rejected: 'neutral',
  };
  const rows = tableWithHeader(section(readProductDoc('01-statuses.md'), '6.'), 'Статус').rows;
  it.each(rows)('%s', (status) => {
    expect(limitView({ status: status as LimitStatus, used: sar(1) })).toBe(expected[status as LimitStatus]);
  });
  it('active и used == 0 — «ещё не использован», не пустой график', () => {
    expect(limitView({ status: 'active', used: sar(0) })).toBe('unused');
  });
});
