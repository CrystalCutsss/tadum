import { describe, expect, it } from 'vitest';

import { submitProgress } from './submit-progress';

describe('submitProgress', () => {
  it('сегмент на каждый документ и на поле CR', () => {
    const p = submitProgress({ uploaded: 2, total: 4, requiredRemaining: 2 }, { required: true, ready: false });
    expect(p.segments).toEqual([true, true, false, false, false]);
    expect(p.copy).toBe('documents');
    expect(p.minutesLeft).toBe(5);
  });

  it('документы загружены — осталось только поле CR', () => {
    const p = submitProgress({ uploaded: 4, total: 4, requiredRemaining: 0 }, { required: true, ready: false });
    expect(p.copy).toBe('cr_only');
    expect(p.minutesLeft).toBe(1);
  });

  it('поле CR заполнено — сегменты по очереди от начала, без отдельного места для CR', () => {
    const p = submitProgress({ uploaded: 1, total: 3, requiredRemaining: 2 }, { required: true, ready: true });
    expect(p.segments).toEqual([true, true, false, false]);
    expect(p.copy).toBe('documents');
  });

  it('без поля CR — только документы', () => {
    const p = submitProgress({ uploaded: 1, total: 3, requiredRemaining: 2 }, { required: false, ready: true });
    expect(p.segments).toEqual([true, false, false]);
    expect(p.copy).toBe('documents');
    expect(p.minutesLeft).toBe(4);
  });

  it('всё готово — времени не осталось', () => {
    const p = submitProgress({ uploaded: 3, total: 3, requiredRemaining: 0 }, { required: true, ready: true });
    expect(p.segments).toEqual([true, true, true, true]);
    expect(p.minutesLeft).toBe(0);
  });
});
