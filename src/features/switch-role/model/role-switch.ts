// Переключение ролей для dual (01-cabinet-structure.md §4, SP-01): home выбранной семьи, последняя — в памяти.
// Подсказка «у вас есть и кабинет поставщика» показывается один раз (флаг рядом с языком и темой).
// Демо (решение Кирилла 2026-11-11): в прототипе переключатель есть у всех персон, на всех этапах. У персоны с одной ролью
// «Supplier» открывает кабинет поставщика (персона supplier_active), «Client» возвращает к последней клиентской
// персоне с её этапом (по умолчанию client_active). Только мок с демо-режимом; в прод-сборке — как у обычного пользователя.
import { useNavigate } from '@tanstack/react-router';

import { familyMemory } from '@/entities/session';
import { setAnalyticsContext, track } from '@/shared/analytics';
import { demoPersona } from '@/shared/api';
import { homeOf, type Family } from '@/shared/config';
import { storage } from '@/shared/lib';

const HINT_KEY = 'role:hint_seen';
const LAST_CLIENT_KEY = 'demo:last_client_persona';

export const roleHint = {
  seen: (): boolean => storage.get(HINT_KEY) === '1',
  markSeen: (): void => storage.set(HINT_KEY, '1'),
};

/** Демо-переключение ролей доступно: мок и демо-режим витрины (не прод-сборка). */
export const demoRoleSwitch: boolean = import.meta.env.VITE_DEMO_PANEL !== '0' && (import.meta.env.VITE_API_MODE ?? 'mock') === 'mock';

const DEMO_SUPPLIER = 'supplier_active';
const DEMO_CLIENT = 'client_active';

/** Персона для демо-перехода в семью `next`; уходя из клиента, запоминает текущую клиентскую персону. */
export function demoPersonaFor(current: Family, next: Family): string {
  if (current === 'client') {
    const persona = demoPersona.get();
    if (persona?.startsWith('client_')) storage.set(LAST_CLIENT_KEY, persona);
  }
  return next === 'supplier' ? DEMO_SUPPLIER : (storage.get(LAST_CLIENT_KEY) ?? DEMO_CLIENT);
}

/**
 * `demo` — у пользователя одна роль: вторая открывается сменой персоны мока (полная загрузка с ?persona=,
 * как из меню просмотрщика Proto), иначе гард вернул бы его на home своей роли.
 */
export function useSwitchRole(current: Family, { demo = false }: { demo?: boolean } = {}): (next: Family) => void {
  const navigate = useNavigate();
  return (next) => {
    if (next === current) return;
    familyMemory.remember(next);
    setAnalyticsContext({ role: next });
    track('role_switched', { from: current, to: next });
    if (demo) {
      const persona = demoPersonaFor(current, next);
      window.location.assign(`${import.meta.env.BASE_URL}${homeOf(next).slice(1)}?persona=${persona}`);
      return;
    }
    void navigate({ to: homeOf(next) });
  };
}
