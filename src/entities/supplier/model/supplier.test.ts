// Поставщик: статус (01-statuses.md §3, SP-03 A1/A2), шкала (§8), права (01-roles.md §5),
// «следующий шаг» — строки «supplier …» таблицы 01-cabinet-structure.md §6 и SP-01 A1.
import { describe, expect, it } from 'vitest';

import type { SupplierStatus } from '@/shared/api';
import { doc, docSet } from '@/test-utils/fixtures';
import { readProductDoc, section, tableWithHeader, yamlBlock } from '@/test-utils/markdown';

import { supplierNextStep, type SupplierNextStepInput } from './next-step';
import { SUPPLIER_PERMISSIONS, supplierCan, type SupplierPermission } from './permissions';
import { deriveSupplierStatus } from './status';
import { computeSupplierTimeline } from './timeline';

const statuses = readProductDoc('01-statuses.md');
const supSet = (...args: Parameters<typeof docSet>) => docSet(args[0], { owner: { kind: 'supplier', id: 'sup_1' }, ...args[1] });

describe('01-statuses.md §3 — deriveSupplierStatus, каждая строка', () => {
  const inputs: Record<SupplierStatus, Parameters<typeof deriveSupplierStatus>[0][]> = {
    docs_required: [
      supSet([doc('pending', { portal_key: 'sup_vat' })]),
      supSet([doc('rejected', { portal_key: 'sup_vat' }), doc('received', { portal_key: 'sup_iban_letter' })]),
    ],
    under_review: [supSet([doc('received', { portal_key: 'sup_vat' })], { status: 'submitted', locked: true })],
    active: [supSet([doc('approved', { portal_key: 'sup_vat' })], { status: 'completed', locked: true }), null],
  };
  const rows = tableWithHeader(section(statuses, '3.'), 'supplier_status').rows;
  it.each(rows)('%s — %s', (status) => {
    const cases = inputs[status as SupplierStatus];
    expect(cases, `нет входа для «${status}»`).toBeDefined();
    for (const set of cases) expect(deriveSupplierStatus(set)).toBe(status);
  });

  it('SP-03 A1: после проверки есть rejected, комплект снова открыт → docs_required', () => {
    const set = supSet([doc('approved', { portal_key: 'sup_vat' }), doc('rejected', { portal_key: 'sup_iban_letter' })], { status: 'draft', locked: false });
    expect(deriveSupplierStatus(set)).toBe('docs_required');
  });
  it('SP-03 A2: Odoo добавил новый обязательный документ → docs_required', () => {
    const set = supSet([doc('approved', { portal_key: 'sup_vat' }), doc('pending', { portal_key: 'sup_cr' })], { round: 2 });
    expect(deriveSupplierStatus(set)).toBe('docs_required');
  });
  it('необязательный sup_cr не мешает active', () => {
    const set = supSet([doc('approved', { portal_key: 'sup_vat' }), doc('pending', { portal_key: 'sup_cr', required: false })], { status: 'completed', locked: true });
    expect(deriveSupplierStatus(set)).toBe('active');
  });
});

describe('01-statuses.md §8 — шкала поставщика', () => {
  // Правило дано строкой: «docs_required → documents current; under_review → documents done, review current;
  // active → все done, active current».
  it.each([
    ['docs_required', { documents: 'current', review: 'upcoming', active: 'upcoming' }],
    ['under_review', { documents: 'done', review: 'current', active: 'upcoming' }],
    ['active', { documents: 'done', review: 'done', active: 'current' }],
  ] as const)('%s', (status, expected) => {
    expect(computeSupplierTimeline(status)).toEqual(expected);
    expect(section(statuses, '8.')).toContain(`\`${status}\``);
  });
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
  const contexts = (['docs_required', 'under_review', 'active'] as const).flatMap((s) => [true, false].map((locked) => ({ supplier_status: s, locked })));

  it('набор прав совпадает с документом', () => {
    expect(Object.keys(SUPPLIER_PERMISSIONS).sort()).toEqual(rules.map((r) => r[0]).sort());
  });
  it.each(rules)('%s: %s', (perm, rule) => {
    for (const ctx of contexts) {
      const expected = rule === 'always' ? true : rule === 'never' ? false : ctx.supplier_status === 'docs_required' && !ctx.locked;
      expect(supplierCan(perm as SupplierPermission, ctx), JSON.stringify(ctx)).toBe(expected);
    }
  });
});

describe('01-cabinet-structure.md §6 — строки «supplier …»', () => {
  const inputs: Record<string, SupplierNextStepInput> = {
    'supplier docs_required': { supplier_status: 'docs_required', document_set: supSet([doc('pending', { portal_key: 'sup_vat' })]) },
    'supplier under_review': { supplier_status: 'under_review', document_set: null },
    'supplier active': { supplier_status: 'active', document_set: null },
  };
  const rows = tableWithHeader(section(readProductDoc('01-cabinet-structure.md'), '6.'), 'Ситуация').rows.filter((r) => r[0]?.startsWith('supplier '));
  it('в таблице 3 строки поставщика', () => expect(rows).toHaveLength(3));
  it.each(rows)('%s → %s %s', (situation, owner, textKey, cta) => {
    const step = supplierNextStep(inputs[situation]!);
    expect(step.owner).toBe(owner);
    expect(step.text_key).toBe(textKey);
    const route = cta.match(/→\s*(\/\S+)/)?.[1];
    if (route) expect(step.cta?.route).toBe(route);
    else expect(step.cta).toBeUndefined();
  });
  it('SP-01 A1: есть rejected → supplier.reupload_rejected {count}', () => {
    const s = supplierNextStep({ supplier_status: 'docs_required', document_set: supSet([doc('rejected', { portal_key: 'sup_vat' }), doc('rejected', { portal_key: 'sup_cr' })]) });
    expect(s).toMatchObject({ owner: 'user', text_key: 'next_step.supplier.reupload_rejected', meta: { count: 2 }, cta: { route: '/s/documents' } });
  });
  it('на проверке со сроком из данных → supplier.under_review_eta', () => {
    expect(supplierNextStep({ supplier_status: 'under_review', document_set: null, review_eta_hours: 48 })).toEqual({
      owner: 'tadum',
      text_key: 'next_step.supplier.under_review_eta',
      meta: { hours: 48 },
    });
  });
});
