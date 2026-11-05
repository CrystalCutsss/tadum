// Порты данных. UI и features знают только эти интерфейсы; адаптер (mock | http) выбирает client.ts.
// Ответы всех методов валидируются Zod-схемами из RESPONSE_SCHEMAS (обёртка в client.ts).

import { z } from 'zod';

import {
  ApplicationSchema,
  DateTimeSchema,
  DocumentSchema,
  DocumentSetSchema,
  LimitSchema,
  OfferContentSchema,
  OnboardingChecklistSchema,
  PrevalidationResultSchema,
  ReferredClientSchema,
  SessionSchema,
  SupplierSchema,
  type Application,
  type CHECKLIST_KEYS,
  type Document,
  type DocumentSet,
  type Limit,
  type Money,
  type OfferContent,
  type OnboardingChecklist,
  type PortalKey,
  type Session,
  type Supplier,
  type SupplierViewStatus,
  type UploadProgress,
} from './schemas';

// ---------- Ответы, которых нет среди сущностей ----------

export const OtpChannelSchema = z.enum(['sms', 'whatsapp']);

export const OtpChallengeSchema = z.object({
  channel: OtpChannelSchema,
  length: z.number().int(),
  expires_at: DateTimeSchema,
  resend_available_at: DateTimeSchema,
  attempts_left: z.number().int().nonnegative(),
});

export const UploadResultSchema = z.object({
  document: DocumentSchema,
  /** `failed` — файл не принят, документ не изменился (SC-02 A3). */
  prevalidation: PrevalidationResultSchema,
});

export const DownloadLinkSchema = z.object({ url: z.string() });

export const SupplierCountersSchema = SupplierSchema.shape.counters;

export const ReferredClientsPageSchema = z.object({
  items: z.array(ReferredClientSchema),
  next_cursor: z.string().nullable(),
  total: z.number().int().nonnegative(),
});

export type OtpChannel = z.infer<typeof OtpChannelSchema>;
export type OtpChallenge = z.infer<typeof OtpChallengeSchema>;
export type UploadResult = z.infer<typeof UploadResultSchema>;
export type DownloadLink = z.infer<typeof DownloadLinkSchema>;
export type SupplierCounters = z.infer<typeof SupplierCountersSchema>;
export type ReferredClientsPage = z.infer<typeof ReferredClientsPageSchema>;

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

/** Размер страницы списка приведённых клиентов (SP-04 A7). */
export const REFERRED_CLIENTS_PAGE_SIZE = 20;

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

export interface SupplierPort {
  get(): Promise<Supplier>;
  getCounters(): Promise<SupplierCounters>;
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
  cancelLimit(): void;
  setPersona(personaId: string): void;
}

export interface Api extends Ports {
  /** Только в mock-режиме. */
  demo: DemoActions | null;
}

// ---------- Схемы ответов для обёртки валидации ----------

type Schemas<P> = { [K in keyof P]: z.ZodType };

export const RESPONSE_SCHEMAS: { [K in keyof Ports]: Schemas<Ports[K]> } = {
  auth: { requestOtp: OtpChallengeSchema, verifyOtp: SessionSchema, getSession: SessionSchema.nullable(), logout: z.void() },
  application: { getCurrent: ApplicationSchema, createApplication: ApplicationSchema },
  documents: {
    getSet: DocumentSetSchema,
    upload: UploadResultSchema,
    replace: UploadResultSchema,
    delete: DocumentSchema,
    submit: DocumentSetSchema,
    download: DownloadLinkSchema,
  },
  limit: { get: LimitSchema, getChecklist: OnboardingChecklistSchema },
  supplier: { get: SupplierSchema, getCounters: SupplierCountersSchema },
  referredClients: { list: ReferredClientsPageSchema },
  offer: { get: OfferContentSchema },
};

