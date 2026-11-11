// client_offer_pending — client_owner; одобрено, условия согласует менеджер (Offer confirmation), лимит pending с суммой (SC-06, этап «Решение»).
import { CLIENT_BASE_KEYS, ZERO, ago, checklist, documentSet, phone, sar, uploaded } from '../build';
import type { PersonaFixture } from '../types';

const SET = 'set_cop_1';

export const clientOfferPending: PersonaFixture = (now) => {
  const t = ago(now, { days: 6 });
  return {
    persona_id: 'client_offer_pending',
    phone: phone(15),
    company: { id: 'cmp_cop', name: 'Nakheel Trading', name_ar: 'النخيل للتجارة', cr_number: '1010000015' },
    applications: [
      {
        id: 'app_cop',
        company_id: 'cmp_cop',
        odoo_stage: 'Offer confirmation',
        client_status: 'approved',
        permission_state: 'active',
        next_step: { owner: 'tadum', text_key: 'next_step.offer_confirmation' },
        current_document_set_id: SET,
        limit_id: 'lim_cop',
        created_at: ago(now, { days: 8 }),
        updated_at: ago(now, { hours: 20 }),
        source: { channel: 'direct' },
      },
    ],
    leads: [{ application_id: 'app_cop', phone: phone(115), lead_main_owner_phone: phone(15) }],
    document_sets: [
      documentSet({
        id: SET,
        owner: { kind: 'application', id: 'app_cop' },
        round: 1,
        status: 'completed',
        submitted_at: t,
        documents: CLIENT_BASE_KEYS.map((key) => uploaded(SET, key, 'approved', t)),
      }),
    ],
    limits: [
      {
        id: 'lim_cop',
        application_id: 'app_cop',
        status: 'pending',
        approved: sar(180_000),
        used: ZERO,
        available: sar(180_000),
        checklist: checklist('pending', 'pending', 'pending'),
      },
    ],
    deals: [],
    supplier: null,
    referrals: [],
  };
};
