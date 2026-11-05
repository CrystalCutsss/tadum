// @vitest-environment happy-dom
// SC-10 · Служебные сценарии v1: язык, выход, сохранение и истечение сессии, тема, роли dual, офлайн-выход, 404.
import { QueryClient } from '@tanstack/react-query';
import { createMemoryHistory, createRouter } from '@tanstack/react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { authMemory, familyMemory, sessionQuery } from '@/entities/session';
import { performLogout } from '@/features/logout';
import { setAnalyticsProviders, type CapturedEvent } from '@/shared/analytics';
import { configureApi, getApi, type Api } from '@/shared/api';
import { createI18n, readStoredLanguage, resolveLanguage, setLanguage } from '@/shared/i18n';
import { network, storage } from '@/shared/lib';
import { TEST_NOW } from '@/test-utils/mock-api';

import { landingUrl, mockDomain } from './api';
import { routeTree } from './routeTree.gen';

let api: Api;
let events: CapturedEvent[];
let restore: () => void;
let queryClient: QueryClient;

async function open(path: string) {
  const router = createRouter({ routeTree, context: { queryClient }, history: createMemoryHistory({ initialEntries: [path] }), notFoundMode: 'root' });
  await router.load();
  return router.state.location.pathname;
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TEST_NOW);
  configureApi({ mode: 'mock', domain: mockDomain, landingUrl, latency: false });
  api = await getApi();
  api.demo!.setNetwork('ok');
  network.simulateOffline(false);
  storage.remove('role:last_family');
  queryClient = new QueryClient();
  events = [];
  restore = setAnalyticsProviders([{ capture: (e) => events.push(e) }]);
});
afterEach(() => {
  restore();
  vi.useRealTimers();
});

describe('SC-10 §1.1 — язык', () => {
  it('смена без перезагрузки: <html lang dir>, хранилище, language_changed{switch}', async () => {
    const i18n = createI18n('ar');
    await setLanguage(i18n, 'en', 'switch');
    expect(document.documentElement).toMatchObject({ lang: 'en', dir: 'ltr' });
    expect(readStoredLanguage()).toBe('en');
    expect(events.find((e) => e.name === 'language_changed')?.props).toEqual({ to: 'en', source: 'switch' });
    await setLanguage(i18n, 'ar', 'switch');
  });
  it('?lang= сильнее сохранённого выбора', () => {
    expect(resolveLanguage('?lang=ar', 'en')).toEqual({ lang: 'ar', source: 'url' });
  });
});

describe('SC-10 §1.2 — выход', () => {
  it('сессия и returnTo удалены, язык и тема сохранены, событие logout; «Назад» → /login', async () => {
    api.demo!.setPersona('client_active');
    storage.set('lang', 'en');
    storage.set('theme', 'dark');
    authMemory.setReturnTo('/c/documents');
    expect(await open('/c/home')).toBe('/c/home');
    expect(await performLogout(queryClient)).toEqual({ offline: false });
    expect(await api.auth.getSession()).toBeNull();
    expect(authMemory.returnTo()).toBeNull();
    expect([storage.get('lang'), storage.get('theme')]).toEqual(['en', 'dark']);
    expect(events.find((e) => e.name === 'logout')?.props).toEqual({ offline: false });
    // «Назад»: защищённый маршрут снова ведёт на /login, кэш данных пуст.
    expect(await open('/c/home')).toBe('/login');
    expect(queryClient.getQueryCache().getAll().every((q) => q.queryKey[0] === 'session')).toBe(true);
  });
  it('A10: выход при офлайне — локальная сессия удаляется, logout{offline: true}', async () => {
    api.demo!.setPersona('client_active');
    network.simulateOffline(true);
    api.demo!.setNetwork('offline');
    expect(await performLogout(queryClient)).toEqual({ offline: true });
    expect(queryClient.getQueryData(sessionQuery.queryKey)).toBeNull();
    expect(events.find((e) => e.name === 'logout')?.props).toEqual({ offline: true });
  });
});

describe('SC-10 §1.3–1.4 — сессия', () => {
  it('сессия переживает «перезагрузку» (новый роутер и кэш)', async () => {
    api.demo!.setPersona('client_active');
    expect(await open('/c/help')).toBe('/c/help');
    queryClient = new QueryClient();
    expect(await open('/c/help')).toBe('/c/help');
  });
  it('выход в другой вкладке → при следующем действии 401 / вход', async () => {
    api.demo!.setPersona('client_active');
    expect(await open('/c/home')).toBe('/c/home');
    await (await getApi()).auth.logout();
    queryClient.clear();
    expect(await open('/c/home')).toBe('/login');
  });
  it('expireSession → /session-expired с возвратом на исходный маршрут', async () => {
    api.demo!.setPersona('client_active');
    api.demo!.expireSession();
    expect(await open('/c/help')).toBe('/session-expired');
    expect(authMemory.returnTo()).toBe('/c/help');
  });
});

describe('01-cabinet-structure.md §4 — роли dual (SP-01)', () => {
  it('переключение не сбрасывает язык и тему; последняя роль — при следующем входе', async () => {
    api.demo!.setPersona('dual_active');
    storage.set('lang', 'en');
    storage.set('theme', 'dark');
    expect(await open('/s/home')).toBe('/s/home');
    expect(familyMemory.last()).toBe('supplier');
    expect([storage.get('lang'), storage.get('theme')]).toEqual(['en', 'dark']);
    expect(await open('/')).toBe('/s/home');
  });
  it('dual: клиентская заявка closed — кабинет поставщика работает (SP-01 A6)', async () => {
    api.demo!.setPersona('dual_active');
    api.demo!.uwReject();
    expect(await open('/s/help')).toBe('/s/help');
  });
});

describe('SC-10 §1.8 — неизвестный маршрут', () => {
  it('404 — нейтральный экран, ни один экран кабинета не совпал', async () => {
    api.demo!.setPersona('client_active');
    const router = createRouter({ routeTree, context: { queryClient }, history: createMemoryHistory({ initialEntries: ['/c/nowhere'] }), notFoundMode: 'root' });
    await router.load();
    expect(router.state.matches.map((m) => String(m.routeId)).filter((id) => id.startsWith('/c/'))).toEqual([]);
  });
});
