// Главная активного клиента: доступ, доля лимита, разбор суммы (бриф TD-002 §3, §5; A-078, A-079).
import { describe, expect, it } from 'vitest';

import { availableOf, hasClientHome, limitShare, parseAmount } from './home';

const sar = (amount_minor: number) => ({ amount_minor, currency: 'SAR' as const });

describe('hasClientHome (D-098, A-078)', () => {
  it('активный лимит — Home есть', () => expect(hasClientHome({ status: 'active', activated_at: '2026-11-01T00:00:00Z' })).toBe(true));
  it('отменён после активации — Home остаётся', () => expect(hasClientHome({ status: 'cancelled', activated_at: '2026-11-01T00:00:00Z' })).toBe(true));
  it('отменён до активации — Home нет', () => expect(hasClientHome({ status: 'cancelled' })).toBe(false));
  it.each(['pending', 'ready', 'rejected'] as const)('%s — Home нет', (status) => expect(hasClientHome({ status })).toBe(false));
  it('лимита нет — Home нет', () => {
    expect(hasClientHome(null)).toBe(false);
    expect(hasClientHome(undefined)).toBe(false);
  });
});

describe('limitShare', () => {
  it('не использован — 0', () => expect(limitShare({ approved: sar(100), used: sar(0) })).toEqual({ share: 0, percent: 0, inconsistent: false }));
  it('42 500 из 150 000 — 28 %', () => expect(limitShare({ approved: sar(15_000_000), used: sar(4_250_000) }).percent).toBe(28));
  it('крошечное использование — не 0 %', () => expect(limitShare({ approved: sar(10_000_000), used: sar(1) }).percent).toBe(1));
  it('почти всё — не 100 %, пока что-то доступно', () => expect(limitShare({ approved: sar(10_000), used: sar(9_999) }).percent).toBe(99));
  it('выбран полностью — 100 %', () => expect(limitShare({ approved: sar(100), used: sar(100) })).toEqual({ share: 1, percent: 100, inconsistent: false }));
  it('used > approved — 100 % и несогласованность (A3)', () => expect(limitShare({ approved: sar(100), used: sar(150) })).toEqual({ share: 1, percent: 100, inconsistent: true }));
});

describe('availableOf', () => {
  it('берёт доступное порта', () => expect(availableOf({ approved: sar(150), used: sar(50), available: sar(100) })).toEqual(sar(100)));
  it('used > approved — 0, даже если порт прислал иное', () => expect(availableOf({ approved: sar(100), used: sar(150), available: sar(20) })).toEqual(sar(0)));
});

describe('parseAmount (A-079)', () => {
  it.each([
    ['25000', 2_500_000],
    ['25,000', 2_500_000],
    ['25 000.5', 2_500_050],
    ['٢٥٠٠٠', 2_500_000],
    ['١٢٫٥٠', 1_250],
    ['0.01', 1],
  ])('%s → %d халал', (input, minor) => expect(parseAmount(input)).toEqual(sar(minor)));
  it.each(['', '   ', '0', '0.00', '-5', 'abc', '1.234', '1e5', '12..5'])('%j — не сумма', (input) => expect(parseAmount(input)).toBeNull());
});
