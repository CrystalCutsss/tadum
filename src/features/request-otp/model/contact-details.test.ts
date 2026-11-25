import { describe, expect, it } from 'vitest';

import { businessNameError, contactNameError } from './contact-details';

describe('проверка полей нового клиента (A-074)', () => {
  it('пустое и из одних пробелов — required', () => {
    expect(contactNameError('')).toBe('required');
    expect(contactNameError('   ')).toBe('required');
    expect(businessNameError(' ')).toBe('required');
  });
  it('один знак — too_short', () => {
    expect(contactNameError('A')).toBe('too_short');
    expect(businessNameError(' B ')).toBe('too_short');
  });
  it('имя: латиница, арабский, дефис и апостроф проходят', () => {
    expect(contactNameError('Ahmed Al-Harbi')).toBeNull();
    expect(contactNameError("O'Neil")).toBeNull();
    expect(contactNameError('أحمد الحربي')).toBeNull();
  });
  it('имя: цифры и символы — letters_only', () => {
    expect(contactNameError('Ahmed 2')).toBe('letters_only');
    expect(contactNameError('-Ahmed')).toBe('letters_only');
    expect(contactNameError('a@b')).toBe('letters_only');
  });
  it('название компании: цифры и символы можно', () => {
    expect(businessNameError('Rimal 24 & Co.')).toBeNull();
  });
});
