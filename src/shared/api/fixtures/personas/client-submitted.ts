// client_submitted — client_contact; under_review, комплект locked, review_eta_hours = 24 (SC-05).
import { CLIENT_BASE_KEYS, ago, documentSet, phone, uploaded } from '../build';
import type { PersonaFixture } from '../types';

const SET = 'set_cs_1';

export const clientSubmitted: PersonaFixture = (now) => {
  const t = ago(now, { hours: 4 });
  return {
    persona_id: 'client_submitted',
    phone: phone(4),
    company: { id: 'cmp_cs', name: 'Danah Medical Supplies', name_ar: 'دانة للمستلزمات الطبية', cr_number: '1010000004' },
    applications: [
      {
        id: 'app_cs',
        company_id: 'cmp_cs',
        odoo_stage: 'Ready for UW',
        client_status: 'under_review',
        permission_state: 'reviewing',
        next_step: { owner: 'tadum', text_key: 'next_step.under_review_eta', meta: { hours: 24 } },
        current_document_set_id: SET,
        created_at: ago(now, { days: 1 }),
        updated_at: ago(now, { hours: 3 }),
        source: { channel: 'direct' },
        review_eta_hours: 24,
      },
    ],
    leads: [{ application_id: 'app_cs', phone: phone(4), lead_main_owner_phone: phone(104) }],
    document_sets: [
      documentSet({
        id: SET,
        owner: { kind: 'application', id: 'app_cs' },
        round: 1,
        status: 'in_review',
        submitted_at: ago(now, { hours: 3 }),
        documents: CLIENT_BASE_KEYS.map((key) => uploaded(SET, key, 'received', t)),
      }),
    ],
    limits: [],
    deals: [],
    supplier: null,
    referrals: [],
  };
};
