// Этап экрана «Заявка» (A-063): из клиентского статуса и статуса лимита — odoo_stage сюда не доходит.
// documents — сбор и проверка (SC-02…SC-05); decision — одобрено, условия согласуются (лимит pending);
// signing — открыто подписание (лимит ready); approved — лимит одобрен и активен; cancelled — лимит отменён/отклонён.
import type { ClientStatus, Limit } from '@/shared/api';

export type ApplicationStage = 'documents' | 'decision' | 'signing' | 'cancelled' | 'approved';

export function applicationStage(clientStatus: ClientStatus, limit: Pick<Limit, 'status'> | null | undefined): ApplicationStage {
  if ((clientStatus !== 'approved' && clientStatus !== 'first_purchase') || !limit) return 'documents';
  switch (limit.status) {
    case 'pending':
      return 'decision';
    case 'ready':
      return 'signing';
    case 'active':
      return 'approved';
    case 'cancelled':
    case 'rejected':
      return 'cancelled';
  }
}
