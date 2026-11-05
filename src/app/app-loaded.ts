// app_loaded (04-metrics-and-events.md §3, NFR §2.6): первая отрисовка оболочки в сессии вкладки.
// Версия приложения (package.json + коммит) приходит в событие из общего контекста track() — app_version.
import { track } from '@/shared/analytics';
import { sessionStore, storage } from '@/shared/lib';

const SENT_KEY = 'app:loaded';
const UPDATED_KEY = 'sw:updated';

type SwState = 'none' | 'installed' | 'updated';

/** Состояние service worker на момент загрузки. 'updated' — первая загрузка после смены воркера. */
export function swStateOf(hasController: boolean, updatedFlag: boolean): SwState {
  if (!hasController) return 'none';
  return updatedFlag ? 'updated' : 'installed';
}

export function trackAppLoaded(): void {
  if (sessionStore.get(SENT_KEY)) return;
  sessionStore.set(SENT_KEY, '1');
  const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined;
  const hasController = Boolean(sw?.controller);
  const state = swStateOf(hasController, storage.get(UPDATED_KEY) === '1');
  storage.remove(UPDATED_KEY);
  // Холодный старт — страница пришла из сети, а не из кэша service worker.
  track('app_loaded', { cold_start: !hasController, sw_state: state });
  // autoUpdate перезагружает страницу при смене воркера; отметку видит следующая сессия.
  sw?.addEventListener('controllerchange', () => storage.set(UPDATED_KEY, '1'));
}
