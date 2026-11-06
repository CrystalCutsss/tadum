// dual_active — client_owner + supplier: клиент approved, лимит active + поставщик active (переключение ролей, SC-10).
// Комплекты клиента и поставщика независимы (SP-03 A9).
import { CLIENT_BASE_KEYS, ZERO, ago, checklist, documentSet, phone, sar, uploaded } from '../build';
import type { PersonaFixture } from '../types';

const CSET = 'set_da_c1';
const SSET = 'set_da_s1';
const SUP = 'sup_da';

export const dualActive: PersonaFixture = (now) => {
  const t = ago(now, { days: 40 });
  return {
    persona_id: 'dual_active',
    phone: phone(13),
    user: { name: 'Nasser Al-Rashid', name_ar: 'ناصر الراشد' },
    company: { id: 'cmp_da', name: 'Jood Home Appliances', name_ar: 'جود للأجهزة المنزلية', cr_number: '1010000013' },
    applications: [
      {
        id: 'app_da',
        company_id: 'cmp_da',
        odoo_stage: 'Client Approved',
        client_status: 'approved',
        permission_state: 'active',
        next_step: { owner: 'user', text_key: 'next_step.how_to_buy', cta: { label_key: 'next_step.cta.how_to_buy', route: '/c/home#how-to-buy' } },
        current_document_set_id: CSET,
        limit_id: 'lim_da',
        created_at: ago(now, { days: 45 }),
        updated_at: ago(now, { days: 12 }),
        source: { channel: 'direct' },
      },
    ],
    leads: [{ application_id: 'app_da', phone: phone(113), lead_main_owner_phone: phone(13) }],
    document_sets: [
      documentSet({
        id: CSET,
        owner: { kind: 'application', id: 'app_da' },
        round: 1,
        status: 'completed',
        submitted_at: t,
        documents: CLIENT_BASE_KEYS.map((key) => uploaded(CSET, key, 'approved', t)),
      }),
      documentSet({
        id: SSET,
        owner: { kind: 'supplier', id: SUP },
        round: 1,
        status: 'completed',
        submitted_at: t,
        documents: [
          uploaded(SSET, 'sup_vat', 'approved', t),
          uploaded(SSET, 'sup_iban_letter', 'approved', t),
          uploaded(SSET, 'sup_national_address', 'approved', t),
        ],
      }),
    ],
    limits: [
      {
        id: 'lim_da',
        application_id: 'app_da',
        status: 'active',
        approved: sar(80_000),
        used: ZERO,
        available: sar(80_000),
        checklist: checklist('done', 'done', 'done'),
        activated_at: ago(now, { days: 12 }),
      },
    ],
    deals: [{ id: 'deal_da_1', application_id: 'ref_da_02', supplier_id: SUP, amount: sar(15_000), stage: 'payment_done', outstanding: sar(15_000), paid_at: ago(now, { days: 6 }) }],
    supplier: {
      id: SUP,
      name: 'Jood Home Appliances',
      slug: 'jood-home',
      referral_url: 'https://tadum.sa/s/jood-home',
      supplier_status: 'active',
      next_step: { owner: 'user', text_key: 'next_step.supplier.share_link', cta: { label_key: 'next_step.cta.share_link', route: '/s/referral' } },
      current_document_set_id: SSET,
      counters: { referred_total: 3, under_review: 1, approved: 1 },
      phones: [phone(13)],
    },
    referrals: [
      { application_id: 'ref_da_01', company_name: 'مؤسسة الواحة', applied_at: ago(now, { days: 3 }), updated_at: ago(now, { days: 1 }), odoo_stage: 'Risk committee', attribution: 'referral_link' },
      { application_id: 'ref_da_02', company_name: 'Lulu Al Khaleej Trading', applied_at: ago(now, { days: 15 }), updated_at: ago(now, { days: 6 }), odoo_stage: 'Payment done', attribution: 'referral_link' },
      { application_id: 'ref_da_03', company_name: 'شركة البيان', applied_at: ago(now, { days: 2 }), updated_at: ago(now, { days: 2 }), odoo_stage: 'Document collection', attribution: 'manual' },
    ],
  };
};
