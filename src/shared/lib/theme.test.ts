// Тема по умолчанию сборки (A-056): системная; витрина Proto задаёт светлую.
import { describe, expect, it } from 'vitest';

import { initialTheme } from './theme';

describe('initialTheme', () => {
  it('без переменной — системная; витрина задаёт светлую; мусор игнорируется', () => {
    expect(initialTheme(undefined)).toBe('system');
    expect(initialTheme('light')).toBe('light');
    expect(initialTheme('%VITE_DEFAULT_THEME%')).toBe('system');
  });
});
