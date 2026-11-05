// Переключение ролей для dual (01-cabinet-structure.md §4, SP-01): home выбранной семьи, последняя — в памяти.
// Подсказка «у вас есть и кабинет поставщика» показывается один раз (флаг рядом с языком и темой).
import { useNavigate } from '@tanstack/react-router';

import { familyMemory } from '@/entities/session';
import { setAnalyticsContext, track } from '@/shared/analytics';
import { homeOf, type Family } from '@/shared/config';
import { storage } from '@/shared/lib';

const HINT_KEY = 'role:hint_seen';

export const roleHint = {
  seen: (): boolean => storage.get(HINT_KEY) === '1',
  markSeen: (): void => storage.set(HINT_KEY, '1'),
};

export function useSwitchRole(current: Family): (next: Family) => void {
  const navigate = useNavigate();
  return (next) => {
    if (next === current) return;
    familyMemory.remember(next);
    setAnalyticsContext({ role: next });
    track('role_switched', { from: current, to: next });
    void navigate({ to: homeOf(next) });
  };
}
