// Уведомление о смене статуса (D-034, SC-05 A6/A6a): внутри портала, без модальных окон.
// Пока экран открыт — тост; если статус сменился, пока клиента не было, — закрываемый баннер на home.
// Последний увиденный статус и закрытие баннера (для конкретного перехода) — в storage, без PII.
import type { ClientStatus } from '@/shared/api';
import { storage } from '@/shared/lib';

const LAST_SEEN = 'status:last_seen';
const DISMISSED = 'status:banner_dismissed';

const STATUSES: readonly ClientStatus[] = ['docs_required', 'under_review', 'approved', 'first_purchase', 'closed'];
const isStatus = (v: string | null): v is ClientStatus => v !== null && (STATUSES as readonly string[]).includes(v);

export interface StatusMemory {
  lastSeen: ClientStatus | null;
  dismissed: string | null;
}

export const transitionKey = (from: ClientStatus, to: ClientStatus) => `${from}->${to}`;

export type StatusNotice = { kind: 'none' } | { kind: 'banner'; from: ClientStatus; to: ClientStatus };

/** Баннер при входе: статус отличается от последнего увиденного и этот переход ещё не закрывали. */
export function statusNoticeOnEnter(memory: StatusMemory, current: ClientStatus): StatusNotice {
  const from = memory.lastSeen;
  if (!from || from === current) return { kind: 'none' };
  if (memory.dismissed === transitionKey(from, current)) return { kind: 'none' };
  return { kind: 'banner', from, to: current };
}

export const statusMemory = {
  read: (): StatusMemory => {
    const lastSeen = storage.get(LAST_SEEN);
    return { lastSeen: isStatus(lastSeen) ? lastSeen : null, dismissed: storage.get(DISMISSED) };
  },
  /** Клиент увидел статус (тост при открытом экране или первый вход без баннера). */
  seen: (status: ClientStatus): void => storage.set(LAST_SEEN, status),
  /** Баннер закрыт: запоминаем переход и считаем статус увиденным. */
  dismiss: (from: ClientStatus, to: ClientStatus): void => {
    storage.set(DISMISSED, transitionKey(from, to));
    storage.set(LAST_SEEN, to);
  },
};
