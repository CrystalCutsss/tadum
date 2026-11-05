// Маппинг стадий Odoo — по каждой строке таблиц 01-statuses.md §1–2 и 01-roles.md §4.
import { describe, expect, it } from 'vitest';

import { ODOO_STAGES, type ClientStatus, type OdooStage, type PermissionState, type SupplierViewStatus } from '@/shared/api';
import { readProductDoc, section, tableWithHeader } from '@/test-utils/markdown';

import { ODOO_STAGE_MAP, isKnownOdooStage, mapOdooStage } from './odoo-stage-map';
import { deriveClientStatus, derivePermissionState, deriveSupplierViewStatus, isAllowedClientTransition } from './status';

const statuses = readProductDoc('01-statuses.md');
const roles = readProductDoc('01-roles.md');

describe('01-statuses.md §1 — каждая известная стадия имеет маппинг', () => {
  const stages = tableWithHeader(section(statuses, '1.'), 'Стадия Odoo').rows.map((r) => r[0] ?? '');
  it('список стадий совпадает с документом', () => {
    expect([...ODOO_STAGES].sort()).toEqual([...stages].sort());
  });
  it.each(stages)('%s — есть в ODOO_STAGE_MAP', (stage) => {
    expect(isKnownOdooStage(stage)).toBe(true);
  });
  it('неизвестная стадия → null', () => {
    expect(mapOdooStage('Renamed stage')).toBeNull();
  });
});

describe('01-statuses.md §2 — таблица маппинга, каждая строка', () => {
  const rows = tableWithHeader(section(statuses, '2.'), 'Стадия Odoo').rows;
  it('в таблице 14 строк', () => expect(rows).toHaveLength(14));
  it.each(rows)('%s → %s / %s / %s', (stage, client, supplierView, permission) => {
    const s = stage as OdooStage;
    expect(mapOdooStage(s)).toEqual({ client_status: client, supplier_view_status: supplierView, permission_state: permission });
    expect(deriveClientStatus(s)).toBe(client as ClientStatus);
    expect(deriveSupplierViewStatus(s)).toBe(supplierView as SupplierViewStatus);
    expect(derivePermissionState(client as ClientStatus)).toBe(permission as PermissionState);
  });
  it('карта не содержит лишних стадий', () => {
    expect(Object.keys(ODOO_STAGE_MAP).sort()).toEqual(rows.map((r) => r[0]).sort());
  });
});

describe('01-roles.md §4 — состояния прав группируют статусы и стадии', () => {
  const rows = tableWithHeader(section(roles, '4.'), 'Состояние прав').rows;
  it.each(rows)('%s', (stateCell, clientStatuses, stagesCell) => {
    const state = stateCell.split(' ')[0] as PermissionState;
    for (const cs of clientStatuses.split(',').map((s) => s.trim())) {
      expect(derivePermissionState(cs as ClientStatus)).toBe(state);
    }
    const stages = ODOO_STAGES.filter((s) => stagesCell.includes(s));
    if (state === 'closed') expect(stages).toEqual(['Lost']); // «отказ UW или Lost»
    for (const st of stages) expect(ODOO_STAGE_MAP[st].permission_state).toBe(state);
  });
});

describe('01-statuses.md §2 — переходы client_status', () => {
  it.each([
    ['docs_required', 'under_review', true],
    ['under_review', 'approved', true],
    ['approved', 'first_purchase', true],
    ['under_review', 'docs_required', true],
    ['approved', 'docs_required', false],
    ['first_purchase', 'approved', false],
    ['closed', 'docs_required', false],
  ] as const)('%s → %s: %s', (from, to, ok) => {
    expect(isAllowedClientTransition(from, to)).toBe(ok);
  });
  it.each(['docs_required', 'under_review', 'approved', 'first_purchase'] as const)('%s → closed (reject / lost)', (from) => {
    expect(isAllowedClientTransition(from, 'closed')).toBe(true);
  });
});
