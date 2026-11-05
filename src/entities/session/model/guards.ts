// Решения гардов маршрутов (01-cabinet-structure.md §1, SC-01, D-020) — чистые функции.
// Маршруты только исполняют решение (redirect), поэтому каждую ветку можно проверить unit-тестом.
import type { Role, Session } from '@/shared/api';
import { ROUTES, familyOfPath, homeOf, safeReturnTo, type Family } from '@/shared/config';
import { storage } from '@/shared/lib';

import { roleFamily } from './roles';

const LAST_FAMILY = 'role:last_family';

export function familiesOf(roles: readonly Role[]): Family[] {
  return [...new Set(roles.map(roleFamily))].sort();
}

/** Последний выбор семьи для dual (D-020: «далее — последняя выбранная»). */
export const familyMemory = {
  last: (): Family | null => {
    const v = storage.get(LAST_FAMILY);
    return v === 'client' || v === 'supplier' ? v : null;
  },
  remember: (family: Family): void => storage.set(LAST_FAMILY, family),
};

/** Активная семья: последняя выбранная, если она доступна; первый вход dual — клиентская (D-020). */
export function activeFamily(session: Pick<Session, 'roles'>, last: Family | null): Family {
  const families = familiesOf(session.roles);
  if (last && families.includes(last)) return last;
  return families.includes('client') ? 'client' : 'supplier';
}

export type GuardDecision = { kind: 'allow' } | { kind: 'redirect'; to: string; returnTo?: string };

type State = { status: 'none' } | { status: 'expired' } | { status: 'active'; session: Pick<Session, 'roles'> };

/** `/`: нет сессии → /login; есть → home активной семьи. */
export function decideRoot(state: State, last: Family | null): GuardDecision {
  if (state.status !== 'active') return { kind: 'redirect', to: ROUTES.login };
  return { kind: 'redirect', to: homeOf(activeFamily(state.session, last)) };
}

/** Экраны входа: при живой сессии — home активной семьи (SC-01 A12). */
export function decideAuthScreen(state: State, last: Family | null): GuardDecision {
  return state.status === 'active' ? { kind: 'redirect', to: homeOf(activeFamily(state.session, last)) } : { kind: 'allow' };
}

/**
 * Кабинет /c/* и /s/*: нет сессии → /login с returnTo; истекла → /session-expired (A11);
 * чужая семья → свой home без ошибки; dual открывает обе семьи.
 */
export function decideCabinet(state: State, href: string, last: Family | null): GuardDecision {
  const family = familyOfPath(href.split(/[?#]/)[0] ?? '');
  const returnTo = safeReturnTo(href) ?? undefined;
  if (state.status === 'none') return { kind: 'redirect', to: ROUTES.login, ...(returnTo ? { returnTo } : {}) };
  if (state.status === 'expired') return { kind: 'redirect', to: ROUTES.sessionExpired, ...(returnTo ? { returnTo } : {}) };
  if (family && !familiesOf(state.session.roles).includes(family)) {
    return { kind: 'redirect', to: homeOf(activeFamily(state.session, last)) };
  }
  return { kind: 'allow' };
}

/** Куда вести после входа: returnTo своей семьи, иначе home активной (SC-01: supplier с диплинком /c/* → /s/home). */
export function destinationAfterLogin(session: Pick<Session, 'roles'>, returnTo: string | null, last: Family | null): { to: string; returned: boolean } {
  const safe = safeReturnTo(returnTo);
  const family = safe ? familyOfPath(safe.split(/[?#]/)[0] ?? '') : null;
  if (safe && family && familiesOf(session.roles).includes(family)) return { to: safe, returned: true };
  return { to: homeOf(activeFamily(session, last)), returned: false };
}
