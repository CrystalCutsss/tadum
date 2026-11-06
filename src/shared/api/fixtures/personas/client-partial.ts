// client_partial — client_contact; docs_required, часть документов received, часть pending,
// у выписки предупреждение предвалидации (SC-02 A4).
import { ago, ahead, document, documentSet, phone, uploaded } from '../build';
import type { PersonaFixture } from '../types';

const SET = 'set_cp_1';

export const clientPartial: PersonaFixture = (now) => {
  const t = ago(now, { hours: 1 });
  const pending = ago(now, { hours: 5 });
  return {
    persona_id: 'client_partial',
    phone: phone(2),
    user: { name: 'Noura Al-Qahtani', name_ar: 'نورة القحطاني' },
    company: { id: 'cmp_cp', name: 'Nakheel Valley Foods', name_ar: 'وادي النخيل للأغذية', cr_number: '1010000002' },
    applications: [
      {
        id: 'app_cp',
        company_id: 'cmp_cp',
        odoo_stage: 'Document collection',
        client_status: 'docs_required',
        permission_state: 'collecting',
        next_step: { owner: 'user', text_key: 'next_step.upload_documents', cta: { label_key: 'next_step.cta.documents', route: '/c/documents' }, meta: { count: 4 } },
        current_document_set_id: SET,
        created_at: ago(now, { hours: 5 }),
        updated_at: t,
        source: { supplier_id: 'sup_ext_01', channel: 'referral_link' },
        collection_deadline_at: ahead(now, { hours: 7 }),
      },
    ],
    leads: [{ application_id: 'app_cp', phone: phone(2), lead_main_owner_phone: phone(102) }],
    document_sets: [
      documentSet({
        id: SET,
        owner: { kind: 'application', id: 'app_cp' },
        round: 1,
        status: 'draft',
        documents: [
          uploaded(SET, 'bs', 'received', t, { prevalidation: { state: 'warning', rule_keys: ['prevalidation.bs.period_too_short'] } }),
          uploaded(SET, 'national_id', 'received', t),
          uploaded(SET, 'vat', 'received', t),
          document(SET, 'vat_sales', { status: 'pending', updated_at: pending }),
          document(SET, 'ch_owner', { status: 'pending', updated_at: pending }),
          document(SET, 'ch_company', { status: 'pending', updated_at: pending }),
          document(SET, 'aoa', { status: 'pending', updated_at: pending }),
        ],
      }),
    ],
    limits: [],
    deals: [],
    supplier: null,
    referrals: [],
  };
};
