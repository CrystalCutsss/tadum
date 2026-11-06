// Тесты чистых функций превью ветки (A-053).
import { describe, expect, it } from 'vitest';

import { MAX_NAME, previewName, previewUrl } from './deploy-branch.mjs';

describe('previewName', () => {
  it('turns a branch into a DNS-safe name', () => {
    expect(previewName('feat/TD-12_login')).toBe('feat-td-12-login');
    expect(previewName('fix//double--dash/')).toBe('fix-double-dash');
  });

  it('keeps long names within the DNS label limit and distinct', () => {
    const a = previewName(`feat/${'a'.repeat(80)}-one`);
    const b = previewName(`feat/${'a'.repeat(80)}-two`);
    expect(a.length).toBeLessThanOrEqual(MAX_NAME);
    expect(`${a}-tadum`.length).toBeLessThanOrEqual(63);
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[a-z0-9-]+[a-z0-9]$/);
  });

  it('rejects a branch with no usable characters', () => {
    expect(() => previewName('///')).toThrow();
  });
});

describe('previewUrl', () => {
  it('reads the preview URL from wrangler JSON', () => {
    const json = JSON.stringify({ preview: { urls: ['https://feat-x-tadum.example.workers.dev'] } });
    expect(previewUrl(json)).toBe('https://feat-x-tadum.example.workers.dev');
  });

  it('fails without a URL', () => {
    expect(() => previewUrl({ preview: { urls: [] } })).toThrow();
  });
});
