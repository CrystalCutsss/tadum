// Текущая персона демо-режима (витрина): чтобы ?persona= не сбрасывал состояние при каждой перезагрузке.
import { storage } from '@/shared/lib';

const KEY = 'demo:persona';

export const demoPersona = {
  get: (): string | null => storage.get(KEY),
  set: (id: string): void => storage.set(KEY, id),
};

/**
 * Значение ?persona= → id персоны. Меню просмотрщика Proto принимает только id через дефис (`client-active`),
 * демо-панель и документация используют подчёркивание (`client_active`) — принимаем оба.
 */
export function personaFromParam(value: string | null): string | null {
  return value ? value.replaceAll('-', '_') : null;
}
