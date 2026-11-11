// client_approved_unsigned — client_owner; approved, лимит ready, чек-лист: все три pending (SC-06; «ждём подтверждения» —
// у client_signing_partial: без «Открыть снова» пункт in_progress в демо не завершить, Кирилл 2026-11-11).
import { CLIENT_BASE_KEYS, ZERO, ago, checklist, documentSet, phone, sar, uploaded } from '../build';
import type { PersonaFixture } from '../types';

const SET = 'set_cau_1';

export const clientApprovedUnsigned: PersonaFixture = (now) => {
  const t = ago(now, { days: 6 });
  return {
    persona_id: 'client_approved_unsigned',
    phone: phone(6),
    company: { id: 'cmp_cau', name: 'Barq Logistics', name_ar: 'برق للخدمات اللوجستية', cr_number: '1010000006' },
    applications: [
      {
        id: 'app_cau',
        company_id: 'cmp_cau',
        odoo_stage: 'Signing SPA & PN',
        client_status: 'approved',
        permission_state: 'active',
        next_step: { owner: 'user', text_key: 'next_step.sign_documents', cta: { label_key: 'next_step.cta.sign', route: '/c/home#limit' } },
        current_document_set_id: SET,
        limit_id: 'lim_cau',
        created_at: ago(now, { days: 8 }),
        updated_at: ago(now, { hours: 20 }),
        source: { channel: 'direct' },
      },
    ],
    leads: [{ application_id: 'app_cau', phone: phone(106), lead_main_owner_phone: phone(6) }],
    document_sets: [
      documentSet({
        id: SET,
        owner: { kind: 'application', id: 'app_cau' },
        round: 1,
        status: 'completed',
        submitted_at: t,
        documents: CLIENT_BASE_KEYS.map((key) => uploaded(SET, key, 'approved', t)),
      }),
    ],
    limits: [
      {
        id: 'lim_cau',
        application_id: 'app_cau',
        status: 'ready',
        approved: sar(200_000),
        used: ZERO,
        available: sar(200_000),
        checklist: checklist('pending', 'pending', 'pending'),
      },
    ],
    deals: [],
    supplier: null,
    referrals: [],
  };
};
