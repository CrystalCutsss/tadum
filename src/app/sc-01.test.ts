// @vitest-environment happy-dom
// SC-01 · Первый вход — основной сценарий и альтернативы A1–A14, каждая отдельным кейсом.
// Маршруты проверяются настоящим деревом (routeTree.gen) в памяти против MockAdapter; формы — через их модели.
// Поведение экранов (фокус, ячейки, таймер на экране) — в историях Storybook с play-тестами.
import { QueryClient } from '@tanstack/react-query';
import { createMemoryHistory, createRouter } from '@tanstack/react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { authMemory, destinationAfterLogin, familyMemory, loginFlow } from '@/entities/session';
import { phoneErrorActive, phoneErrorFrom, phoneErrorMessage, phoneFailReason } from '@/features/request-otp';
import { canResend, inputLocked, otpErrorFrom, otpErrorMessage, otpFailReason } from '@/features/verify-otp';
import { setAnalyticsProviders, type CapturedEvent } from '@/shared/analytics';
import { configureApi, getApi, type Api } from '@/shared/api';
import { sessionStore, storage, toKsaMobile } from '@/shared/lib';
import { TEST_NOW } from '@/test-utils/mock-api';

import { landingUrl, mockDomain } from './api';
import { routeTree } from './routeTree.gen';

const PHONE = '+966500000001'; // client_new
const SUPPLIER = '+966500000011'; // supplier_new
const UNKNOWN = '+966500000014'; // unknown_phone
const advance = (ms: number) => vi.setSystemTime(Date.now() + ms);

let api: Api;
let events: CapturedEvent[];
let restoreAnalytics: () => void;

function makeRouter(path: string) {
  return createRouter({ routeTree, context: { queryClient: new QueryClient() }, history: createMemoryHistory({ initialEntries: [path] }), notFoundMode: 'root' });
}

async function open(path: string) {
  const router = makeRouter(path);
  await router.load();
  return router.state.location;
}

async function caught<T>(p: Promise<T>): Promise<unknown> {
  try {
    await p;
    return null;
  } catch (e) {
    return e;
  }
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TEST_NOW);
  configureApi({ mode: 'mock', domain: mockDomain, landingUrl, latency: false });
  api = await getApi();
  api.demo!.setPersona('client_new');
  await api.auth.logout();
  for (const k of ['auth:return_to', 'auth:source', 'auth:last_screen']) sessionStore.remove(k);
  storage.remove('role:last_family');
  loginFlow.finish();
  events = [];
  restoreAnalytics = setAnalyticsProviders([{ capture: (e) => events.push(e) }]);
});
afterEach(() => {
  restoreAnalytics();
  vi.useRealTimers();
});

describe('SC-01 §1 — основной сценарий', () => {
  it('кабинет без сессии → /login, returnTo запомнен', async () => {
    expect((await open('/c/home')).pathname).toBe('/login');
    expect(authMemory.returnTo()).toBe('/c/home');
  });
  it('/ без сессии → /login', async () => {
    expect((await open('/')).pathname).toBe('/login');
  });
  it('/login/code без введённого номера → /login', async () => {
    expect((await open('/login/code')).pathname).toBe('/login');
  });
  it('номер → код 0000 → сессия на 30 дней → /c/home', async () => {
    const challenge = await api.auth.requestOtp(PHONE);
    loginFlow.start({ phone: PHONE, challenge });
    expect((await open('/login/code')).pathname).toBe('/login/code');
    const session = await api.auth.verifyOtp(PHONE, '0000');
    expect(destinationAfterLogin(session, authMemory.returnTo(), familyMemory.last())).toEqual({ to: '/c/home', returned: false });
    expect((await open('/')).pathname).toBe('/c/home');
  });
  it('одна роль supplier → /s/home', async () => {
    api.demo!.setPersona('supplier_active');
    expect((await open('/')).pathname).toBe('/s/home');
  });
});

describe('SC-01 §2 — альтернативы', () => {
  it('A1: номер не в формате KSA — инлайн-ошибка, кнопка задизейблена', () => {
    expect(toKsaMobile('41234567')).toBeNull();
    expect(phoneErrorMessage({ kind: 'invalid_format' }, 0)).toEqual({ key: 'auth.phone.invalid_format', values: {} });
  });

  it('A2: больше 3 запросов за 10 минут — too_many_requests с таймером, auth_otp_failed{rate_limited}', async () => {
    for (let i = 0; i < 3; i++) {
      await api.auth.requestOtp(PHONE);
      advance(40_000);
    }
    const err = phoneErrorFrom(await caught(api.auth.requestOtp(PHONE)), Date.now());
    expect(err.kind).toBe('rate_limited');
    const msg = phoneErrorMessage(err, Date.now());
    expect(msg.key).toBe('auth.phone.too_many_requests');
    expect(msg.values.minutes).toBeGreaterThan(0);
    expect(phoneFailReason(err)).toBe('rate_limited');
    // Таймер: по истечении ошибка снимается сама.
    expect(phoneErrorActive(err, Date.now())).toBe(true);
    expect(phoneErrorActive(err, Date.now() + 10 * 60_000)).toBe(false);
  });

  it('A3: неверный код — invalid; остаток попыток показываем после 3-й ошибки', async () => {
    await api.auth.requestOtp(PHONE);
    const keys: string[] = [];
    for (let i = 0; i < 3; i++) {
      const err = otpErrorFrom(await caught(api.auth.verifyOtp(PHONE, '1234')), Date.now());
      expect(otpFailReason(err)).toBe('invalid');
      keys.push(otpErrorMessage(err, Date.now())!.key);
    }
    expect(keys).toEqual(['auth.otp.invalid_retry', 'auth.otp.invalid_retry', 'auth.otp.invalid']);
  });

  it('A4: код истёк (5 минут) — expired; «Отправить новый код» активна независимо от таймера', async () => {
    const c = await api.auth.requestOtp(PHONE);
    advance(5 * 60_000);
    const err = otpErrorFrom(await caught(api.auth.verifyOtp(PHONE, '0000')), Date.now());
    expect(err.kind).toBe('expired');
    expect(otpFailReason(err)).toBe('expired');
    expect(canResend(err, Date.parse(c.resend_available_at) - 1, Date.parse(c.resend_available_at))).toBe(true);
  });

  it('A5: исчерпаны 5 попыток — too_many_attempts, ввод заблокирован до нового кода', async () => {
    await api.auth.requestOtp(PHONE);
    let err = otpErrorFrom(null, 0);
    for (let i = 0; i < 5; i++) err = otpErrorFrom(await caught(api.auth.verifyOtp(PHONE, '9999')), Date.now());
    expect(err.kind).toBe('too_many_attempts');
    expect(inputLocked(err)).toBe(true);
    expect(canResend(err, 0, Number.MAX_SAFE_INTEGER)).toBe(true);
    expect(otpFailReason(err)).toBe('too_many_attempts');
  });

  it('A6: повторная отправка до 40 с — кнопка задизейблена', async () => {
    const c = await api.auth.requestOtp(PHONE);
    const at = Date.parse(c.resend_available_at);
    expect(canResend(null, at - 1_000, at)).toBe(false);
    expect(otpErrorFrom(await caught(api.auth.requestOtp(PHONE)), Date.now())).toMatchObject({ kind: 'resend_too_early' });
  });

  it('A7: повторная отправка после 40 с — новый код, таймер перезапущен', async () => {
    const first = await api.auth.requestOtp(PHONE);
    advance(40_000);
    expect(canResend(null, Date.now(), Date.parse(first.resend_available_at))).toBe(true);
    const second = await api.auth.requestOtp(PHONE);
    expect(Date.parse(second.resend_available_at)).toBe(Date.parse(first.resend_available_at) + 40_000);
  });

  it('A8: номер без заявки — /not-found без сессии, auth_otp_failed{phone_unknown}', async () => {
    await api.auth.requestOtp(UNKNOWN);
    const err = otpErrorFrom(await caught(api.auth.verifyOtp(UNKNOWN, '0000')), Date.now());
    expect(err.kind).toBe('phone_unknown');
    expect(otpFailReason(err)).toBe('phone_unknown');
    expect(await api.auth.getSession()).toBeNull();
    expect((await open('/not-found')).pathname).toBe('/not-found');
  });

  it('A9: нет сети — common.offline_retry, без события', async () => {
    api.demo!.setNetwork('offline');
    const err = phoneErrorFrom(await caught(api.auth.requestOtp(PHONE)), Date.now());
    expect(err.kind).toBe('offline');
    expect(phoneErrorMessage(err, 0).key).toBe('common.offline_retry');
    expect(phoneFailReason(err)).toBeNull();
    expect(otpFailReason(otpErrorFrom(await caught(api.auth.verifyOtp(PHONE, '0000')), 0))).toBeNull();
    api.demo!.setNetwork('ok');
  });

  it('A10: ошибка сервера — common.server_error_retry, auth_otp_failed{server_error}', async () => {
    api.demo!.setNetwork('error');
    const err = phoneErrorFrom(await caught(api.auth.requestOtp(PHONE)), Date.now());
    expect(phoneErrorMessage(err, 0).key).toBe('common.server_error_retry');
    expect(phoneFailReason(err)).toBe('server_error');
    expect(otpErrorMessage(otpErrorFrom(await caught(api.auth.verifyOtp(PHONE, '0000')), 0), 0)?.key).toBe('common.server_error_retry');
    api.demo!.setNetwork('ok');
  });

  it('A11: сессия истекла при открытии кабинета → /session-expired, «Войти» → /login, returnTo сохранён', async () => {
    api.demo!.setPersona('client_active');
    api.demo!.expireSession();
    expect((await open('/c/documents')).pathname).toBe('/session-expired');
    expect(authMemory.returnTo()).toBe('/c/documents');
    expect((await open('/login')).pathname).toBe('/login');
  });

  it('A11: через 30 дней — то же', async () => {
    api.demo!.setPersona('client_active');
    advance(30 * 24 * 60 * 60_000);
    expect((await open('/c/home')).pathname).toBe('/session-expired');
  });

  it('A12: с сессией открывает /login → home активной роли', async () => {
    api.demo!.setPersona('client_active');
    expect((await open('/login')).pathname).toBe('/c/home');
    api.demo!.setPersona('supplier_new');
    expect((await open('/login')).pathname).toBe('/s/home');
    expect((await open('/login/code')).pathname).toBe('/s/home');
  });

  it('A13: «Изменить номер» — к номеру с заполненным полем, старый код больше не используется', async () => {
    const challenge = await api.auth.requestOtp(PHONE);
    loginFlow.start({ phone: PHONE, challenge });
    loginFlow.changePhone();
    expect(loginFlow.get()).toBeNull();
    expect(loginFlow.lastPhone()).toBe(PHONE);
    expect((await open('/login/code')).pathname).toBe('/login');
  });

  it('A14: диплинк /c/documents без сессии → /login, после входа — /c/documents', async () => {
    expect((await open('/c/documents')).pathname).toBe('/login');
    await api.auth.requestOtp(PHONE);
    const session = await api.auth.verifyOtp(PHONE, '0000');
    expect(destinationAfterLogin(session, authMemory.returnTo(), null)).toEqual({ to: '/c/documents', returned: true });
    expect((await open('/c/documents')).pathname).toBe('/c/documents');
  });
});

describe('SC-01 §6 — критерии приёмки маршрутов', () => {
  it('диплинк поставщика на /c/* после входа ведёт на /s/home', async () => {
    expect((await open('/c/documents')).pathname).toBe('/login');
    await api.auth.requestOtp(SUPPLIER);
    const session = await api.auth.verifyOtp(SUPPLIER, '0000');
    expect(destinationAfterLogin(session, authMemory.returnTo(), null).to).toBe('/s/home');
    expect((await open('/c/documents')).pathname).toBe('/s/home');
  });
  it('клиент открыл /s/home → /c/home', async () => {
    api.demo!.setPersona('client_active');
    expect((await open('/s/home')).pathname).toBe('/c/home');
  });
  it('внешний returnTo с лендинга игнорируется, внутренний — принимается (D-039)', async () => {
    await open('/login?returnTo=https%3A%2F%2Fevil.example%2Fc%2Fhome');
    expect(authMemory.returnTo()).toBeNull();
    await open('/login?returnTo=%2Fc%2Fhome&src=landing');
    expect(authMemory.returnTo()).toBe('/c/home');
    expect(authMemory.source()).toBe('landing');
  });
  it('/c и /s ведут на свой home; несуществующий путь — 404', async () => {
    api.demo!.setPersona('client_active');
    expect((await open('/c')).pathname).toBe('/c/home');
    const router = makeRouter('/c/nowhere');
    await router.load();
    // Ни один экран /c/* не совпал — корень рисует system.404 (notFoundMode: 'root').
    expect(router.state.matches.map((m) => String(m.routeId)).filter((id) => id.startsWith('/c/'))).toEqual([]);
  });
});
