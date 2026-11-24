// Этап экрана «Заявка» поставщика (бриф TD-001 §2; D-087–D-090) — аналог applicationStage клиента.

import type { SupplierStatus } from '@/shared/api';

export type SupplierApplicationStage = 'documents' | 'contract' | 'partner' | 'declined' | 'paused';

/** documents — список документов (сбор и проверка); contract — Need Contract; partner — карточка со ссылкой. */
export function supplierApplicationStage(status: SupplierStatus): SupplierApplicationStage {
  switch (status) {
    case 'application_created':
    case 'docs_required':
    case 'under_review':
      return 'documents';
    case 'contract_pending':
      return 'contract';
    case 'partner':
    case 'active':
      return 'partner';
    case 'declined':
      return 'declined';
    case 'paused':
      return 'paused';
  }
}
