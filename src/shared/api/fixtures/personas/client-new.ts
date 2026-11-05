// client_new — client_contact; docs_required, раунд 1, ничего не загружено (SC-01, SC-02).
import { CLIENT_BASE_KEYS, ago, ahead, document, documentSet, phone } from '../build';
import type { PersonaFixture } from '../types';

const SET = 'set_cn_1';

export const clientNew: PersonaFixture = (now) => ({
  persona_id: 'client_new',
  phone: phone(1),
  company: { id: 'cmp_cn', name: 'Rimal Al Sharq Trading', name_ar: 'رمال الشرق للتجارة', cr_number: '1010000001' },
  applications: [
    {
      id: 'app_cn',
      company_id: 'cmp_cn',
      odoo_stage: 'Document collection',
      client_status: 'docs_required',
      permission_state: 'collecting',
      next_step: { owner: 'user', text_key: 'next_step.upload_documents', cta: { label_key: 'next_step.cta.documents', route: '/c/documents' }, meta: { count: 7 } },
      current_document_set_id: SET,
      created_at: ago(now, { hours: 2 }),
      updated_at: ago(now, { hours: 2 }),
      source: { channel: 'direct' },
      collection_deadline_at: ahead(now, { hours: 10 }),
    },
  ],
  leads: [{ application_id: 'app_cn', phone: phone(1), lead_main_owner_phone: phone(101) }],
  document_sets: [
    documentSet({
      id: SET,
      owner: { kind: 'application', id: 'app_cn' },
      round: 1,
      status: 'draft',
      documents: CLIENT_BASE_KEYS.map((key) => document(SET, key, { status: 'pending', updated_at: ago(now, { hours: 2 }) })),
    }),
  ],
  limits: [],
  deals: [],
  supplier: null,
  referrals: [],
});
