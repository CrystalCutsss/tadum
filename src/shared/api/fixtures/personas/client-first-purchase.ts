// client_first_purchase — client_owner; first_purchase, одна сделка payment_done (SC-07).
import { CLIENT_BASE_KEYS, ago, checklist, documentSet, phone, sar, uploaded } from '../build';
import type { PersonaFixture } from '../types';

const SET = 'set_cfp_1';

export const clientFirstPurchase: PersonaFixture = (now) => {
  const t = ago(now, { days: 30 });
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
        created_at: ago(now, { days: 35 }),
        updated_at: ago(now, { days: 4 }),
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
        checklist: checklist('done', 'done', 'done'),
        activated_at: ago(now, { days: 15 }),
      },
    ],
    deals: [
      {
        id: 'deal_cfp_1',
        application_id: 'app_cfp',
        supplier_id: 'sup_ext_01',
        amount: sar(30_000),
        stage: 'payment_done',
        outstanding: sar(30_000),
        paid_at: ago(now, { days: 4 }),
      },
    ],
    supplier: null,
    referrals: [],
  };
};
