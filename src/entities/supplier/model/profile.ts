// Профиль компании поставщика на экране «Заявка» (Кирилл 2026-11-25, A-075): CR, email, отрасль, город.
// Проверка простая и та же, что у мока (SupplierSchema): email — вид name@company.com, отрасль и город — от 2 до 60 знаков,
// в городе — только буквы любого алфавита, пробел, дефис, апостроф и точка («Al-Ahsa», «مكة المكرمة»).
const PROFILE_TEXT_MIN = 2;
export const PROFILE_TEXT_MAX = 60;

export type ProfileTextError = 'required' | 'too_short';
export type EmailError = 'required' | 'invalid';
export type CityError = ProfileTextError | 'letters_only';

const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/;
const CITY = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u;

export function emailError(value: string): EmailError | null {
  const v = value.trim();
  if (v === '') return 'required';
  return EMAIL.test(v) ? null : 'invalid';
}

export function industryError(value: string): ProfileTextError | null {
  const v = value.trim();
  if (v === '') return 'required';
  return [...v].length < PROFILE_TEXT_MIN ? 'too_short' : null;
}

export function cityError(value: string): CityError | null {
  const base = industryError(value);
  if (base) return base;
  return CITY.test(value.trim()) ? null : 'letters_only';
}

export interface SupplierProfileValues {
  email?: string | undefined;
  industry?: string | undefined;
  city?: string | undefined;
}

/** Email, отрасль и город сохранены и подходят. Номер CR проверяет фича (isValidCr из entities/application). */
export function isSupplierProfileComplete(p: SupplierProfileValues): boolean {
  return (
    emailError(p.email ?? '') === null &&
    industryError(p.industry ?? '') === null &&
    cityError(p.city ?? '') === null
  );
}
