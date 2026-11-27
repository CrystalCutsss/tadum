// Порты данных. UI и features знают только эти интерфейсы; адаптер (mock | http) выбирает client.ts.
// Ответы всех методов валидируются Zod-схемами из RESPONSE_SCHEMAS (validation.ts, грузится лениво вместе с адаптером).

import type { CHECKLIST_KEYS } from './constants';
import type { DownloadLink, OtpChallenge, ReferredClientsPage, SupplierCounters, UploadResult } from './response-schemas';
import type {
  Application,
  Company,
  Document,
  DocumentSet,
  Limit,
  Money,
  OfferContent,
  OnboardingChecklist,
  PortalKey,
  RepaymentSchedule,
  Session,
  Supplier,
  SupplierProfilePatch,
  SupplierViewStatus,
  UploadProgress,
} from './schemas';

export type { DownloadLink, OtpChallenge, OtpChannel, ReferredClientsPage, SupplierCounters, UploadResult } from './response-schemas';
export { REFERRED_CLIENTS_PAGE_SIZE } from './constants';

// ---------- Входы ----------

export type DocumentSetOwner = DocumentSet['owner'];

/** Файл для загрузки; в браузере — `File`. */
export interface UploadFile {
  readonly name: string;
  readonly type: string;
  readonly size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
}

export type ReferredClientsSort = 'applied' | 'updated';

export interface ReferredClientsQuery {
  statuses?: readonly SupplierViewStatus[];
  /** По умолчанию `applied` (applied_at desc), SP-04. */
  sort?: ReferredClientsSort;
  cursor?: string | null;
}


// ---------- Порты ----------

export interface AuthPort {
  requestOtp(phone: string): Promise<OtpChallenge>;
  /** Неверный код, истёк, попытки, неизвестный номер — DomainError с кодом из 01-roles.md §3. */
  verifyOtp(phone: string, code: string): Promise<Session>;
  getSession(): Promise<Session | null>;
  logout(): Promise<void>;
}

export interface ApplicationPort {
  getCurrent(): Promise<Application>;
  /** Компания текущей заявки: название в шапке кабинета (01-cabinet-structure.md §4). */
  getCompany(): Promise<Company>;
  /** Номер CR компании: 10 цифр; неверный — DomainError `company.cr_invalid`. */
  setCrNumber(crNumber: string): Promise<Company>;
  /** Только из `closed` (D-038): новая заявка, старая остаётся закрытой. */
  createApplication(): Promise<Application>;
}

export interface DocumentsPort {
  getSet(owner: DocumentSetOwner): Promise<DocumentSet>;
  upload(documentId: string, file: UploadFile, options?: UploadOptions): Promise<UploadResult>;
  replace(documentId: string, fileId: string, file: UploadFile, options?: UploadOptions): Promise<UploadResult>;
  delete(documentId: string, fileId: string): Promise<Document>;
  submit(setId: string): Promise<DocumentSet>;
  /** Прямая ссылка (не blob:), DoD. */
  download(fileId: string): Promise<DownloadLink>;
}

export interface LimitPort {
  get(): Promise<Limit>;
  getChecklist(): Promise<OnboardingChecklist>;
}

/** График платежей клиента (D-102, 01-entities.md §2.9a). До оплаты первой сделки поставщику — пустой список. */
export interface RepaymentPort {
  /**
   * D-102: все взносы по сделкам текущей заявки и реквизиты Tadum для оплаты; статус взноса считает бэкенд.
   * До оплаты первой сделки поставщику — `installments: []`. Только клиент; поставщику — `Forbidden`.
   */
  getSchedule(): Promise<RepaymentSchedule>;
}

export interface SupplierPort {
  get(): Promise<Supplier>;
  getCounters(): Promise<SupplierCounters>;
  /** Номер CR поставщика (D-093), как ApplicationPort.setCrNumber у клиента. */
  setCrNumber(crNumber: string): Promise<Supplier>;
  /** Email, отрасль и город поставщика (A-075); неверное значение — DomainError `supplier.profile_invalid`. */
  setProfile(patch: SupplierProfilePatch): Promise<Supplier>;
}

export interface ReferredClientsPort {
  /** Только проекция ReferredClient; фильтр и сортировка — на стороне порта. */
  list(query?: ReferredClientsQuery): Promise<ReferredClientsPage>;
}

export interface OfferPort {
  get(): Promise<OfferContent>;
}

export interface Ports {
  auth: AuthPort;
  application: ApplicationPort;
  documents: DocumentsPort;
  limit: LimitPort;
  repayment: RepaymentPort;
  supplier: SupplierPort;
  referredClients: ReferredClientsPort;
  offer: OfferPort;
}

// ---------- Демо-действия (01-statuses.md §10, SP-03 §7) ----------

export type NetworkMode = 'ok' | 'slow' | 'error' | 'offline';
export type ChecklistKey = (typeof CHECKLIST_KEYS)[number];

/** Ровно таблица 01-statuses.md §10 + SP-03 §7 + cancelLimit + служебное setPersona. Других нет. */
export interface DemoActions {
  submitDocumentSet(): void;
  uwApproveDocument(documentId: string): void;
  uwRejectDocument(documentId: string, reasonKey?: string): void;
  uwRequestMoreDocs(portalKeys: readonly PortalKey[]): void;
  uwApproveApplication(limitAmount: Money): void;
  salesConfirmOffer(): void;
  externalSign(itemKey: ChecklistKey): void;
  /** Возвращает id сделки. */
  createDeal(amount: Money, supplierId: string): string;
  payDeal(dealId: string): void;
  uwReject(): void;
  salesLose(): void;
  createApplication(): void;
  expireSession(): void;
  setNetwork(mode: NetworkMode): void;
  uwApproveSupplierSet(): void;
  uwRejectSupplierDocument(portalKey: PortalKey, reasonTag?: string): void;
  odooRequireDocument(portalKey: PortalKey): void;
  /** Поставщик: договор и данные получены — Need Contract → Interested (D-088, бриф TD-001 §5). */
  salesSupplierContractDone(): void;
  /** Поставщик: первая сделка — Interested → Activated. */
  odooSupplierActivated(): void;
  odooSupplierDecline(): void;
  odooSupplierLost(): void;
  /** Lost → Processing (кнопка Return to Processing в Odoo). */
  returnToProcessing(): void;
  cancelLimit(): void;
  setPersona(personaId: string): void;
}

export interface Api extends Ports {
  /** Только в mock-режиме. */
  demo: DemoActions | null;
}
