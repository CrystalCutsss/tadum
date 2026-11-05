// Сведения о среде браузера для аналитики и подсказок (WhatsApp in-app browser, PWA, ширина экрана).

const IAB_PATTERN = /WhatsApp|FBAN|FBAV|Instagram|Line\/|Snapchat|TikTok|MicroMessenger/i;

const hasWindow = () => typeof window !== 'undefined';

/** Встроенный браузер мессенджера (ключевой — WhatsApp, 00-project-plan.md §3.3). */
export function isInAppBrowser(userAgent = hasWindow() ? window.navigator.userAgent : ''): boolean {
  return IAB_PATTERN.test(userAgent);
}

export function platformOf(userAgent = hasWindow() ? window.navigator.userAgent : ''): 'ios' | 'android' | 'desktop' {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
  if (/Android/i.test(userAgent)) return 'android';
  return 'desktop';
}

/** Запуск как установленное PWA. */
export function isStandalone(): boolean {
  return hasWindow() && typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
}

/** Контрольные точки 360 / 768 / 1280. */
export function viewportOf(width = hasWindow() ? window.innerWidth : 360): 'xs' | 'md' | 'lg' {
  if (width >= 1280) return 'lg';
  if (width >= 768) return 'md';
  return 'xs';
}
