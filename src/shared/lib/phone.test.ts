// SC-01 A1 и критерий приёмки: маска работает при вставке с пробелами, дефисами, кодом страны и ведущим 0.
import { describe, expect, it } from 'vitest';

import { formatNationalInput, nationalDigits, pathHash, toKsaMobile } from './phone';

describe('номер KSA', () => {
  it.each([
    ['501234567', '+966501234567'],
    ['50 123 4567', '+966501234567'],
    ['050-123-4567', '+966501234567'],
    ['+966 50 123 4567', '+966501234567'],
    ['00966501234567', '+966501234567'],
    ['966501234567', '+966501234567'],
  ])('%s → %s', (raw, full) => expect(toKsaMobile(raw)).toBe(full));
  it.each(['412345678', '50123456', '', 'abc', '+971501234567'])('A1: «%s» — не номер KSA', (raw) => expect(toKsaMobile(raw)).toBeNull());
  it('лишние цифры обрезаются до 9', () => expect(nationalDigits('5012345678999')).toBe('501234567'));
  it('маска 5X XXX XXXX по мере ввода', () => {
    expect(formatNationalInput('5')).toBe('5');
    expect(formatNationalInput('5012')).toBe('50 12');
    expect(formatNationalInput('501234567')).toBe('50 123 4567');
  });
  it('path_hash не раскрывает путь и стабилен', () => {
    expect(pathHash('/c/x?y=1')).toMatch(/^[0-9a-f]{8}$/);
    expect(pathHash('/a')).toBe(pathHash('/a'));
    expect(pathHash('/a')).not.toBe(pathHash('/b'));
  });
});
