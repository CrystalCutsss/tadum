// Гарды (01-cabinet-structure.md §1, SC-01, D-020): каждая ветка — отдельный кейс.
import { describe, expect, it } from 'vitest';

import type { Role } from '@/shared/api';

import { activeFamily, decideAuthScreen, decideCabinet, decideRoot, destinationAfterLogin, familiesOf } from './guards';

const active = (...roles: Role[]) => ({ status: 'active' as const, session: { roles } });
const none = { status: 'none' as const };
const expired = { status: 'expired' as const };

describe('активная семья (D-020)', () => {
  it('одна роль — её семья', () => {
    expect(activeFamily({ roles: ['client_owner'] }, null)).toBe('client');
    expect(activeFamily({ roles: ['supplier'] }, 'client')).toBe('supplier');
  });
  it('dual при первом входе — клиентская, далее — последняя выбранная', () => {
    expect(activeFamily({ roles: ['client_owner', 'supplier'] }, null)).toBe('client');
    expect(activeFamily({ roles: ['client_owner', 'supplier'] }, 'supplier')).toBe('supplier');
  });
  it('обе клиентские роли — одна семья', () => expect(familiesOf(['client_contact', 'client_owner'])).toEqual(['client']));
});

describe('/', () => {
  it('нет сессии → /login', () => expect(decideRoot(none, null)).toEqual({ kind: 'redirect', to: '/login' }));
  it('истекла → /login', () => expect(decideRoot(expired, null)).toEqual({ kind: 'redirect', to: '/login' }));
  it('клиент → /c/home, поставщик → /s/home, dual → /c/home', () => {
    expect(decideRoot(active('client_contact'), null)).toMatchObject({ to: '/c/home' });
    expect(decideRoot(active('supplier'), null)).toMatchObject({ to: '/s/home' });
    expect(decideRoot(active('client_owner', 'supplier'), null)).toMatchObject({ to: '/c/home' });
  });
});

describe('SC-01 — альтернативы, которые решает гард', () => {
  it('основной сценарий: кабинет без сессии → /login с returnTo', () => {
    expect(decideCabinet(none, '/c/home', null)).toEqual({ kind: 'redirect', to: '/login', returnTo: '/c/home' });
  });
  it('A11: сессия истекла при открытии кабинета → /session-expired с returnTo', () => {
    expect(decideCabinet(expired, '/c/documents', null)).toEqual({ kind: 'redirect', to: '/session-expired', returnTo: '/c/documents' });
  });
  it('A12: с сессией открыт /login → home активной роли', () => {
    expect(decideAuthScreen(active('client_contact'), null)).toEqual({ kind: 'redirect', to: '/c/home' });
    expect(decideAuthScreen(active('supplier'), null)).toEqual({ kind: 'redirect', to: '/s/home' });
    expect(decideAuthScreen(none, null)).toEqual({ kind: 'allow' });
  });
  it('A14: диплинк /c/documents без сессии — после входа открывается /c/documents', () => {
    const d = decideCabinet(none, '/c/documents', null);
    expect(d).toMatchObject({ returnTo: '/c/documents' });
    expect(destinationAfterLogin({ roles: ['client_contact'] }, '/c/documents', null)).toEqual({ to: '/c/documents', returned: true });
  });
});

describe('семьи маршрутов', () => {
  it('клиент открыл /s/home → свой home без ошибки', () => {
    expect(decideCabinet(active('client_contact'), '/s/home', null)).toEqual({ kind: 'redirect', to: '/c/home' });
  });
  it('поставщик открыл /c/* → /s/home', () => {
    expect(decideCabinet(active('supplier'), '/c/documents', null)).toEqual({ kind: 'redirect', to: '/s/home' });
  });
  it('dual открывает маршруты обеих семей', () => {
    expect(decideCabinet(active('client_owner', 'supplier'), '/s/home', null)).toEqual({ kind: 'allow' });
    expect(decideCabinet(active('client_owner', 'supplier'), '/c/home', 'supplier')).toEqual({ kind: 'allow' });
  });
  it('после входа: диплинк поставщика на /c/* → /s/home (SC-01, критерии приёмки)', () => {
    expect(destinationAfterLogin({ roles: ['supplier'] }, '/c/documents', null)).toEqual({ to: '/s/home', returned: false });
  });
  it('после входа: внешний returnTo игнорируется', () => {
    expect(destinationAfterLogin({ roles: ['client_contact'] }, 'https://evil.example/c/home', null)).toEqual({ to: '/c/home', returned: false });
  });
  it('после входа dual без returnTo — последняя выбранная семья', () => {
    expect(destinationAfterLogin({ roles: ['client_owner', 'supplier'] }, null, 'supplier')).toEqual({ to: '/s/home', returned: false });
  });
});
