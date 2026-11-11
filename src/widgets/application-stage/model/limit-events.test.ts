// limit_activated — только на переходе в active, сумма корзиной, без days_since_approved (D-081).
import { afterEach, describe, expect, it } from 'vitest';

import { setAnalyticsProviders, type CapturedEvent } from '@/shared/analytics';

import { trackLimitTransition } from './limit-events';

let restore: () => void = () => undefined;
afterEach(() => restore());

function capture(): CapturedEvent[] {
  const events: CapturedEvent[] = [];
  restore = setAnalyticsProviders([{ capture: (e) => events.push(e) }]);
  return events;
}

const approved = { amount_minor: 15_000_000, currency: 'SAR' } as const;

describe('trackLimitTransition', () => {
  it('ready → active — limit_activated с корзиной суммы', () => {
    const events = capture();
    trackLimitTransition('ready', { status: 'active', approved });
    expect(events.map((e) => [e.name, e.props])).toEqual([['limit_activated', { amount_bucket: '100-250k' }]]);
  });
  it('первый ответ сервера, уже active, другие переходы — без события', () => {
    const events = capture();
    trackLimitTransition(undefined, { status: 'active', approved });
    trackLimitTransition('active', { status: 'active', approved });
    trackLimitTransition('pending', { status: 'ready', approved });
    trackLimitTransition('ready', { status: 'cancelled', approved });
    trackLimitTransition('ready', null);
    expect(events).toEqual([]);
  });
});
