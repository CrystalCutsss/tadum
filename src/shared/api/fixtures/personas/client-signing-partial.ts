// client_signing_partial — client_owner; подписание: SPA done, вексель компании in_progress, владельца pending (SC-06).
import { CLIENT_BASE_KEYS, ZERO, ago, checklist, documentSet, phone, sar, uploaded } from '../build';
import type { PersonaFixture } from '../types';

const SET = 'set_csp_1';

export const clientSigningPartial: PersonaFixture = (now) => {
  const t = ago(now, { days: 6 });
  return {
    persona_id: 'client_signing_partial',
    phone: phone(16),
    company: { id: 'cmp_csp', name: 'Rawabi Building Materials', name_ar: 'روابي لمواد البناء', cr_number: '1010000016' },
    applications: [
      {
        id: 'app_csp',
        company_id: 'cmp_csp',
        odoo_stage: 'Signing SPA & PN',
        client_status: 'approved',
        permission_state: 'active',
        next_step: { owner: 'user', text_key: 'next_step.sign_documents', cta: { label_key: 'next_step.cta.sign', route: '/c/home#limit' } },
        current_document_set_id: SET,
        limit_id: 'lim_csp',
        created_at: ago(now, { days: 8 }),
        updated_at: ago(now, { hours: 20 }),
        source: { channel: 'direct' },
      },
    ],
    leads: [{ application_id: 'app_csp', phone: phone(116), lead_main_owner_phone: phone(16) }],
    document_sets: [
      documentSet({
        id: SET,
        owner: { kind: 'application', id: 'app_csp' },
        round: 1,
        status: 'completed',
        submitted_at: t,
        documents: CLIENT_BASE_KEYS.map((key) => uploaded(SET, key, 'approved', t)),
      }),
    ],
    limits: [
      {
        id: 'lim_csp',
        application_id: 'app_csp',
        status: 'ready',
        approved: sar(250_000),
        used: ZERO,
        available: sar(250_000),
        checklist: checklist('done', 'in_progress', 'pending'),
      },
    ],
    deals: [],
    supplier: null,
    referrals: [],
  };
};
