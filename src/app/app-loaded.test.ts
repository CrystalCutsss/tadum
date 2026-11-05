import { describe, expect, it } from 'vitest';

import { swStateOf } from './app-loaded';

describe('swStateOf', () => {
  it('без контроллера — none', () => {
    expect(swStateOf(false, true)).toBe('none');
  });
  it('контроллер есть — installed, после смены воркера — updated', () => {
    expect(swStateOf(true, false)).toBe('installed');
    expect(swStateOf(true, true)).toBe('updated');
  });
});
