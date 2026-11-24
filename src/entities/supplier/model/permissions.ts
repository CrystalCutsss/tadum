// Права поставщика (01-roles.md §5): документы правятся только до отправки комплекта; ссылка, QR и список
// клиентов — только после одобрения документов, при partner или active (D-087); остальное — всегда.

import type { SupplierStatus } from '@/shared/api';

import { isSupplierPartner } from './status';

export type SupplierRule = 'always' | 'never' | 'editable_unlocked' | 'partner_or_active';

export const SUPPLIER_PERMISSIONS = {
  view_own_status_and_next_step: 'always',
  view_documents: 'always',
  upload_or_replace_file: 'editable_unlocked',
  reupload_rejected: 'editable_unlocked',
  submit_document_set: 'editable_unlocked',
  view_referral_link: 'partner_or_active',
  copy_referral_link: 'partner_or_active',
  share_referral_whatsapp: 'partner_or_active',
  download_referral_qr: 'partner_or_active',
  view_referred_clients: 'partner_or_active',
  filter_sort_referred_clients: 'partner_or_active',
  view_offer_terms: 'always',
  download_materials: 'always',
  edit_referral_page: 'never',
  change_language: 'always',
  contact_support: 'always',
  logout: 'always',
} as const satisfies Record<string, SupplierRule>;

export type SupplierPermission = keyof typeof SUPPLIER_PERMISSIONS;

export interface SupplierPermissionContext {
  supplier_status: SupplierStatus;
  /** document_set.locked; нет комплекта — считается заблокированным для правок. */
  locked: boolean;
}

export function supplierCan(permission: SupplierPermission, ctx: SupplierPermissionContext): boolean {
  const rule: SupplierRule = SUPPLIER_PERMISSIONS[permission];
  switch (rule) {
    case 'always':
      return true;
    case 'never':
      return false;
    case 'partner_or_active':
      return isSupplierPartner(ctx.supplier_status);
    case 'editable_unlocked':
      return (ctx.supplier_status === 'application_created' || ctx.supplier_status === 'docs_required') && !ctx.locked;
  }
}
