// dependency-cruiser: циклы и направление слоёв (дублирует ESLint boundaries на уровне графа модулей).
// Слои: app → pages → widgets → features → entities → shared.

const layer = (name) => `^src/${name}/`;

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Циклические зависимости запрещены.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      comment: 'Импорт не разрешается в файл.',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'shared-is-bottom',
      severity: 'error',
      comment: 'shared не импортирует верхние слои.',
      from: { path: layer('shared') },
      to: { path: '^src/(app|pages|widgets|features|entities)/' },
    },
    {
      name: 'entities-down-only',
      severity: 'error',
      from: { path: layer('entities') },
      to: { path: '^src/(app|pages|widgets|features)/' },
    },
    {
      name: 'features-down-only',
      severity: 'error',
      from: { path: layer('features') },
      to: { path: '^src/(app|pages|widgets)/' },
    },
    {
      name: 'widgets-down-only',
      severity: 'error',
      from: { path: layer('widgets') },
      to: { path: '^src/(app|pages)/' },
    },
    {
      name: 'pages-down-only',
      severity: 'error',
      from: { path: layer('pages') },
      to: { path: '^src/app/' },
    },
    {
      name: 'no-cross-slice',
      severity: 'error',
      comment: 'Срезы одного слоя (кроме shared) не импортируют друг друга.',
      from: { path: '^src/(widgets|features|entities)/([^/]+)/' },
      to: { path: '^src/$1/', pathNot: '^src/$1/$2/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: ['routeTree\\.gen\\.ts$'] },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.app.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '.d.ts'],
    },
    reporterOptions: {
      archi: { collapsePattern: '^src/[^/]+/[^/]+' },
    },
  },
};
