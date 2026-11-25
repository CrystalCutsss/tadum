import { describe, expect, it } from 'vitest';

import { cityError, emailError, industryError, isSupplierProfileComplete } from './profile';

describe('профиль поставщика (A-075)', () => {
  it('email: пустой — required, без домена — invalid', () => {
    expect(emailError(' ')).toBe('required');
    expect(emailError('orders')).toBe('invalid');
    expect(emailError('orders@zahrat')).toBe('invalid');
    expect(emailError('a b@zahrat.sa')).toBe('invalid');
    expect(emailError(' orders@zahrat.com.sa ')).toBeNull();
  });
  it('отрасль: пустая и один знак — ошибки, цифры и символы можно', () => {
    expect(industryError('')).toBe('required');
    expect(industryError('A')).toBe('too_short');
    expect(industryError('IT & 3D printing')).toBeNull();
  });
  it('город: подсказки из списка проходят, цифры — нет', () => {
    for (const c of ['Riyadh', 'Al-Ahsa', 'Al Khobar', 'مكة المكرمة', 'الأحساء']) expect(cityError(c)).toBeNull();
    expect(cityError('R')).toBe('too_short');
    expect(cityError('Riyadh 2')).toBe('letters_only');
  });
  it('готовность: email, отрасль и город сохранены и подходят', () => {
    const full = { email: 'o@z.sa', industry: 'Food', city: 'Riyadh' };
    expect(isSupplierProfileComplete(full)).toBe(true);
    expect(isSupplierProfileComplete({ ...full, city: undefined })).toBe(false);
    expect(isSupplierProfileComplete({ ...full, email: 'o@z' })).toBe(false);
  });
});
