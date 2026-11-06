// client_closed_rejected — client_contact; closed (Rejected by UW), лимит rejected (SC-08).
import { CLIENT_BASE_KEYS, ZERO, ago, checklist, documentSet, landingUrl, phone, uploaded } from '../build';
import type { PersonaFixture } from '../types';

const SET = 'set_ccr_1';

export const clientClosedRejected: PersonaFixture = (now) => {
  const t = ago(now, { days: 9 });
  return {
    persona_id: 'client_closed_rejected',
    phone: phone(9),
    user: { name: 'Majed Al-Anazi', name_ar: 'ماجد العنزي' },
    company: { id: 'cmp_ccr', name: 'Wadi Hanifa Contracting', name_ar: 'وادي حنيفة للمقاولات', cr_number: '1010000009' },
    applications: [
      {
        id: 'app_ccr',
        company_id: 'cmp_ccr',
        odoo_stage: 'Rejected by UW',
        client_status: 'closed',
        permission_state: 'closed',
        next_step: { owner: 'none', text_key: 'next_step.closed', cta: { label_key: 'next_step.cta.apply', external_url: landingUrl() } },
        current_document_set_id: SET,
        limit_id: 'lim_ccr',
        created_at: ago(now, { days: 12 }),
        updated_at: ago(now, { days: 5 }),
        source: { channel: 'direct' },
      },
    ],
    leads: [{ application_id: 'app_ccr', phone: phone(9), lead_main_owner_phone: phone(109) }],
    document_sets: [
      documentSet({
        id: SET,
        owner: { kind: 'application', id: 'app_ccr' },
        round: 1,
        status: 'in_review',
        submitted_at: t,
        documents: CLIENT_BASE_KEYS.map((key) => uploaded(SET, key, 'received', t)),
      }),
    ],
    limits: [{ id: 'lim_ccr', application_id: 'app_ccr', status: 'rejected', approved: ZERO, used: ZERO, available: ZERO, checklist: checklist('pending', 'pending', 'pending') }],
    deals: [],
    supplier: null,
    referrals: [],
  };
};
