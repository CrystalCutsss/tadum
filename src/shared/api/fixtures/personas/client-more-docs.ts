// client_more_docs — client_contact; docs_required, раунд 2: новый комплект из 2 документов, старый superseded (SC-04).
import { CLIENT_BASE_KEYS, ago, document, documentSet, phone, uploaded } from '../build';
import type { PersonaFixture } from '../types';

const OLD = 'set_cm_1';
const NEW = 'set_cm_2';
const REQUESTED = ['bs', 'vat_sales'];

export const clientMoreDocs: PersonaFixture = (now) => {
  const t = ago(now, { days: 3 });
  const asked = ago(now, { hours: 6 });
  return {
    persona_id: 'client_more_docs',
    phone: phone(5),
    user: { name: 'Khalid Al-Mutairi', name_ar: 'خالد المطيري' },
    company: { id: 'cmp_cm', name: 'Sahab Electronics', name_ar: 'سحاب للإلكترونيات', cr_number: '1010000005' },
    applications: [
      {
        id: 'app_cm',
        company_id: 'cmp_cm',
        odoo_stage: 'Need more docs for UW',
        client_status: 'docs_required',
        permission_state: 'collecting',
        next_step: { owner: 'user', text_key: 'next_step.more_docs_requested', cta: { label_key: 'next_step.cta.documents', route: '/c/documents' }, meta: { count: 2 } },
        current_document_set_id: NEW,
        created_at: ago(now, { days: 4 }),
        updated_at: asked,
        source: { channel: 'direct' },
      },
    ],
    leads: [{ application_id: 'app_cm', phone: phone(5), lead_main_owner_phone: phone(105) }],
    document_sets: [
      documentSet({
        id: OLD,
        owner: { kind: 'application', id: 'app_cm' },
        round: 1,
        status: 'superseded',
        submitted_at: ago(now, { days: 3 }),
        documents: CLIENT_BASE_KEYS.map((key) => uploaded(OLD, key, REQUESTED.includes(key) ? 'received' : 'approved', t)),
      }),
      documentSet({
        id: NEW,
        owner: { kind: 'application', id: 'app_cm' },
        round: 2,
        status: 'draft',
        documents: REQUESTED.map((key) => document(NEW, key, { status: 'pending', updated_at: asked })),
      }),
    ],
    limits: [],
    deals: [],
    supplier: null,
    referrals: [],
  };
};
