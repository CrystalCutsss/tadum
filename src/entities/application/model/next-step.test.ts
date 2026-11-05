// «Следующий шаг» клиента — каждая клиентская строка таблицы 01-cabinet-structure.md §6
// плюс уточнения сценариев SC-02, SC-05, SC-06. Строки «supplier …» — в entities/supplier/model/next-step.test.ts.
import { describe, expect, it } from 'vitest';

import { doc, docSet, limit } from '@/test-utils/fixtures';
import { readProductDoc, section, tableWithHeader } from '@/test-utils/markdown';

import { clientNextStep, type ClientNextStepInput } from './next-step';

const LANDING = 'https://tadum.sa';
const base = { landing_url: LANDING, limit: null, document_set: null } as const;

const cases: Record<string, ClientNextStepInput> = {
  'docs_required, есть rejected документы': { ...base, client_status: 'docs_required', document_set: docSet([doc('rejected'), doc('received', { portal_key: 'vat' })]) },
  'docs_required, нет отправленного комплекта': { ...base, client_status: 'docs_required', document_set: docSet([doc('received'), doc('pending', { portal_key: 'vat' })]) },
  'docs_required, round > 1, новых загрузок нет': { ...base, client_status: 'docs_required', document_set: docSet([doc('pending')], { round: 2 }) },
  under_review: { ...base, client_status: 'under_review' },
  'approved, чек-лист не завершён': { ...base, client_status: 'approved', limit: limit('ready', false) },
  'approved, чек-лист завершён, лимит active': { ...base, client_status: 'approved', limit: limit('active', true) },
  first_purchase: { ...base, client_status: 'first_purchase', limit: limit('active', true) },
  closed: { ...base, client_status: 'closed' },
};

/** «→ `/c/documents`» → маршрут; «→ лендинг …» → внешняя ссылка; «—» → без CTA. */
function expectedCta(cell: string): { route?: string; external?: true } | null {
  if (cell.startsWith('—')) return null;
  const route = cell.match(/→\s*(\/\S+)/)?.[1];
  if (route) return { route };
  if (cell.includes('лендинг')) return { external: true };
  throw new Error(`не разобрана ячейка CTA: ${cell}`);
}

describe('01-cabinet-structure.md §6 — каждая клиентская строка', () => {
  const all = tableWithHeader(section(readProductDoc('01-cabinet-structure.md'), '6.'), 'Ситуация').rows;
  const rows = all.filter((r) => !r[0]?.startsWith('supplier '));
  it('в таблице 11 строк, из них 8 клиентских', () => {
    expect(all).toHaveLength(11);
    expect(rows).toHaveLength(8);
  });
  it.each(rows)('%s → %s %s', (situation, owner, textKeyCell, ctaCell) => {
    const c = cases[situation];
    expect(c, `нет входа для строки «${situation}»`).toBeDefined();
    const step = clientNextStep(c!);
    expect(step.owner).toBe(owner);
    expect(step.text_key).toBe(textKeyCell.split(' ')[0]);
    if (textKeyCell.includes('(count')) expect(step.meta?.count).toBeTypeOf('number');
    const cta = expectedCta(ctaCell);
    if (cta === null) expect(step.cta).toBeUndefined();
    else if (cta.route) expect(step.cta?.route).toBe(cta.route);
    else expect(step.cta?.external_url).toBe(LANDING);
  });
});

describe('уточнения сценариев', () => {
  it('SC-02: все обязательные загружены → submit_ready', () => {
    const s = clientNextStep({ ...base, client_status: 'docs_required', document_set: docSet([doc('received'), doc('approved', { portal_key: 'vat' })]) });
    expect(s.text_key).toBe('next_step.submit_ready');
  });
  it('count оставшихся документов считает только обязательные', () => {
    const s = clientNextStep({
      ...base,
      client_status: 'docs_required',
      document_set: docSet([doc('pending'), doc('pending', { portal_key: 'vat' }), doc('pending', { portal_key: 'aoa', required: false }), doc('received', { portal_key: 'ch_owner' })]),
    });
    expect(s).toMatchObject({ text_key: 'next_step.upload_documents', meta: { count: 2 } });
  });
  it('SC-05 A2: срок из данных → under_review_eta {hours}; без данных — без срока', () => {
    expect(clientNextStep({ ...base, client_status: 'under_review', review_eta_hours: 24 })).toEqual({
      owner: 'tadum',
      text_key: 'next_step.under_review_eta',
      meta: { hours: 24 },
    });
    expect(clientNextStep({ ...base, client_status: 'under_review' }).meta).toBeUndefined();
  });
  it('SC-06: approved, лимит pending (Offer confirmation) → offer_confirmation, owner tadum', () => {
    expect(clientNextStep({ ...base, client_status: 'approved', limit: limit('pending', false) })).toEqual({
      owner: 'tadum',
      text_key: 'next_step.offer_confirmation',
    });
  });
});
