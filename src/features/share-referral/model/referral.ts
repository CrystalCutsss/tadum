// Действия с реферальной ссылкой поставщика (SP-02 §1, §7; D-087, D-089): копирование, отправка в WhatsApp, QR.
// Ссылка и текст сообщения — данные поставщика: в аналитику не уходят (SP-02 §5).
import { encode } from 'uqr';

/** wa.me без номера — WhatsApp сам предложит выбрать чат (SP-02 §1). Текст и ссылка кодируются целиком. */
export function whatsappShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/** Текст сообщения: переведённая фраза и ссылка отдельной строкой, чтобы URL не попал под bidi-перестановку (SP-02 §7). */
export function shareMessage(text: string, url: string): string {
  return `${text}\n${url}`;
}

/** Имя файла QR: tadum-{slug}-qr.png (SP-02 §1). */
export function qrFileName(slug: string): string {
  return `tadum-${slug}-qr.png`;
}

export interface QrMatrix {
  size: number;
  data: boolean[][];
}

/** Матрица QR: коррекция M, тихая зона 4 модуля (SP-02 §7). */
export function qrMatrix(url: string): QrMatrix {
  const { size, data } = encode(url, { ecc: 'M', border: 4 });
  return { size, data };
}

/** Копирование через Clipboard API; false — API нет или браузер отказал (SP-02 A1). */
export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export type ShareResult = 'web_share' | 'wa_me' | 'cancelled';

/**
 * Системное меню «Поделиться» устройства (Web Share: iOS, Android, macOS, Windows) — только по жесту пользователя
 * (SP-02 §7, Кирилл 2026-11-24). Ссылка — отдельным полем url, чтобы WhatsApp, Telegram и «Скопировать» получили её
 * как ссылку. Где Web Share нет (часть десктопных браузеров) — wa.me в новом окне. Отмена меню — не ошибка (SP-02 A2).
 */
export async function shareLink(
  text: string,
  url: string,
  open: (href: string) => void = (href) => window.open(href, '_blank', 'noopener'),
): Promise<ShareResult> {
  const data = { text, url };
  if (typeof navigator !== 'undefined' && navigator.share && (!navigator.canShare || navigator.canShare(data))) {
    try {
      await navigator.share(data);
      return 'web_share';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    }
  }
  open(whatsappShareUrl(shareMessage(text, url)));
  return 'wa_me';
}

// Печатное изображение QR (SP-02 §1, D-045): 1024 px, тёмные модули на светлом фоне в любой теме (SP-02 §3) —
// это свойства картинки для печати, а не цвета интерфейса, поэтому они не берутся из токенов.
const PNG_SIZE = 1024;
const CAPTION_HEIGHT = 96;
const INK = 'black';
const PAPER = 'white';

/** PNG-ссылка data: (не blob: — ограничение встроенного браузера WhatsApp, DoD §3). null — Canvas недоступен. */
export function qrPngDataUrl(url: string): string | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const { size, data } = qrMatrix(url);
  const cell = Math.floor(PNG_SIZE / size);
  const offset = Math.floor((PNG_SIZE - cell * size) / 2);
  canvas.width = PNG_SIZE;
  canvas.height = PNG_SIZE + CAPTION_HEIGHT;
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = INK;
  data.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) ctx.fillRect(offset + x * cell, offset + y * cell, cell, cell);
    }),
  );
  // Подпись — ссылка текстом под QR, системный шрифт (SP-02 §7).
  ctx.font = '36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(url, PNG_SIZE / 2, PNG_SIZE + CAPTION_HEIGHT / 2, PNG_SIZE - 64);
  return canvas.toDataURL('image/png');
}
