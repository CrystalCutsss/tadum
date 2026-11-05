// Ввод номера KSA (SC-01 §1, критерии приёмки): вставка с пробелами, дефисами, `+966`, `00966` и ведущим `0`.

/** Национальная часть (9 цифр, начинается с 5) из произвольного ввода; без кода страны. */
export function nationalDigits(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('00966')) d = d.slice(5);
  else if (d.startsWith('966')) d = d.slice(3);
  if (d.startsWith('0')) d = d.slice(1);
  return d.slice(0, 9);
}

/** Полный номер `+9665XXXXXXXX` или null, если национальная часть ещё не 9 цифр с ведущей 5. */
export function toKsaMobile(raw: string): string | null {
  const d = nationalDigits(raw);
  return /^5\d{8}$/.test(d) ? `+966${d}` : null;
}

/** Маска поля `5X XXX XXXX` по уже введённым цифрам. */
export function formatNationalInput(digits: string): string {
  const d = digits.slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 9)].filter(Boolean).join(' ');
}

/** Хеш пути для screen_viewed{system.404}: параметры и сам путь не уходят в аналитику (SC-10). */
export function pathHash(pathname: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < pathname.length; i++) {
    h ^= pathname.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
