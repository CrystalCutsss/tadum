// Маршруты v1 (01-cabinet-structure.md §1, D-067) и их screen_id для аналитики.
/** screen_id из 01-cabinet-structure.md §1 (единый список для маршрутов и аналитики). */
export type ScreenId =
  | 'auth.phone'
  | 'auth.otp'
  | 'auth.not_found'
  | 'auth.expired'
  | 'client.home'
  | 'client.documents'
  | 'client.document'
  | 'client.closed'
  | 'client.reapply'
  | 'client.help'
  | 'supplier.home'
  | 'supplier.referral'
  | 'supplier.clients'
  | 'supplier.documents'
  | 'supplier.document'
  | 'supplier.offer'
  | 'supplier.help'
  | 'system.404';

export const ROUTES = {
  root: '/',
  login: '/login',
  loginCode: '/login/code',
  notFound: '/not-found',
  sessionExpired: '/session-expired',
  clientHome: '/c/home',
  clientDocuments: '/c/documents',
  clientHelp: '/c/help',
  supplierHome: '/s/home',
  supplierDocuments: '/s/documents',
  supplierHelp: '/s/help',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
export type Family = 'client' | 'supplier';

/** screen_id по пути; у `/` экрана нет (только редирект). */
export const SCREEN_IDS: Readonly<Partial<Record<RoutePath, ScreenId>>> = {
  [ROUTES.login]: 'auth.phone',
  [ROUTES.loginCode]: 'auth.otp',
  [ROUTES.notFound]: 'auth.not_found',
  [ROUTES.sessionExpired]: 'auth.expired',
  [ROUTES.clientHome]: 'client.home',
  [ROUTES.clientDocuments]: 'client.documents',
  [ROUTES.clientHelp]: 'client.help',
  [ROUTES.supplierHome]: 'supplier.home',
  [ROUTES.supplierDocuments]: 'supplier.documents',
  [ROUTES.supplierHelp]: 'supplier.help',
};

const normalize = (pathname: string) => (pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname);

export function screenIdFor(pathname: string): ScreenId | null {
  return SCREEN_IDS[normalize(pathname) as RoutePath] ?? null;
}

/** Семья кабинета по префиксу: /c → client, /s → supplier. */
export function familyOfPath(pathname: string): Family | null {
  if (pathname === '/c' || pathname.startsWith('/c/')) return 'client';
  if (pathname === '/s' || pathname.startsWith('/s/')) return 'supplier';
  return null;
}

export function homeOf(family: Family): typeof ROUTES.clientHome | typeof ROUTES.supplierHome {
  return family === 'client' ? ROUTES.clientHome : ROUTES.supplierHome;
}

/**
 * returnTo — только внутренний путь кабинета: начинается с /c/ или /s/, без схемы, `//`, `\` и управляющих символов.
 * Так ссылка из письма или лендинга не уведёт на чужой сайт и не зациклит вход.
 */
export function safeReturnTo(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 512) return null;
  // eslint-disable-next-line no-control-regex -- отсекаем управляющие символы
  if (!/^\/[cs]\/[^\s\\]*$/.test(value) || value.startsWith('//') || /[\u0000-\u001f]/.test(value)) return null;
  return familyOfPath(value.split(/[?#]/)[0] ?? '') ? value : null;
}
