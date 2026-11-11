// Демо-переключение ролей (Кирилл 2026-11-11): у персоны с одной ролью «Supplier» → supplier_active,
// «Client» → последняя клиентская персона (по умолчанию client_active).
import { beforeEach, describe, expect, it } from 'vitest';

import { demoPersona } from '@/shared/api';
import { storage } from '@/shared/lib';

import { demoPersonaFor } from './role-switch';

beforeEach(() => storage.remove('demo:last_client_persona'));

describe('demoPersonaFor', () => {
  it('клиент → поставщик: supplier_active, клиентская персона запоминается', () => {
    demoPersona.set('client_signing_partial');
    expect(demoPersonaFor('client', 'supplier')).toBe('supplier_active');
    demoPersona.set('supplier_active');
    expect(demoPersonaFor('supplier', 'client')).toBe('client_signing_partial');
  });
  it('без запомненной клиентской персоны — client_active', () => {
    demoPersona.set('supplier_new');
    expect(demoPersonaFor('supplier', 'client')).toBe('client_active');
  });
});
