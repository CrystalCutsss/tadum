// MockAdapter: OTP (D-021), сессия, сеть, документы, каждое демо-действие 01-statuses.md §10 + SP-03 §7
// и инварианты мока из §10 (правки после submitted, available ≥ 0, состав нового комплекта, turnover).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { storage } from '@/shared/lib';
import { TEST_NOW, testApi } from '@/test-utils/mock-api';
import { readProductDoc, section, tableWithHeader } from '@/test-utils/markdown';

import { PERSONAS } from '../../fixtures/personas';
import type { PersonaId } from '../../fixtures/types';
import { withValidation } from '../../validation';
import { DomainError, Forbidden, NetworkError, ServerError, Unauthorized } from '../../ports/errors';
import type { Api, UploadFile } from '../../ports/ports';
import type { DocumentSet } from '../../ports/schemas';
import { MOCK_SCHEMA_VERSION } from './mock-api';

const sar = (n: number) => ({ amount_minor: n * 100, currency: 'SAR' as const });
const t0 = () => Date.parse(TEST_NOW);
const advance = (ms: number) => vi.setSystemTime(Date.now() + ms);

const pdf = (name = 'file.pdf', content = name): UploadFile => new File([content], name, { type: 'application/pdf' });

async function code<T>(p: Promise<T>): Promise<string> {
  try {
    await p;
  } catch (e) {
    return e instanceof DomainError ? e.code : (e as { kind?: string }).kind ?? String(e);
  }
  return 'ok';
}

function as(persona: PersonaId): Api {
  const api = testApi();
  api.demo!.setPersona(persona);
  return api;
}

async function clientSet(api: Api): Promise<DocumentSet> {
  const app = await api.application.getCurrent();
  return api.documents.getSet({ kind: 'application', id: app.id });
}

/** Загрузить файлы во все pending-документы комплекта. */
async function fillAll(api: Api, set: DocumentSet) {
  for (const d of set.documents) if (d.status === 'pending') await api.documents.upload(d.id, pdf(`${d.portal_key}.pdf`));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(TEST_NOW);
});
afterEach(() => vi.useRealTimers());

describe('демо-действия — ровно список 01-statuses.md §10 + SP-03 §7 + cancelLimit + setPersona', () => {
  it('набор совпадает', () => {
    const table = tableWithHeader(section(readProductDoc('01-statuses.md'), '10.'), 'Действие мока').rows.map((r) => r[0]!);
    const fromTable = table.flatMap((cell) => [...cell.matchAll(/`?([a-zA-Z]+)\(/g)].map((m) => m[1]!));
    const sp03 = [...section(readProductDoc('scenarios/SP-03-supplier-documents.md'), '7.').matchAll(/`(uw\w+|odoo\w+)\(/g)].map((m) => m[1]!);
    const expected = [...new Set([...fromTable, ...sp03, 'cancelLimit', 'setPersona'])].sort();
    expect(Object.keys(testApi().demo!).sort()).toEqual(expected);
  });
});

describe('OTP (D-021, D-027, SC-01)', () => {
  const phone = PERSONAS.client_new(0).phone;

  it('4 цифры, 5 минут, 5 попыток, повтор через 40 с; канал детерминирован от персоны', async () => {
    const api = testApi();
    const c = await api.auth.requestOtp(phone);
    expect(c).toMatchObject({ length: 4, attempts_left: 5 });
    expect(Date.parse(c.expires_at) - t0()).toBe(5 * 60_000);
    expect(Date.parse(c.resend_available_at) - t0()).toBe(40_000);
    expect((await testApi().auth.requestOtp(phone)).channel).toBe(c.channel);
    const channels = new Set(await Promise.all(Object.values(PERSONAS).map(async (p) => (await testApi().auth.requestOtp(p(0).phone)).channel)));
    expect([...channels].sort()).toEqual(['sms', 'whatsapp']);
  });
  it('повтор раньше 40 с — otp_resend_too_early; после — новый код', async () => {
    const api = testApi();
    await api.auth.requestOtp(phone);
    advance(39_000);
    expect(await code(api.auth.requestOtp(phone))).toBe('otp_resend_too_early');
    advance(1_000);
    expect(await code(api.auth.requestOtp(phone))).toBe('ok');
  });
  it('SC-01 A2: больше 3 запросов за 10 минут — otp_rate_limited', async () => {
    const api = testApi();
    for (let i = 0; i < 3; i++) {
      expect(await code(api.auth.requestOtp(phone))).toBe('ok');
      advance(40_000);
    }
    expect(await code(api.auth.requestOtp(phone))).toBe('otp_rate_limited');
    advance(10 * 60_000);
    expect(await code(api.auth.requestOtp(phone))).toBe('ok');
  });
  it('принимается только 0000; после 5 ошибок — блок до нового кода', async () => {
    const api = testApi();
    await api.auth.requestOtp(phone);
    for (let left = 4; left >= 1; left--) {
      await expect(api.auth.verifyOtp(phone, '1234')).rejects.toMatchObject({ code: 'otp_invalid', details: { attempts_left: left } });
    }
    expect(await code(api.auth.verifyOtp(phone, '1234'))).toBe('otp_too_many_attempts');
    expect(await code(api.auth.verifyOtp(phone, '0000'))).toBe('otp_too_many_attempts');
    advance(40_000);
    await api.auth.requestOtp(phone);
    expect((await api.auth.verifyOtp(phone, '0000')).roles).toEqual(['client_contact']);
  });
  it('код живёт 5 минут', async () => {
    const api = testApi();
    await api.auth.requestOtp(phone);
    advance(5 * 60_000);
    expect(await code(api.auth.verifyOtp(phone, '0000'))).toBe('otp_expired');
  });
  it('номер без заявки и неизвестный номер — phone_unknown, сессии нет', async () => {
    for (const p of [PERSONAS.unknown_phone(0).phone, '+966500009999']) {
      const api = testApi();
      await api.auth.requestOtp(p);
      expect(await code(api.auth.verifyOtp(p, '0000'))).toBe('phone_unknown');
      expect(await api.auth.getSession()).toBeNull();
    }
  });
  it('второй номер заявки (контакт у client_owner-персоны) входит как client_contact', async () => {
    const contact = PERSONAS.client_rejected(0).leads[0]!.phone;
    const api = testApi();
    await api.auth.requestOtp(contact);
    expect((await api.auth.verifyOtp(contact, '0000')).roles).toEqual(['client_contact']);
  });
});

describe('сессия и сеть', () => {
  it('сессия 30 дней; после — 401 и экран «Сессия истекла»', async () => {
    const api = as('client_new');
    const s = await api.auth.getSession();
    expect(Date.parse(s!.expires_at) - Date.parse(s!.issued_at)).toBe(30 * 24 * 60 * 60_000);
    advance(30 * 24 * 60 * 60_000);
    expect(await code(api.application.getCurrent())).toBe('unauthorized');
    expect(await api.auth.getSession()).toBeNull();
  });
  it('expireSession(): следующий вызов порта → 401', async () => {
    const api = as('client_active');
    api.demo!.expireSession();
    await expect(api.limit.get()).rejects.toBeInstanceOf(Unauthorized);
    expect(await api.auth.getSession()).toBeNull();
  });
  it('logout завершает сессию', async () => {
    const api = as('client_active');
    await api.auth.logout();
    expect(await api.auth.getSession()).toBeNull();
    expect(await code(api.application.getCurrent())).toBe('unauthorized');
  });
  it('setNetwork: offline → NetworkError, error → ServerError, ok — снова работает', async () => {
    const api = as('client_new');
    api.demo!.setNetwork('offline');
    await expect(api.application.getCurrent()).rejects.toBeInstanceOf(NetworkError);
    api.demo!.setNetwork('error');
    await expect(api.application.getCurrent()).rejects.toBeInstanceOf(ServerError);
    api.demo!.setNetwork('slow');
    expect(await code(api.application.getCurrent())).toBe('ok');
    api.demo!.setNetwork('ok');
    expect(await code(api.application.getCurrent())).toBe('ok');
  });
  it('порты чужой семьи ролей — Forbidden', async () => {
    await expect(as('supplier_new').application.getCurrent()).rejects.toBeInstanceOf(Forbidden);
    await expect(as('client_new').supplier.get()).rejects.toBeInstanceOf(Forbidden);
  });
  it('getCompany — компания текущей заявки; поставщику — Forbidden', async () => {
    expect((await as('client_active').application.getCompany()).name).toBe('Ufuq Office Furniture');
    await expect(as('supplier_new').application.getCompany()).rejects.toBeInstanceOf(Forbidden);
  });
  it('dual: комплекты клиента и поставщика раздельные (SP-03 §7)', async () => {
    const api = as('dual_active');
    const supplier = await api.supplier.get();
    const own = await api.documents.getSet({ kind: 'supplier', id: supplier.id });
    expect(own.documents.every((d) => d.portal_key.startsWith('sup_'))).toBe(true);
    expect((await clientSet(api)).documents.some((d) => d.portal_key.startsWith('sup_'))).toBe(false);
  });
});

describe('хранилище (D-072)', () => {
  it('состояние переживает новый экземпляр адаптера', async () => {
    const api = as('client_new');
    const set = await clientSet(api);
    await api.documents.upload(set.documents[0]!.id, pdf());
    expect((await clientSet(testApi())).documents[0]!.status).toBe('received');
  });
  it('schemaVersion не совпал — сброс к фикстуре', async () => {
    const api = as('client_new');
    const set = await clientSet(api);
    await api.documents.upload(set.documents[0]!.id, pdf());
    const stored = JSON.parse(storage.get('mock:client_new')!) as { schemaVersion: number };
    storage.set('mock:client_new', JSON.stringify({ ...stored, schemaVersion: MOCK_SCHEMA_VERSION + 1 }));
    expect((await clientSet(testApi())).documents[0]!.status).toBe('pending');
  });
  it('повреждённое состояние — сброс к фикстуре', async () => {
    as('client_new');
    storage.set('mock:client_new', '{not json');
    expect((await clientSet(testApi())).documents.every((d) => d.status === 'pending')).toBe(true);
  });
});

describe('документы (01-statuses.md §4–5, SC-02, SC-03)', () => {
  it('загрузка: pending → received; несколько файлов на документ (D-028)', async () => {
    const api = as('client_new');
    const doc = (await clientSet(api)).documents[0]!;
    const progress: string[] = [];
    const r = await api.documents.upload(doc.id, pdf('a.pdf'), { onProgress: (p) => progress.push(p.state) });
    expect(r.document.status).toBe('received');
    expect(progress).toEqual(['queued', 'uploading', 'validating', 'done']);
    const r2 = await api.documents.upload(doc.id, pdf('b.pdf'));
    expect(r2.document.files.map((f) => f.name)).toEqual(['a.pdf', 'b.pdf']);
  });
  it('предвалидация failed — файл не принят, документ остаётся pending (SC-02 A3); warning — received (A4)', async () => {
    const api = as('client_new');
    const bs = (await clientSet(api)).documents.find((d) => d.portal_key === 'bs')!;
    const failed = await api.documents.upload(bs.id, pdf('statement-fail.pdf'));
    expect(failed.prevalidation).toEqual({ state: 'failed', rule_keys: ['prevalidation.bs.period_too_short'] });
    expect(failed.document).toMatchObject({ status: 'pending', files: [] });
    const warned = await api.documents.upload(bs.id, pdf('statement-warn.pdf'));
    expect(warned.prevalidation.state).toBe('warning');
    expect(warned.document.status).toBe('received');
  });
  it('размер > 10 МБ и неподдерживаемый тип (SC-02 A1, A2)', async () => {
    const api = as('client_new');
    const doc = (await clientSet(api)).documents[0]!;
    const big: UploadFile = { name: 'big.pdf', type: 'application/pdf', size: 10 * 1024 * 1024 + 1, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) };
    expect(await code(api.documents.upload(doc.id, big))).toBe('upload.error.too_large');
    expect(await code(api.documents.upload(doc.id, new File(['x'], 'a.docx', { type: 'application/msword' })))).toBe('upload.error.unsupported_type');
  });
  it('замена и удаление файла: последний файл удалён → pending (SC-02 A7, A8)', async () => {
    const api = as('client_partial');
    const vat = (await clientSet(api)).documents.find((d) => d.portal_key === 'vat')!;
    const replaced = await api.documents.replace(vat.id, vat.files[0]!.id, pdf('vat-new.pdf'));
    expect(replaced.document.files.map((f) => f.name)).toEqual(['vat-new.pdf']);
    const deleted = await api.documents.delete(vat.id, replaced.document.files[0]!.id);
    expect(deleted).toMatchObject({ status: 'pending', files: [] });
  });
  it('SC-03: тот же файл, что отклоняли, — document.same_file_rejected; новый файл → received, причина скрыта', async () => {
    const api = as('client_rejected');
    const bs = (await clientSet(api)).documents.find((d) => d.portal_key === 'bs')!;
    const sameContent = 'rejected-statement';
    // Отклонённый ранее файл: его хеш — в rejected_file_hashes.
    const fileHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sameContent));
    const hex = [...new Uint8Array(fileHash)].map((b) => b.toString(16).padStart(2, '0')).join('');
    const state = JSON.parse(storage.get('mock:client_rejected')!) as { graph: { document_sets: DocumentSet[] } };
    state.graph.document_sets[0]!.documents.find((d) => d.portal_key === 'bs')!.rejected_file_hashes.push(hex);
    storage.set('mock:client_rejected', JSON.stringify(state));
    expect(await code(api.documents.upload(bs.id, pdf('bs.pdf', sameContent)))).toBe('document.same_file_rejected');
    const ok = await api.documents.upload(bs.id, pdf('bs-6-months.pdf'));
    expect(ok.document.status).toBe('received');
    expect(ok.document.reject_reason_text).toBeUndefined();
    expect(ok.document.rejected_file_hashes).toContain(hex);
  });
  it('несколько файлов: второй файл добавляется, тот же — same_file_rejected, больше 10 — too_many (2026-11-10)', async () => {
    const api = as('client_partial');
    const vat = (await clientSet(api)).documents.find((d) => d.portal_key === 'vat')!;
    const two = await api.documents.upload(vat.id, pdf('vat-2.pdf'));
    expect(two.document.files).toHaveLength(2);
    expect(two.document.status).toBe('received');
    expect(await code(api.documents.upload(vat.id, pdf('again.pdf', 'vat-2.pdf')))).toBe('document.same_file_rejected');
    for (let i = 3; i <= 10; i++) await api.documents.upload(vat.id, pdf(`vat-${i}.pdf`));
    expect(await code(api.documents.upload(vat.id, pdf('vat-11.pdf')))).toBe('upload.error.too_many');
  });
  it('замечание к файлу: замена файла снимает его, документ → received; удаление файла с замечанием — тоже', async () => {
    const api = as('client_rejected');
    const docs = (await clientSet(api)).documents;
    const vatSales = docs.find((d) => d.portal_key === 'vat_sales')!;
    const bad = vatSales.files.find((f) => f.issue)!;
    const replaced = await api.documents.replace(vatSales.id, bad.id, pdf('vat-signed.pdf'));
    expect(replaced.document.status).toBe('received');
    expect(replaced.document.files.some((f) => f.issue)).toBe(false);
    const id = docs.find((d) => d.portal_key === 'national_id')!;
    const extra = await api.documents.upload(id.id, pdf('id-back.pdf'));
    expect(extra.document.status).toBe('rejected');
    const cleaned = await api.documents.delete(id.id, id.files[0]!.id);
    expect(cleaned).toMatchObject({ status: 'received' });
  });
  it('CR: 10 цифр сохраняются, иначе company.cr_invalid; без CR комплект не отправить', async () => {
    const api = as('client_new');
    expect(await code(api.application.setCrNumber('123'))).toBe('company.cr_invalid');
    await fillAll(api, await clientSet(api));
    expect(await code(api.documents.submit((await clientSet(api)).id))).toBe('documents.submit_incomplete');
    expect((await api.application.setCrNumber('1010000001')).cr_number).toBe('1010000001');
    expect((await api.documents.submit((await clientSet(api)).id)).status).toBe('submitted');
  });
  it('отправка неполного комплекта — documents.submit_incomplete с числом оставшихся', async () => {
    const api = as('client_partial');
    const set = await clientSet(api);
    await expect(api.documents.submit(set.id)).rejects.toMatchObject({ code: 'documents.submit_incomplete', details: { remaining: 4 } });
  });
  it('§10 инвариант: после submitted любая попытка изменить файл → document_set_locked', async () => {
    const api = as('client_new');
    await fillAll(api, await clientSet(api));
    await api.application.setCrNumber('1010000001');
    const set = await api.documents.submit((await clientSet(api)).id);
    expect(set).toMatchObject({ status: 'submitted', locked: true });
    const doc = set.documents[0]!;
    expect(await code(api.documents.upload(doc.id, pdf('more.pdf')))).toBe('document_set_locked');
    expect(await code(api.documents.replace(doc.id, doc.files[0]!.id, pdf('x.pdf')))).toBe('document_set_locked');
    expect(await code(api.documents.delete(doc.id, doc.files[0]!.id))).toBe('document_set_locked');
    expect(await code(api.documents.submit(set.id))).toBe('document_set_locked');
  });
  it('закрытая заявка — файлы не меняются (01-statuses.md §9)', async () => {
    const api = as('client_closed_lost');
    const pending = (await clientSet(api)).documents.find((d) => d.status === 'pending')!;
    expect(await code(api.documents.upload(pending.id, pdf()))).toBe('document_set_locked');
  });
  it('автополнота: через 10 с после последней загрузки комплект отправляется сам (§4)', async () => {
    const api = as('client_new');
    await fillAll(api, await clientSet(api));
    advance(9_000);
    expect((await clientSet(api)).status).toBe('draft');
    advance(1_000);
    expect((await clientSet(api)).status).toBe('submitted');
  });
  it('download — прямая ссылка на файл', async () => {
    const api = as('client_partial');
    const f = (await clientSet(api)).documents.find((d) => d.files.length > 0)!.files[0]!;
    expect(await api.documents.download(f.id)).toEqual({ url: f.download_url });
  });
});

describe('демо-действия клиента — каждое (01-statuses.md §10)', () => {
  it('submitDocumentSet: draft → submitted, locked; через 2 с → in_review, Ready for UW, under_review', async () => {
    const api = as('client_new');
    await fillAll(api, await clientSet(api));
    api.demo!.submitDocumentSet();
    expect(await clientSet(api)).toMatchObject({ status: 'submitted', locked: true });
    expect((await api.application.getCurrent()).client_status).toBe('docs_required');
    advance(2_000);
    expect((await clientSet(api)).status).toBe('in_review');
    expect(await api.application.getCurrent()).toMatchObject({ odoo_stage: 'Ready for UW', client_status: 'under_review', permission_state: 'reviewing' });
  });
  it('uwApproveDocument: received → approved', async () => {
    const api = as('client_submitted');
    const doc = (await clientSet(api)).documents[0]!;
    api.demo!.uwApproveDocument(doc.id);
    expect((await clientSet(api)).documents[0]!.status).toBe('approved');
  });
  it('uwRejectDocument: received → rejected с тегом; заявка остаётся under_review', async () => {
    const api = as('client_submitted');
    const doc = (await clientSet(api)).documents[0]!;
    api.demo!.uwRejectDocument(doc.id, 'reject.bs.period');
    const after = (await clientSet(api)).documents[0]!;
    expect(after).toMatchObject({ status: 'rejected', reject_reason_key: 'reject.bs.period' });
    expect(after.rejected_file_hashes).toEqual(doc.files.map((f) => f.sha256));
    expect((await api.application.getCurrent()).client_status).toBe('under_review');
  });
  it('uwRequestMoreDocs: старый → superseded, новый draft round + 1 только с запрошенными ключами (инвариант §10)', async () => {
    const api = as('client_submitted');
    const old = await clientSet(api);
    api.demo!.uwRequestMoreDocs(['bs', 'vat']);
    const next = await clientSet(api);
    expect(next).toMatchObject({ status: 'draft', round: 2, locked: false });
    expect(next.id).not.toBe(old.id);
    expect(next.documents.map((d) => d.portal_key)).toEqual(['bs', 'vat']);
    expect(next.documents.every((d) => d.status === 'pending')).toBe(true);
    const app = await api.application.getCurrent();
    expect(app).toMatchObject({ odoo_stage: 'Need more docs for UW', client_status: 'docs_required' });
    expect(app.next_step).toMatchObject({ text_key: 'next_step.more_docs_requested', meta: { count: 2 } });
    // Старый комплект — только для чтения.
    expect(await code(api.documents.upload(old.documents[0]!.id, pdf()))).toBe('document_set_locked');
  });
  it('uwApproveApplication: Approved, лимит pending с approved = amount', async () => {
    const api = as('client_submitted');
    api.demo!.uwApproveApplication(sar(120_000));
    expect(await api.application.getCurrent()).toMatchObject({ odoo_stage: 'Approved', client_status: 'approved' });
    expect(await api.limit.get()).toMatchObject({ status: 'pending', approved: sar(120_000), used: sar(0), available: sar(120_000) });
    expect((await clientSet(api)).status).toBe('completed');
  });
  it('salesConfirmOffer: Signing SPA & PN, лимит ready, чек-лист pending', async () => {
    const api = as('client_submitted');
    api.demo!.uwApproveApplication(sar(120_000));
    api.demo!.salesConfirmOffer();
    expect((await api.application.getCurrent()).odoo_stage).toBe('Signing SPA & PN');
    expect((await api.limit.get()).status).toBe('ready');
    expect((await api.limit.getChecklist()).items.map((i) => i.status)).toEqual(['pending', 'pending', 'pending']);
  });
  it('externalSign: пункт → done; все три → Client Approved, лимит active', async () => {
    const api = as('client_approved_unsigned');
    api.demo!.externalSign('spa_sadq');
    api.demo!.externalSign('pn_company_nafith');
    expect((await api.limit.get()).status).toBe('ready');
    api.demo!.externalSign('pn_owner_nafith');
    expect(await api.limit.get()).toMatchObject({ status: 'active', checklist: { completed: true } });
    expect((await api.application.getCurrent()).odoo_stage).toBe('Client Approved');
  });
  it('createDeal / payDeal: used растёт, Payment done → first_purchase', async () => {
    const api = as('client_active');
    const id = api.demo!.createDeal(sar(7_500), 'sup_ext_01');
    expect(await api.limit.get()).toMatchObject({ used: sar(50_000), available: sar(100_000) });
    expect((await api.application.getCurrent()).client_status).toBe('approved');
    api.demo!.payDeal(id);
    expect(await api.application.getCurrent()).toMatchObject({ odoo_stage: 'Payment done', client_status: 'first_purchase' });
  });
  it('§10 инвариант: available никогда < 0 — сделка сверх доступного отклоняется', async () => {
    const api = as('client_active');
    expect(() => api.demo!.createDeal(sar(107_500 + 500), 'sup_ext_01')).toThrow(DomainError);
    api.demo!.createDeal(sar(107_500), 'sup_ext_01');
    expect((await api.limit.get()).available).toEqual(sar(0));
    expect(() => api.demo!.createDeal(sar(500), 'sup_ext_01')).toThrow(DomainError);
  });
  it('uwReject: Rejected by UW, closed, лимит rejected', async () => {
    const api = as('client_submitted');
    api.demo!.uwReject();
    expect(await api.application.getCurrent()).toMatchObject({ odoo_stage: 'Rejected by UW', client_status: 'closed', permission_state: 'closed' });
    expect((await api.limit.get()).status).toBe('rejected');
  });
  it('salesLose: Lost, closed, лимит cancelled', async () => {
    const api = as('client_approved_unsigned');
    api.demo!.salesLose();
    expect(await api.application.getCurrent()).toMatchObject({ odoo_stage: 'Lost', client_status: 'closed' });
    expect((await api.limit.get()).status).toBe('cancelled');
  });
  it('createApplication: только из closed; новая заявка docs_required, раунд 1, пустой комплект; роли находят её', async () => {
    const open = as('client_new');
    expect(() => open.demo!.createApplication()).toThrow(DomainError);
    expect(await code(open.application.createApplication())).toBe('application_not_closed');

    const api = as('client_closed_rejected');
    const old = await api.application.getCurrent();
    api.demo!.createApplication();
    const app = await api.application.getCurrent();
    expect(app.id).not.toBe(old.id);
    expect(app).toMatchObject({ client_status: 'docs_required', odoo_stage: 'Document collection' });
    const set = await clientSet(api);
    expect(set).toMatchObject({ round: 1, status: 'draft' });
    expect(set.documents.every((d) => d.status === 'pending' && d.files.length === 0)).toBe(true);
    expect((await api.auth.getSession())?.client_context?.application_id).toBe(app.id);
  });
  it('createApplication через порт (D-038)', async () => {
    const api = as('client_closed_lost');
    const app = await api.application.createApplication();
    expect(app.client_status).toBe('docs_required');
    expect((await api.application.getCurrent()).id).toBe(app.id);
  });
  it('cancelLimit: лимит cancelled, заявка не закрывается (SC-06 A7, SC-07 A4)', async () => {
    const api = as('client_active');
    api.demo!.cancelLimit();
    expect((await api.limit.get()).status).toBe('cancelled');
    expect((await api.application.getCurrent()).client_status).toBe('approved');
  });
  it('setPersona: сброс к фикстуре и вход по номеру персоны', async () => {
    const api = as('client_active');
    api.demo!.cancelLimit();
    api.demo!.setPersona('client_active');
    expect((await api.limit.get()).status).toBe('active');
    api.demo!.setPersona('unknown_phone');
    expect(await api.auth.getSession()).toBeNull();
    expect(() => api.demo!.setPersona('nobody')).toThrow();
  });
  it('полный путь SC-02 → SC-07 на одной персоне', async () => {
    const api = as('client_new');
    await fillAll(api, await clientSet(api));
    api.demo!.submitDocumentSet();
    api.demo!.uwApproveApplication(sar(50_000));
    api.demo!.salesConfirmOffer();
    for (const k of ['spa_sadq', 'pn_company_nafith', 'pn_owner_nafith'] as const) api.demo!.externalSign(k);
    api.demo!.payDeal(api.demo!.createDeal(sar(10_000), 'sup_ext_01'));
    expect((await api.application.getCurrent()).client_status).toBe('first_purchase');
    expect(await api.limit.get()).toMatchObject({ used: sar(10_000), available: sar(40_000) });
  });
});

describe('демо-действия поставщика — каждое (SP-03 §7)', () => {
  async function supplierSet(api: Api) {
    const s = await api.supplier.get();
    return api.documents.getSet({ kind: 'supplier', id: s.id });
  }

  it('uwApproveSupplierSet: отправленный комплект → completed, supplier_status active', async () => {
    const api = as('supplier_new');
    const set = await supplierSet(api);
    for (const d of set.documents.filter((x) => x.required)) await api.documents.upload(d.id, pdf(`${d.portal_key}.pdf`));
    // SP-03 A5: необязательный sup_cr не мешает отправке.
    await api.documents.submit(set.id);
    expect((await api.supplier.get()).supplier_status).toBe('under_review');
    api.demo!.uwApproveSupplierSet();
    expect((await supplierSet(api)).status).toBe('completed');
    expect(await api.supplier.get()).toMatchObject({ supplier_status: 'active', next_step: { text_key: 'next_step.supplier.share_link' } });
  });
  it('uwRejectSupplierDocument: документ rejected, комплект снова draft, docs_required (SP-03 A1)', async () => {
    const api = as('supplier_new');
    const set = await supplierSet(api);
    for (const d of set.documents.filter((x) => x.required)) await api.documents.upload(d.id, pdf(`${d.portal_key}.pdf`));
    await api.documents.submit(set.id);
    api.demo!.uwApproveDocument(set.documents[0]!.id);
    api.demo!.uwRejectSupplierDocument('sup_iban_letter', 'reject.iban.unreadable');
    const after = await supplierSet(api);
    expect(after).toMatchObject({ status: 'draft', locked: false });
    expect(after.documents.find((d) => d.portal_key === 'sup_iban_letter')).toMatchObject({ status: 'rejected', reject_reason_key: 'reject.iban.unreadable' });
    expect(await api.supplier.get()).toMatchObject({ supplier_status: 'docs_required', next_step: { text_key: 'next_step.supplier.reupload_rejected', meta: { count: 1 } } });
    // approved — только для чтения.
    const approved = after.documents[0]!;
    expect(await code(api.documents.upload(approved.id, pdf()))).toBe('not_allowed');
  });
  it('odooRequireDocument: у completed — новый draft только с добавленным документом (SP-03 A2)', async () => {
    const api = as('supplier_active');
    const old = await supplierSet(api);
    api.demo!.odooRequireDocument('sup_cr');
    const next = await supplierSet(api);
    expect(next).toMatchObject({ round: 2, status: 'draft' });
    expect(next.id).not.toBe(old.id);
    expect(next.documents.map((d) => [d.portal_key, d.status, d.required])).toEqual([['sup_cr', 'pending', true]]);
    expect((await api.supplier.get()).supplier_status).toBe('docs_required');
  });
  it('odooRequireDocument: у draft — необязательный документ становится обязательным', async () => {
    const api = as('supplier_new');
    api.demo!.odooRequireDocument('sup_cr');
    expect((await supplierSet(api)).documents.find((d) => d.portal_key === 'sup_cr')?.required).toBe(true);
  });
});

describe('приведённые клиенты (SP-04) и оборот (D-012)', () => {
  it('§10 инвариант: turnover — только payment_done и repaid своих сделок', async () => {
    const { items } = await as('supplier_active').referredClients.list();
    const turnover = Object.fromEntries(items.map((c) => [c.application_id, c.turnover.amount_minor / 100]));
    expect(turnover).toMatchObject({ ref_sa_10: 0, ref_sa_11: 57_500, ref_sa_12: 30_000, ref_sa_13: 0 });
  });
  it('по умолчанию applied_at desc; фильтр по статусам; сортировка по обновлению', async () => {
    const api = as('supplier_active');
    const all = await api.referredClients.list();
    expect(all.total).toBe(14);
    expect(all.next_cursor).toBeNull();
    const applied = all.items.map((c) => Date.parse(c.applied_at));
    expect(applied).toEqual([...applied].sort((a, b) => b - a));
    expect((await api.referredClients.list({ statuses: ['under_review'] })).total).toBe(3);
    expect((await api.referredClients.list({ statuses: ['approved', 'first_purchase'] })).total).toBe(6);
    const updated = (await api.referredClients.list({ sort: 'updated' })).items.map((c) => Date.parse(c.updated_at));
    expect(updated).toEqual([...updated].sort((a, b) => b - a));
  });
  it('порции по 20 и курсор', async () => {
    const page = await as('supplier_active').referredClients.list({ cursor: '10' });
    expect(page.items).toHaveLength(4);
    expect(page.next_cursor).toBeNull();
  });
  it('проекция — только поля ReferredClient', async () => {
    const { items } = await as('supplier_active').referredClients.list();
    expect(Object.keys(items[0]!).sort()).toEqual(['application_id', 'applied_at', 'attribution', 'company_name', 'supplier_view_status', 'turnover', 'updated_at']);
  });
  it('счётчики совпадают со списком', async () => {
    const api = as('supplier_active');
    expect(await api.supplier.getCounters()).toEqual({ referred_total: 14, under_review: 3, approved: 6 });
  });
});

describe('оффер и валидация ответов', () => {
  it('OfferPort.get — заготовка content/offer.*.json проходит схему', async () => {
    expect(await as('supplier_active').offer.get()).toEqual({ terms: { ar: '', en: '' }, materials: [] });
  });
  it('ответ, не прошедший Zod, — ServerError', async () => {
    const api = as('client_new');
    const broken = withValidation({ ...api, application: { ...api.application, getCurrent: () => Promise.resolve({ id: 1 } as never) } });
    await expect(broken.application.getCurrent()).rejects.toBeInstanceOf(ServerError);
  });
});
