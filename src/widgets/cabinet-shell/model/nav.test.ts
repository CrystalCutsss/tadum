import { describe, expect, it } from 'vitest';

import { crumbsFor } from './nav';

describe('crumbsFor', () => {
  it('страница первого уровня — одна крошка (в шапке не показывается)', () => {
    expect(crumbsFor('client', '/c/documents')).toEqual([{ labelKey: 'nav.application' }]);
  });
  it('экран подписания — «Application › Sign documents» со ссылкой на заявку (D-083)', () => {
    expect(crumbsFor('client', '/c/documents/sign')).toEqual([
      { labelKey: 'nav.application', to: '/c/documents' },
      { labelKey: 'signing.title' },
    ]);
  });
});
