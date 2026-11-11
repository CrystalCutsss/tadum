// client_limit_cancelled — client_owner; лимит отменён на этапе подписания, заявка не закрыта (SC-06 A7).
import { CLIENT_BASE_KEYS, ZERO, ago, checklist, documentSet, phone, sar, uploaded } from '../build';
import type { PersonaFixture } from '../types';

const SET = 'set_clc_1';

export const clientLimitCancelled: PersonaFixture = (now) => {
  const t = ago(now, { days: 6 });
  return {
    persona_id: 'client_limit_cancelled',
    phone: phone(17),
    company: { id: 'cmp_clc', name: 'Sahel Foods', name_ar: 'الساحل للأغذية', cr_number: '1010000017' },
    applications: [
      {
        id: 'app_clc',
        company_id: 'cmp_clc',
        odoo_stage: 'Signing SPA & PN',
        client_status: 'approved',
        permission_state: 'active',
        next_step: { owner: 'user', text_key: 'next_step.sign_documents', cta: { label_key: 'next_step.cta.sign', route: '/c/home#limit' } },
        current_document_set_id: SET,
        limit_id: 'lim_clc',
        created_at: ago(now, { days: 8 }),
        updated_at: ago(now, { hours: 20 }),
        source: { channel: 'direct' },
      },
    ],
    leads: [{ application_id: 'app_clc', phone: phone(117), lead_main_owner_phone: phone(17) }],
    document_sets: [
      documentSet({
        id: SET,
        owner: { kind: 'application', id: 'app_clc' },
        round: 1,
        status: 'completed',
        submitted_at: t,
        documents: CLIENT_BASE_KEYS.map((key) => uploaded(SET, key, 'approved', t)),
      }),
    ],
    limits: [
      {
        id: 'lim_clc',
        application_id: 'app_clc',
        status: 'cancelled',
        approved: sar(120_000),
        used: ZERO,
        available: sar(120_000),
        checklist: checklist('done', 'pending', 'pending'),
      },
    ],
    deals: [],
    supplier: null,
    referrals: [],
  };
};
