// Общие свойства каждого события (04-metrics-and-events.md §2.2). Оболочка обновляет экран, роль,
// язык и тему через setAnalyticsContext; среда (платформа, IAB, PWA, ширина) читается в момент события.
import { isInAppBrowser, isStandalone, platformOf, sessionStore, viewportOf } from '@/shared/lib';

import type { ScreenId } from './events';

export interface AnalyticsContext {
  screen_id: ScreenId | null;
  role: 'client' | 'supplier' | 'anon';
  lang: 'ar' | 'en';
  dir: 'rtl' | 'ltr';
  theme: 'light' | 'dark';
  platform: 'ios' | 'android' | 'desktop';
  in_iab: boolean;
  is_pwa: boolean;
  viewport: 'xs' | 'md' | 'lg';
  app_version: string;
  proto_version?: string;
  persona?: string;
  session_id: string;
}

type Settable = Pick<AnalyticsContext, 'screen_id' | 'role' | 'lang' | 'dir' | 'theme'> & { persona?: string | undefined };

let state: Settable = { screen_id: null, role: 'anon', lang: 'ar', dir: 'rtl', theme: 'light' };

export function setAnalyticsContext(patch: Partial<Settable>): void {
  state = { ...state, ...patch };
}

const SESSION_KEY = 'analytics:session_id';

/** Случайный id сессии аналитики — живёт, пока открыта вкладка; не связан с сессией входа. */
function sessionId(): string {
  let id = sessionStore.get(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStore.set(SESSION_KEY, id);
  }
  return id;
}

export function currentContext(): AnalyticsContext {
  const proto = import.meta.env.VITE_PROTO_VERSION;
  return {
    screen_id: state.screen_id,
    role: state.role,
    lang: state.lang,
    dir: state.dir,
    theme: state.theme,
    platform: platformOf(),
    in_iab: isInAppBrowser(),
    is_pwa: isStandalone(),
    viewport: viewportOf(),
    app_version: import.meta.env.VITE_APP_VERSION ?? 'dev',
    // proto_version и persona — только на витрине; в проде отсутствуют.
    ...(proto ? { proto_version: proto } : {}),
    ...(state.persona && import.meta.env.VITE_DEMO_PANEL !== '0' ? { persona: state.persona } : {}),
    session_id: sessionId(),
  };
}
