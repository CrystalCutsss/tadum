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

/**
 * Пункты меню витрины «Вход по номеру» (`login`) и «Вход: номер и Business name» (`login-business-name`) —
 * не персоны, а начало с экрана входа (Кирилл 2026-11-19, A-071). Второй включает вариант формы входа
 * с полем Business name; флаг живёт до выбора другого пункта меню.
 */
export const LOGIN_ITEMS = { plain: 'login', businessName: 'login_business_name' } as const;

const LOGIN_VARIANT_KEY = 'demo:login_variant';

export const demoLoginVariant = {
  /** Вариант входа с полем Business name. */
  businessName: (): boolean => storage.get(LOGIN_VARIANT_KEY) === 'business_name',
  set: (businessName: boolean): void =>
    businessName ? storage.set(LOGIN_VARIANT_KEY, 'business_name') : storage.remove(LOGIN_VARIANT_KEY),
};
