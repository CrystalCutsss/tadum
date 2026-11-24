// Поставщик: статус (01-statuses.md §3, D-088), шкала (§8), права (01-roles.md §5, D-087),
// «следующий шаг» — строки «supplier …» таблицы 01-cabinet-structure.md §6 (D-091) и SP-01 A1, этап экрана «Заявка».
import { describe, expect, it } from 'vitest';

import type { SupplierOdooStage, SupplierStatus } from '@/shared/api';
import { doc, docSet } from '@/test-utils/fixtures';
import { readProductDoc, section, tableWithHeader, yamlBlock } from '@/test-utils/markdown';

import { supplierNextStep, type SupplierNextStepInput } from './next-step';
import { SUPPLIER_PERMISSIONS, supplierCan, type SupplierPermission } from './permissions';
import { supplierApplicationStage } from './stage';
import { deriveSupplierStatus, isSupplierPartner } from './status';
import { computeSupplierTimeline } from './timeline';

const statuses = readProductDoc('01-statuses.md');
const supSet = (...args: Parameters<typeof docSet>) => docSet(args[0], { owner: { kind: 'supplier', id: 'sup_1' }, ...args[1] });
const open = { locked: false };
const locked = { locked: true };

const ALL: readonly SupplierStatus[] = ['application_created', 'docs_required', 'under_review', 'contract_pending', 'partner', 'active', 'declined', 'paused'];

describe('01-statuses.md §3 — deriveSupplierStatus по стадии Odoo, каждая строка', () => {
  // Вход для каждой строки таблицы: стадия Odoo и комплект.
  const inputs: Record<SupplierStatus, [SupplierOdooStage, { locked: boolean } | null][]> = {
    application_created: [['New Lead', open], ['New Lead', null]],
    docs_required: [['Processing: Pending Docs', open]],
    under_review: [['Processing: Pending Docs', locked], ['New Lead', locked]],
    contract_pending: [['Processing: Need Contract', locked]],
    partner: [['Interested', locked]],
    active: [['Activated', locked]],
    declined: [['Declined', null]],
    paused: [['Lost', locked], ['Lost', open]],
  };
  const rows = tableWithHeader(section(statuses, '3.'), 'Стадия Odoo').rows;
  const fromTable = rows.map((r) => r[1]!.replaceAll('`', ''));

  it('в таблице ровно 8 статусов поставщика', () => expect([...fromTable].sort()).toEqual([...ALL].sort()));
  it.each(fromTable)('%s', (status) => {
    for (const [stage, set] of inputs[status as SupplierStatus]) expect(deriveSupplierStatus(stage, set)).toBe(status);
  });
  it('ссылка и клиенты — только partner и active (D-087)', () => {
    expect(ALL.filter(isSupplierPartner)).toEqual(['partner', 'active']);
  });
});

describe('01-statuses.md §8 — шкала поставщика documents → review → partner', () => {
  const rule = section(statuses, '8.');
  it.each([
    ['application_created', { documents: 'current', review: 'upcoming', partner: 'upcoming' }],
    ['docs_required', { documents: 'current', review: 'upcoming', partner: 'upcoming' }],
    ['under_review', { documents: 'done', review: 'current', partner: 'upcoming' }],
    ['contract_pending', { documents: 'done', review: 'current', partner: 'upcoming' }],
    ['partner', { documents: 'done', review: 'done', partner: 'current' }],
    ['active', { documents: 'done', review: 'done', partner: 'current' }],
    // D-092: Lost и Declined — последний шаг «Не активен», как отменённый лимит у клиента.
    ['paused', { documents: 'done', review: 'done', partner: 'cancelled' }],
    ['declined', { documents: 'done', review: 'done', partner: 'cancelled' }],
  ] as const)('%s', (status, expected) => {
    expect(computeSupplierTimeline(status)).toEqual(expected);
    expect(rule).toContain(`\`${status}\``);
  });
  it('D-092: у Lost и Declined последний шаг cancelled', () => expect(rule).toContain('partner cancelled'));
});

describe('01-roles.md §5 — права поставщика, каждая строка', () => {
  const lines = yamlBlock(section(readProductDoc('01-roles.md'), '5.'))
    .split('\n')
    .map((l) => l.replace(/#.*$/, '').trim())
    .filter((l) => l && !l.endsWith(':'));
  const rules = lines.flatMap((l) => {
    const [names, rule] = [l.slice(0, l.indexOf(':')), l.slice(l.indexOf(':') + 1).trim()];
    return names.split('/').map((n) => [n.trim(), rule] as const);
  });
  const contexts = ALL.flatMap((s) => [true, false].map((isLocked) => ({ supplier_status: s, locked: isLocked })));
  const expectedFor = (rule: string, ctx: (typeof contexts)[number]) => {
    if (rule === 'always') return true;
    if (rule === 'never') return false;
    if (rule === 'partner_or_active') return ctx.supplier_status === 'partner' || ctx.supplier_status === 'active';
    if (rule === "when supplier_status in ('application_created', 'docs_required') and !document_set.locked")
      return (ctx.supplier_status === 'application_created' || ctx.supplier_status === 'docs_required') && !ctx.locked;
    throw new Error(`неизвестное правило: ${rule}`);
  };

  it('набор прав совпадает с документом', () => {
    expect(Object.keys(SUPPLIER_PERMISSIONS).sort()).toEqual(rules.map((r) => r[0]).sort());
  });
  it.each(rules)('%s: %s', (perm, rule) => {
    for (const ctx of contexts) expect(supplierCan(perm as SupplierPermission, ctx), JSON.stringify(ctx)).toBe(expectedFor(rule, ctx));
  });
});

describe('01-cabinet-structure.md §6 — строки «supplier …»', () => {
  const pending = supSet([doc('pending', { portal_key: 'sup_vat' })]);
  const rows = tableWithHeader(section(readProductDoc('01-cabinet-structure.md'), '6.'), 'Ситуация').rows.filter((r) => r[0]?.startsWith('supplier '));
  it('в таблице 8 строк поставщика — по одной на статус', () => {
    expect(rows.map((r) => r[0]!.replace('supplier ', '').replaceAll('`', '')).sort()).toEqual([...ALL].sort());
  });
  it.each(rows)('%s → %s %s', (situation, owner, textKey, cta) => {
    const status = situation.replace('supplier ', '').replaceAll('`', '') as SupplierStatus;
    const input: SupplierNextStepInput = { supplier_status: status, document_set: pending };
    const step = supplierNextStep(input);
    expect(step.owner).toBe(owner);
    expect(step.text_key).toBe(textKey.replaceAll('`', ''));
    const route = cta.match(/→\s*`?(\/[^\s`]+)/)?.[1];
    if (route) expect(step.cta?.route).toBe(route);
    else expect(step.cta).toBeUndefined();
  });
  it('SP-01 A1: есть rejected → supplier.reupload_rejected {count}', () => {
    const s = supplierNextStep({ supplier_status: 'docs_required', document_set: supSet([doc('rejected', { portal_key: 'sup_vat' }), doc('rejected', { portal_key: 'sup_cr' })]) });
    expect(s).toMatchObject({ owner: 'user', text_key: 'next_step.supplier.reupload_rejected', meta: { count: 2 }, cta: { route: '/s/documents' } });
  });
  it('D-091: на проверке без срока', () => {
    expect(supplierNextStep({ supplier_status: 'under_review', document_set: null })).toEqual({ owner: 'tadum', text_key: 'next_step.supplier.under_review' });
  });
});

describe('этап экрана «Заявка» поставщика (бриф TD-001 §2)', () => {
  it.each([
    ['application_created', 'documents'],
    ['docs_required', 'documents'],
    ['under_review', 'documents'],
    ['contract_pending', 'contract'],
    ['partner', 'partner'],
    ['active', 'partner'],
    ['declined', 'declined'],
    ['paused', 'paused'],
  ] as const)('%s → %s', (status, stage) => expect(supplierApplicationStage(status)).toBe(stage));
});
