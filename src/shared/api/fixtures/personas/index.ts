// Реестр персон (01-entities.md §6). Идентификатор = значение `?persona=`.
// Подключается только динамическим импортом вместе с MockAdapter — не в первом чанке.
import type { PersonaFixture, PersonaId } from '../types';

import { clientActive } from './client-active';
import { clientApprovedUnsigned } from './client-approved-unsigned';
import { clientClosedLost } from './client-closed-lost';
import { clientClosedRejected } from './client-closed-rejected';
import { clientFirstPurchase } from './client-first-purchase';
import { clientMoreDocs } from './client-more-docs';
import { clientNew } from './client-new';
import { clientPartial } from './client-partial';
import { clientRejected } from './client-rejected';
import { clientSubmitted } from './client-submitted';
import { dualActive } from './dual-active';
import { supplierActive } from './supplier-active';
import { supplierNew } from './supplier-new';
import { unknownPhone } from './unknown-phone';

export const PERSONAS: Readonly<Record<PersonaId, PersonaFixture>> = {
  client_new: clientNew,
  client_partial: clientPartial,
  client_rejected: clientRejected,
  client_submitted: clientSubmitted,
  client_more_docs: clientMoreDocs,
  client_approved_unsigned: clientApprovedUnsigned,
  client_active: clientActive,
  client_first_purchase: clientFirstPurchase,
  client_closed_rejected: clientClosedRejected,
  client_closed_lost: clientClosedLost,
  supplier_new: supplierNew,
  supplier_active: supplierActive,
  dual_active: dualActive,
  unknown_phone: unknownPhone,
};
