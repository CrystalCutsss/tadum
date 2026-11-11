import { describe, expect, it } from 'vitest';

import { crumbsFor } from './nav';

describe('crumbsFor', () => {
  it('страница первого уровня — одна крошка (в шапке не показывается)', () => {
    expect(crumbsFor('client', '/c/documents')).toEqual([{ labelKey: 'nav.application' }]);
    expect(crumbsFor('client', '/c/documents', '?persona=client_active')).toEqual([{ labelKey: 'nav.application' }]);
  });
  it('подробности заявки — «Application › Application details» со ссылкой на заявку (A-063)', () => {
    expect(crumbsFor('client', '/c/documents', '?view=details')).toEqual([
      { labelKey: 'nav.application', to: '/c/documents' },
      { labelKey: 'application.details.title' },
    ]);
  });
  it('у поставщика view=details не меняет крошки', () => {
    expect(crumbsFor('supplier', '/s/documents', '?view=details')).toEqual([{ labelKey: 'nav.documents' }]);
  });
});
