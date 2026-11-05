// Перечисления схем совпадают со сводкой 01-entities.md §4 (каждая строка); схемы принимают корректные данные.
import { describe, expect, it } from 'vitest';

import { readProductDoc, section, tableWithHeader } from '@/test-utils/markdown';

import {
  ApplicationSchema,
  ChecklistItemStatusSchema,
  ClientStatusSchema,
  DocumentSetSchema,
  DocumentSetStatusSchema,
  DocumentStatusSchema,
  LimitStatusSchema,
  MoneySchema,
  OdooStageSchema,
  SupplierStatusSchema,
  SupplierViewStatusSchema,
} from './schemas';

const ENUMS: Record<string, { options: readonly string[] }> = {
  OdooStage: OdooStageSchema,
  ClientStatus: ClientStatusSchema,
  SupplierViewStatus: SupplierViewStatusSchema,
  SupplierStatus: SupplierStatusSchema,
  DocumentSetStatus: DocumentSetStatusSchema,
  DocumentStatus: DocumentStatusSchema,
  LimitStatus: LimitStatusSchema,
  ChecklistItemStatus: ChecklistItemStatusSchema,
};

describe('01-entities.md §4 — перечисления, каждая строка', () => {
  const rows = tableWithHeader(section(readProductDoc('01-entities.md'), '4.'), 'Тип').rows.filter((r) => r[0] !== 'PortalKey');
  it.each(rows)('%s', (type, values) => {
    const schema = ENUMS[type];
    expect(schema, `нет схемы для ${type}`).toBeDefined();
    expect([...schema!.options]).toEqual(values.split(',').map((v) => v.trim()));
  });
});

describe('схемы', () => {
  it('Money — целые халалы в SAR', () => {
    expect(MoneySchema.safeParse({ amount_minor: 15_000_000, currency: 'SAR' }).success).toBe(true);
    expect(MoneySchema.safeParse({ amount_minor: 1.5, currency: 'SAR' }).success).toBe(false);
    expect(MoneySchema.safeParse({ amount_minor: 1, currency: 'USD' }).success).toBe(false);
  });
  it('Application с минимальным набором полей', () => {
    const app = {
      id: 'app_1',
      company_id: 'cmp_1',
      odoo_stage: 'Document collection',
      client_status: 'docs_required',
      permission_state: 'collecting',
      next_step: { owner: 'user', text_key: 'next_step.upload_documents', meta: { count: 3 } },
      current_document_set_id: 'set_1',
      created_at: '2026-11-04T10:00:00Z',
      updated_at: '2026-11-04T10:00:00Z',
    };
    expect(ApplicationSchema.parse(app)).toEqual(app);
    expect(ApplicationSchema.safeParse({ ...app, odoo_stage: 'Unknown' }).success).toBe(false);
  });
  it('DocumentSet: round ≥ 1, файл ≤ 10 МБ', () => {
    const file = {
      id: 'f1',
      name: 'bs.pdf',
      mime: 'application/pdf',
      size_bytes: 10 * 1024 * 1024 + 1,
      sha256: 'h',
      uploaded_at: '2026-11-04T10:00:00Z',
      download_url: '/f1',
      prevalidation: { state: 'passed', rule_keys: [] },
    };
    const set = {
      id: 'set_1',
      owner: { kind: 'application', id: 'app_1' },
      round: 1,
      status: 'draft',
      locked: false,
      documents: [
        {
          id: 'doc_bs',
          set_id: 'set_1',
          portal_key: 'bs',
          status: 'received',
          required: true,
          rejected_file_hashes: [],
          files: [file],
          hint: { title_key: 'document.bs.title', hint_key: 'document.bs.hint' },
          updated_at: '2026-11-04T10:00:00Z',
        },
      ],
    };
    expect(DocumentSetSchema.safeParse(set).success).toBe(false);
    file.size_bytes = 1000;
    expect(DocumentSetSchema.safeParse(set).success).toBe(true);
    expect(DocumentSetSchema.safeParse({ ...set, round: 0 }).success).toBe(false);
  });
});
