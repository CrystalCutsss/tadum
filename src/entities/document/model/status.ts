// Машина состояний документа (01-statuses.md §5) и порядок в списке.

import type { Document, DocumentSetStatus, DocumentStatus, PrevalidationResult } from '@/shared/api';

import { catalogIndex } from './catalog';

export type DocumentEvent =
  | { type: 'upload'; prevalidation: PrevalidationResult['state'] }
  | { type: 'replace' }
  | { type: 'delete' }
  | { type: 'uw_approve' }
  | { type: 'uw_reject'; reason_key?: string }
  | { type: 'reupload'; sha256: string };

export type DocumentTransition =
  | { ok: true; to: DocumentStatus; prevalidation_failed?: true }
  | { ok: false; error: 'document_set_locked' | 'document.same_file_rejected' | 'not_allowed' };

interface Context {
  set_status: DocumentSetStatus;
  rejected_file_hashes: readonly string[];
}

/** Переход документа по событию. Клиентские события — только в draft, решения UW — только в in_review. */
export function transitionDocument(from: DocumentStatus, event: DocumentEvent, ctx: Context): DocumentTransition {
  const clientEvent = event.type === 'upload' || event.type === 'replace' || event.type === 'delete' || event.type === 'reupload';
  if (clientEvent && ctx.set_status !== 'draft') return { ok: false, error: 'document_set_locked' };
  if (!clientEvent && ctx.set_status !== 'in_review') return { ok: false, error: 'not_allowed' };

  switch (from) {
    case 'pending':
      if (event.type === 'upload') {
        return event.prevalidation === 'failed' ? { ok: true, to: 'pending', prevalidation_failed: true } : { ok: true, to: 'received' };
      }
      return { ok: false, error: 'not_allowed' };
    case 'received':
      if (event.type === 'replace') return { ok: true, to: 'received' };
      if (event.type === 'delete') return { ok: true, to: 'pending' };
      if (event.type === 'uw_approve') return { ok: true, to: 'approved' };
      if (event.type === 'uw_reject') return { ok: true, to: 'rejected' };
      return { ok: false, error: 'not_allowed' };
    case 'rejected':
      if (event.type === 'reupload') {
        return ctx.rejected_file_hashes.includes(event.sha256) ? { ok: false, error: 'document.same_file_rejected' } : { ok: true, to: 'received' };
      }
      return { ok: false, error: 'not_allowed' };
    case 'approved':
      // Терминальный для раунда.
      return { ok: false, error: 'not_allowed' };
  }
}

const STATUS_ORDER: Readonly<Record<DocumentStatus, number>> = { rejected: 0, pending: 1, received: 2, approved: 3 };

/** Сортировка списка: rejected → pending → received → approved; внутри группы — порядок каталога. */
export function sortDocuments<T extends Pick<Document, 'status' | 'portal_key'>>(docs: readonly T[]): T[] {
  return [...docs].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || catalogIndex(a.portal_key) - catalogIndex(b.portal_key));
}

/** Причина отклонения: текст тега на языке интерфейса; нет текста или нет EN — нейтральный generic. */
export function rejectReason(
  doc: Pick<Document, 'reject_reason_key' | 'reject_reason_text'>,
  lang: 'ar' | 'en',
): { kind: 'text'; text: string } | { kind: 'key'; key: string } {
  const text = lang === 'ar' ? doc.reject_reason_text?.ar : doc.reject_reason_text?.en;
  if (text) return { kind: 'text', text };
  if (doc.reject_reason_key) return { kind: 'key', key: doc.reject_reason_key };
  return { kind: 'key', key: 'document.rejected.generic' };
}
