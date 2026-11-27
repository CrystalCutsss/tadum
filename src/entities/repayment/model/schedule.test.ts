// График платежей: порядок и отбор для главной (D-102), дни до взноса по Эр-Рияду.
import { describe, expect, it } from 'vitest';

import type { Installment } from '@/shared/api';

import { daysUntil, groupSchedule, riyadhToday } from './schedule';

const item = (id: string, due_date: string, status: Installment['status']): Installment => ({
  id,
  deal_id: 'd1',
  reference: id,
  supplier_name: 'Al Noor',
  due_date,
  amount: { amount_minor: 1_000_000, currency: 'SAR' },
  status,
});

describe('groupSchedule', () => {
  const schedule = [
    item('p1', '2026-09-01', 'paid'),
    item('u3', '2027-02-01', 'upcoming'),
    item('o2', '2026-11-20', 'overdue'),
    item('u1', '2026-12-01', 'upcoming'),
    item('o1', '2026-10-20', 'overdue'),
    item('u2', '2027-01-01', 'upcoming'),
    item('p2', '2026-10-01', 'paid'),
  ];
  const g = groupSchedule(schedule);
  it('на главной — сначала просроченные (по сроку), затем ближайшие предстоящие, всего три', () => {
    expect(g.home.map((i) => i.id)).toEqual(['o1', 'o2', 'u1']);
  });
  it('оплаченные — от последнего к первому', () => expect(g.paid.map((i) => i.id)).toEqual(['p2', 'p1']));
  it('предстоящие — по сроку', () => expect(g.upcoming.map((i) => i.id)).toEqual(['u1', 'u2', 'u3']));
  it('пустой график', () => expect(groupSchedule([])).toEqual({ overdue: [], upcoming: [], paid: [], home: [] }));
});

describe('daysUntil', () => {
  // 2026-11-27 22:30 UTC — в Эр-Рияде уже 28 ноября.
  const now = Date.parse('2026-11-27T22:30:00Z');
  it('сегодня по Эр-Рияду', () => expect(riyadhToday(now)).toBe('2026-11-28'));
  it.each([
    ['2026-11-28', 0],
    ['2026-12-01', 3],
    ['2026-11-23', -5],
  ])('%s → %d', (due, days) => expect(daysUntil(due, now)).toBe(days));
});
