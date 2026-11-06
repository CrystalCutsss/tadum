// client_rejected — client_owner; docs_required, отклонённые документы: причина AR+EN, причина только AR,
// без причины; файл выписки уже отклонялся раньше (TADUM-536) (SC-03).
import { ago, documentSet, phone, uploaded } from '../build';
import type { PersonaFixture } from '../types';

const SET = 'set_cr_1';

export const clientRejected: PersonaFixture = (now) => {
  const t = ago(now, { days: 1 });
  const r = ago(now, { hours: 3 });
  return {
    persona_id: 'client_rejected',
    phone: phone(3),
    user: { name: 'Abdullah Al-Shehri', name_ar: 'عبدالله الشهري' },
    company: { id: 'cmp_cr', name: 'Qimam Building Materials', name_ar: 'قمم لمواد البناء', cr_number: '1010000003' },
    applications: [
      {
        id: 'app_cr',
        company_id: 'cmp_cr',
        odoo_stage: 'Document collection',
        client_status: 'docs_required',
        permission_state: 'collecting',
        next_step: { owner: 'user', text_key: 'next_step.reupload_rejected', cta: { label_key: 'next_step.cta.documents', route: '/c/documents' }, meta: { count: 3 } },
        current_document_set_id: SET,
        created_at: ago(now, { days: 2 }),
        updated_at: r,
        source: { channel: 'manual' },
      },
    ],
    leads: [{ application_id: 'app_cr', phone: phone(103), lead_main_owner_phone: phone(3) }],
    document_sets: [
      documentSet({
        id: SET,
        owner: { kind: 'application', id: 'app_cr' },
        round: 1,
        status: 'draft',
        documents: [
          uploaded(SET, 'bs', 'rejected', r, {
            reject_reason_key: 'reject.bs.period',
            reject_reason_text: { ar: 'نحتاج كشف حساب يغطي آخر 6 أشهر', en: 'We need a statement covering the last 6 months' },
            rejected_file_hashes: ['sha_set_cr_1_bs_0', 'sha_set_cr_1_bs_1'],
          }),
          uploaded(SET, 'national_id', 'received', t),
          uploaded(SET, 'vat', 'received', t),
          uploaded(SET, 'vat_sales', 'rejected', r, {
            reject_reason_text: { ar: 'الإقرار غير موقّع' },
            rejected_file_hashes: ['sha_set_cr_1_vat_sales_1'],
          }),
          uploaded(SET, 'ch_owner', 'rejected', r, { rejected_file_hashes: ['sha_set_cr_1_ch_owner_1'] }),
          uploaded(SET, 'ch_company', 'received', t),
          uploaded(SET, 'aoa', 'received', t),
        ],
      }),
    ],
    limits: [],
    deals: [],
    supplier: null,
    referrals: [],
  };
};
