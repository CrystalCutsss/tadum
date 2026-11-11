import { describe, expect, it } from 'vitest';

import { crumbsFor } from './nav';

describe('crumbsFor', () => {
  it('страница первого уровня — одна крошка (в шапке не показывается)', () => {
    expect(crumbsFor('client', '/c/documents')).toEqual([{ labelKey: 'nav.application' }]);
  });
});
