// Константы контракта без зависимости от zod: их импортирует код первого чанка (схемы грузятся лениво).

export const ODOO_STAGES = [
  'New lead',
  'Processing lead',
  'Document collection',
  'Need more docs for UW',
  'Ready for UW',
  'Company risk assessment',
  'Risk committee',
  'Approved',
  'Offer confirmation',
  'Signing SPA & PN',
  'Client Approved',
  'Payment done',
  'Rejected by UW',
  'Lost',
] as const;

/** Открытый каталог (01-entities.md §3): новые ключи приходят без правок UI. */
export const KNOWN_PORTAL_KEYS = [
  'bs',
  'national_id',
  'vat',
  'vat_sales',
  'ch_owner',
  'ch_company',
  'aoa',
  'sup_vat',
  'sup_iban_letter',
  'sup_national_address',
  'sup_cr',
] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const CHECKLIST_KEYS = ['spa_sadq', 'pn_company_nafith', 'pn_owner_nafith'] as const;

/** Размер страницы списка приведённых клиентов (SP-04 A7). */
export const REFERRED_CLIENTS_PAGE_SIZE = 20;
