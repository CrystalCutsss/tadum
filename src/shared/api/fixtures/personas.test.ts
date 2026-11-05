// Персоны (01-entities.md §6): каждая строка таблицы есть, граф проходит Zod, производные поля совпадают
// с правилами entities, правила генерации соблюдены (телефоны, суммы кратны 500, даты от clock.now()).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TEST_NOW, landingUrl, mockDomain, testApi } from '@/test-utils/mock-api';
import { readProductDoc, section, tableWithHeader } from '@/test-utils/markdown';

import { normalize } from '../adapters/mock/derive';
import { PERSONAS } from './personas';
import { PersonaGraphSchema } from './schema';
import { PERSONA_IDS, type PersonaGraph, type PersonaId } from './types';

const rows = tableWithHeader(section(readProductDoc('01-entities.md'), '6.'), 'persona_id').rows;
const id = (cell: string) => cell.replace(/`/g, '') as PersonaId;
const now = () => Date.parse(TEST_NOW);

/** Все объекты Money в графе. */
function moneys(value: unknown, out: number[] = []): number[] {
  if (Array.isArray(value)) value.forEach((v) => moneys(v, out));
  else if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    if (o.currency === 'SAR' && typeof o.amount_minor === 'number') out.push(o.amount_minor);
    else Object.values(o).forEach((v) => moneys(v, out));
  }
  return out;
}

/** Все ISO-даты графа. */
function dates(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string' && /^\d{4}-\d\d-\d\dT/.test(value)) out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => dates(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => dates(v, out));
  return out;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(TEST_NOW);
});
afterEach(() => vi.useRealTimers());

describe('01-entities.md §6 — персоны, каждая строка', () => {
  it('реестр совпадает с таблицей (14)', () => {
    expect(rows.map((r) => id(r[0]!))).toEqual([...PERSONA_IDS]);
  });

  it.each(rows)('%s — %s — %s', async (cell, rolesCell, stateCell) => {
    const pid = id(cell);
    const g = PERSONAS[pid](now());
    expect(PersonaGraphSchema.parse(g)).toEqual(g);
    // Производные поля записаны руками и совпадают с правилами entities.
    expect(normalize(g, mockDomain, landingUrl)).toEqual(g);

    // Роли — как в колонке «Роли» (вход по номеру персоны).
    const expectedRoles = rolesCell === '—' ? [] : rolesCell.split('+').map((r) => r.trim());
    const api = testApi();
    api.demo!.setPersona(pid);
    const session = await api.auth.getSession();
    expect([...(session?.roles ?? [])].sort()).toEqual([...expectedRoles].sort());

    // Статус — первый код в колонке «Состояние»: клиентский статус заявки или статус поставщика.
    const status = stateCell.match(/`([a-z_]+)/)?.[1];
    if (status) {
      const actual = g.applications.at(-1)?.client_status ?? g.supplier?.supplier_status;
      expect(actual).toBe(status);
    }
  });
});

describe('правила генерации персон', () => {
  const graphs = PERSONA_IDS.map((pid) => PERSONAS[pid](now()));

  it('телефоны только из диапазона +966 50 000 0XXX', () => {
    for (const g of graphs) {
      const phones = [g.phone, ...g.leads.flatMap((l) => [l.phone, l.lead_main_owner_phone ?? g.phone]), ...(g.supplier?.phones ?? [])];
      for (const p of phones) expect(p).toMatch(/^\+9665000[0-9]{5}$/);
    }
  });
  it('номера для входа уникальны', () => {
    expect(new Set(graphs.map((g) => g.phone)).size).toBe(graphs.length);
  });
  it('суммы кратны 500 SAR', () => {
    for (const g of graphs) for (const m of moneys(g)) expect(m % 50_000, `${g.persona_id}: ${m}`).toBe(0);
  });
  it('даты — смещения от clock.now(): граф «через сутки» сдвинут ровно на сутки', () => {
    const day = 24 * 60 * 60_000;
    for (const pid of PERSONA_IDS) {
      const a = dates(PERSONAS[pid](now()));
      const b = dates(PERSONAS[pid](now() + day));
      expect(b.map((x) => Date.parse(x) - day)).toEqual(a.map((x) => Date.parse(x)));
    }
  });
  it('названия компаний есть на арабском и английском', () => {
    for (const g of graphs.filter((x): x is PersonaGraph & { company: NonNullable<PersonaGraph['company']> } => x.company !== null)) {
      expect(g.company.name).toMatch(/[A-Za-z]/);
      expect(g.company.name_ar).toMatch(/[؀-ۿ]/);
    }
  });
  it('SP-01: счётчики supplier_active = {14, 3, 6}', () => {
    expect(PERSONAS.supplier_active(now()).supplier?.counters).toEqual({ referred_total: 14, under_review: 3, approved: 6 });
  });
  it('SP-04: у supplier_active приведённые клиенты во всех статусах', () => {
    const g = PERSONAS.supplier_active(now());
    const statuses = new Set(g.referrals.map((r) => mockDomain.deriveSupplierViewStatus(r.odoo_stage)));
    expect([...statuses].sort()).toEqual(['applied', 'approved', 'closed', 'collecting_docs', 'first_purchase', 'under_review']);
  });
});
