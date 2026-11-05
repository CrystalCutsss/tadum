// Stylelint — только для CSS-файлов (классы в TSX проверяет ESLint).
// Сырые цвета разрешены только в src/styles/tokens.css: остальные файлы берут значения из токенов.
/** @type {import('stylelint').Config} */
export default {
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['theme', 'custom-variant', 'apply', 'utility', 'variant', 'source', 'plugin', 'config', 'reference', 'layer', 'import'],
      },
    ],
    'color-no-hex': true,
    'function-disallowed-list': ['rgb', 'rgba', 'hsl', 'hsla', 'oklch', 'oklab', 'lab', 'lch', 'hwb', 'color'],
    'color-named': 'never',
  },
  overrides: [
    {
      files: ['src/styles/tokens.css'],
      rules: { 'color-no-hex': null, 'function-disallowed-list': null, 'color-named': null },
    },
  ],
};
