// supplier_new — supplier; docs_required, 0 клиентов; комплект draft: sup_vat, sup_iban_letter,
// sup_national_address обязательные, sup_cr необязательный (SP-01, SP-03).
import { ago, document, documentSet, phone } from '../build';
import type { PersonaFixture } from '../types';

const SET = 'set_sn_1';

export const supplierNew: PersonaFixture = (now) => {
  const t = ago(now, { hours: 1 });
  return {
    persona_id: 'supplier_new',
    phone: phone(11),
    company: null,
    applications: [],
    leads: [],
    document_sets: [
      documentSet({
        id: SET,
        owner: { kind: 'supplier', id: 'sup_sn' },
        round: 1,
        status: 'draft',
        documents: [
          document(SET, 'sup_vat', { status: 'pending', updated_at: t }),
          document(SET, 'sup_iban_letter', { status: 'pending', updated_at: t }),
          document(SET, 'sup_national_address', { status: 'pending', updated_at: t }),
          document(SET, 'sup_cr', { status: 'pending', required: false, updated_at: t }),
        ],
      }),
    ],
    limits: [],
    deals: [],
    supplier: {
      id: 'sup_sn',
      name: 'Zahrat Al Madina Stationery',
      slug: 'zahrat-al-madina',
      referral_url: 'https://tadum.sa/s/zahrat-al-madina',
      supplier_status: 'docs_required',
      next_step: { owner: 'user', text_key: 'next_step.supplier.upload_documents', cta: { label_key: 'next_step.cta.documents', route: '/s/documents' } },
      current_document_set_id: SET,
      counters: { referred_total: 0, under_review: 0, approved: 0 },
      phones: [phone(11)],
    },
    referrals: [],
  };
};
