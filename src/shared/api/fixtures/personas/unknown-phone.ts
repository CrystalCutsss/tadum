// unknown_phone — номер без заявки и без поставщика: roles = [] (SC-01, экран auth.not_found).
import { phone } from '../build';
import type { PersonaFixture } from '../types';

export const unknownPhone: PersonaFixture = () => ({
  persona_id: 'unknown_phone',
  phone: phone(14),
  company: null,
  applications: [],
  leads: [],
  document_sets: [],
  limits: [],
  deals: [],
  supplier: null,
  referrals: [],
});
