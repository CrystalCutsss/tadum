// Собственный статус поставщика (01-statuses.md §3 — предложение до ответа на S-1; SP-03 §2, §7).
// Чистая функция от текущего комплекта документов поставщика.

import type { DocumentSet, SupplierStatus } from '@/shared/api';

type SetLike = Pick<DocumentSet, 'locked' | 'documents'>;

/**
 * active — все обязательные документы approved (или комплект не требуется: set === null);
 * under_review — комплект отправлен (locked), но не всё approved;
 * docs_required — комплект открыт: не отправлен, вернули после проверки с rejected (A1)
 * или Odoo добавил новый обязательный документ (A2).
 */
export function deriveSupplierStatus(set: SetLike | null): SupplierStatus {
  if (set === null) return 'active';
  const required = set.documents.filter((d) => d.required);
  if (required.every((d) => d.status === 'approved')) return 'active';
  return set.locked ? 'under_review' : 'docs_required';
}
