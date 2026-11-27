import { beforeEach, describe, expect, it } from 'vitest';

import { homeFlags } from './home-flags';

describe('homeFlags', () => {
  beforeEach(() => localStorage.clear());

  it('карточка первого визита закрывается для своего лимита и не возвращается', () => {
    expect(homeFlags.welcomeDismissed('lim_1')).toBe(false);
    homeFlags.dismissWelcome('lim_1');
    expect(homeFlags.welcomeDismissed('lim_1')).toBe(true);
    expect(homeFlags.welcomeDismissed('lim_2')).toBe(false);
  });

  it('свёрнутый блок шагов переживает перезагрузку', () => {
    expect(homeFlags.howToBuyCollapsed()).toBe(false);
    homeFlags.setHowToBuyCollapsed(true);
    expect(homeFlags.howToBuyCollapsed()).toBe(true);
    homeFlags.setHowToBuyCollapsed(false);
    expect(homeFlags.howToBuyCollapsed()).toBe(false);
  });
});
