// Состояние входа между экранами /login и /login/code. Номер телефона — только в памяти вкладки:
// это PII, в хранилище и URL он не попадает. returnTo, источник входа и последний экран — в sessionStore.
import type { ScreenId } from '@/shared/analytics';
import type { OtpChallenge } from '@/shared/api';
import { safeReturnTo } from '@/shared/config';
import { sessionStore, storage } from '@/shared/lib';

export interface PendingLogin {
  phone: string;
  challenge: OtpChallenge;
}

let pending: PendingLogin | null = null;
/** Номер для предзаполнения после «Изменить номер» (A13). */
let lastPhone: string | null = null;

export const loginFlow = {
  get: (): PendingLogin | null => pending,
  start(next: PendingLogin): void {
    pending = next;
    lastPhone = next.phone;
  },
  /** A13: вернуться к номеру; старый код больше не используется. */
  changePhone(): void {
    pending = null;
  },
  finish(): void {
    pending = null;
    lastPhone = null;
  },
  lastPhone: (): string | null => lastPhone,
};

const RETURN_TO = 'auth:return_to';
const SOURCE = 'auth:source';
const LAST_SCREEN = 'auth:last_screen';
const LOGGED_IN_BEFORE = 'auth:logged_in_before';

export type LoginSource = 'whatsapp_link' | 'landing' | 'direct';

export const authMemory = {
  setReturnTo(value: unknown): void {
    const safe = safeReturnTo(value);
    if (safe) sessionStore.set(RETURN_TO, safe);
  },
  returnTo: (): string | null => safeReturnTo(sessionStore.get(RETURN_TO)),
  clearReturnTo: (): void => sessionStore.remove(RETURN_TO),
  setSource(src: unknown, inWhatsApp: boolean): void {
    const source: LoginSource = src === 'landing' ? 'landing' : src === 'whatsapp' || inWhatsApp ? 'whatsapp_link' : 'direct';
    sessionStore.set(SOURCE, source);
  },
  source: (): LoginSource => {
    const v = sessionStore.get(SOURCE);
    return v === 'landing' || v === 'whatsapp_link' ? v : 'direct';
  },
  setLastScreen(screen: ScreenId): void {
    sessionStore.set(LAST_SCREEN, screen);
  },
  lastScreen: (): string | null => sessionStore.get(LAST_SCREEN),
  /** Флаг «уже входил на этом устройстве» для first_login; без PII. */
  markLoggedIn: (): void => storage.set(LOGGED_IN_BEFORE, '1'),
  loggedInBefore: (): boolean => storage.get(LOGGED_IN_BEFORE) === '1',
};
