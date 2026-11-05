// Маппинг стадий Odoo → статусы UI (01-statuses.md §2). Единственный файл, где названия стадий Odoo
// встречаются в коде: если Odoo переименует стадию, правится только он. Покрыт тестом по каждой строке таблицы.

import type { ClientStatus, OdooStage, PermissionState, SupplierViewStatus } from '@/shared/api';

export interface StageMapping {
  client_status: ClientStatus;
  supplier_view_status: SupplierViewStatus;
  permission_state: PermissionState;
}

export const ODOO_STAGE_MAP: Readonly<Record<OdooStage, StageMapping>> = {
  'New lead': { client_status: 'docs_required', supplier_view_status: 'applied', permission_state: 'collecting' },
  'Processing lead': { client_status: 'docs_required', supplier_view_status: 'applied', permission_state: 'collecting' },
  'Document collection': { client_status: 'docs_required', supplier_view_status: 'collecting_docs', permission_state: 'collecting' },
  'Need more docs for UW': { client_status: 'docs_required', supplier_view_status: 'collecting_docs', permission_state: 'collecting' },
  'Ready for UW': { client_status: 'under_review', supplier_view_status: 'under_review', permission_state: 'reviewing' },
  'Company risk assessment': { client_status: 'under_review', supplier_view_status: 'under_review', permission_state: 'reviewing' },
  'Risk committee': { client_status: 'under_review', supplier_view_status: 'under_review', permission_state: 'reviewing' },
  Approved: { client_status: 'approved', supplier_view_status: 'approved', permission_state: 'active' },
  'Offer confirmation': { client_status: 'approved', supplier_view_status: 'approved', permission_state: 'active' },
  'Signing SPA & PN': { client_status: 'approved', supplier_view_status: 'approved', permission_state: 'active' },
  'Client Approved': { client_status: 'approved', supplier_view_status: 'approved', permission_state: 'active' },
  'Payment done': { client_status: 'first_purchase', supplier_view_status: 'first_purchase', permission_state: 'active' },
  'Rejected by UW': { client_status: 'closed', supplier_view_status: 'closed', permission_state: 'closed' },
  Lost: { client_status: 'closed', supplier_view_status: 'closed', permission_state: 'closed' },
};

export function isKnownOdooStage(stage: string): stage is OdooStage {
  return Object.hasOwn(ODOO_STAGE_MAP, stage);
}

/** Статусы UI по стадии Odoo. Неизвестная стадия → null (адаптер логирует и показывает нейтральное состояние). */
export function mapOdooStage(stage: string): StageMapping | null {
  return isKnownOdooStage(stage) ? ODOO_STAGE_MAP[stage] : null;
}
