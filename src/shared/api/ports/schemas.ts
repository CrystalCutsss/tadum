// Zod-схемы данных портов — один к одному с 01-entities.md §2 и перечислениями 01-statuses.md.
// Имена полей не менять: это контракт с будущим HttpAdapter (05-backend-contract.md, блок 5c).
// Типы сущностей (entities/*/model/types.ts) выводятся отсюда через z.infer.

import { z } from 'zod';

import { CHECKLIST_KEYS, MAX_FILE_SIZE_BYTES, ODOO_STAGES } from './constants';

export { CHECKLIST_KEYS, KNOWN_PORTAL_KEYS, MAX_FILE_SIZE_BYTES, MAX_FILES_PER_DOCUMENT, ODOO_STAGES } from './constants';

// ---------- Общие ----------

/** ISO 8601 в UTC (01-entities.md, принципы). */
export const DateTimeSchema = z.iso.datetime({ offset: true });

/** Деньги — целые халалы (1 SAR = 100). */
export const MoneySchema = z.object({
  amount_minor: z.number().int(),
  currency: z.literal('SAR'),
});

const LocalizedText = z.object({ ar: z.string(), en: z.string() });

// ---------- Перечисления (01-statuses.md; сводка — 01-entities.md §4) ----------


export const OdooStageSchema = z.enum(ODOO_STAGES);

export const ClientStatusSchema = z.enum(['docs_required', 'under_review', 'approved', 'first_purchase', 'closed']);
export const SupplierViewStatusSchema = z.enum(['applied', 'collecting_docs', 'under_review', 'approved', 'first_purchase', 'closed']);
export const SupplierStatusSchema = z.enum(['docs_required', 'under_review', 'active']);
export const PermissionStateSchema = z.enum(['collecting', 'reviewing', 'active', 'closed']);
export const DocumentSetStatusSchema = z.enum(['draft', 'submitted', 'in_review', 'completed', 'superseded']);
export const DocumentStatusSchema = z.enum(['pending', 'received', 'rejected', 'approved']);
export const LimitStatusSchema = z.enum(['pending', 'ready', 'active', 'cancelled', 'rejected']);
export const ChecklistItemStatusSchema = z.enum(['pending', 'in_progress', 'done', 'failed']);

/** Открытый каталог (01-entities.md §3): новые ключи приходят без правок UI — KNOWN_PORTAL_KEYS в constants.ts. */
export const PortalKeySchema = z.string().min(1);

// ---------- Роли и сессия (01-roles.md §1–2) ----------

export const RoleSchema = z.enum(['client_contact', 'client_owner', 'supplier']);
export const ClientRoleSchema = z.enum(['client_contact', 'client_owner']);
export const RoleFamilySchema = z.enum(['client', 'supplier']);

export const SessionSchema = z.object({
  phone: z.string().regex(/^\+9665\d{8}$/),
  roles: z.array(RoleSchema),
  active_role: RoleSchema,
  language: z.enum(['ar', 'en']),
  theme: z.enum(['system', 'light', 'dark']),
  issued_at: DateTimeSchema,
  expires_at: DateTimeSchema,
  client_context: z.object({ application_id: z.string(), company_id: z.string() }).optional(),
  supplier_context: z.object({ supplier_id: z.string() }).optional(),
});

// ---------- Следующий шаг (01-cabinet-structure.md §6) ----------

export const NextStepSchema = z.object({
  owner: z.enum(['user', 'tadum', 'none']),
  text_key: z.string(),
  cta: z
    .object({
      label_key: z.string(),
      route: z.string().optional(),
      external_url: z.string().optional(),
    })
    .optional(),
  meta: z.object({ hours: z.number().optional(), count: z.number().optional() }).optional(),
});

// ---------- 2.2 Company ----------

export const CompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  name_ar: z.string().optional(),
  cr_number: z.string().regex(/^\d{10}$/).optional(),
});

// ---------- 2.3 Application ----------

export const ApplicationSchema = z.object({
  id: z.string(),
  company_id: z.string(),
  odoo_stage: OdooStageSchema,
  client_status: ClientStatusSchema,
  permission_state: PermissionStateSchema,
  next_step: NextStepSchema,
  current_document_set_id: z.string(),
  limit_id: z.string().optional(),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
  source: z
    .object({
      supplier_id: z.string().optional(),
      channel: z.enum(['referral_link', 'manual', 'direct']).optional(),
    })
    .optional(),
  review_eta_hours: z.number().optional(),
  collection_deadline_at: DateTimeSchema.optional(),
});

// ---------- 2.6 FileAsset ----------

export const AcceptedMimeSchema = z.enum(['application/pdf', 'image/jpeg', 'image/png']);

export const PrevalidationResultSchema = z.object({
  state: z.enum(['passed', 'warning', 'failed', 'skipped']),
  rule_keys: z.array(z.string()),
});

export const FileAssetSchema = z.object({
  id: z.string(),
  name: z.string(),
  mime: AcceptedMimeSchema,
  size_bytes: z.number().int().nonnegative().max(MAX_FILE_SIZE_BYTES),
  sha256: z.string(),
  uploaded_at: DateTimeSchema,
  download_url: z.string(),
  prevalidation: PrevalidationResultSchema,
  /** Замечание проверяющего к этому файлу: ошибка или дозапрос (решение Кирилла 2026-11-10). */
  issue: z
    .object({
      kind: z.enum(['error', 'request']),
      reason_key: z.string().optional(),
      reason_text: z.object({ ar: z.string(), en: z.string().optional() }).optional(),
    })
    .optional(),
});

/** Только клиентское состояние загрузки, не хранится. */
export const UploadProgressSchema = z.object({
  file_id: z.string().optional(),
  percent: z.number().min(0).max(100),
  state: z.enum(['queued', 'uploading', 'validating', 'done', 'failed']),
  error_key: z.string().optional(),
});

// ---------- 2.5 Document ----------

export const DocumentHintSchema = z.object({
  title_key: z.string(),
  hint_key: z.string(),
  example_pdf_url: z.string().optional(),
  video_url: z.object({ ar: z.string().optional(), en: z.string().optional() }).optional(),
});

export const DocumentSchema = z.object({
  id: z.string(),
  set_id: z.string(),
  portal_key: PortalKeySchema,
  status: DocumentStatusSchema,
  required: z.boolean(),
  reject_reason_key: z.string().optional(),
  reject_reason_text: z.object({ ar: z.string(), en: z.string().optional() }).optional(),
  /** Вид причины на весь документ: `error` (по умолчанию) или `request` — дозапрос. */
  reason_kind: z.enum(['error', 'request']).optional(),
  rejected_file_hashes: z.array(z.string()),
  files: z.array(FileAssetSchema),
  hint: DocumentHintSchema,
  updated_at: DateTimeSchema,
});

// ---------- 2.4 DocumentSet ----------

export const DocumentSetSchema = z.object({
  id: z.string(),
  owner: z.object({ kind: z.enum(['application', 'supplier']), id: z.string() }),
  round: z.number().int().min(1),
  status: DocumentSetStatusSchema,
  locked: z.boolean(),
  submitted_at: DateTimeSchema.optional(),
  completion_grace_until: DateTimeSchema.optional(),
  documents: z.array(DocumentSchema),
});

// ---------- 2.8 OnboardingChecklist ----------


export const ChecklistItemSchema = z.object({
  key: z.enum(CHECKLIST_KEYS),
  status: ChecklistItemStatusSchema,
  external_url: z.string().optional(),
});

export const OnboardingChecklistSchema = z.object({
  items: z.array(ChecklistItemSchema),
  completed: z.boolean(),
});

// ---------- 2.7 Limit ----------

export const LimitSchema = z.object({
  id: z.string(),
  application_id: z.string(),
  status: LimitStatusSchema,
  approved: MoneySchema,
  used: MoneySchema,
  available: MoneySchema,
  checklist: OnboardingChecklistSchema,
  activated_at: DateTimeSchema.optional(),
});

// ---------- 2.9 Deal ----------

export const DealStageSchema = z.enum(['quotation', 'approved', 'payment_done', 'repaid', 'cancelled']);

export const DealSchema = z.object({
  id: z.string(),
  application_id: z.string(),
  supplier_id: z.string(),
  amount: MoneySchema,
  stage: DealStageSchema,
  outstanding: MoneySchema,
  paid_at: DateTimeSchema.optional(),
});

// ---------- 2.10 Supplier ----------

export const SupplierSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  referral_url: z.string(),
  supplier_status: SupplierStatusSchema,
  next_step: NextStepSchema,
  current_document_set_id: z.string(),
  counters: z.object({
    referred_total: z.number().int().nonnegative(),
    under_review: z.number().int().nonnegative(),
    approved: z.number().int().nonnegative(),
  }),
  phones: z.array(z.string()),
});

// ---------- 2.11 ReferredClient ----------

export const ReferredClientSchema = z.object({
  application_id: z.string(),
  company_name: z.string(),
  applied_at: DateTimeSchema,
  supplier_view_status: SupplierViewStatusSchema,
  turnover: MoneySchema,
  updated_at: DateTimeSchema,
  attribution: z.enum(['referral_link', 'manual']),
});

// ---------- 2.12 OfferContent ----------

/** RichText — текст в Markdown-подмножестве; рендер — в блоке v3 (SP-05). */
export const RichTextSchema = z.string();

export const OfferMaterialSchema = z.object({
  id: z.string(),
  title: LocalizedText,
  kind: z.enum(['pdf', 'video']),
  lang: z.enum(['ar', 'en', 'both']),
  download_url: z.string(),
  size_bytes: z.number().int().nonnegative().optional(),
});

export const OfferContentSchema = z.object({
  terms: z.object({ ar: RichTextSchema, en: RichTextSchema }),
  materials: z.array(OfferMaterialSchema),
});

// ---------- Типы ----------

export type Money = z.infer<typeof MoneySchema>;
export type OdooStage = z.infer<typeof OdooStageSchema>;
export type ClientStatus = z.infer<typeof ClientStatusSchema>;
export type SupplierViewStatus = z.infer<typeof SupplierViewStatusSchema>;
export type SupplierStatus = z.infer<typeof SupplierStatusSchema>;
export type PermissionState = z.infer<typeof PermissionStateSchema>;
export type DocumentSetStatus = z.infer<typeof DocumentSetStatusSchema>;
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;
export type LimitStatus = z.infer<typeof LimitStatusSchema>;
export type ChecklistItemStatus = z.infer<typeof ChecklistItemStatusSchema>;
export type ChecklistStatus = ChecklistItemStatus;
export type PortalKey = z.infer<typeof PortalKeySchema>;
export type Role = z.infer<typeof RoleSchema>;
export type ClientRole = z.infer<typeof ClientRoleSchema>;
export type RoleFamily = z.infer<typeof RoleFamilySchema>;
export type Session = z.infer<typeof SessionSchema>;
export type NextStep = z.infer<typeof NextStepSchema>;
export type Company = z.infer<typeof CompanySchema>;
export type Application = z.infer<typeof ApplicationSchema>;
export type FileAsset = z.infer<typeof FileAssetSchema>;
export type PrevalidationResult = z.infer<typeof PrevalidationResultSchema>;
export type UploadProgress = z.infer<typeof UploadProgressSchema>;
export type DocumentHint = z.infer<typeof DocumentHintSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type DocumentSet = z.infer<typeof DocumentSetSchema>;
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
export type OnboardingChecklist = z.infer<typeof OnboardingChecklistSchema>;
export type Limit = z.infer<typeof LimitSchema>;
export type DealStage = z.infer<typeof DealStageSchema>;
export type Deal = z.infer<typeof DealSchema>;
export type Supplier = z.infer<typeof SupplierSchema>;
export type ReferredClient = z.infer<typeof ReferredClientSchema>;
export type OfferMaterial = z.infer<typeof OfferMaterialSchema>;
export type OfferContent = z.infer<typeof OfferContentSchema>;
