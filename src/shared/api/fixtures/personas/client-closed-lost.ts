// client_closed_lost — client_contact; closed (Lost) на этапе сбора документов (SC-08).
import { ago, document, documentSet, landingUrl, phone, uploaded } from '../build';
import type { PersonaFixture } from '../types';

const SET = 'set_ccl_1';

export const clientClosedLost: PersonaFixture = (now) => {
  const t = ago(now, { days: 16 });
  return {
    persona_id: 'client_closed_lost',
    phone: phone(10),
    company: { id: 'cmp_ccl', name: 'Najm Auto Parts', name_ar: 'نجم لقطع غيار السيارات', cr_number: '1010000010' },
    applications: [
      {
        id: 'app_ccl',
        company_id: 'cmp_ccl',
        odoo_stage: 'Lost',
        client_status: 'closed',
        permission_state: 'closed',
        next_step: { owner: 'none', text_key: 'next_step.closed', cta: { label_key: 'next_step.cta.apply', external_url: landingUrl() } },
        current_document_set_id: SET,
        created_at: ago(now, { days: 20 }),
        updated_at: ago(now, { days: 7 }),
        source: { channel: 'manual' },
      },
    ],
    leads: [{ application_id: 'app_ccl', phone: phone(10), lead_main_owner_phone: phone(110) }],
    document_sets: [
      documentSet({
        id: SET,
        owner: { kind: 'application', id: 'app_ccl' },
        round: 1,
        status: 'draft',
        documents: [
          uploaded(SET, 'bs', 'received', t),
          uploaded(SET, 'national_id', 'received', t),
          ...(['vat', 'vat_sales', 'ch_owner', 'ch_company', 'aoa'] as const).map((key) => document(SET, key, { status: 'pending', updated_at: ago(now, { days: 20 }) })),
        ],
      }),
    ],
    limits: [],
    deals: [],
    supplier: null,
    referrals: [],
  };
};
