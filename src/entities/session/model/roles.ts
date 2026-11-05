// Роли по телефону (01-roles.md §2). Роли не хранятся в портале — вычисляются при входе
// по тому, что знает бэкенд об этом номере. Поиск лида и поставщика передаётся извне (порт / мок).

import type { ClientRole, Role, RoleFamily } from '@/shared/api';

export interface LeadMatch {
  phone: string;
  lead_main_owner_phone?: string | undefined;
}

export interface RoleLookups {
  /** Ищет активную заявку по crm.lead.phone и lead_main_owner_phone (TADUM-629). */
  findActiveLeadByPhone: (phone: string) => LeadMatch | null;
  findSupplierByPhone: (phone: string) => boolean;
}

/** [] → unknown: сессия не создаётся, экран «Заявка не найдена». */
export function resolveRoles(phone: string, lookups: RoleLookups): Role[] {
  const roles: Role[] = [];
  const lead = lookups.findActiveLeadByPhone(phone);
  if (lead && lead.phone === phone) roles.push('client_contact');
  if (lead && lead.lead_main_owner_phone === phone) roles.push('client_owner');
  if (lookups.findSupplierByPhone(phone)) roles.push('supplier');
  return roles;
}

export function isClientRole(role: Role): role is ClientRole {
  return role === 'client_contact' || role === 'client_owner';
}

export function roleFamily(role: Role): RoleFamily {
  return isClientRole(role) ? 'client' : 'supplier';
}

/** Префикс маршрутов кабинета: client → /c, supplier → /s. */
export function routePrefix(family: RoleFamily): '/c' | '/s' {
  return family === 'client' ? '/c' : '/s';
}

export type SessionKind = 'unknown' | 'client' | 'supplier' | 'dual';

export function sessionKind(roles: readonly Role[]): SessionKind {
  const client = roles.some(isClientRole);
  const supplier = roles.includes('supplier');
  if (client && supplier) return 'dual';
  if (client) return 'client';
  if (supplier) return 'supplier';
  return 'unknown';
}

/**
 * Активная роль при входе: одна роль — она; dual при первом входе — клиентская (D-020),
 * далее — последняя выбранная, если она всё ещё есть среди ролей.
 */
export function initialActiveRole(roles: readonly Role[], lastSelected?: Role | null): Role | null {
  if (roles.length === 0) return null;
  if (lastSelected && roles.includes(lastSelected)) return lastSelected;
  return roles.find(isClientRole) ?? roles[0] ?? null;
}
