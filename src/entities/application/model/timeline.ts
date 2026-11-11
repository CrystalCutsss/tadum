// Шкала прогресса клиента (01-cabinet-structure.md §5, таблица истинности 01-statuses.md §8).
// Шкала никогда не откатывается назад (D-008). Этап «Решение» — текущий шаг, пока условия согласуются (A-063). Дозапрос (решения Кирилла 2026-11-09): «Документы» — пройдены,
// «Проверка» — текущий шаг, без предупреждающей метки (раньше метка needs_attention стояла на «Документах»).

import type { ClientStatus, Limit } from '@/shared/api';

export type TimelineStepState = 'done' | 'current' | 'upcoming' | 'needs_attention' | 'closed';

export const CLIENT_TIMELINE_STEPS = ['documents', 'review', 'decision', 'signing', 'limit_active'] as const;
export type ClientTimelineStep = (typeof CLIENT_TIMELINE_STEPS)[number];

export type ClientTimeline =
  | { hidden: false; steps: Record<ClientTimelineStep, TimelineStepState> }
  /** closed: шкала скрыта, вместо неё карточка «Заявка закрыта». */
  | { hidden: true; steps: null };

export interface ClientTimelineInput {
  client_status: ClientStatus;
  round: number;
  limit: Pick<Limit, 'status' | 'checklist'> | null;
}

const row = (...s: [TimelineStepState, TimelineStepState, TimelineStepState, TimelineStepState, TimelineStepState]): ClientTimeline => ({
  hidden: false,
  steps: { documents: s[0], review: s[1], decision: s[2], signing: s[3], limit_active: s[4] },
});

export function computeClientTimeline({ client_status: status, round, limit }: ClientTimelineInput): ClientTimeline {
  switch (status) {
    case 'docs_required':
      return round > 1
        ? row('done', 'current', 'upcoming', 'upcoming', 'upcoming')
        : row('current', 'upcoming', 'upcoming', 'upcoming', 'upcoming');
    case 'under_review':
      return row('done', 'current', 'upcoming', 'upcoming', 'upcoming');
    case 'approved':
      if (limit?.status === 'active' && limit.checklist.completed) return row('done', 'done', 'done', 'done', 'current');
      // Решение Кирилла 2026-11-11 (A-063): пока условия согласуются (лимита ещё нет или он pending) — текущий шаг
      // «Решение»; «Подписание» становится текущим, когда открылось подписание (лимит ready). Расходится с §8 до правки Drive.
      return !limit || limit.status === 'pending'
        ? row('done', 'done', 'current', 'upcoming', 'upcoming')
        : row('done', 'done', 'done', 'current', 'upcoming');
    case 'first_purchase':
      return row('done', 'done', 'done', 'done', 'done');
    case 'closed':
      return { hidden: true, steps: null };
  }
}
