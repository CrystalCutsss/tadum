// «Следующий шаг» поставщика (01-cabinet-structure.md §6, SP-01 A1). Срок проверки поставщику не показываем (D-091).

import type { DocumentSet, NextStep, SupplierStatus } from '@/shared/api';

export interface SupplierNextStepInput {
  supplier_status: SupplierStatus;
  document_set: Pick<DocumentSet, 'documents'> | null;
}

export function supplierNextStep(input: SupplierNextStepInput): NextStep {
  switch (input.supplier_status) {
    case 'partner':
    case 'active':
      // Ссылка и QR — в карточке «Вы партнёр Tadum» на экране «Заявка» (D-089), поэтому без CTA.
      return { owner: 'user', text_key: 'next_step.supplier.share_link' };
    case 'under_review':
      return { owner: 'tadum', text_key: 'next_step.supplier.under_review' };
    case 'contract_pending':
      return { owner: 'tadum', text_key: 'next_step.supplier.contract_pending' };
    case 'paused':
      return { owner: 'none', text_key: 'next_step.supplier.paused' };
    case 'declined':
      return { owner: 'none', text_key: 'next_step.supplier.declined' };
    case 'application_created':
    case 'docs_required': {
      const cta = { label_key: 'next_step.cta.documents', route: '/s/documents' };
      const rejected = (input.document_set?.documents ?? []).filter((d) => d.status === 'rejected').length;
      return rejected > 0
        ? { owner: 'user', text_key: 'next_step.supplier.reupload_rejected', cta, meta: { count: rejected } }
        : { owner: 'user', text_key: 'next_step.supplier.upload_documents', cta };
    }
  }
}
