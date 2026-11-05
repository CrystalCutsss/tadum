// Корзины §2.4 — границы каждой корзины.
import { describe, expect, it } from 'vitest';

import { amountBucket, countBucket, hoursRounded, sizeKb, usedShareBucket } from './buckets';

const sar = (n: number) => ({ amount_minor: Math.round(n * 100), currency: 'SAR' as const });

describe('amount_bucket', () => {
  it.each([
    [0, '<50k'],
    [49_999.99, '<50k'],
    [50_000, '50-100k'],
    [99_999, '50-100k'],
    [100_000, '100-250k'],
    [249_999, '100-250k'],
    [250_000, '250-500k'],
    [499_999, '250-500k'],
    [500_000, '500k+'],
    [5_000_000, '500k+'],
  ] as const)('%s SAR → %s', (amount, bucket) => expect(amountBucket(sar(amount))).toBe(bucket));
});

describe('used_share_bucket', () => {
  const approved = sar(100_000);
  it.each([
    [0, '0'],
    [1, '1-25'],
    [25_000, '1-25'],
    [25_001, '26-50'],
    [50_000, '26-50'],
    [50_001, '51-75'],
    [75_000, '51-75'],
    [75_001, '76-99'],
    [99_999, '76-99'],
    [100_000, '100'],
    [120_000, '100'],
  ] as const)('%s из 100 000 → %s', (used, bucket) => expect(usedShareBucket(sar(used), approved)).toBe(bucket));
  it('лимит 0 → «0»', () => expect(usedShareBucket(sar(10), sar(0))).toBe('0'));
});

describe('referred_bucket / total_bucket', () => {
  it.each([
    [0, '0'],
    [1, '1-5'],
    [5, '1-5'],
    [6, '6-10'],
    [10, '6-10'],
    [11, '11-25'],
    [25, '11-25'],
    [26, '26+'],
    [140, '26+'],
  ] as const)('%s → %s', (n, bucket) => expect(countBucket(n)).toBe(bucket));
});

describe('size_kb и часы', () => {
  it('размер округляется до 100 КБ', () => {
    expect(sizeKb(0)).toBe(0);
    expect(sizeKb(49 * 1024)).toBe(0);
    expect(sizeKb(50 * 1024)).toBe(100);
    expect(sizeKb(1_234 * 1024)).toBe(1_200);
    expect(sizeKb(10 * 1024 * 1024)).toBe(10_200);
  });
  it('часы округляются до 1 ч', () => {
    expect(hoursRounded(29 * 60_000)).toBe(0);
    expect(hoursRounded(90 * 60_000)).toBe(2);
    expect(hoursRounded(24 * 3_600_000)).toBe(24);
  });
});
