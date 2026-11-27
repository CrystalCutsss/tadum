// Правила блока «График платежей» (D-102, 01-entities.md §2.9a): просроченные взносы — первыми, затем ближайшие
// предстоящие; оплаченные — только в истории. Даты взносов — календарные дни по Эр-Рияду.
import type { Installment } from '@/shared/api';
import { toDate } from '@/shared/lib';

const DAY = 86_400_000;
const RIYADH_OFFSET = 3 * 3_600_000;

/** Сколько взносов показывать на главной: ближайший крупно и ещё два строками. */
export const HOME_ROWS = 3;

export interface ScheduleGroups {
  overdue: Installment[];
  upcoming: Installment[];
  /** Оплаченные — от последнего к первому. */
  paid: Installment[];
  /** Что показать на главной: сначала просроченные, затем предстоящие, не больше HOME_ROWS. */
  home: Installment[];
}

const byDue = (a: Installment, b: Installment) => a.due_date.localeCompare(b.due_date);

export function groupSchedule(installments: readonly Installment[]): ScheduleGroups {
  const overdue = installments.filter((i) => i.status === 'overdue').sort(byDue);
  const upcoming = installments.filter((i) => i.status === 'upcoming').sort(byDue);
  const paid = installments.filter((i) => i.status === 'paid').sort((a, b) => byDue(b, a));
  return { overdue, upcoming, paid, home: [...overdue, ...upcoming].slice(0, HOME_ROWS) };
}

/** Сегодня по Эр-Рияду, `YYYY-MM-DD`. */
export const riyadhToday = (nowMs: number): string => toDate(nowMs + RIYADH_OFFSET).toISOString().slice(0, 10);

/** Дней от сегодняшней даты (Эр-Рияд) до даты взноса: 0 — сегодня, отрицательное — срок прошёл. */
export function daysUntil(dueDate: string, nowMs: number): number {
  return Math.round((toDate(`${dueDate}T00:00:00Z`).getTime() - toDate(`${riyadhToday(nowMs)}T00:00:00Z`).getTime()) / DAY);
}
