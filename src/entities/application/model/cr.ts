// Номер коммерческой регистрации (CR) компании: ровно 10 цифр (схема Company, A-0xx в assumptions.md).

export const CR_LENGTH = 10;

/** Только цифры: арабско-индийские (٠–٩, ۰–۹) приводим к западным, прочее отбрасываем, не длиннее 10. */
export function crDigits(raw: string): string {
  return raw
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, '')
    .slice(0, CR_LENGTH);
}

export type CrError = 'required' | 'length';

/** Ошибка проверки номера или null, если номер подходит. */
export function crError(value: string): CrError | null {
  if (value.length === 0) return 'required';
  if (!new RegExp(`^\\d{${CR_LENGTH}}$`).test(value)) return 'length';
  return null;
}

export const isValidCr = (value: string | undefined): value is string => value !== undefined && crError(value) === null;
