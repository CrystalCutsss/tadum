// Состояние входа между экранами /login, /login/details и /login/code. Номер телефона, имя и название компании —
// только в памяти вкладки: это PII, в хранилище и URL они не попадают. returnTo, источник входа и последний экран — в sessionStore.
import type { ScreenId } from '@/shared/analytics';
import type { OtpChallenge } from '@/shared/api';
import { safeReturnTo } from '@/shared/config';
import { sessionStore, storage } from '@/shared/lib';

export interface PendingLogin {
  phone: string;
  challenge: OtpChallenge;
}

/** Данные нового клиента с экрана /login/details (A-074); никуда не уходят. */
export interface ContactDetails {
  contactName: string;
  businessName: string;
}

let pending: PendingLogin | null = null;
/** Номер для предзаполнения после «Изменить номер» (A13). */
let lastPhone: string | null = null;
/** Вариант «новый клиент» (A-074): номер введён, код ещё не запрошен. */
let enteredPhone: string | null = null;
let details: ContactDetails | null = null;

export const loginFlow = {
  get: (): PendingLogin | null => pending,
  start(next: PendingLogin): void {
    pending = next;
    lastPhone = next.phone;
    enteredPhone = null;
  },
  /** Новый клиент: номер введён, дальше — экран имени и компании; код запросит он. */
  enterPhone(phone: string): void {
    enteredPhone = phone;
    lastPhone = phone;
  },
  enteredPhone: (): string | null => enteredPhone,
  saveDetails(next: ContactDetails): void {
    details = next;
  },
  details: (): ContactDetails | null => details,
  /** A13: вернуться к номеру; старый код больше не используется. */
  changePhone(): void {
    pending = null;
    enteredPhone = null;
  },
  finish(): void {
    pending = null;
    lastPhone = null;
    enteredPhone = null;
    details = null;
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
