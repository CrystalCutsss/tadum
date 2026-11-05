// Карточка «следующий шаг» клиента (01-cabinet-structure.md §6, уточнения SC-02, SC-05, SC-06).
// Детерминированно из статуса, не из текста Odoo. Срок показываем только если он пришёл из данных.

import type { ClientStatus, DocumentSet, Limit, NextStep } from '@/shared/api';

export interface ClientNextStepInput {
  client_status: ClientStatus;
  document_set: Pick<DocumentSet, 'round' | 'documents'> | null;
  limit: Pick<Limit, 'status' | 'checklist'> | null;
  review_eta_hours?: number | undefined;
  /** Ссылка «Подать заявку» для закрытой заявки (VITE_LANDING_URL). */
  landing_url: string;
}

const isDone = (status: string) => status === 'received' || status === 'approved';

export function clientNextStep(input: ClientNextStepInput): NextStep {
  const { client_status: status } = input;

  if (status === 'closed') {
    return { owner: 'none', text_key: 'next_step.closed', cta: { label_key: 'next_step.cta.apply', external_url: input.landing_url } };
  }
  if (status === 'first_purchase') {
    return { owner: 'none', text_key: 'next_step.first_purchase_done' };
  }
  if (status === 'approved') {
    const limit = input.limit;
    if (!limit || limit.status === 'pending') {
      // Offer confirmation: условия согласует менеджер по телефону (SC-06).
      return { owner: 'tadum', text_key: 'next_step.offer_confirmation' };
    }
    if (limit.status === 'active' && limit.checklist.completed) {
      return { owner: 'user', text_key: 'next_step.how_to_buy', cta: { label_key: 'next_step.cta.how_to_buy', route: '/c/home#how-to-buy' } };
    }
    return { owner: 'user', text_key: 'next_step.sign_documents', cta: { label_key: 'next_step.cta.sign', route: '/c/home#limit' } };
  }
  if (status === 'under_review') {
    return input.review_eta_hours !== undefined
      ? { owner: 'tadum', text_key: 'next_step.under_review_eta', meta: { hours: input.review_eta_hours } }
      : { owner: 'tadum', text_key: 'next_step.under_review' };
  }

  // docs_required
  const docs = input.document_set?.documents ?? [];
  const round = input.document_set?.round ?? 1;
  const cta = { label_key: 'next_step.cta.documents', route: '/c/documents' };
  const rejected = docs.filter((d) => d.status === 'rejected').length;
  if (rejected > 0) {
    return { owner: 'user', text_key: 'next_step.reupload_rejected', cta, meta: { count: rejected } };
  }
  const nothingUploadedYet = docs.every((d) => d.status === 'pending' && d.files.length === 0);
  if (round > 1 && nothingUploadedYet) {
    return { owner: 'user', text_key: 'next_step.more_docs_requested', cta, meta: { count: docs.length } };
  }
  const remaining = docs.filter((d) => d.required && !isDone(d.status)).length;
  if (remaining === 0 && docs.length > 0) {
    return { owner: 'user', text_key: 'next_step.submit_ready', cta };
  }
  return { owner: 'user', text_key: 'next_step.upload_documents', cta, meta: { count: remaining } };
}
