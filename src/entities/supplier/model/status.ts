// Собственный статус поставщика (01-statuses.md §3, D-088): из стадии его записи в Odoo.
// Комплект отправлен, а Odoo ещё не перевёл запись (гонка, SP-01 A2) — under_review по document_set.locked.

import type { DocumentSet, SupplierOdooStage, SupplierStatus } from '@/shared/api';

type SetLike = Pick<DocumentSet, 'locked'>;

export function deriveSupplierStatus(stage: SupplierOdooStage, set: SetLike | null): SupplierStatus {
  switch (stage) {
    case 'Declined':
      return 'declined';
    case 'Lost':
      return 'paused';
    case 'Activated':
      return 'active';
    case 'Interested':
      return 'partner';
    case 'Processing: Need Contract':
      return 'contract_pending';
    case 'New Lead':
      return set?.locked ? 'under_review' : 'application_created';
    case 'Processing: Pending Docs':
      return set?.locked ? 'under_review' : 'docs_required';
  }
}

/** Ссылка, QR и список клиентов — только после одобрения документов (D-087). */
export function isSupplierPartner(status: SupplierStatus): boolean {
  return status === 'partner' || status === 'active';
}
