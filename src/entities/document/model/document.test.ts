// Документ: машина состояний — каждая строка 01-statuses.md §5; сортировка и причина отклонения — правила §5.
import { describe, expect, it } from 'vitest';

import type { DocumentSetStatus, DocumentStatus, FileAsset } from '@/shared/api';
import { doc } from '@/test-utils/fixtures';
import { readProductDoc, section, tableWithHeader } from '@/test-utils/markdown';

import { DOCUMENT_CATALOG, hintFor } from './catalog';
import { fileIssueReason, hasDocumentIssue, isSameFile, rejectReason, settleDocumentStatus, sortDocuments, transitionDocument, type DocumentEvent } from './status';

const s5 = section(readProductDoc('01-statuses.md'), '5.');

// Событие из таблицы → событие кода. Строка без сопоставления — ошибка теста.
const EVENTS: Record<string, DocumentEvent> = {
  'загружен файл, предвалидация passed/warning': { type: 'upload', prevalidation: 'passed' },
  'загружен файл, предвалидация failed': { type: 'upload', prevalidation: 'failed' },
  'заменён файл': { type: 'replace' },
  'удалён файл': { type: 'delete' },
  'UW принял': { type: 'uw_approve' },
  'UW отклонил с тегом': { type: 'uw_reject', reason_key: 'bs_period' },
  'загружен новый файл': { type: 'reupload', sha256: 'new-hash' },
};
const ALL_EVENTS: DocumentEvent[] = [...Object.values(EVENTS), { type: 'upload', prevalidation: 'warning' }];

/** Комплект, в котором событие допустимо: из ячейки «Условие» или по автору (UW → in_review). */
const setStatusFor = (condition: string, who: string): DocumentSetStatus =>
  condition.includes('in_review') || who === 'UW' ? 'in_review' : 'draft';

describe('01-statuses.md §5 — переходы документа, каждая строка', () => {
  const rows = tableWithHeader(s5, 'Из').rows;
  it('в таблице 8 строк', () => expect(rows).toHaveLength(8));
  it.each(rows)('%s —[%s]→ %s', (from, eventCell, to, who, condition) => {
    if (eventCell === '—') {
      // approved — терминальный для раунда: никакое событие не меняет статус.
      for (const e of ALL_EVENTS)
        for (const set of ['draft', 'in_review'] as const)
          expect(transitionDocument(from as DocumentStatus, e, { set_status: set, rejected_file_hashes: [] }).ok).toBe(false);
      return;
    }
    const event = EVENTS[eventCell];
    expect(event, `нет события для «${eventCell}»`).toBeDefined();
    const set_status = setStatusFor(condition ?? '', who ?? '');
    expect(transitionDocument(from as DocumentStatus, event!, { set_status, rejected_file_hashes: ['old-hash'] })).toMatchObject({ ok: true, to });
    // Вне своего комплекта событие недопустимо.
    const other: DocumentSetStatus = set_status === 'draft' ? 'submitted' : 'draft';
    expect(transitionDocument(from as DocumentStatus, event!, { set_status: other, rejected_file_hashes: [] }).ok).toBe(false);
  });

  it('предвалидация warning тоже даёт received', () => {
    expect(transitionDocument('pending', { type: 'upload', prevalidation: 'warning' }, { set_status: 'draft', rejected_file_hashes: [] })).toEqual({
      ok: true,
      to: 'received',
    });
  });
  it('failed — файл не принят, флаг для события document_prevalidation_failed', () => {
    expect(transitionDocument('pending', { type: 'upload', prevalidation: 'failed' }, { set_status: 'draft', rejected_file_hashes: [] })).toEqual({
      ok: true,
      to: 'pending',
      prevalidation_failed: true,
    });
  });
  it('TADUM-536: тот же файл, что уже отклоняли → document.same_file_rejected', () => {
    expect(transitionDocument('rejected', { type: 'reupload', sha256: 'old-hash' }, { set_status: 'draft', rejected_file_hashes: ['old-hash'] })).toEqual({
      ok: false,
      error: 'document.same_file_rejected',
    });
  });
  it('после submitted любая правка файла → document_set_locked', () => {
    for (const e of [EVENTS['заменён файл']!, EVENTS['удалён файл']!]) {
      expect(transitionDocument('received', e, { set_status: 'submitted', rejected_file_hashes: [] })).toEqual({ ok: false, error: 'document_set_locked' });
    }
  });
});

describe('01-statuses.md §5 — правила отображения', () => {
  it('сортировка: rejected → pending → received → approved, внутри группы — порядок каталога', () => {
    const sorted = sortDocuments([
      doc('approved', { portal_key: 'bs' }),
      doc('received', { portal_key: 'vat' }),
      doc('pending', { portal_key: 'aoa' }),
      doc('rejected', { portal_key: 'vat_sales' }),
      doc('pending', { portal_key: 'national_id' }),
      doc('received', { portal_key: 'bs' }),
    ]);
    expect(sorted.map((d) => `${d.status}:${d.portal_key}`)).toEqual([
      'rejected:vat_sales',
      'pending:national_id',
      'pending:aoa',
      'received:bs',
      'received:vat',
      'approved:bs',
    ]);
  });
  it('причина: текст на языке интерфейса; нет EN — generic, арабский не подставляем', () => {
    const d = { reject_reason_text: { ar: 'نحتاج آخر 6 أشهر' } };
    expect(rejectReason(d, 'ar')).toEqual({ kind: 'text', text: 'نحتاج آخر 6 أشهر' });
    expect(rejectReason(d, 'en')).toEqual({ kind: 'key', key: 'document.rejected.generic' });
    expect(rejectReason({ reject_reason_key: 'reject.bs.period' }, 'en')).toEqual({ kind: 'key', key: 'reject.bs.period' });
    expect(rejectReason({}, 'ar')).toEqual({ kind: 'key', key: 'document.rejected.generic' });
  });
});

describe('01-entities.md §3 — каталог типов документов', () => {
  const rows = tableWithHeader(section(readProductDoc('01-entities.md'), '3.'), 'portal_key').rows;
  it.each(rows)('%s (%s) — в каталоге с аудиторией %s', (key, _title, audience) => {
    const t = DOCUMENT_CATALOG.find((x) => x.portal_key === key);
    expect(t?.audience).toBe(audience);
    expect(t?.max_size_bytes).toBe(10 * 1024 * 1024);
  });
  it('каталог открыт: неизвестный ключ получает подсказку по шаблону i18n', () => {
    expect(hintFor('new_doc')).toEqual({ title_key: 'document.new_doc.title', hint_key: 'document.new_doc.hint' });
  });
});

describe('несколько файлов и замечания (решение Кирилла 2026-11-10)', () => {
  const f = (id: string, issue?: FileAsset['issue']) => ({ ...doc('received').files[0]!, id, sha256: `h_${id}`, ...(issue ? { issue } : {}) });
  it('settleDocumentStatus: нет файлов → pending (или rejected при ошибке на документе), замечание → rejected, иначе received', () => {
    expect(settleDocumentStatus(doc('pending'))).toBe('pending');
    expect(settleDocumentStatus(doc('pending', { reject_reason_key: 'x' }))).toBe('rejected');
    expect(settleDocumentStatus(doc('pending', { reject_reason_key: 'x', reason_kind: 'request' }))).toBe('pending');
    expect(settleDocumentStatus(doc('received', { files: [f('a'), f('b')] }))).toBe('received');
    expect(settleDocumentStatus(doc('received', { files: [f('a'), f('b', { kind: 'request' })] }))).toBe('rejected');
    expect(settleDocumentStatus(doc('received', { files: [f('a')], reject_reason_key: 'x' }))).toBe('rejected');
  });
  it('isSameFile: файл уже в документе или раньше не подошёл', () => {
    const d = doc('received', { files: [f('a')], rejected_file_hashes: ['old'] });
    expect(isSameFile(d, 'h_a')).toBe(true);
    expect(isSameFile(d, 'old')).toBe(true);
    expect(isSameFile(d, 'new')).toBe(false);
  });
  it('hasDocumentIssue и текст замечания к файлу', () => {
    expect(hasDocumentIssue(doc('rejected'))).toBe(false);
    expect(hasDocumentIssue(doc('rejected', { reject_reason_text: { ar: 'نص' } }))).toBe(true);
    expect(fileIssueReason({ kind: 'error', reason_text: { ar: 'نص', en: 'Text' } }, 'en')).toEqual({ kind: 'text', text: 'Text' });
    expect(fileIssueReason({ kind: 'error' }, 'en')).toEqual({ kind: 'key', key: 'document.rejected.generic' });
  });
  it('из «Нужен новый файл» можно удалить файл с замечанием', () => {
    expect(transitionDocument('rejected', { type: 'delete' }, { set_status: 'draft', rejected_file_hashes: [] })).toEqual({ ok: true, to: 'rejected' });
  });
});
