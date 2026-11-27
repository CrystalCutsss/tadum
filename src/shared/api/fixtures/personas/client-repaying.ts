// client_repaying — client_owner; клиент платит по графику (D-104, 01-entities.md §6): first_purchase, лимит 200 000.
// Две сделки у разных поставщиков: 60 000 оплачена поставщику 95 дней назад — два взноса оплачены, у третьего срок
// прошёл 5 дней назад; 30 000 оплачена 10 дней назад — три взноса впереди. Использовано = 20 000 + 30 000 = 50 000.
import { CLIENT_BASE_KEYS, ago, checklist, documentSet, installmentsFor, phone, sar, uploaded } from '../build';
import type { PersonaFixture } from '../types';

const SET = 'set_crp_1';

export const clientRepaying: PersonaFixture = (now) => {
  const t = ago(now, { days: 130 });
  const first = {
    id: 'deal_crp_1',
    application_id: 'app_crp',
    supplier_id: 'sup_ext_01',
    amount: sar(60_000),
    stage: 'payment_done' as const,
    outstanding: sar(20_000),
    paid_at: ago(now, { days: 95 }),
  };
  const second = {
    id: 'deal_crp_2',
    application_id: 'app_crp',
    supplier_id: 'sup_ext_02',
    amount: sar(30_000),
    stage: 'payment_done' as const,
    outstanding: sar(30_000),
    paid_at: ago(now, { days: 10 }),
  };
  return {
    persona_id: 'client_repaying',
    phone: phone(23),
    company: { id: 'cmp_crp', name: 'Nakheel Home Supplies', name_ar: 'نخيل للمستلزمات المنزلية', cr_number: '1010000023' },
    applications: [
      {
        id: 'app_crp',
        company_id: 'cmp_crp',
        odoo_stage: 'Payment done',
        client_status: 'first_purchase',
        permission_state: 'active',
        next_step: { owner: 'none', text_key: 'next_step.first_purchase_done' },
        current_document_set_id: SET,
        limit_id: 'lim_crp',
        created_at: ago(now, { days: 140 }),
        updated_at: ago(now, { days: 10 }),
        source: { channel: 'direct' },
      },
    ],
    leads: [{ application_id: 'app_crp', phone: phone(123), lead_main_owner_phone: phone(23) }],
    document_sets: [
      documentSet({
        id: SET,
        owner: { kind: 'application', id: 'app_crp' },
        round: 1,
        status: 'completed',
        submitted_at: t,
        documents: CLIENT_BASE_KEYS.map((key) => uploaded(SET, key, 'approved', t)),
      }),
    ],
    limits: [
      {
        id: 'lim_crp',
        application_id: 'app_crp',
        status: 'active',
        approved: sar(200_000),
        used: sar(50_000),
        available: sar(150_000),
        checklist: checklist('done', 'done'),
        activated_at: ago(now, { days: 110 }),
      },
    ],
    deals: [first, second],
    installments: [
      ...installmentsFor(first, 'Al Noor Trading', now, { count: 3, paid: 2 }),
      ...installmentsFor(second, 'Riyadh Packaging Co.', now, { count: 3 }),
    ],
    supplier: null,
    referrals: [],
  };
};
