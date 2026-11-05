// Права поставщика (01-roles.md §5): от статуса зависят только документы; ссылка, клиенты и условия — всегда (D-022).

import type { SupplierStatus } from '@/shared/api';

export type SupplierRule = 'always' | 'never' | 'docs_required_unlocked';

export const SUPPLIER_PERMISSIONS = {
  view_own_status_and_next_step: 'always',
  view_documents: 'always',
  upload_or_replace_file: 'docs_required_unlocked',
  reupload_rejected: 'docs_required_unlocked',
  submit_document_set: 'docs_required_unlocked',
  view_referral_link: 'always',
  copy_referral_link: 'always',
  share_referral_whatsapp: 'always',
  download_referral_qr: 'always',
  view_referred_clients: 'always',
  filter_sort_referred_clients: 'always',
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
  if (rule === 'always') return true;
  if (rule === 'never') return false;
  return ctx.supplier_status === 'docs_required' && !ctx.locked;
}
