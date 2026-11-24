// Шкала поставщика: documents → review → partner (01-cabinet-structure.md §5, 01-statuses.md §8; D-088, D-090).

import type { SupplierStatus } from '@/shared/api';

export type SupplierTimelineStepState = 'done' | 'current' | 'upcoming' | 'cancelled';
export const SUPPLIER_TIMELINE_STEPS = ['documents', 'review', 'partner'] as const;
export type SupplierTimelineStep = (typeof SUPPLIER_TIMELINE_STEPS)[number];

type Steps = Record<SupplierTimelineStep, SupplierTimelineStepState>;

const AT_DOCUMENTS: Steps = { documents: 'current', review: 'upcoming', partner: 'upcoming' };
const AT_REVIEW: Steps = { documents: 'done', review: 'current', partner: 'upcoming' };
const AT_PARTNER: Steps = { documents: 'done', review: 'done', partner: 'current' };
/** Lost и Declined — последний шаг «Не активен» с серым крестиком, как отменённый лимит у клиента (Кирилл 2026-11-24). */
const INACTIVE: Steps = { documents: 'done', review: 'done', partner: 'cancelled' };

export function computeSupplierTimeline(status: SupplierStatus): Steps {
  switch (status) {
    case 'application_created':
    case 'docs_required':
      return AT_DOCUMENTS;
    case 'under_review':
    case 'contract_pending':
      return AT_REVIEW;
    case 'partner':
    case 'active':
      return AT_PARTNER;
    case 'paused':
    case 'declined':
      return INACTIVE;
  }
}
