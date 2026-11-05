// Статусы заявки для клиента и поставщика (01-statuses.md §2) и состояние прав (01-roles.md §4).
// Вычисляются один раз здесь и никогда не пересчитываются в компонентах.

import type { ClientStatus, OdooStage, PermissionState, SupplierViewStatus } from '@/shared/api';

import { ODOO_STAGE_MAP } from './odoo-stage-map';

export function deriveClientStatus(stage: OdooStage): ClientStatus {
  return ODOO_STAGE_MAP[stage].client_status;
}

export function deriveSupplierViewStatus(stage: OdooStage): SupplierViewStatus {
  return ODOO_STAGE_MAP[stage].supplier_view_status;
}

/** Четыре состояния прав группируют пять клиентских статусов (01-roles.md §4). */
export const PERMISSION_STATE_BY_CLIENT_STATUS: Readonly<Record<ClientStatus, PermissionState>> = {
  docs_required: 'collecting',
  under_review: 'reviewing',
  approved: 'active',
  first_purchase: 'active',
  closed: 'closed',
};

export function derivePermissionState(status: ClientStatus): PermissionState {
  return PERMISSION_STATE_BY_CLIENT_STATUS[status];
}

/** Допустимые переходы client_status (01-statuses.md §2): вперёд по процессу, дозапрос назад, закрытие из любого. */
export const CLIENT_STATUS_TRANSITIONS: ReadonlyArray<readonly [ClientStatus, ClientStatus, string]> = [
  ['docs_required', 'under_review', 'submit'],
  ['under_review', 'approved', 'approve'],
  ['approved', 'first_purchase', 'first payment'],
  ['under_review', 'docs_required', 'need more docs'],
  ['docs_required', 'closed', 'reject / lost'],
  ['under_review', 'closed', 'reject / lost'],
  ['approved', 'closed', 'reject / lost'],
  ['first_purchase', 'closed', 'reject / lost'],
];

export function isAllowedClientTransition(from: ClientStatus, to: ClientStatus): boolean {
  return CLIENT_STATUS_TRANSITIONS.some(([f, t]) => f === from && t === to);
}
