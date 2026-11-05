// D-034, SC-05 A6/A6a — когда показывать баннер смены статуса.
import { describe, expect, it } from 'vitest';

import { statusMemory, statusNoticeOnEnter } from './status-notice';

describe('баннер смены статуса при входе (A6a)', () => {
  it('первый вход — без баннера', () => expect(statusNoticeOnEnter({ lastSeen: null, dismissed: null }, 'under_review')).toEqual({ kind: 'none' }));
  it('статус не менялся — без баннера', () => expect(statusNoticeOnEnter({ lastSeen: 'under_review', dismissed: null }, 'under_review')).toEqual({ kind: 'none' }));
  it('сменился, пока клиента не было — баннер from → to', () =>
    expect(statusNoticeOnEnter({ lastSeen: 'under_review', dismissed: null }, 'approved')).toEqual({ kind: 'banner', from: 'under_review', to: 'approved' }));
  it('закрытие запоминается для этого перехода', () => {
    statusMemory.seen('under_review');
    statusMemory.dismiss('under_review', 'approved');
    expect(statusNoticeOnEnter(statusMemory.read(), 'approved')).toEqual({ kind: 'none' });
    expect(statusMemory.read().lastSeen).toBe('approved');
  });
  it('новый переход после закрытого — снова баннер', () =>
    expect(statusNoticeOnEnter({ lastSeen: 'approved', dismissed: 'under_review->approved' }, 'first_purchase')).toMatchObject({ kind: 'banner', to: 'first_purchase' }));
});
