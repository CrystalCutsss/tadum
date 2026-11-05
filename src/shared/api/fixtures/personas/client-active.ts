// client_active — client_owner; approved, лимит active 150 000 SAR, использовано 42 500 (SC-07).
// Использование — одобренная сделка с непогашенным остатком: стадия заявки остаётся Client Approved.
import { CLIENT_BASE_KEYS, ago, checklist, documentSet, phone, sar, uploaded } from '../build';
import type { PersonaFixture } from '../types';

const SET = 'set_ca_1';

export const clientActive: PersonaFixture = (now) => {
  const t = ago(now, { days: 20 });
  return {
    persona_id: 'client_active',
    phone: phone(7),
    company: { id: 'cmp_ca', name: 'Ufuq Office Furniture', name_ar: 'أفق للأثاث المكتبي', cr_number: '1010000007' },
    applications: [
      {
        id: 'app_ca',
        company_id: 'cmp_ca',
        odoo_stage: 'Client Approved',
        client_status: 'approved',
        permission_state: 'active',
        next_step: { owner: 'user', text_key: 'next_step.how_to_buy', cta: { label_key: 'next_step.cta.how_to_buy', route: '/c/home#how-to-buy' } },
        current_document_set_id: SET,
        limit_id: 'lim_ca',
        created_at: ago(now, { days: 25 }),
        updated_at: ago(now, { days: 2 }),
        source: { supplier_id: 'sup_ext_01', channel: 'referral_link' },
      },
    ],
    leads: [{ application_id: 'app_ca', phone: phone(107), lead_main_owner_phone: phone(7) }],
    document_sets: [
      documentSet({
        id: SET,
        owner: { kind: 'application', id: 'app_ca' },
        round: 1,
        status: 'completed',
        submitted_at: t,
        documents: CLIENT_BASE_KEYS.map((key) => uploaded(SET, key, 'approved', t)),
      }),
    ],
    limits: [
      {
        id: 'lim_ca',
        application_id: 'app_ca',
        status: 'active',
        approved: sar(150_000),
        used: sar(42_500),
        available: sar(107_500),
        checklist: checklist('done', 'done', 'done'),
        activated_at: ago(now, { days: 10 }),
      },
    ],
    deals: [{ id: 'deal_ca_1', application_id: 'app_ca', supplier_id: 'sup_ext_01', amount: sar(42_500), stage: 'approved', outstanding: sar(42_500) }],
    supplier: null,
    referrals: [],
  };
};
