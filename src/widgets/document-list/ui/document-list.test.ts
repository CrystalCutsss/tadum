// Порядок карточек фиксируется при открытии экрана: после загрузки документ остаётся на месте (Кирилл 2026-11-10).
import { describe, expect, it } from 'vitest';

import type { Document } from '@/shared/api';

import { stableOrder } from './document-list';

const doc = (portal_key: string, status: Document['status']) => ({ portal_key, status }) as Document;

describe('stableOrder', () => {
  it('документ, сменивший статус после загрузки, не уезжает вниз', () => {
    const keys = ['vat_sales', 'national_id', 'aoa', 'bs'];
    const afterUpload = [doc('bs', 'received'), doc('aoa', 'pending'), doc('national_id', 'received'), doc('vat_sales', 'rejected')];
    expect(stableOrder(afterUpload, keys).map((d) => d.portal_key)).toEqual(keys);
  });

  it('документы, которых не было при открытии, — в конце', () => {
    const out = stableOrder([doc('bs', 'pending'), doc('vat', 'pending'), doc('aoa', 'pending')], ['aoa', 'bs']);
    expect(out.map((d) => d.portal_key)).toEqual(['aoa', 'bs', 'vat']);
  });
});
