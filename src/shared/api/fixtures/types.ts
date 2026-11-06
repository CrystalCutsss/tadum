// Граф данных персоны: всё, что «знает бэкенд» об одном номере телефона.

import type { Application, Company, Deal, DocumentSet, Limit, OdooStage, Supplier } from '../ports/schemas';

export const PERSONA_IDS = [
  'client_new',
  'client_partial',
  'client_rejected',
  'client_submitted',
  'client_more_docs',
  'client_approved_unsigned',
  'client_active',
  'client_first_purchase',
  'client_closed_rejected',
  'client_closed_lost',
  'supplier_new',
  'supplier_active',
  'dual_active',
  'unknown_phone',
] as const;

export type PersonaId = (typeof PERSONA_IDS)[number];

/** Номера crm.lead заявки: по ним resolveRoles находит client_contact / client_owner. */
interface Lead {
  application_id: string;
  phone: string;
  lead_main_owner_phone?: string;
}

/** Заявка компании, приведённой поставщиком; проекция ReferredClient строится из неё и сделок. */
export interface Referral {
  application_id: string;
  company_name: string;
  applied_at: string;
  updated_at: string;
  odoo_stage: OdooStage;
  attribution: 'referral_link' | 'manual';
}

export interface PersonaGraph {
  persona_id: PersonaId;
  /** Номер для входа. */
  phone: string;
  /** Имя и фамилия владельца номера `phone` (Session.display_name, A-055); у номеров из leads имени нет. */
  user?: { name: string; name_ar?: string };
  company: Company | null;
  /** Все заявки компании по порядку создания; текущая — последняя. */
  applications: Application[];
  leads: Lead[];
  /** Комплекты клиента и поставщика хранятся вместе, различаются по owner (SP-03 §7). */
  document_sets: DocumentSet[];
  limits: Limit[];
  /** Сделки клиента и сделки приведённых клиентов поставщика. */
  deals: Deal[];
  supplier: Supplier | null;
  referrals: Referral[];
}

/** Фикстура строит граф от текущего времени: даты — смещения от clock.now(). */
export type PersonaFixture = (now: number) => PersonaGraph;
