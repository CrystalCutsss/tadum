// Шкала поставщика: documents → review → partner (01-cabinet-structure.md §5, 01-statuses.md §8; D-088, D-090).

import type { SupplierStatus } from '@/shared/api';

export type SupplierTimelineStepState = 'done' | 'current' | 'upcoming';
export const SUPPLIER_TIMELINE_STEPS = ['documents', 'review', 'partner'] as const;
export type SupplierTimelineStep = (typeof SUPPLIER_TIMELINE_STEPS)[number];

type Steps = Record<SupplierTimelineStep, SupplierTimelineStepState>;

const AT_DOCUMENTS: Steps = { documents: 'current', review: 'upcoming', partner: 'upcoming' };
const AT_REVIEW: Steps = { documents: 'done', review: 'current', partner: 'upcoming' };
const AT_PARTNER: Steps = { documents: 'done', review: 'done', partner: 'current' };

/**
 * null — шкалы нет (declined). paused (Lost) — шкала по последнему шагу: комплект отправлен — «Проверка», иначе «Документы».
 */
export function computeSupplierTimeline(status: SupplierStatus, locked = false): Steps | null {
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
      return locked ? AT_REVIEW : AT_DOCUMENTS;
    case 'declined':
      return null;
  }
}
