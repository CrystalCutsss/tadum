import { describe, expect, it } from 'vitest';

import { applicationStage } from './stage';

describe('applicationStage (A-063)', () => {
  it('до одобрения и без лимита — документы', () => {
    for (const s of ['docs_required', 'under_review', 'closed'] as const) expect(applicationStage(s, { status: 'active' })).toBe('documents');
    expect(applicationStage('approved', null)).toBe('documents');
  });
  it('approved: pending → решение, ready → подписание, active → лимит одобрен, cancelled/rejected → отменён', () => {
    expect(applicationStage('approved', { status: 'pending' })).toBe('decision');
    expect(applicationStage('approved', { status: 'ready' })).toBe('signing');
    expect(applicationStage('approved', { status: 'active' })).toBe('approved');
    expect(applicationStage('approved', { status: 'cancelled' })).toBe('cancelled');
    expect(applicationStage('approved', { status: 'rejected' })).toBe('cancelled');
  });
  it('first_purchase с активным лимитом — лимит одобрен', () => {
    expect(applicationStage('first_purchase', { status: 'active' })).toBe('approved');
  });
});
