// release:proto — публикация версии Tadum на витрину Proto (ADR-003, мастер-промпт блок 9, A-052).
//
// Повторяет механизм Proto, а не изобретает свой: версия прототипа — workspace-пакет
// prototypes/<slug>/versions/<vN>/; готовая сборка из другого репозитория кладётся как замороженная
// версия (ADR-0010 Proto): .frozen/site + .frozen/manifest.json, сборка Proto её только копирует.
// В main Proto попадает через PR, который мержит Кирилл; Workers Builds деплоит витрину после merge.
//
//   pnpm run release:proto vN --proto-dir <путь к клону Proto>            подготовить коммит в ветке Proto
//   pnpm run release:proto vN --proto-dir <путь> --publish                push ветки Proto (после «да»)
//   --proto-branch <имя>   ветка в Proto (по умолчанию feat/tadum-vN); существующая — только без своих коммитов
//   pnpm run release:proto vN --tag                                       тег vN в Tadum (после деплоя)
//   pnpm run release:proto --ci --proto-dir <путь>                         GitHub Actions после merge в main Tadum:
//                         последняя docs/releases/vN.md, которой ещё нет в Proto, сразу в main Proto (ADR-004)
//
// Каждый шаг останавливается и печатает, что проверить и что делать дальше. В main ничего не пушится.
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

export const SLUG = 'tadum';
const VERSION_RE = /^v[1-9][0-9]{0,3}$/;
const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

/**
 * Ось меню просмотрщика «Сценарии и роли» — единственный способ сменить персону на витрине: демо-панели нет
 * (Кирилл 2026-11-06). Ограничения Proto: не больше 6 пунктов, id через дефис (Tadum принимает
 * ?persona=client-active так же, как client_active). Первый пункт — без персоны: обычный вход.
 * Пункты «Клиент: новая заявка» (client-new), «Клиент: на проверке» (client-submitted) и «Клиент: лимит
 * активен» (client-active) убраны до готовности соответствующего функционала — вернуть, когда он будет готов.
 */
export const PERSONA_ITEMS = [
  { id: 'login', title: 'Вход по номеру' },
  { id: 'supplier-active', title: 'Поставщик' },
  { id: 'dual-active', title: 'Клиент и поставщик' },
];

export const PROTOTYPE_META = {
  $schema: '../../packages/registry/schemas/prototype.schema.json',
  title: 'Tadum',
  description:
    'B2B-портал для KSA: заявка на торговый лимит, документы и статус клиента, кабинет поставщика. Арабский (RTL) и английский, мок-данные с персонами. Собирается в репозитории tadum и публикуется сюда замороженной версией.',
  owner: 'Кирилл',
  tags: ['tadum', 'b2b', 'rtl', 'pwa'],
  status: 'active',
  // Только компьютер, на всё окно: «Экран» (ПК / Телефон) убран из меню (Кирилл 2026-11-06).
  platform: 'desktop',
  platforms: ['desktop'],
  // Меню оболочки для Tadum (Кирилл 2026-11-06, ADR-0027 Proto): без переключения версий, в стиле shadcn.
  menu: { versions: false, style: 'shadcn' },
  defaultVersion: 'latest',
  separatePassword: true,
};

// ---------- Чистые функции (покрыты тестами) ----------

/** Теги, которые @proto/build-kit добавляет в каждую версию: контекст для оболочки и её загрузчик. */
export function injectProtoTags(html, version) {
  if (html.includes('/_shell/loader.js')) throw new Error('index.html уже содержит загрузчик оболочки Proto');
  const tags = [
    '<meta name="robots" content="noindex, nofollow">',
    `<meta name="proto:prototype" content="${SLUG}">`,
    `<meta name="proto:version" content="${version}">`,
    '<script type="module" src="/_shell/loader.js" data-proto-shell></script>',
  ].join('\n    ');
  if (!html.includes('</head>')) throw new Error('index.html без </head>');
  return html.replace('</head>', `    ${tags}\n  </head>`);
}

/** Список изменений и название версии из docs/releases/vN.md: заголовок «# … — <название>», раздел «## Что вошло». */
export function parseReleaseNotes(markdown) {
  const title = /^# .+? — (.+)$/m.exec(markdown)?.[1]?.trim();
  const section = /^## Что вошло\n([\s\S]*?)(?=^## |$(?![\s\S]))/m.exec(markdown)?.[1] ?? '';
  const changelog = section
    .split('\n')
    .filter((l) => l.startsWith('- '))
    .map((l) => l.slice(2).trim());
  if (!title) throw new Error('в release notes нет заголовка «# Tadum vN — <название>»');
  if (changelog.length === 0) throw new Error('в release notes нет пунктов в разделе «## Что вошло»');
  return { title, changelog };
}

export function versionMeta({ version, title, changelog, date }) {
  return {
    $schema: '../../../../packages/registry/schemas/version.schema.json',
    version,
    title,
    date,
    author: 'Claude',
    status: 'frozen',
    changelog,
    routing: 'history',
    routes: ['/login', '/c/home', '/c/documents', '/c/help', '/s/home', '/s/documents', '/s/help'],
    // Только «Сценарии и роли». Оси «Язык» нет (Кирилл 2026-11-06): на витрине по умолчанию английский
    // (VITE_DEFAULT_LANG=en, A-056), язык меняет кнопка в шапке кабинета.
    axes: [{ id: 'persona', title: 'Сценарии и роли', items: PERSONA_ITEMS }],
  };
}

/** package.json замороженной версии — как после `pnpm proto:freeze`. */
export function versionPackage(version) {
  return {
    name: `@proto/${SLUG}--${version}`,
    version: '0.0.0',
    private: true,
    type: 'module',
    description: 'Замороженная сборка из репозитория tadum (pnpm run release:proto). Исходников здесь нет.',
    scripts: { build: 'proto-frozen-build', typecheck: 'proto-frozen-build --check' },
    devDependencies: { '@proto/build-kit': 'workspace:*' },
  };
}

function walkFiles(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((d) => (d.isDirectory() ? walkFiles(join(dir, d.name)) : [join(dir, d.name)]))
    .sort();
}

/** sha256 каждого файла по относительному POSIX-пути — тот же формат, что hashTree в @proto/build-kit. */
export function hashTree(dir) {
  const files = {};
  for (const file of walkFiles(dir)) {
    files[relative(dir, file).split('\\').join('/')] = createHash('sha256').update(readFileSync(file)).digest('hex');
  }
  return files;
}

export function frozenManifest({ siteDir, version, date, commit }) {
  const files = hashTree(siteDir);
  return {
    schemaVersion: 1,
    prototype: SLUG,
    version,
    frozenAt: date,
    sourceCommit: commit,
    fileCount: Object.keys(files).length,
    bytes: Object.keys(files).reduce((sum, f) => sum + statSync(join(siteDir, f)).size, 0),
    files,
  };
}

// ---------- Шаги ----------

const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: 'utf8', ...opts }).trim();
function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (res.status !== 0) stop(`команда не прошла: ${cmd} ${args.join(' ')}`);
}
function stop(message) {
  console.error(`\n✗ release:proto: ${message}`);
  process.exit(1);
}
const today = () => sh('date', ['-u', '+%Y-%m-%d']);

function checkTadum(ci = false) {
  if (sh('git', ['-C', ROOT, 'status', '--porcelain'])) stop('в Tadum есть незакоммиченные изменения');
  // В Actions код уже прошёл ci в PR и смержен Кириллом; HEAD там может быть отсоединён.
  if (ci) return console.log(`✓ Tadum (ci) @ ${sh('git', ['-C', ROOT, 'rev-parse', '--short', 'HEAD'])}, дерево чистое`);
  const branch = sh('git', ['-C', ROOT, 'symbolic-ref', '--short', 'HEAD']);
  if (branch !== 'main' && !branch.startsWith('chore/release-')) stop(`публикация — с main или chore/release-*, а не с ${branch}`);
  console.log(`✓ Tadum: ${branch} @ ${sh('git', ['-C', ROOT, 'rev-parse', '--short', 'HEAD'])}, дерево чистое`);
}

function checkProto(proto) {
  if (!existsSync(join(proto, 'packages/registry'))) stop(`${proto} — не клон Proto`);
  run('git', ['-C', proto, 'fetch', 'origin', 'main']);
  if (sh('git', ['-C', proto, 'status', '--porcelain'])) stop('в Proto есть незакоммиченные изменения — разберите их до публикации');
}

/** Ветка публикации в Proto от свежего origin/main. Существующая подходит, только если в ней нет своих коммитов. */
function switchProtoBranch(proto, branch) {
  const exists = spawnSync('git', ['-C', proto, 'rev-parse', '--verify', '--quiet', `refs/heads/${branch}`]).status === 0;
  if (!exists) return run('git', ['-C', proto, 'switch', '-c', branch, 'origin/main']);
  if (sh('git', ['-C', proto, 'rev-list', `origin/main..${branch}`])) stop(`в ветке Proto ${branch} уже есть свои коммиты — выберите другую (--proto-branch)`);
  run('git', ['-C', proto, 'switch', branch]);
  run('git', ['-C', proto, 'merge', '--ff-only', 'origin/main']);
}

/** Файлы коммита публикации вне prototypes/tadum/** и pnpm-lock.yaml — их быть не должно (ADR-004). */
export function touchedOutsideTadum(files) {
  return files.filter((f) => f && !f.startsWith(`prototypes/${SLUG}/`) && f !== 'pnpm-lock.yaml');
}

/** Номера версий vN из имён файлов docs/releases/vN.md, по возрастанию. */
export function releaseVersions(names) {
  return names
    .map((n) => /^(v[1-9][0-9]{0,3})\.md$/.exec(n)?.[1])
    .filter(Boolean)
    .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
}

/** Версия к публикации: самая новая из release notes, если её ещё нет в Proto; иначе null. */
export function pendingVersion(versions, published) {
  const latest = versions.at(-1);
  return latest && !published.includes(latest) ? latest : null;
}

function prepare(version, proto, branch, ci = false) {
  const notesFile = join(ROOT, 'docs/releases', `${version}.md`);
  if (!existsSync(notesFile)) stop(`нет release notes ${relative(ROOT, notesFile)}`);
  const { title, changelog } = parseReleaseNotes(readFileSync(notesFile, 'utf8'));

  checkTadum(ci);
  checkProto(proto);
  const versionDir = join(proto, 'prototypes', SLUG, 'versions', version);
  if (sh('git', ['-C', proto, 'ls-tree', '--name-only', 'origin/main', `prototypes/${SLUG}/versions/${version}`]))
    stop(`${version} уже опубликована в Proto. Замороженные версии не меняются — выпустите следующую.`);

  // В ci verify уже прошёл в PR (job ci); здесь только сборка и проверки Proto.
  if (!ci) {
    console.log('\n→ pnpm verify (Tadum)');
    run('pnpm', ['verify'], { cwd: ROOT });
  }

  if (ci) run('git', ['-C', proto, 'switch', '-C', 'main', 'origin/main']);
  else switchProtoBranch(proto, branch);

  console.log(`\n→ сборка Tadum под /p/${SLUG}/${version}/`);
  run('pnpm', ['build'], {
    cwd: ROOT,
    env: { ...process.env, VITE_BASE_PATH: `/p/${SLUG}/${version}/`, VITE_DEMO_PANEL: '1', VITE_ANALYTICS: 'console', VITE_PROTO_VERSION: version,
      // Витрина: английский и светлая тема по умолчанию (A-056); в продукте — арабский и системная.
      VITE_DEFAULT_LANG: 'en', VITE_DEFAULT_THEME: 'light' },
  });
  const dist = join(ROOT, 'dist');
  // У превью-воркера свои заголовки (noindex); витрина задаёт их сама.
  rmSync(join(dist, '_headers'), { force: true });
  writeFileSync(join(dist, 'index.html'), injectProtoTags(readFileSync(join(dist, 'index.html'), 'utf8'), version));

  const date = today();
  const protoDir = join(proto, 'prototypes', SLUG);
  mkdirSync(versionDir, { recursive: true });
  if (!existsSync(join(protoDir, 'prototype.json'))) writeFileSync(join(protoDir, 'prototype.json'), json(PROTOTYPE_META));
  const site = join(versionDir, '.frozen', 'site');
  cpSync(dist, site, { recursive: true });
  const commit = sh('git', ['-C', ROOT, 'rev-parse', 'HEAD']);
  writeFileSync(join(versionDir, '.frozen', 'manifest.json'), json(frozenManifest({ siteDir: site, version, date, commit })));
  writeFileSync(join(versionDir, 'version.json'), json(versionMeta({ version, title, changelog, date })));
  writeFileSync(join(versionDir, 'package.json'), json(versionPackage(version)));

  console.log('\n→ Proto: pnpm install, форматирование, проверка реестра и линт, сборка витрины');
  run('pnpm', ['install'], { cwd: proto });
  // Метаданные — в стиле Proto (его Prettier проверяет CI); .frozen/ Prettier Proto игнорирует.
  const meta = [`prototypes/${SLUG}/prototype.json`, `prototypes/${SLUG}/versions/${version}/version.json`, `prototypes/${SLUG}/versions/${version}/package.json`];
  run('pnpm', ['exec', 'prettier', '--write', ...meta], { cwd: proto });
  run('pnpm', ['registry:validate'], { cwd: proto });
  run('pnpm', ['lint'], { cwd: proto });
  run('pnpm', ['site:build', '--no-previews'], { cwd: proto });

  run('git', ['-C', proto, 'add', `prototypes/${SLUG}`, 'pnpm-lock.yaml']);
  // Proto общий с другими прототипами: публикация трогает только Tadum и запись нового пакета в lock-файле.
  const outside = touchedOutsideTadum(sh('git', ['-C', proto, 'diff', '--cached', '--name-only']).split('\n'));
  if (outside.length) stop(`публикация затронула бы чужие файлы Proto: ${outside.join(', ')}`);
  run('git', ['-C', proto, 'commit', '-m', `${SLUG} ${version}: publish from the tadum repo as a frozen snapshot`, '-m', `Source: tadum@${commit}`]);

  if (ci) {
    // ADR-004 (Tadum) / ADR-0028 (Proto): бот Tadum пишет в main Proto только prototypes/tadum/**.
    run('git', ['-C', proto, 'push', 'origin', 'HEAD:main']);
    console.log(`\n✓ ${version} в main Proto. Workers Builds выложит витрину: https://proto.kirillgloba.workers.dev/p/${SLUG}/${version}/`);
    return;
  }
  console.log(`\n⏸ Готово к решению Кирилла. Ветка Proto ${branch}, коммит не запушен.`);
  console.log(sh('git', ['-C', proto, 'show', '--stat', '--format=%h %s', 'HEAD']).split('\n').slice(0, 12).join('\n'));
  console.log(`\nПроверить локально: cd ${proto} && PROTO_PREVIEW_PASSWORD=<любой> pnpm site:preview → /p/${SLUG}/${version}/`);
  console.log(`После «да»: pnpm run release:proto ${version} --proto-dir ${proto} --proto-branch ${branch} --publish`);
}

function publish(version, proto, branch) {
  const current = sh('git', ['-C', proto, 'symbolic-ref', '--short', 'HEAD']);
  if (current !== branch) stop(`в Proto активна ветка ${current}, нужна ${branch} — сначала подготовка`);
  if (sh('git', ['-C', proto, 'status', '--porcelain'])) stop('в Proto есть незакоммиченные изменения');
  run('git', ['-C', proto, 'push', '-u', 'origin', branch]);
  console.log(`\n✓ Ветка ${branch} в Proto запушена. Дальше:`);
  console.log('  1. PR в main Proto (GitHub MCP или gh pr create); merge делает Кирилл;');
  console.log('  2. после merge Workers Builds деплоит витрину сам;');
  console.log(`  3. пароль Tadum — секрет PROTOTYPE_PASSWORDS воркера proto (ставит Кирилл, см. docs/release.md);`);
  console.log(`  4. проверка /p/${SLUG}/${version}/ и тег: pnpm run release:proto ${version} --tag`);
}

function tag(version) {
  if (sh('git', ['-C', ROOT, 'tag', '--list', version])) stop(`тег ${version} уже есть`);
  run('git', ['-C', ROOT, 'fetch', 'origin', 'main']);
  run('git', ['-C', ROOT, 'tag', '-a', version, 'origin/main', '-m', `Tadum ${version} on the Proto showcase`]);
  // В облачной сессии push тегов закрыт git-прокси: тогда тег ставят через GitHub → Releases (docs/release.md).
  run('git', ['-C', ROOT, 'push', 'origin', version]);
  console.log(`✓ Тег ${version} на origin/main. Ссылка: https://proto.kirillgloba.workers.dev/p/${SLUG}/${version}/`);
  console.log('Откат витрины: revert PR публикации в Proto (после merge Workers Builds задеплоит предыдущее состояние).');
}

/** Режим GitHub Actions: публикует новую версию, если в docs/releases появилась vN, которой нет в Proto. */
function ci(proto) {
  if (!proto) stop('укажите --proto-dir <путь к клону Proto> или PROTO_DIR');
  const dir = resolve(proto);
  run('git', ['-C', dir, 'fetch', 'origin', 'main']);
  const published = sh('git', ['-C', dir, 'ls-tree', '--name-only', `origin/main:prototypes/${SLUG}/versions`]).split('\n');
  const version = pendingVersion(releaseVersions(readdirSync(join(ROOT, 'docs/releases'))), published);
  // Для GitHub Actions: следующий шаг (тег и релиз) знает, что публиковать.
  if (process.env.GITHUB_OUTPUT) writeFileSync(process.env.GITHUB_OUTPUT, `version=${version ?? ''}\n`, { flag: 'a' });
  if (!version) return console.log('Новой версии нет: последняя из docs/releases уже в Proto.');
  console.log(`→ публикую ${version}`);
  return prepare(version, dir, 'main', true);
}

function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      'proto-dir': { type: 'string' },
      'proto-branch': { type: 'string' },
      publish: { type: 'boolean', default: false },
      tag: { type: 'boolean', default: false },
      ci: { type: 'boolean', default: false },
    },
  });
  if (values.ci) return ci(values['proto-dir'] ?? process.env.PROTO_DIR);
  const version = positionals[0] ?? '';
  if (!VERSION_RE.test(version)) stop('укажите версию: pnpm run release:proto v1 --proto-dir <путь к Proto>');
  if (values.tag) return tag(version);
  const proto = values['proto-dir'] ?? process.env.PROTO_DIR;
  if (!proto) stop('укажите --proto-dir <путь к клону Proto> или PROTO_DIR');
  const branch = values['proto-branch'] ?? `feat/${SLUG}-${version}`;
  return values.publish ? publish(version, resolve(proto), branch) : prepare(version, resolve(proto), branch);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
