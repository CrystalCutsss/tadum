// Простая проверка полей экрана «Contact name и Business name» нового клиента (Кирилл 2026-11-25, A-074):
// оба поля обязательные, не короче двух знаков; в имени — только буквы (любого алфавита), пробел, дефис, апостроф и точка.
export const DETAILS_MIN_LENGTH = 2;

export type DetailsFieldError = 'required' | 'too_short' | 'letters_only';

const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u;

function baseError(value: string): 'required' | 'too_short' | null {
  const v = value.trim();
  if (v === '') return 'required';
  if ([...v].length < DETAILS_MIN_LENGTH) return 'too_short';
  return null;
}

export function contactNameError(value: string): DetailsFieldError | null {
  return baseError(value) ?? (NAME_PATTERN.test(value.trim()) ? null : 'letters_only');
}

export function businessNameError(value: string): Exclude<DetailsFieldError, 'letters_only'> | null {
  return baseError(value);
}
