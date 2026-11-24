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

/** Стадии записи поставщика в Odoo (требования поставщика 2026-11-24; маппинг — 01-statuses.md §3, D-088). */
export const SUPPLIER_ODOO_STAGES = [
  'New Lead',
  'Processing: Pending Docs',
  'Processing: Need Contract',
  'Interested',
  'Activated',
  'Declined',
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

/** Файлов в одном документе (решение Кирилла 2026-11-10). */
export const MAX_FILES_PER_DOCUMENT = 10;

export const CHECKLIST_KEYS = ['spa', 'pn_nafith'] as const;

/** Размер страницы списка приведённых клиентов (SP-04 A7). */
export const REFERRED_CLIENTS_PAGE_SIZE = 20;
