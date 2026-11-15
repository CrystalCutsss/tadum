// Каналы поддержки Tadum: WhatsApp (номер — VITE_SUPPORT_WHATSAPP) и e-mail. Одна ссылка wa.me для блока помощи
// и для отправки подписанного договора (SC-06, D-083); текст сообщения — уже переведённый, в аналитику не уходит.
const WHATSAPP = import.meta.env.VITE_SUPPORT_WHATSAPP ?? '966579768881';
export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL ?? 'info@tadum.sa';

/** Ссылка wa.me на поддержку Tadum с готовым текстом (если задан). */
export function supportWhatsappUrl(text = ''): string {
  return `https://wa.me/${WHATSAPP}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

/**
 * Nafith — сайт, откуда клиент переходит в приложение и одобряет вексель (Кирилл 2026-11-15). Прямой ссылки на запрос
 * у нас нет; если бэкенд начнёт её отдавать — заменить на неё.
 */
export const NAFITH_URL = 'https://www.nafith.sa';
