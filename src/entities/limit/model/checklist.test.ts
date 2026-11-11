import { describe, expect, it } from 'vitest';

import { CHECKLIST_STALE_HOURS, checklistFocusKey, checklistItemView } from './checklist';

const H = 3_600_000;

describe('checklistFocusKey', () => {
  it('первый незавершённый в фиксированном порядке, даже если позже выполненный стоит раньше (SC-06 A5)', () => {
    expect(
      checklistFocusKey([
        { key: 'spa_sadq', status: 'pending' },
        { key: 'pn_company_nafith', status: 'done' },
        { key: 'pn_owner_nafith', status: 'pending' },
      ]),
    ).toBe('spa_sadq');
    expect(
      checklistFocusKey([
        { key: 'spa_sadq', status: 'done' },
        { key: 'pn_company_nafith', status: 'failed' },
        { key: 'pn_owner_nafith', status: 'pending' },
      ]),
    ).toBe('pn_company_nafith');
  });

  it('всё выполнено — акцента нет', () => {
    expect(checklistFocusKey([{ key: 'spa_sadq', status: 'done' }])).toBeNull();
  });
});

describe('checklistItemView', () => {
  const now = 1_000 * H;

  it('done и failed — из данных, отметка не влияет', () => {
    expect(checklistItemView({ status: 'done' }, now, 0, now)).toBe('done');
    expect(checklistItemView({ status: 'failed' }, now, 0, now)).toBe('failed');
  });

  it('pending без отметки — pending', () => {
    expect(checklistItemView({ status: 'pending' }, null, now, now)).toBe('pending');
  });

  it('pending с отметкой после последнего ответа — «ждём подтверждения»; ответ позже отметки снимает её (D-035)', () => {
    expect(checklistItemView({ status: 'pending' }, now - H, now - 2 * H, now)).toBe('in_progress');
    expect(checklistItemView({ status: 'pending' }, now - 2 * H, now - H, now)).toBe('pending');
  });

  it(`in_progress дольше ${CHECKLIST_STALE_HOURS} ч после клика — stale`, () => {
    expect(checklistItemView({ status: 'in_progress' }, now - CHECKLIST_STALE_HOURS * H, now, now)).toBe('stale');
    expect(checklistItemView({ status: 'in_progress' }, now - H, now, now)).toBe('in_progress');
    expect(checklistItemView({ status: 'in_progress' }, null, now, now)).toBe('in_progress');
  });
});
