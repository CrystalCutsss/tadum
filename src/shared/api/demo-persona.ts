// Текущая персона демо-режима (витрина): чтобы ?persona= не сбрасывал состояние при каждой перезагрузке.
import { storage } from '@/shared/lib';

const KEY = 'demo:persona';

export const demoPersona = {
  get: (): string | null => storage.get(KEY),
  set: (id: string): void => storage.set(KEY, id),
};
