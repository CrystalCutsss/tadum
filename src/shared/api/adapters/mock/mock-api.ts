// MockAdapter: имитация бэкенда по правилам 01-statuses.md §10 (D-072, D-073).
// Состояние — в памяти и в storage('mock:<persona>') со schemaVersion; при несовпадении — сброс к фикстуре.
// Время — только clock.now(); задержки и канал OTP детерминированы от hash(persona_id).

import { MOCK_COMPLETION_GRACE_MS, MOCK_LATENCY, MOCK_REVIEW_DELAY_MS, OTP, SESSION_TTL_MS } from '@/shared/config';
import { now as clockNow, storage, toDate } from '@/shared/lib';

import { CLIENT_BASE_KEYS } from '../../fixtures/build';
import { PERSONAS } from '../../fixtures/personas';
import { PersonaGraphSchema } from '../../fixtures/schema';
import { PERSONA_IDS, type PersonaGraph, type PersonaId } from '../../fixtures/types';
import { DomainError, Forbidden, NetworkError, NotFound, ServerError, Unauthorized } from '../../ports/errors';
import {
  REFERRED_CLIENTS_PAGE_SIZE,
  type Api,
  type DemoActions,
  type NetworkMode,
  type Ports,
  type UploadFile,
  type UploadOptions,
  type UploadResult,
} from '../../ports/ports';
import {
  AcceptedMimeSchema,
  MAX_FILE_SIZE_BYTES,
  type Application,
  type Document,
  type DocumentSet,
  type FileAsset,
  type Limit,
  type OnboardingChecklist,
  type PrevalidationResult,
  type Role,
  type Session,
} from '../../ports/schemas';
import { loadOfferContent } from '../static/offer';
import { normalize, referredClients } from './derive';
import type { MockDocumentEvent, MockDomain } from './domain';
import { hash, hashRange, sha256Hex } from './hash';

/** Меняется при несовместимом изменении формы состояния — сохранённое состояние сбрасывается к фикстуре. */
export const MOCK_SCHEMA_VERSION = 1;

/** Код OTP, который мок принимает (D-021). */
const MOCK_OTP_CODE = '0000';

export interface MockApiOptions {
  domain: MockDomain;
  landingUrl: string;
  /** false — без задержек (тесты). */
  latency?: boolean;
}

interface PersonaState {
  schemaVersion: number;
  /** Счётчик для детерминированных id новых объектов. */
  seq: number;
  graph: PersonaGraph;
}

interface ActiveSession {
  phone: string;
  active_role: Role;
  issued_at: string;
  expires_at: string;
  /** expireSession(): следующий вызов порта → 401. */
  expired: boolean;
}

interface ActiveState {
  schemaVersion: number;
  persona_id: PersonaId | null;
  session: ActiveSession | null;
}

interface Challenge {
  issued: number;
  attempts: number;
}

const ACTIVE_KEY = 'mock:active';
const personaKey = (id: PersonaId) => `mock:${id}`;
const iso = (ms: number) => toDate(ms).toISOString();
const ms = (isoTime: string) => toDate(isoTime).getTime();
const sleep = (delay: number) => new Promise<void>((resolve) => setTimeout(resolve, delay));
const isPersonaId = (id: string): id is PersonaId => (PERSONA_IDS as readonly string[]).includes(id);
const isDone = (d: Pick<Document, 'status'>) => d.status === 'received' || d.status === 'approved';

/** Комплект полон: все обязательные received/approved и нет rejected (01-statuses.md §4). */
function isSetComplete(set: Pick<DocumentSet, 'documents'>): boolean {
  const required = set.documents.filter((d) => d.required);
  return required.length > 0 && required.every(isDone) && !set.documents.some((d) => d.status === 'rejected');
}

/** Имитация предвалидации: имя файла с `fail` / `warn` даёт failed / warning по первому правилу типа. */
function mockPrevalidation(fileName: string, rules: readonly string[]): PrevalidationResult {
  const name = fileName.toLowerCase();
  const rule = rules[0];
  if (rule && name.includes('fail')) return { state: 'failed', rule_keys: [rule] };
  if (rule && name.includes('warn')) return { state: 'warning', rule_keys: [rule] };
  return { state: 'passed', rule_keys: [] };
}

export function createMockApi(options: MockApiOptions): Api {
  const d = options.domain;
  const landingUrl = options.landingUrl;
  const latency = options.latency ?? true;
  let network: NetworkMode = 'ok';
  const challenges = new Map<string, Challenge>();
  const otpRequests = new Map<string, number[]>();

  // ---------- Хранилище ----------

  const fixtureState = (id: PersonaId): PersonaState => ({
    schemaVersion: MOCK_SCHEMA_VERSION,
    seq: 0,
    graph: normalize(PERSONAS[id](clockNow()), d, landingUrl),
  });

  const savePersona = (s: PersonaState) => storage.set(personaKey(s.graph.persona_id), JSON.stringify(s));

  function loadPersona(id: PersonaId): PersonaState {
    const raw = storage.get(personaKey(id));
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<PersonaState>;
        if (parsed.schemaVersion === MOCK_SCHEMA_VERSION && typeof parsed.seq === 'number' && PersonaGraphSchema.safeParse(parsed.graph).success) {
          return parsed as PersonaState;
        }
      } catch {
        // повреждённое состояние — сброс к фикстуре
      }
    }
    const fresh = fixtureState(id);
    savePersona(fresh);
    return fresh;
  }

  function loadActive(): ActiveState {
    const raw = storage.get(ACTIVE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ActiveState;
        if (parsed.schemaVersion === MOCK_SCHEMA_VERSION && (parsed.persona_id === null || isPersonaId(parsed.persona_id))) return parsed;
      } catch {
        // сброс
      }
    }
    return { schemaVersion: MOCK_SCHEMA_VERSION, persona_id: null, session: null };
  }

  const saveActive = (a: ActiveState) => storage.set(ACTIVE_KEY, JSON.stringify(a));

  // ---------- Время: отложенные переходы ----------

  function submitSet(set: DocumentSet, at: string) {
    set.status = 'submitted';
    set.locked = true;
    set.submitted_at = at;
    delete set.completion_grace_until;
  }

  /** submitted → in_review; заявка уходит в Ready for UW (01-statuses.md §10). */
  function toReview(g: PersonaGraph, set: DocumentSet) {
    set.status = 'in_review';
    set.locked = true;
    if (set.owner.kind !== 'application') return;
    const app = g.applications.find((a) => a.id === set.owner.id);
    if (app && d.deriveClientStatus(app.odoo_stage) === 'docs_required') {
      app.odoo_stage = 'Ready for UW';
      app.updated_at = iso(clockNow());
    }
  }

  /** Автополнота и задержка проверки — по часам, при каждом чтении. */
  function settle(g: PersonaGraph): boolean {
    const t = clockNow();
    let changed = false;
    for (const set of g.document_sets) {
      if (set.status === 'draft' && set.completion_grace_until && ms(set.completion_grace_until) <= t) {
        if (isSetComplete(set) && editable(g, set)) submitSet(set, set.completion_grace_until);
        else delete set.completion_grace_until;
        changed = true;
      }
      if (set.status === 'submitted' && set.submitted_at && ms(set.submitted_at) + MOCK_REVIEW_DELAY_MS <= t) {
        toReview(g, set);
        changed = true;
      }
    }
    return changed;
  }

  function fresh(state: PersonaState): PersonaGraph {
    const g = structuredClone(state.graph);
    if (settle(g)) {
      state.graph = normalize(g, d, landingUrl);
      savePersona(state);
    }
    return state.graph;
  }

  function commit<T>(state: PersonaState, fn: (g: PersonaGraph) => T): T {
    const g = structuredClone(state.graph);
    settle(g);
    const result = fn(g);
    state.graph = normalize(g, d, landingUrl);
    savePersona(state);
    return result;
  }

  const nextId = (state: PersonaState, prefix: string) => `${prefix}_${state.graph.persona_id}_${++state.seq}`;

  // ---------- Роли и сессия ----------

  function lookups(g: PersonaGraph) {
    const app = g.applications.at(-1);
    const lead = app ? g.leads.find((l) => l.application_id === app.id) : undefined;
    return {
      findActiveLeadByPhone: (p: string) =>
        lead && (lead.phone === p || lead.lead_main_owner_phone === p) ? { phone: lead.phone, lead_main_owner_phone: lead.lead_main_owner_phone } : null,
      findSupplierByPhone: (p: string) => g.supplier?.phones.includes(p) ?? false,
    };
  }

  const rolesOf = (g: PersonaGraph, phone: string) => d.resolveRoles(phone, lookups(g));

  let phoneIndex: Map<string, PersonaId> | null = null;
  function personaByPhone(phone: string): PersonaId | null {
    if (!phoneIndex) {
      phoneIndex = new Map();
      for (const id of PERSONA_IDS) {
        const g = PERSONAS[id](clockNow());
        const phones = [g.phone, ...g.leads.flatMap((l) => [l.phone, l.lead_main_owner_phone ?? '']), ...(g.supplier?.phones ?? [])];
        for (const p of phones) if (p && !phoneIndex.has(p)) phoneIndex.set(p, id);
      }
    }
    return phoneIndex.get(phone) ?? null;
  }

  function toSession(g: PersonaGraph, s: ActiveSession, roles: Role[]): Session {
    const app = g.applications.at(-1);
    const active_role = roles.includes(s.active_role) ? s.active_role : (d.initialActiveRole(roles) ?? s.active_role);
    return {
      phone: s.phone,
      roles,
      active_role,
      language: 'ar',
      theme: 'system',
      issued_at: s.issued_at,
      expires_at: s.expires_at,
      // Имя знает только владелец основного номера персоны; номера из leads — без имени.
      ...(g.user && s.phone === g.phone ? { display_name: g.user.name, ...(g.user.name_ar ? { display_name_ar: g.user.name_ar } : {}) } : {}),
      ...(app && roles.some((r) => r !== 'supplier') ? { client_context: { application_id: app.id, company_id: app.company_id } } : {}),
      ...(g.supplier && roles.includes('supplier') ? { supplier_context: { supplier_id: g.supplier.id } } : {}),
    };
  }

  function startSession(id: PersonaId, phone: string): Session | null {
    const state = loadPersona(id);
    const roles = rolesOf(state.graph, phone);
    const role = d.initialActiveRole(roles);
    const t = clockNow();
    const session: ActiveSession | null = role ? { phone, active_role: role, issued_at: iso(t), expires_at: iso(t + SESSION_TTL_MS), expired: false } : null;
    saveActive({ schemaVersion: MOCK_SCHEMA_VERSION, persona_id: id, session });
    return session ? toSession(state.graph, session, roles) : null;
  }

  /** Гард каждого вызова порта, кроме входа: нет сессии или она истекла → 401. */
  function authed() {
    const a = loadActive();
    if (!a.session || !a.persona_id) throw new Unauthorized();
    if (a.session.expired || ms(a.session.expires_at) <= clockNow()) {
      saveActive({ ...a, session: null });
      throw new Unauthorized('session_expired');
    }
    const state = loadPersona(a.persona_id);
    return { state, roles: rolesOf(state.graph, a.session.phone), session: a.session };
  }

  function asClient() {
    const ctx = authed();
    if (!ctx.roles.some((r) => r !== 'supplier')) throw new Forbidden();
    return ctx;
  }

  function asSupplier() {
    const ctx = authed();
    if (!ctx.roles.includes('supplier')) throw new Forbidden();
    return ctx;
  }

  // ---------- Доступ к данным графа ----------

  const currentApp = (g: PersonaGraph): Application => {
    const app = g.applications.at(-1);
    if (!app) throw new NotFound('application');
    return app;
  };

  const currentLimit = (g: PersonaGraph): Limit | undefined => {
    const app = g.applications.at(-1);
    return app?.limit_id ? g.limits.find((l) => l.id === app.limit_id) : undefined;
  };

  const setById = (g: PersonaGraph, id: string): DocumentSet => {
    const set = g.document_sets.find((s) => s.id === id);
    if (!set) throw new NotFound('document_set');
    return set;
  };

  const clientSet = (g: PersonaGraph) => setById(g, currentApp(g).current_document_set_id);

  const supplierSet = (g: PersonaGraph) => {
    if (!g.supplier) throw new NotFound('supplier');
    return setById(g, g.supplier.current_document_set_id);
  };

  /** Правка файлов клиента — только в текущей заявке в состоянии collecting (01-statuses.md §9). */
  function editable(g: PersonaGraph, set: DocumentSet): boolean {
    if (set.owner.kind === 'supplier') return true;
    const app = g.applications.at(-1);
    return !!app && app.id === set.owner.id && d.derivePermissionState(d.deriveClientStatus(app.odoo_stage)) === 'collecting';
  }

  function locateDocument(g: PersonaGraph, roles: Role[], documentId: string) {
    for (const set of g.document_sets) {
      const doc = set.documents.find((x) => x.id === documentId);
      if (!doc) continue;
      const allowed = set.owner.kind === 'supplier' ? roles.includes('supplier') : roles.some((r) => r !== 'supplier');
      if (!allowed) throw new Forbidden();
      return { set, doc };
    }
    throw new NotFound('document');
  }

  function updateGrace(set: DocumentSet) {
    if (set.status === 'draft' && isSetComplete(set)) set.completion_grace_until = iso(clockNow() + MOCK_COMPLETION_GRACE_MS);
    else delete set.completion_grace_until;
  }

  function apply(g: PersonaGraph, set: DocumentSet, doc: Document, event: MockDocumentEvent) {
    if (!editable(g, set) && (event.type === 'upload' || event.type === 'replace' || event.type === 'delete' || event.type === 'reupload')) {
      throw new DomainError('document_set_locked');
    }
    const t = d.transitionDocument(doc.status, event, { set_status: set.status, rejected_file_hashes: doc.rejected_file_hashes });
    if (!t.ok) throw new DomainError(t.error);
    return t;
  }

  // ---------- Сеть ----------

  async function io<T>(method: string, fn: () => T | Promise<T>): Promise<T> {
    if (latency) {
      const persona = loadActive().persona_id ?? 'anonymous';
      const base = hashRange(`${persona}:${method}`, MOCK_LATENCY.min_ms, MOCK_LATENCY.max_ms);
      await sleep(network === 'slow' ? base * MOCK_LATENCY.slow_factor : base);
    }
    if (network === 'offline') throw new NetworkError();
    if (network === 'error') throw new ServerError();
    return fn();
  }

  // ---------- Загрузка файлов ----------

  async function receiveFile(state: PersonaState, file: UploadFile, documentId: string, opts: UploadOptions | undefined) {
    const mime = AcceptedMimeSchema.safeParse(file.type);
    if (!mime.success) throw new DomainError('upload.error.unsupported_type');
    if (file.size > MAX_FILE_SIZE_BYTES) throw new DomainError('upload.error.too_large', { max_mb: MAX_FILE_SIZE_BYTES / 1024 / 1024 });
    opts?.onProgress?.({ percent: 0, state: 'queued' });
    const sha256 = await sha256Hex(await file.arrayBuffer());
    opts?.onProgress?.({ percent: 100, state: 'uploading' });
    const portalKey = state.graph.document_sets.flatMap((s) => s.documents).find((x) => x.id === documentId)?.portal_key ?? '';
    const prevalidation = mockPrevalidation(file.name, d.prevalidationRules(portalKey));
    opts?.onProgress?.({ percent: 100, state: 'validating' });
    const asset = (id: string): FileAsset => ({
      id,
      name: file.name,
      mime: mime.data,
      size_bytes: file.size,
      sha256,
      uploaded_at: iso(clockNow()),
      download_url: `/mock-files/${id}`,
      prevalidation,
    });
    return { sha256, prevalidation, asset };
  }

  function finish(opts: UploadOptions | undefined, result: UploadResult): UploadResult {
    opts?.onProgress?.(
      result.prevalidation.state === 'failed' ? { percent: 100, state: 'failed', error_key: 'prevalidation.failed.title' } : { percent: 100, state: 'done' },
    );
    return result;
  }

  function clearRejection(doc: Document) {
    delete doc.reject_reason_key;
    delete doc.reject_reason_text;
  }

  // ---------- Порты ----------

  const ports: Ports = {
    auth: {
      requestOtp: (phone) =>
        io('auth.requestOtp', () => {
          if (!/^\+9665\d{8}$/.test(phone)) throw new DomainError('not_allowed');
          const t = clockNow();
          const recent = (otpRequests.get(phone) ?? []).filter((x) => t - x < OTP.rate_limit.window_ms);
          const first = recent[0];
          if (first !== undefined && recent.length >= OTP.rate_limit.max_requests) {
            throw new DomainError('otp_rate_limited', { retry_after_s: Math.ceil((first + OTP.rate_limit.window_ms - t) / 1000) });
          }
          const previous = challenges.get(phone);
          if (previous && t - previous.issued < OTP.resend_after_ms) {
            throw new DomainError('otp_resend_too_early', { retry_after_s: Math.ceil((previous.issued + OTP.resend_after_ms - t) / 1000) });
          }
          otpRequests.set(phone, [...recent, t]);
          challenges.set(phone, { issued: t, attempts: 0 });
          // Канал выбирает бэкенд (D-027); в моке — детерминированно от персоны.
          const channel = hash(personaByPhone(phone) ?? phone) % 2 === 0 ? 'sms' : 'whatsapp';
          return {
            channel,
            length: OTP.length,
            expires_at: iso(t + OTP.ttl_ms),
            resend_available_at: iso(t + OTP.resend_after_ms),
            attempts_left: OTP.max_attempts,
          };
        }),
      verifyOtp: (phone, code) =>
        io('auth.verifyOtp', () => {
          const c = challenges.get(phone);
          const t = clockNow();
          if (!c || t - c.issued >= OTP.ttl_ms) throw new DomainError('otp_expired');
          if (c.attempts >= OTP.max_attempts) throw new DomainError('otp_too_many_attempts');
          if (code !== MOCK_OTP_CODE) {
            c.attempts += 1;
            if (c.attempts >= OTP.max_attempts) throw new DomainError('otp_too_many_attempts');
            throw new DomainError('otp_invalid', { attempts_left: OTP.max_attempts - c.attempts });
          }
          challenges.delete(phone);
          const id = personaByPhone(phone);
          const session = id ? startSession(id, phone) : null;
          if (!session) throw new DomainError('phone_unknown');
          return session;
        }),
      getSession: () =>
        io('auth.getSession', () => {
          if (!loadActive().session) return null;
          const { state, roles, session } = authed();
          return toSession(fresh(state), session, roles);
        }),
      logout: () =>
        io('auth.logout', () => {
          saveActive({ ...loadActive(), session: null });
        }),
    },

    application: {
      getCurrent: () => io('application.getCurrent', () => currentApp(fresh(asClient().state))),
      getCompany: () =>
        io('application.getCompany', () => {
          const company = fresh(asClient().state).company;
          if (!company) throw new NotFound('company');
          return company;
        }),
      createApplication: () =>
        io('application.createApplication', () => {
          const { state } = asClient();
          return commit(state, (g) => createApplicationIn(state, g));
        }),
    },

    documents: {
      getSet: (owner) =>
        io('documents.getSet', () => {
          if (owner.kind === 'application') {
            const g = fresh(asClient().state);
            const app = g.applications.find((a) => a.id === owner.id);
            if (!app) throw new NotFound('application');
            return setById(g, app.current_document_set_id);
          }
          const g = fresh(asSupplier().state);
          if (g.supplier?.id !== owner.id) throw new NotFound('supplier');
          return supplierSet(g);
        }),
      upload: (documentId, file, opts) =>
        io('documents.upload', async () => {
          const { state, roles } = authed();
          locateDocument(state.graph, roles, documentId);
          const received = await receiveFile(state, file, documentId, opts);
          const result = commit(state, (g): UploadResult => {
            const { set, doc } = locateDocument(g, roles, documentId);
            const event: MockDocumentEvent =
              doc.status === 'rejected'
                ? { type: 'reupload', sha256: received.sha256 }
                : doc.status === 'received'
                  ? { type: 'replace' }
                  : { type: 'upload', prevalidation: received.prevalidation.state };
            const t = apply(g, set, doc, event);
            if (received.prevalidation.state === 'failed') return { document: structuredClone(doc), prevalidation: received.prevalidation };
            const asset = received.asset(nextId(state, 'file'));
            if (doc.status === 'rejected') {
              doc.files = [asset];
              clearRejection(doc);
            } else {
              doc.files.push(asset);
            }
            doc.status = t.to;
            doc.updated_at = asset.uploaded_at;
            updateGrace(set);
            return { document: structuredClone(doc), prevalidation: received.prevalidation };
          });
          return finish(opts, result);
        }),
      replace: (documentId, fileId, file, opts) =>
        io('documents.replace', async () => {
          const { state, roles } = authed();
          locateDocument(state.graph, roles, documentId);
          const received = await receiveFile(state, file, documentId, opts);
          const result = commit(state, (g): UploadResult => {
            const { set, doc } = locateDocument(g, roles, documentId);
            const index = doc.files.findIndex((f) => f.id === fileId);
            if (index === -1) throw new NotFound('file');
            const event: MockDocumentEvent = doc.status === 'rejected' ? { type: 'reupload', sha256: received.sha256 } : { type: 'replace' };
            const t = apply(g, set, doc, event);
            if (received.prevalidation.state === 'failed') return { document: structuredClone(doc), prevalidation: received.prevalidation };
            const asset = received.asset(nextId(state, 'file'));
            if (doc.status === 'rejected') {
              doc.files = [asset];
              clearRejection(doc);
            } else {
              doc.files[index] = asset;
            }
            doc.status = t.to;
            doc.updated_at = asset.uploaded_at;
            updateGrace(set);
            return { document: structuredClone(doc), prevalidation: received.prevalidation };
          });
          return finish(opts, result);
        }),
      delete: (documentId, fileId) =>
        io('documents.delete', () => {
          const { state, roles } = authed();
          return commit(state, (g) => {
            const { set, doc } = locateDocument(g, roles, documentId);
            const index = doc.files.findIndex((f) => f.id === fileId);
            if (index === -1) throw new NotFound('file');
            const t = apply(g, set, doc, doc.files.length > 1 ? { type: 'replace' } : { type: 'delete' });
            doc.files.splice(index, 1);
            doc.status = t.to;
            doc.updated_at = iso(clockNow());
            updateGrace(set);
            return structuredClone(doc);
          });
        }),
      submit: (setId) =>
        io('documents.submit', () => {
          const { state, roles } = authed();
          return commit(state, (g) => {
            const set = setById(g, setId);
            const allowed = set.owner.kind === 'supplier' ? roles.includes('supplier') : roles.some((r) => r !== 'supplier');
            if (!allowed) throw new Forbidden();
            submitIn(g, set);
            return structuredClone(set);
          });
        }),
      download: (fileId) =>
        io('documents.download', () => {
          const { state, roles } = authed();
          for (const set of state.graph.document_sets) {
            for (const doc of set.documents) {
              const f = doc.files.find((x) => x.id === fileId);
              if (!f) continue;
              locateDocument(state.graph, roles, doc.id);
              return { url: f.download_url };
            }
          }
          throw new NotFound('file');
        }),
    },

    limit: {
      get: () =>
        io('limit.get', () => {
          const limit = currentLimit(fresh(asClient().state));
          if (!limit) throw new NotFound('limit');
          return limit;
        }),
      getChecklist: () =>
        io('limit.getChecklist', (): OnboardingChecklist => {
          const limit = currentLimit(fresh(asClient().state));
          if (!limit) throw new NotFound('limit');
          return limit.checklist;
        }),
    },

    supplier: {
      get: () =>
        io('supplier.get', () => {
          const s = fresh(asSupplier().state).supplier;
          if (!s) throw new NotFound('supplier');
          return s;
        }),
      getCounters: () =>
        io('supplier.getCounters', () => {
          const s = fresh(asSupplier().state).supplier;
          if (!s) throw new NotFound('supplier');
          return s.counters;
        }),
    },

    referredClients: {
      list: (query = {}) =>
        io('referredClients.list', () => {
          const g = fresh(asSupplier().state);
          const statuses = query.statuses ?? [];
          const field = query.sort === 'updated' ? 'updated_at' : 'applied_at';
          const all = referredClients(g, d)
            .filter((c) => statuses.length === 0 || statuses.includes(c.supplier_view_status))
            .sort((a, b) => ms(b[field]) - ms(a[field]) || a.application_id.localeCompare(b.application_id));
          const start = query.cursor ? Number(query.cursor) : 0;
          const end = start + REFERRED_CLIENTS_PAGE_SIZE;
          return { items: all.slice(start, end), next_cursor: end < all.length ? String(end) : null, total: all.length };
        }),
    },

    offer: {
      get: () => io('offer.get', () => loadOfferContent()),
    },
  };

  // ---------- Операции, общие для портов и демо-действий ----------

  function submitIn(g: PersonaGraph, set: DocumentSet) {
    if (set.status !== 'draft' || !editable(g, set)) throw new DomainError('document_set_locked');
    if (!isSetComplete(set)) {
      throw new DomainError('documents.submit_incomplete', { remaining: set.documents.filter((x) => x.required && !isDone(x)).length });
    }
    submitSet(set, iso(clockNow()));
  }

  function createApplicationIn(state: PersonaState, g: PersonaGraph): Application {
    const old = currentApp(g);
    if (d.deriveClientStatus(old.odoo_stage) !== 'closed') throw new DomainError('application_not_closed');
    const t = iso(clockNow());
    const appId = nextId(state, 'app');
    const setId = nextId(state, 'set');
    g.document_sets.push({
      id: setId,
      owner: { kind: 'application', id: appId },
      round: 1,
      status: 'draft',
      locked: false,
      documents: CLIENT_BASE_KEYS.map((key) => pendingDocument(setId, key, t, [])),
    });
    const app: Application = {
      id: appId,
      company_id: old.company_id,
      odoo_stage: 'Document collection',
      client_status: 'docs_required',
      permission_state: 'collecting',
      next_step: old.next_step,
      current_document_set_id: setId,
      created_at: t,
      updated_at: t,
      source: { channel: 'direct' },
    };
    g.applications.push(app);
    const lead = g.leads.find((l) => l.application_id === old.id);
    if (lead) g.leads.push({ ...lead, application_id: appId });
    return app;
  }

  function pendingDocument(setId: string, key: string, at: string, rejectedHashes: string[]): Document {
    return {
      id: `${setId}_${key}`,
      set_id: setId,
      portal_key: key,
      status: 'pending',
      required: true,
      rejected_file_hashes: rejectedHashes,
      files: [],
      hint: d.hintFor(key),
      updated_at: at,
    };
  }

  /** Решения UW принимаются по комплекту в in_review; отправленный комплект сначала доходит до проверки. */
  function reviewed(g: PersonaGraph, set: DocumentSet): DocumentSet {
    if (set.status === 'submitted') toReview(g, set);
    if (set.status !== 'in_review') throw new DomainError('not_allowed');
    return set;
  }

  function uwDecide(g: PersonaGraph, set: DocumentSet, doc: Document, event: MockDocumentEvent) {
    const t = apply(g, reviewed(g, set), doc, event);
    doc.status = t.to;
    doc.updated_at = iso(clockNow());
    if (event.type === 'uw_reject') {
      if (event.reason_key) doc.reject_reason_key = event.reason_key;
      doc.rejected_file_hashes = [...new Set([...doc.rejected_file_hashes, ...doc.files.map((f) => f.sha256)])];
    }
  }

  const requireClientStage = (g: PersonaGraph, allowed: readonly string[]) => {
    const app = currentApp(g);
    if (!allowed.includes(d.deriveClientStatus(app.odoo_stage))) throw new DomainError('not_allowed');
    return app;
  };

  const checklistPending = (): OnboardingChecklist => ({
    items: [
      { key: 'spa_sadq', status: 'pending', external_url: 'https://sadq.sa/' },
      { key: 'pn_company_nafith', status: 'pending', external_url: 'https://nafith.sa/' },
      { key: 'pn_owner_nafith', status: 'pending', external_url: 'https://nafith.sa/' },
    ],
    completed: false,
  });

  function demoState(): PersonaState {
    const id = loadActive().persona_id;
    if (!id) throw new DomainError('not_allowed');
    return loadPersona(id);
  }

  const act = <T>(fn: (g: PersonaGraph, state: PersonaState) => T): T => {
    const state = demoState();
    return commit(state, (g) => fn(g, state));
  };

  const touch = (app: Application) => {
    app.updated_at = iso(clockNow());
  };

  // ---------- Демо-действия ----------

  const demo: DemoActions = {
    submitDocumentSet: () => act((g) => submitIn(g, clientSet(g))),
    uwApproveDocument: (documentId) =>
      act((g) => {
        const { set, doc } = locateDocument(g, ['client_contact', 'supplier'], documentId);
        uwDecide(g, set, doc, { type: 'uw_approve' });
      }),
    uwRejectDocument: (documentId, reasonKey) =>
      act((g) => {
        const { set, doc } = locateDocument(g, ['client_contact', 'supplier'], documentId);
        // Заявка остаётся under_review, пока UW не вызовет uwRequestMoreDocs.
        uwDecide(g, set, doc, reasonKey ? { type: 'uw_reject', reason_key: reasonKey } : { type: 'uw_reject' });
      }),
    uwRequestMoreDocs: (portalKeys) =>
      act((g, state) => {
        if (portalKeys.length === 0) throw new DomainError('not_allowed');
        const old = reviewed(g, clientSet(g));
        const app = requireClientStage(g, ['under_review']);
        old.status = 'superseded';
        old.locked = true;
        const t = iso(clockNow());
        const setId = nextId(state, 'set');
        // В новый комплект — только запрошенные ключи (D-031); история отклонённых файлов сохраняется.
        g.document_sets.push({
          id: setId,
          owner: old.owner,
          round: old.round + 1,
          status: 'draft',
          locked: false,
          documents: [...new Set(portalKeys)].map((key) => {
            const prev = old.documents.find((x) => x.portal_key === key);
            return pendingDocument(setId, key, t, prev ? [...prev.rejected_file_hashes] : []);
          }),
        });
        app.current_document_set_id = setId;
        app.odoo_stage = 'Need more docs for UW';
        touch(app);
      }),
    uwApproveApplication: (limitAmount) =>
      act((g, state) => {
        const set = reviewed(g, clientSet(g));
        const app = requireClientStage(g, ['under_review']);
        // S-2: всё, что не rejected после проверки, считается approved.
        for (const doc of set.documents) if (doc.status === 'received') doc.status = 'approved';
        set.status = 'completed';
        set.locked = true;
        app.odoo_stage = 'Approved';
        touch(app);
        const limit: Limit = {
          id: app.limit_id ?? nextId(state, 'lim'),
          application_id: app.id,
          status: 'pending',
          approved: limitAmount,
          used: { amount_minor: 0, currency: 'SAR' },
          available: limitAmount,
          checklist: checklistPending(),
        };
        g.limits = [...g.limits.filter((l) => l.id !== limit.id), limit];
        app.limit_id = limit.id;
      }),
    salesConfirmOffer: () =>
      act((g) => {
        const app = currentApp(g);
        const limit = currentLimit(g);
        if (!limit || limit.status !== 'pending' || (app.odoo_stage !== 'Approved' && app.odoo_stage !== 'Offer confirmation')) throw new DomainError('not_allowed');
        app.odoo_stage = 'Signing SPA & PN';
        touch(app);
        limit.status = 'ready';
        limit.checklist = checklistPending();
      }),
    externalSign: (itemKey) =>
      act((g) => {
        const app = currentApp(g);
        const limit = currentLimit(g);
        const item = limit?.checklist.items.find((i) => i.key === itemKey);
        if (!limit || limit.status !== 'ready' || !item) throw new DomainError('not_allowed');
        item.status = 'done';
        if (d.isChecklistCompleted(limit.checklist.items)) {
          app.odoo_stage = 'Client Approved';
          touch(app);
          limit.status = 'active';
          limit.activated_at = iso(clockNow());
        }
      }),
    createDeal: (amount, supplierId) =>
      act((g, state) => {
        const app = currentApp(g);
        const limit = currentLimit(g);
        if (!limit || limit.status !== 'active' || amount.amount_minor <= 0) throw new DomainError('not_allowed');
        // available никогда не уходит ниже 0 (01-statuses.md §10).
        if (amount.amount_minor > limit.available.amount_minor) throw new DomainError('limit_exceeded');
        const id = nextId(state, 'deal');
        g.deals.push({ id, application_id: app.id, supplier_id: supplierId, amount, stage: 'approved', outstanding: amount });
        return id;
      }),
    payDeal: (dealId) =>
      act((g) => {
        const deal = g.deals.find((x) => x.id === dealId);
        const app = currentApp(g);
        if (!deal || deal.application_id !== app.id || deal.stage !== 'approved') throw new DomainError('not_allowed');
        deal.stage = 'payment_done';
        deal.paid_at = iso(clockNow());
        if (app.odoo_stage === 'Client Approved') app.odoo_stage = 'Payment done';
        touch(app);
      }),
    uwReject: () =>
      act((g, state) => {
        const app = currentApp(g);
        if (d.deriveClientStatus(app.odoo_stage) === 'closed') throw new DomainError('not_allowed');
        app.odoo_stage = 'Rejected by UW';
        touch(app);
        const limit = currentLimit(g);
        if (limit) {
          limit.status = 'rejected';
        } else {
          const zero = { amount_minor: 0, currency: 'SAR' as const };
          const id = nextId(state, 'lim');
          g.limits.push({ id, application_id: app.id, status: 'rejected', approved: zero, used: zero, available: zero, checklist: checklistPending() });
          app.limit_id = id;
        }
      }),
    salesLose: () =>
      act((g) => {
        const app = currentApp(g);
        if (d.deriveClientStatus(app.odoo_stage) === 'closed') throw new DomainError('not_allowed');
        app.odoo_stage = 'Lost';
        touch(app);
        const limit = currentLimit(g);
        if (limit) limit.status = 'cancelled';
      }),
    createApplication: () => {
      act((g, state) => createApplicationIn(state, g));
    },
    expireSession: () => {
      const a = loadActive();
      if (a.session) saveActive({ ...a, session: { ...a.session, expired: true } });
    },
    setNetwork: (mode) => {
      network = mode;
    },
    uwApproveSupplierSet: () =>
      act((g) => {
        const set = reviewed(g, supplierSet(g));
        if (set.documents.some((x) => x.required && !isDone(x))) throw new DomainError('not_allowed');
        for (const doc of set.documents) if (doc.status === 'received') doc.status = 'approved';
        set.status = 'completed';
        set.locked = true;
      }),
    uwRejectSupplierDocument: (portalKey, reasonTag) =>
      act((g) => {
        const set = supplierSet(g);
        const doc = set.documents.find((x) => x.portal_key === portalKey);
        if (!doc) throw new NotFound('document');
        uwDecide(g, set, doc, reasonTag ? { type: 'uw_reject', reason_key: reasonTag } : { type: 'uw_reject' });
        // SP-03 A1: комплект снова открыт; approved остаются только для чтения.
        set.status = 'draft';
        set.locked = false;
      }),
    odooRequireDocument: (portalKey) =>
      act((g, state) => {
        const supplier = g.supplier;
        if (!supplier) throw new NotFound('supplier');
        const set = supplierSet(g);
        const t = iso(clockNow());
        if (set.status === 'completed') {
          // SP-03 A2: новый draft только с добавленным документом; прежний — в истории.
          const setId = nextId(state, 'set');
          g.document_sets.push({ id: setId, owner: set.owner, round: set.round + 1, status: 'draft', locked: false, documents: [pendingDocument(setId, portalKey, t, [])] });
          supplier.current_document_set_id = setId;
          return;
        }
        const existing = set.documents.find((x) => x.portal_key === portalKey);
        if (existing) existing.required = true;
        else set.documents.push(pendingDocument(set.id, portalKey, t, []));
        set.status = 'draft';
        set.locked = false;
        updateGrace(set);
      }),
    cancelLimit: () =>
      act((g) => {
        const limit = currentLimit(g);
        if (!limit || limit.status === 'rejected') throw new DomainError('not_allowed');
        // Лимит → cancelled без закрытия заявки (SC-06 A7, SC-07 A4).
        limit.status = 'cancelled';
      }),
    setPersona: (personaId) => {
      if (!isPersonaId(personaId)) throw new NotFound('persona');
      // Персона всегда начинается с фикстуры: демо воспроизводимо.
      savePersona(fixtureState(personaId));
      challenges.clear();
      otpRequests.clear();
      startSession(personaId, PERSONAS[personaId](clockNow()).phone);
    },
  };

  return { ...ports, demo };
}
