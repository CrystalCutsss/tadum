// resolveRoles — каждая строка таблицы ролей 01-roles.md §2; активная роль для dual (D-020).
import { describe, expect, it } from 'vitest';

import type { Role } from '@/shared/api';
import { readProductDoc, section, tableWithHeader } from '@/test-utils/markdown';

import { initialActiveRole, resolveRoles, roleFamily, routePrefix, sessionKind, type RoleLookups } from './roles';

const PHONE = '+966501234567';
const lookups = (lead: { phone: string; owner?: string } | null, supplier: boolean): RoleLookups => ({
  findActiveLeadByPhone: () => (lead ? { phone: lead.phone, lead_main_owner_phone: lead.owner } : null),
  findSupplierByPhone: () => supplier,
});

// role_id → данные по номеру и ожидаемые роли.
const cases: Record<string, { lookups: RoleLookups; roles: Role[]; kind: ReturnType<typeof sessionKind> }> = {
  client_contact: { lookups: lookups({ phone: PHONE, owner: '+966559999999' }, false), roles: ['client_contact'], kind: 'client' },
  client_owner: { lookups: lookups({ phone: '+966559999999', owner: PHONE }, false), roles: ['client_owner'], kind: 'client' },
  supplier: { lookups: lookups(null, true), roles: ['supplier'], kind: 'supplier' },
  dual: { lookups: lookups({ phone: PHONE }, true), roles: ['client_contact', 'supplier'], kind: 'dual' },
  unknown: { lookups: lookups(null, false), roles: [], kind: 'unknown' },
};

describe('01-roles.md §2 — роли, каждая строка', () => {
  const rows = tableWithHeader(section(readProductDoc('01-roles.md'), '2.'), 'role_id').rows;
  it('в таблице 5 строк', () => expect(rows).toHaveLength(5));
  it.each(rows)('%s', (roleId) => {
    const c = cases[roleId];
    expect(c, `нет входа для «${roleId}»`).toBeDefined();
    const roles = resolveRoles(PHONE, c!.lookups);
    expect(roles).toEqual(c!.roles);
    expect(sessionKind(roles)).toBe(c!.kind);
  });
  it('номер совпал с обоими полями заявки — обе клиентские роли', () => {
    expect(resolveRoles(PHONE, lookups({ phone: PHONE, owner: PHONE }, false))).toEqual(['client_contact', 'client_owner']);
  });
});

describe('01-roles.md §3 — активная роль', () => {
  it('dual при первом входе — клиентская (D-020)', () => {
    expect(initialActiveRole(['client_contact', 'supplier'])).toBe('client_contact');
  });
  it('далее — последняя выбранная, если она есть среди ролей', () => {
    expect(initialActiveRole(['client_contact', 'supplier'], 'supplier')).toBe('supplier');
    expect(initialActiveRole(['client_contact'], 'supplier')).toBe('client_contact');
  });
  it('unknown — без активной роли', () => {
    expect(initialActiveRole([])).toBeNull();
  });
  it('семья роли и префикс маршрута', () => {
    expect(routePrefix(roleFamily('client_owner'))).toBe('/c');
    expect(routePrefix(roleFamily('supplier'))).toBe('/s');
  });
});
