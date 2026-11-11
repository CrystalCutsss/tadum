// SHA-256 содержимого файла (hex): по нему клиент узнаёт тот же файл до отправки (решение Кирилла 2026-11-10).
export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
