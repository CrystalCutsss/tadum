import { describe, expect, it } from 'vitest';

import { personaFromParam } from './demo-persona';

describe('personaFromParam', () => {
  it('принимает id через подчёркивание и через дефис (меню просмотрщика Proto)', () => {
    expect(personaFromParam('client_active')).toBe('client_active');
    expect(personaFromParam('client-active')).toBe('client_active');
    expect(personaFromParam('client-approved-unsigned')).toBe('client_approved_unsigned');
  });

  it('пусто — null', () => {
    expect(personaFromParam(null)).toBeNull();
    expect(personaFromParam('')).toBeNull();
  });
});
