// Детерминированный хеш (FNV-1a, 32 бит): задержки и канал OTP одинаковы при каждом запуске (D-073).
export function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Целое в [min, max] от строки. */
export function hashRange(input: string, min: number, max: number): number {
  return min + (hash(input) % (max - min + 1));
}

/** SHA-256 содержимого файла (hex). */
export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
