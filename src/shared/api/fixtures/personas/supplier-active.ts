// supplier_active — supplier; active, 14 приведённых клиентов во всех статусах, обороты (SP-02, SP-04, SP-05).
// Счётчики {14, 3, 6} — как в SP-01; оборот — только сделки payment_done и repaid (D-012).
import type { OdooStage } from '../../ports/schemas';
import { ago, documentSet, phone, sar, uploaded } from '../build';
import type { PersonaFixture, Referral } from '../types';

const SET = 'set_sa_1';
const SUP = 'sup_sa';

const REFERRALS: ReadonlyArray<readonly [string, OdooStage, number, Referral['attribution']]> = [
  ['Al Noor Bakery', 'New lead', 1, 'referral_link'],
  ['مؤسسة السدرة للتجارة', 'Document collection', 2, 'referral_link'],
  ['Tilal Printing House', 'Need more docs for UW', 4, 'manual'],
  ['شركة الريم للتموين', 'Ready for UW', 5, 'referral_link'],
  ['Sawaed Cleaning Services', 'Company risk assessment', 6, 'referral_link'],
  ['مطاعم الديرة', 'Risk committee', 8, 'manual'],
  ['Hadaba Pharmacy', 'Approved', 10, 'referral_link'],
  ['مؤسسة نسيم البحر', 'Offer confirmation', 12, 'referral_link'],
  ['Thuraya Textiles', 'Signing SPA & PN', 14, 'referral_link'],
  ['شركة المروج الزراعية', 'Client Approved', 18, 'manual'],
  ['Anwar Electrical Trading', 'Payment done', 25, 'referral_link'],
  ['مكتبة الفجر', 'Payment done', 30, 'referral_link'],
  ['Sanabel Sweets', 'Rejected by UW', 40, 'referral_link'],
  ['مؤسسة الأفلاج', 'Lost', 45, 'manual'],
];

const ref = (i: number) => `ref_sa_${String(i + 1).padStart(2, '0')}`;

export const supplierActive: PersonaFixture = (now) => {
  const t = ago(now, { days: 60 });
  return {
    persona_id: 'supplier_active',
    phone: phone(12),
    company: null,
    applications: [],
    leads: [],
    document_sets: [
      documentSet({
        id: SET,
        owner: { kind: 'supplier', id: SUP },
        round: 1,
        status: 'completed',
        submitted_at: t,
        documents: [
          uploaded(SET, 'sup_vat', 'approved', t),
          uploaded(SET, 'sup_iban_letter', 'approved', t),
          uploaded(SET, 'sup_national_address', 'approved', t),
          uploaded(SET, 'sup_cr', 'approved', t, { required: false }),
        ],
      }),
    ],
    limits: [],
    deals: [
      // Одобрена, но не оплачена — в оборот не входит.
      { id: 'deal_sa_1', application_id: ref(9), supplier_id: SUP, amount: sar(20_000), stage: 'approved', outstanding: sar(20_000) },
      { id: 'deal_sa_2', application_id: ref(10), supplier_id: SUP, amount: sar(45_000), stage: 'payment_done', outstanding: sar(45_000), paid_at: ago(now, { days: 20 }) },
      { id: 'deal_sa_3', application_id: ref(10), supplier_id: SUP, amount: sar(12_500), stage: 'repaid', outstanding: sar(0), paid_at: ago(now, { days: 24 }) },
      // Сделка этого клиента с другим поставщиком — не наш оборот.
      { id: 'deal_sa_4', application_id: ref(10), supplier_id: 'sup_ext_02', amount: sar(8_000), stage: 'payment_done', outstanding: sar(8_000), paid_at: ago(now, { days: 21 }) },
      { id: 'deal_sa_5', application_id: ref(11), supplier_id: SUP, amount: sar(30_000), stage: 'payment_done', outstanding: sar(30_000), paid_at: ago(now, { days: 28 }) },
      { id: 'deal_sa_6', application_id: ref(12), supplier_id: SUP, amount: sar(10_000), stage: 'cancelled', outstanding: sar(0) },
    ],
    supplier: {
      id: SUP,
      name: 'Bayt Al Khayr Wholesale',
      slug: 'bayt-al-khayr',
      referral_url: 'https://tadum.sa/s/bayt-al-khayr',
      supplier_status: 'active',
      next_step: { owner: 'user', text_key: 'next_step.supplier.share_link', cta: { label_key: 'next_step.cta.share_link', route: '/s/referral' } },
      current_document_set_id: SET,
      counters: { referred_total: 14, under_review: 3, approved: 6 },
      phones: [phone(12)],
    },
    referrals: REFERRALS.map(([company_name, odoo_stage, days, attribution], i) => ({
      application_id: ref(i),
      company_name,
      applied_at: ago(now, { days }),
      updated_at: ago(now, { days: Math.floor(days / 2), hours: i }),
      odoo_stage,
      attribution,
    })),
  };
};
