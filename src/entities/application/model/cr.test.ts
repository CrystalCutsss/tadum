import { describe, expect, it } from 'vitest';

import { crDigits, crError, isValidCr } from './cr';

describe('CR', () => {
  it('оставляет только цифры, арабские приводит к западным, режет до 10', () => {
    expect(crDigits('10-10 abc')).toBe('1010');
    expect(crDigits('١٠١٠٠٠٠٠٠٣')).toBe('1010000003');
    expect(crDigits('۱۲۳')).toBe('123');
    expect(crDigits('123456789012')).toBe('1234567890');
  });
  it('пусто — required, не 10 цифр — length, 10 цифр — ок', () => {
    expect(crError('')).toBe('required');
    expect(crError('123')).toBe('length');
    expect(crError('1010000003')).toBeNull();
    expect(isValidCr(undefined)).toBe(false);
    expect(isValidCr('1010000003')).toBe(true);
  });
});
