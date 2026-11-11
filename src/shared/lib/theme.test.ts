// Тема по умолчанию (A-062): светлая, даже если в системе тёмная; сборка может задать другую.
import { describe, expect, it } from 'vitest';

import { initialTheme } from './theme';

describe('initialTheme', () => {
  it('без переменной — светлая; сборка может задать другую; мусор игнорируется', () => {
    expect(initialTheme(undefined)).toBe('light');
    expect(initialTheme('dark')).toBe('dark');
    expect(initialTheme('system')).toBe('system');
    expect(initialTheme('%VITE_DEFAULT_THEME%')).toBe('light');
  });
});
