// client_rejected — client_owner; docs_required, отклонённые документы (SC-03; решение Кирилла 2026-11-10):
// выписка — причина на весь документ (AR+EN), два файла; декларация — два файла, замечание к одному (только AR);
// сертификат владельца — замечание к файлу без текста; удостоверение — дозапрос к файлу. Файлы выписки уже отклонялись раньше (TADUM-536).
import { ago, document, documentSet, file, phone, uploaded } from '../build';
import type { PersonaFixture } from '../types';

const SET = 'set_cr_1';

export const clientRejected: PersonaFixture = (now) => {
  const t = ago(now, { days: 1 });
  const r = ago(now, { hours: 3 });
  return {
    persona_id: 'client_rejected',
    phone: phone(3),
    company: { id: 'cmp_cr', name: 'Qimam Building Materials', name_ar: 'قمم لمواد البناء', cr_number: '1010000003' },
    applications: [
      {
        id: 'app_cr',
        company_id: 'cmp_cr',
        odoo_stage: 'Document collection',
        client_status: 'docs_required',
        permission_state: 'collecting',
        next_step: { owner: 'user', text_key: 'next_step.reupload_rejected', cta: { label_key: 'next_step.cta.documents', route: '/c/documents' }, meta: { count: 3 } },
        current_document_set_id: SET,
        created_at: ago(now, { days: 2 }),
        updated_at: r,
        source: { channel: 'manual' },
      },
    ],
    leads: [{ application_id: 'app_cr', phone: phone(103), lead_main_owner_phone: phone(3) }],
    document_sets: [
      documentSet({
        id: SET,
        owner: { kind: 'application', id: 'app_cr' },
        round: 1,
        status: 'draft',
        documents: [
          document(SET, 'bs', {
            status: 'rejected',
            updated_at: r,
            reject_reason_key: 'reject.bs.period',
            reject_reason_text: { ar: 'نحتاج كشف حساب يغطي آخر 6 أشهر', en: 'We need a statement covering the last 6 months' },
            rejected_file_hashes: ['sha_set_cr_1_bs_0', 'sha_set_cr_1_bs_1', 'sha_set_cr_1_bs_2'],
            files: [
              file({ id: `${SET}_bs_f1`, name: 'bank-statement-march.pdf', sha256: 'sha_set_cr_1_bs_1', uploaded_at: t }),
              file({ id: `${SET}_bs_f2`, name: 'bank-statement-april.pdf', sha256: 'sha_set_cr_1_bs_2', uploaded_at: t, size_bytes: 786_432 }),
            ],
          }),
          document(SET, 'national_id', {
            status: 'rejected',
            updated_at: r,
            files: [
              file({
                id: `${SET}_national_id_f1`,
                name: 'national_id.pdf',
                sha256: 'sha_set_cr_1_national_id_1',
                uploaded_at: t,
                issue: {
                  kind: 'request',
                  reason_text: { ar: 'نحتاج صورة الوجه الخلفي للهوية أيضًا', en: 'We also need the back side of the ID' },
                },
              }),
            ],
          }),
          uploaded(SET, 'vat', 'received', t),
          document(SET, 'vat_sales', {
            status: 'rejected',
            updated_at: r,
            rejected_file_hashes: ['sha_set_cr_1_vat_sales_2'],
            files: [
              file({ id: `${SET}_vat_sales_f1`, name: 'vat-return-q1.pdf', sha256: 'sha_set_cr_1_vat_sales_1', uploaded_at: t }),
              file({
                id: `${SET}_vat_sales_f2`,
                name: 'vat-return-q2.pdf',
                sha256: 'sha_set_cr_1_vat_sales_2',
                uploaded_at: t,
                issue: { kind: 'error', reason_text: { ar: 'الإقرار غير موقّع' } },
              }),
            ],
          }),
          document(SET, 'ch_owner', {
            status: 'rejected',
            updated_at: r,
            rejected_file_hashes: ['sha_set_cr_1_ch_owner_1'],
            files: [file({ id: `${SET}_ch_owner_f1`, name: 'ch_owner.pdf', sha256: 'sha_set_cr_1_ch_owner_1', uploaded_at: t, issue: { kind: 'error' } })],
          }),
          uploaded(SET, 'ch_company', 'received', t),
          uploaded(SET, 'aoa', 'received', t),
        ],
      }),
    ],
    limits: [],
    deals: [],
    supplier: null,
    referrals: [],
  };
};
