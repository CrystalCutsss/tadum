// «Следующий шаг» поставщика (01-cabinet-structure.md §6, SP-01 A1).

import type { DocumentSet, NextStep, SupplierStatus } from '@/shared/api';

export interface SupplierNextStepInput {
  supplier_status: SupplierStatus;
  document_set: Pick<DocumentSet, 'documents'> | null;
  review_eta_hours?: number | undefined;
}

export function supplierNextStep(input: SupplierNextStepInput): NextStep {
  switch (input.supplier_status) {
    case 'active':
      return { owner: 'user', text_key: 'next_step.supplier.share_link', cta: { label_key: 'next_step.cta.share_link', route: '/s/referral' } };
    case 'under_review':
      return input.review_eta_hours !== undefined
        ? { owner: 'tadum', text_key: 'next_step.supplier.under_review_eta', meta: { hours: input.review_eta_hours } }
        : { owner: 'tadum', text_key: 'next_step.supplier.under_review' };
    case 'docs_required': {
      const cta = { label_key: 'next_step.cta.documents', route: '/s/documents' };
      const rejected = (input.document_set?.documents ?? []).filter((d) => d.status === 'rejected').length;
      return rejected > 0
        ? { owner: 'user', text_key: 'next_step.supplier.reupload_rejected', cta, meta: { count: rejected } }
        : { owner: 'user', text_key: 'next_step.supplier.upload_documents', cta };
    }
  }
}
