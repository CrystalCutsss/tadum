// Маршруты v1: screen_id каждого пути (01-cabinet-structure.md §1) и безопасный returnTo.
import { describe, expect, it } from 'vitest';

import { readProductDoc, section, tableWithHeader } from '@/test-utils/markdown';

import { ROUTES, familyOfPath, homeOf, safeReturnTo, screenIdFor } from './routes';

describe('01-cabinet-structure.md §1 — screen_id маршрутов v1', () => {
  const rows = tableWithHeader(section(readProductDoc('01-cabinet-structure.md'), '1.'), 'Маршрут').rows;
  const ours = Object.values(ROUTES).filter((p) => p !== '/');
  it.each(ours)('%s', (path) => {
    const row = rows.find((r) => r[0] === path);
    expect(row, `${path} нет в таблице`).toBeDefined();
    expect(screenIdFor(path)).toBe(row![1]!.replace(/`/g, ''));
  });
  it('/ — без screen_id, хвостовой слэш не мешает', () => {
    expect(screenIdFor('/')).toBeNull();
    expect(screenIdFor('/c/home/')).toBe('client.home');
  });
});

describe('семьи и returnTo', () => {
  it('семья по префиксу', () => {
    expect(familyOfPath('/c/documents')).toBe('client');
    expect(familyOfPath('/s/home')).toBe('supplier');
    expect(familyOfPath('/login')).toBeNull();
    expect(homeOf('supplier')).toBe('/s/home');
  });
  it.each(['/c/documents', '/c/documents?tab=1', '/s/home'])('внутренний путь %s принимается', (p) => expect(safeReturnTo(p)).toBe(p));
  it.each(['https://evil.example/c/x', '//evil.example', '/login', '/\\evil', '/c/\u0000', 'c/home', '', 42, null])('%j отклоняется', (p) =>
    expect(safeReturnTo(p)).toBeNull(),
  );
});
