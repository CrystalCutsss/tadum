// Чек-лист подключения лимита (SC-06, 01-statuses.md §7, D-035): порядок пунктов фиксирован, акцент — на первом
// незавершённом; статус приходит только из данных. Отметка «ссылка открыта» — локальная, в sessionStorage с временем
// клика: сразу после клика пункт показывается как «ждём подтверждения», пока данные не обновились (D-035), и по ней
// считается «давно ждём» (24 ч, SC-06 A4). Подтверждением подписи отметка не считается.

import { sessionStore } from '@/shared/lib';

import type { ChecklistItem, ChecklistItemStatus } from './types';

/** Через сколько часов «ждём подтверждения» дополняется строкой «Уже подписали? Напишите нам» (SC-06 A4). */
export const CHECKLIST_STALE_HOURS = 24;

const HOUR_MS = 3_600_000;
const openedKey = (key: ChecklistItem['key']) => `checklist:opened:${key}`;

/** Время, когда клиент открыл ссылку пункта, или null. В ключе — только ключ пункта, не ссылка (в ней может быть код). */
export function checklistOpenedAt(key: ChecklistItem['key']): number | null {
  const raw = sessionStore.get(openedKey(key));
  const at = raw === null ? NaN : Number(raw);
  return Number.isFinite(at) ? at : null;
}

export function markChecklistOpened(key: ChecklistItem['key'], at: number): void {
  sessionStore.set(openedKey(key), String(at));
}

/** Первый незавершённый пункт в фиксированном порядке — на нём акцент (SC-06 §6, A5). */
export function checklistFocusKey(items: readonly Pick<ChecklistItem, 'key' | 'status'>[]): ChecklistItem['key'] | null {
  return items.find((i) => i.status !== 'done')?.key ?? null;
}

export type ChecklistItemView = ChecklistItemStatus | 'stale';

/**
 * Что показать у пункта. Данные главнее отметки: `pending` с отметкой, сделанной после последнего ответа сервера, —
 * «ждём подтверждения»; следующий ответ с `pending` её снимает (SC-06 §6). `in_progress` дольше 24 ч — `stale`.
 */
export function checklistItemView(
  item: Pick<ChecklistItem, 'status'>,
  openedAt: number | null,
  dataUpdatedAt: number,
  now: number,
): ChecklistItemView {
  if (item.status === 'done' || item.status === 'failed') return item.status;
  const waiting = item.status === 'in_progress' || (openedAt !== null && openedAt > dataUpdatedAt);
  if (!waiting) return 'pending';
  return openedAt !== null && now - openedAt >= CHECKLIST_STALE_HOURS * HOUR_MS ? 'stale' : 'in_progress';
}
