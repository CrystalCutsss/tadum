// Шкала поставщика: documents → review → active (01-cabinet-structure.md §5, 01-statuses.md §8).

import type { SupplierStatus } from '@/shared/api';

export type SupplierTimelineStepState = 'done' | 'current' | 'upcoming';
export const SUPPLIER_TIMELINE_STEPS = ['documents', 'review', 'active'] as const;
export type SupplierTimelineStep = (typeof SUPPLIER_TIMELINE_STEPS)[number];

export function computeSupplierTimeline(status: SupplierStatus): Record<SupplierTimelineStep, SupplierTimelineStepState> {
  switch (status) {
    case 'docs_required':
      return { documents: 'current', review: 'upcoming', active: 'upcoming' };
    case 'under_review':
      return { documents: 'done', review: 'current', active: 'upcoming' };
    case 'active':
      return { documents: 'done', review: 'done', active: 'current' };
  }
}
