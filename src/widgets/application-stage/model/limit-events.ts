// Переходы статуса лимита при открытом экране → события аналитики (SC-06 §5, 04-metrics-and-events.md).
// Даты одобрения у лимита нет — `days_since_approved` не отправляем (D-081).
import type { Limit } from '@/entities/limit';
import { amountBucket, track } from '@/shared/analytics';

/**
 * Лимит стал `active` на глазах у клиента — `limit_activated` с суммой корзиной (не точным значением).
 * `prev === undefined` — первый ответ сервера, перехода ещё не было.
 */
export function trackLimitTransition(prev: Limit['status'] | null | undefined, limit: Pick<Limit, 'status' | 'approved'> | null): void {
  if (prev === undefined || !limit || limit.status !== 'active' || prev === 'active') return;
  track('limit_activated', { amount_bucket: amountBucket(limit.approved) });
}
