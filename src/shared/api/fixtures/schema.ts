// Zod-схема графа персоны: проверяет фикстуры в тестах и сохранённое состояние мока при загрузке.
import { z } from 'zod';

import {
  ApplicationSchema,
  CompanySchema,
  DateTimeSchema,
  DealSchema,
  DocumentSetSchema,
  LimitSchema,
  OdooStageSchema,
  SupplierSchema,
} from '../ports/schemas';
import { PERSONA_IDS } from './types';

export const PersonaGraphSchema = z.object({
  persona_id: z.enum(PERSONA_IDS),
  phone: z.string().regex(/^\+9665000\d{5}$/),
  company: CompanySchema.nullable(),
  applications: z.array(ApplicationSchema),
  leads: z.array(
    z.object({
      application_id: z.string(),
      phone: z.string().regex(/^\+9665000\d{5}$/),
      lead_main_owner_phone: z.string().regex(/^\+9665000\d{5}$/).optional(),
    }),
  ),
  document_sets: z.array(DocumentSetSchema),
  limits: z.array(LimitSchema),
  deals: z.array(DealSchema),
  supplier: SupplierSchema.nullable(),
  referrals: z.array(
    z.object({
      application_id: z.string(),
      company_name: z.string(),
      applied_at: DateTimeSchema,
      updated_at: DateTimeSchema,
      odoo_stage: OdooStageSchema,
      attribution: z.enum(['referral_link', 'manual']),
    }),
  ),
});
