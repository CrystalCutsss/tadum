// client_first_purchase — client_owner; first_purchase, одна сделка payment_done (SC-07).
// График платежей (D-102): сделка 40 000 оплачена поставщику 65 дней назад, 4 взноса по 10 000 — первый оплачен,
// второй просрочен (срок 5 дней назад), два впереди; остаток 30 000 = использовано лимита.
import { CLIENT_BASE_KEYS, ago, checklist, documentSet, installmentsFor, phone, sar, uploaded } from '../build';
import type { PersonaFixture } from '../types';

const SET = 'set_cfp_1';

export const clientFirstPurchase: PersonaFixture = (now) => {
  const t = ago(now, { days: 95 });
  const deal = {
    id: 'deal_cfp_1',
    application_id: 'app_cfp',
    supplier_id: 'sup_ext_01',
    amount: sar(40_000),
    stage: 'payment_done' as const,
    outstanding: sar(30_000),
    paid_at: ago(now, { days: 65 }),
  };
  return {
    persona_id: 'client_first_purchase',
    phone: phone(8),
    company: { id: 'cmp_cfp', name: 'Marjan Cosmetics', name_ar: 'مرجان لمستحضرات التجميل', cr_number: '1010000008' },
    applications: [
      {
        id: 'app_cfp',
        company_id: 'cmp_cfp',
        odoo_stage: 'Payment done',
        client_status: 'first_purchase',
        permission_state: 'active',
        next_step: { owner: 'none', text_key: 'next_step.first_purchase_done' },
        current_document_set_id: SET,
        limit_id: 'lim_cfp',
        created_at: ago(now, { days: 100 }),
        updated_at: ago(now, { days: 65 }),
        source: { supplier_id: 'sup_ext_01', channel: 'referral_link' },
      },
    ],
    leads: [{ application_id: 'app_cfp', phone: phone(108), lead_main_owner_phone: phone(8) }],
    document_sets: [
      documentSet({
        id: SET,
        owner: { kind: 'application', id: 'app_cfp' },
        round: 1,
        status: 'completed',
        submitted_at: t,
        documents: CLIENT_BASE_KEYS.map((key) => uploaded(SET, key, 'approved', t)),
      }),
    ],
    limits: [
      {
        id: 'lim_cfp',
        application_id: 'app_cfp',
        status: 'active',
        approved: sar(100_000),
        used: sar(30_000),
        available: sar(70_000),
        checklist: checklist('done', 'done'),
        activated_at: ago(now, { days: 80 }),
      },
    ],
    deals: [deal],
    installments: installmentsFor(deal, 'Al Noor Trading', now, { count: 4, paid: 1 }),
    supplier: null,
    referrals: [],
  };
};
