// Бизнес-правила, которыми мок имитирует бэкенд. Реализация — в entities/*;
// app/api.ts внедряет её при старте: shared не импортирует entities (FSD), а правила не дублируются.

import type {
  ClientStatus,
  Deal,
  Document,
  DocumentHint,
  DocumentSet,
  DocumentSetStatus,
  DocumentStatus,
  Limit,
  Money,
  NextStep,
  OdooStage,
  OnboardingChecklist,
  PermissionState,
  PortalKey,
  PrevalidationResult,
  Role,
  SupplierStatus,
  SupplierViewStatus,
} from '../../ports/schemas';

export type MockDocumentEvent =
  | { type: 'upload'; prevalidation: PrevalidationResult['state'] }
  | { type: 'replace' }
  | { type: 'delete' }
  | { type: 'uw_approve' }
  | { type: 'uw_reject'; reason_key?: string }
  | { type: 'reupload'; sha256: string };

export type MockDocumentTransition =
  | { ok: true; to: DocumentStatus; prevalidation_failed?: true }
  | { ok: false; error: 'document_set_locked' | 'document.same_file_rejected' | 'not_allowed' };

export interface MockDomain {
  deriveClientStatus(stage: OdooStage): ClientStatus;
  derivePermissionState(status: ClientStatus): PermissionState;
  deriveSupplierViewStatus(stage: OdooStage): SupplierViewStatus;
  clientNextStep(input: {
    client_status: ClientStatus;
    document_set: Pick<DocumentSet, 'round' | 'documents'> | null;
    limit: Pick<Limit, 'status' | 'checklist'> | null;
    review_eta_hours?: number | undefined;
    landing_url: string;
  }): NextStep;
  supplierNextStep(input: {
    supplier_status: SupplierStatus;
    document_set: Pick<DocumentSet, 'documents'> | null;
    review_eta_hours?: number | undefined;
  }): NextStep;
  deriveSupplierStatus(set: Pick<DocumentSet, 'locked' | 'documents'> | null): SupplierStatus;
  computeLimitAmounts(approved: Money, deals: readonly Pick<Deal, 'outstanding'>[]): Pick<Limit, 'approved' | 'used' | 'available'>;
  computeTurnover(deals: readonly Pick<Deal, 'amount' | 'stage' | 'supplier_id'>[], supplierId: string): Money;
  isChecklistCompleted(items: OnboardingChecklist['items']): boolean;
  transitionDocument(
    from: DocumentStatus,
    event: MockDocumentEvent,
    ctx: { set_status: DocumentSetStatus; rejected_file_hashes: readonly string[] },
  ): MockDocumentTransition;
  settleDocumentStatus(doc: Pick<Document, 'files' | 'reject_reason_key' | 'reject_reason_text' | 'reason_kind'>): DocumentStatus;
  isSameFile(doc: Pick<Document, 'files' | 'rejected_file_hashes'>, sha256: string): boolean;
  resolveRoles(
    phone: string,
    lookups: {
      findActiveLeadByPhone: (phone: string) => { phone: string; lead_main_owner_phone?: string | undefined } | null;
      findSupplierByPhone: (phone: string) => boolean;
    },
  ): Role[];
  initialActiveRole(roles: readonly Role[], lastSelected?: Role | null): Role | null;
  hintFor(key: PortalKey): DocumentHint;
  /** Ключи правил предвалидации типа документа (каталог 01-entities.md §3). */
  prevalidationRules(key: PortalKey): readonly string[];
}

