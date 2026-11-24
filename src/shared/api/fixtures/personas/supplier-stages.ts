// Поставщик на этапах после сбора документов (01-entities.md §6; D-087–D-090; бриф TD-001 §5):
// supplier_review — комплект отправлен; supplier_contract — документы приняты, остался договор;
// supplier_partner — ссылка и QR открыты; supplier_declined, supplier_lost — заявка не активна / приостановлена.
import type { DocumentSet, SupplierOdooStage, SupplierStatus } from '../../ports/schemas';
import { ago, documentSet, phone, uploaded } from '../build';
import type { PersonaFixture, PersonaGraph } from '../types';

interface StageSpec {
  persona_id: PersonaGraph['persona_id'];
  key: string;
  phone: number;
  name: string;
  slug: string;
  odoo_stage: SupplierOdooStage;
  supplier_status: SupplierStatus;
  next_step: NonNullable<PersonaGraph['supplier']>['next_step'];
  /** Комплект: отправлен и на проверке или проверен и закрыт. */
  set: 'submitted' | 'completed';
}

function stagePersona(spec: StageSpec): PersonaFixture {
  return (now) => {
    const t = ago(now, { days: 3 });
    const setId = `set_${spec.key}_1`;
    const sup = `sup_${spec.key}`;
    const docStatus = spec.set === 'completed' ? 'approved' : 'received';
    const set: DocumentSet = documentSet({
      id: setId,
      owner: { kind: 'supplier', id: sup },
      round: 1,
      status: spec.set,
      submitted_at: t,
      documents: [
        uploaded(setId, 'sup_vat', docStatus, t),
        uploaded(setId, 'sup_iban_letter', docStatus, t),
        uploaded(setId, 'sup_national_address', docStatus, t),
      ],
    });
    return {
      persona_id: spec.persona_id,
      phone: phone(spec.phone),
      company: null,
      applications: [],
      leads: [],
      document_sets: [set],
      limits: [],
      deals: [],
      supplier: {
        id: sup,
        name: spec.name,
        slug: spec.slug,
        referral_url: `https://tadum.sa/s/${spec.slug}`,
        odoo_stage: spec.odoo_stage,
        cr_number: `10104${String(spec.phone).padStart(5, '0')}`,
        supplier_status: spec.supplier_status,
        next_step: spec.next_step,
        current_document_set_id: setId,
        counters: { referred_total: 0, under_review: 0, approved: 0 },
        phones: [phone(spec.phone)],
      },
      referrals: [],
    };
  };
}

export const supplierReview = stagePersona({
  persona_id: 'supplier_review',
  key: 'sr',
  phone: 18,
  name: 'Al Waha Office Supplies',
  slug: 'al-waha-office',
  odoo_stage: 'Processing: Pending Docs',
  supplier_status: 'under_review',
  next_step: { owner: 'tadum', text_key: 'next_step.supplier.under_review' },
  set: 'submitted',
});

export const supplierContract = stagePersona({
  persona_id: 'supplier_contract',
  key: 'sc',
  phone: 19,
  name: 'مؤسسة الندى للتجارة',
  slug: 'al-nada-trading',
  odoo_stage: 'Processing: Need Contract',
  supplier_status: 'contract_pending',
  next_step: { owner: 'tadum', text_key: 'next_step.supplier.contract_pending' },
  set: 'completed',
});

export const supplierPartner = stagePersona({
  persona_id: 'supplier_partner',
  key: 'sp',
  phone: 20,
  name: 'Zahrat Al Madina Stationery',
  slug: 'zahrat-al-madina',
  odoo_stage: 'Interested',
  supplier_status: 'partner',
  next_step: { owner: 'user', text_key: 'next_step.supplier.share_link' },
  set: 'completed',
});

export const supplierDeclined = stagePersona({
  persona_id: 'supplier_declined',
  key: 'sd',
  phone: 21,
  name: 'Rimal Packaging',
  slug: 'rimal-packaging',
  odoo_stage: 'Declined',
  supplier_status: 'declined',
  next_step: { owner: 'none', text_key: 'next_step.supplier.declined' },
  set: 'submitted',
});

export const supplierLost = stagePersona({
  persona_id: 'supplier_lost',
  key: 'sl',
  phone: 22,
  name: 'شركة السحاب للتوريدات',
  slug: 'al-sahab-supplies',
  odoo_stage: 'Lost',
  supplier_status: 'paused',
  next_step: { owner: 'none', text_key: 'next_step.supplier.paused' },
  set: 'submitted',
});
