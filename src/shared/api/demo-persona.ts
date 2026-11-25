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
 * Пункты меню витрины «Вход по номеру» (`login`), «Вход: номер и Business name» (`login-business-name`)
 * и «Вход: новый клиент» (`login-new-client`) — не персоны, а начало с экрана входа (Кирилл 2026-11-19, A-071;
 * 2026-11-25, A-074). Второй включает поле Business name под номером, третий — экран «Contact name и Business name»
 * между номером и кодом; «Вход: новый поставщик» (`login-new-supplier`) — тот же экран с отмеченным «Join as a supplier».
 * Вариант живёт до выбора другого пункта меню.
 */
export const LOGIN_ITEMS = {
  plain: 'login',
  businessName: 'login_business_name',
  newClient: 'login_new_client',
  newSupplier: 'login_new_supplier',
} as const;

/** `new_supplier` — та же форма нового клиента, но «Join as a supplier» уже отмечен (развилка в кабинет поставщика). */
export type LoginVariant = 'plain' | 'business_name' | 'new_client' | 'new_supplier';

const LOGIN_VARIANT_KEY = 'demo:login_variant';
const VARIANT_BY_ITEM: Readonly<Record<string, LoginVariant>> = {
  [LOGIN_ITEMS.plain]: 'plain',
  [LOGIN_ITEMS.businessName]: 'business_name',
  [LOGIN_ITEMS.newClient]: 'new_client',
  [LOGIN_ITEMS.newSupplier]: 'new_supplier',
};

export const demoLoginVariant = {
  get: (): LoginVariant => {
    const v = storage.get(LOGIN_VARIANT_KEY);
    return v === 'business_name' || v === 'new_client' || v === 'new_supplier' ? v : 'plain';
  },
  set: (variant: LoginVariant): void =>
    variant === 'plain' ? storage.remove(LOGIN_VARIANT_KEY) : storage.set(LOGIN_VARIANT_KEY, variant),
  /** Пункт меню витрины → вариант входа; `null` — это персона, а не пункт входа. */
  fromItem: (persona: string): LoginVariant | null => VARIANT_BY_ITEM[persona] ?? null,
};
