import { describe, expect, it } from 'vitest';

import { crumbsFor, navFor } from './nav';

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

describe('navFor (D-098)', () => {
  it('клиент без активного лимита — только «Application»', () => {
    expect(navFor('client', { clientHome: false }).map((n) => n.to)).toEqual(['/c/documents']);
  });
  it('клиент с активным лимитом — «Home» первым', () => {
    expect(navFor('client', { clientHome: true }).map((n) => n.to)).toEqual(['/c/home', '/c/documents']);
  });
  it('у поставщика меню не зависит от лимита клиента', () => {
    expect(navFor('supplier', { clientHome: false }).map((n) => n.to)).toEqual(['/s/home', '/s/documents']);
  });
});
