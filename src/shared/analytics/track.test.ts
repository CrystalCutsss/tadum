// track(): контекст §2.2, провайдеры по VITE_ANALYTICS (D-059), PII-guard §2.3, лента демо-панели.
import { afterEach, describe, expect, it } from 'vitest';

import { setAnalyticsContext } from './context';
import { PiiViolation, assertNoPii } from './pii-guard';
import { demoFeed } from './providers/demo-panel';
import { consoleProvider } from './providers/console';
import { posthogProvider } from './providers/posthog';
import type { CapturedEvent } from './providers/types';
import { providersFor, setAnalyticsProviders, track } from './track';

let restore: () => void = () => undefined;
afterEach(() => restore());

function capture(): CapturedEvent[] {
  const events: CapturedEvent[] = [];
  restore = setAnalyticsProviders([{ capture: (e) => events.push(e) }]);
  return events;
}

describe('track()', () => {
  it('передаёт имя, свойства и общий контекст §2.2', () => {
    const events = capture();
    setAnalyticsContext({ screen_id: 'client.home', role: 'client', lang: 'en', dir: 'ltr', theme: 'dark' });
    track('logout', { offline: false });
    expect(events).toHaveLength(1);
    const [e] = events;
    expect(e!.name).toBe('logout');
    expect(e!.props).toEqual({ offline: false });
    expect(e!.context).toMatchObject({ screen_id: 'client.home', role: 'client', lang: 'en', dir: 'ltr', theme: 'dark', viewport: 'xs', platform: 'desktop' });
    expect(Object.keys(e!.context).sort()).toEqual(
      ['app_version', 'dir', 'in_iab', 'is_pwa', 'lang', 'platform', 'role', 'screen_id', 'session_id', 'theme', 'viewport'].sort(),
    );
  });
  it('session_id стабилен в пределах вкладки', () => {
    const events = capture();
    track('role_hint_shown', {});
    track('role_hint_dismissed', {});
    expect(events[0]!.context.session_id).toBe(events[1]!.context.session_id);
  });
  it('persona — только в демо-режиме', () => {
    const events = capture();
    setAnalyticsContext({ persona: 'client_new' });
    track('how_to_buy_viewed', {});
    expect(events[0]!.context.persona).toBe('client_new');
    setAnalyticsContext({ persona: undefined });
  });
  it('ошибка провайдера не ломает вызов', () => {
    restore = setAnalyticsProviders([
      {
        capture: () => {
          throw new Error('boom');
        },
      },
    ]);
    expect(() => track('logout', { offline: true })).not.toThrow();
  });
  it('в dev PII-guard останавливает событие с телефоном', () => {
    const events = capture();
    expect(() => track('data_inconsistency', { kind: '+966500000001' })).toThrow(PiiViolation);
    expect(events).toHaveLength(0);
  });
});

describe('провайдеры (D-059)', () => {
  it('витрина — лента демо-панели и консоль; прод — только боевой', () => {
    expect(providersFor('demo')).toEqual([expect.objectContaining({}), consoleProvider]);
    expect(providersFor('demo')).not.toContain(posthogProvider);
    expect(providersFor('posthog')).toEqual([posthogProvider]);
    expect(providersFor('console')).toEqual([consoleProvider]);
    expect(providersFor(undefined)).toEqual([consoleProvider]);
  });
  it('лента демо-панели: новые сверху, очистка', () => {
    restore = setAnalyticsProviders(providersFor('demo').filter((p) => p !== consoleProvider));
    demoFeed.clear();
    let notified = 0;
    const unsubscribe = demoFeed.subscribe(() => notified++);
    track('referral_printed', {});
    track('clients_page_loaded', { page: 2 });
    expect(demoFeed.getSnapshot().map((e) => e.name)).toEqual(['clients_page_loaded', 'referral_printed']);
    expect(notified).toBe(2);
    demoFeed.clear();
    expect(demoFeed.getSnapshot()).toEqual([]);
    unsubscribe();
  });
});

describe('PII-guard (§2.3)', () => {
  it.each([
    [{ kind: '+966 50 000 0001' }, 'телефон'],
    [{ kind: 'user@example.com' }, 'e-mail'],
    [{ href_host: 'https://tadum.sa/s/x' }, 'ссылка'],
    [{ count: 15_000_000 }, 'точная сумма'],
    [{ application_id: 'app_1' }, 'запрещённое свойство'],
    [{ company_name: 'X' }, 'запрещённое свойство'],
    [{ statuses: ['ok', 'a@b'] }, 'PII в массиве'],
  ] as [Record<string, unknown>, string][])('%j — %s', (props) => expect(() => assertNoPii('e', props)).toThrow(PiiViolation));
  it('корзины, короткие числа, точные длительности и хосты — допустимы', () => {
    expect(() =>
      assertNoPii('e', { amount_bucket: '100-250k', page: 3, duration_ms: 12_345_678, href_host: 'sadq.sa', statuses: ['under_review'] }),
    ).not.toThrow();
  });
});
