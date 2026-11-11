// Тесты чистых функций release:proto (блок 9).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { personaFromParam } from '../src/shared/api/demo-persona';
import { PERSONA_IDS } from '../src/shared/api/fixtures/types';

import { PERSONA_ITEMS, PROTOTYPE_META, PROTO_INSTALL_ARGS, frozenManifest, pendingVersion, releaseVersions, touchedOutsideTadum, injectProtoTags, parseReleaseNotes, versionMeta, versionPackage } from './release-proto.mjs';

describe('injectProtoTags', () => {
  const html = '<!doctype html><html lang="ar" dir="rtl"><head><title>Tadum</title></head><body></body></html>';

  it('добавляет мета-теги версии и загрузчик оболочки, как @proto/build-kit', () => {
    const out = injectProtoTags(html, 'v1');
    expect(out).toContain('<meta name="proto:prototype" content="tadum">');
    expect(out).toContain('<meta name="proto:version" content="v1">');
    expect(out).toContain('<script type="module" src="/_shell/loader.js" data-proto-shell></script>');
    expect(out.indexOf('/_shell/loader.js')).toBeLessThan(out.indexOf('</head>'));
  });

  it('проверки сборки Proto проходят (content="vN" и /_shell/loader.js)', () => {
    const out = injectProtoTags(html, 'v3');
    expect(out.includes('content="v3"') && out.includes('/_shell/loader.js')).toBe(true);
  });

  it('повторная вставка — ошибка', () => {
    expect(() => injectProtoTags(injectProtoTags(html, 'v1'), 'v1')).toThrow();
  });
});

describe('parseReleaseNotes', () => {
  it('берёт название из заголовка и пункты раздела «Что вошло»', () => {
    const md = '# Tadum v2 — документы\n\nТекст.\n\n## Что вошло\n\n- Загрузка\n- Статусы\n\n## Что отложено\n\n- Лимит\n';
    expect(parseReleaseNotes(md)).toEqual({ title: 'документы', changelog: ['Загрузка', 'Статусы'] });
  });

  it('release notes v1 из репозитория разбираются', () => {
    const md = readFileSync(new URL('../docs/releases/v1.md', import.meta.url), 'utf8');
    const { title, changelog } = parseReleaseNotes(md);
    expect(title.length).toBeGreaterThan(5);
    expect(changelog.length).toBeGreaterThan(3);
  });

  it('без раздела «Что вошло» — ошибка', () => {
    expect(() => parseReleaseNotes('# Tadum v1 — x\n')).toThrow();
  });
});

describe('метаданные Proto', () => {
  it('ось «Сценарии и роли» в рамках Proto: ≤ 12 пунктов, id через дефис, все — персоны мока; первый — обычный вход', () => {
    // Схема Proto расширена с 6 до 12 пунктов оси (Кирилл 2026-11-11, A-063).
    expect(PERSONA_ITEMS.length).toBeLessThanOrEqual(12);
    expect(PERSONA_ITEMS[0].id).toBe('login');
    for (const { id } of PERSONA_ITEMS) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    for (const { id } of PERSONA_ITEMS.slice(1)) expect(PERSONA_IDS).toContain(personaFromParam(id));
    // v6: клиентские сценарии экрана документов вернулись в меню (SC-02…SC-04), «Поставщик» убран (Кирилл 2026-11-09).
    // v14: все сценарии этапов после одобрения (A-063).
    expect(PERSONA_ITEMS.map((i) => i.id)).toEqual([
      'login',
      'client-new',
      'client-rejected',
      'client-more-docs',
      'client-offer-pending',
      'client-approved-unsigned',
      'client-signing-partial',
      'client-limit-cancelled',
      'client-active',
      'dual-active',
    ]);
  });

  it('прототип: только компьютер, меню оболочки без версий и в стиле shadcn', () => {
    expect(PROTOTYPE_META).toMatchObject({ platform: 'desktop', platforms: ['desktop'], menu: { versions: false, style: 'shadcn' } });
  });

  it('версия заморожена, history-маршрутизация, имя пакета по правилу Proto', () => {
    const v = versionMeta({ version: 'v1', title: 't', changelog: ['c'], date: '2026-11-05' });
    expect(v).toMatchObject({ version: 'v1', status: 'frozen', routing: 'history' });
    expect(v.axes.map((a) => [a.id, a.title])).toEqual([['persona', 'Сценарии и роли']]);
    expect(versionPackage('v1')).toMatchObject({ name: '@proto/tadum--v1', scripts: { build: 'proto-frozen-build' } });
  });

  it('манифест снимка — sha256 и размеры файлов', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tadum-frozen-'));
    mkdirSync(join(dir, 'assets'));
    writeFileSync(join(dir, 'index.html'), 'a');
    writeFileSync(join(dir, 'assets', 'x.js'), 'bc');
    const m = frozenManifest({ siteDir: dir, version: 'v1', date: '2026-11-05', commit: 'abc' });
    expect(m).toMatchObject({ schemaVersion: 1, prototype: 'tadum', version: 'v1', fileCount: 2, bytes: 3, sourceCommit: 'abc' });
    expect(Object.keys(m.files)).toEqual(['assets/x.js', 'index.html']);
    expect(m.files['index.html']).toBe('ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb');
  });
});

describe('публикация из CI (ADR-004)', () => {
  it('версии из имён release notes — по номеру, не по алфавиту', () => {
    expect(releaseVersions(['v2.md', 'how-to-view.md', 'v10.md', 'v9.md', 'v1.md'])).toEqual(['v1', 'v2', 'v9', 'v10']);
  });
  it('публикуется только самая новая версия, которой ещё нет в Proto', () => {
    expect(pendingVersion(['v4', 'v5'], ['v1', 'v2', 'v3', 'v4'])).toBe('v5');
    expect(pendingVersion(['v4', 'v5'], ['v4', 'v5'])).toBeNull();
    expect(pendingVersion([], ['v1'])).toBeNull();
  });
  it('публикация не трогает чужие файлы Proto', () => {
    expect(touchedOutsideTadum(['prototypes/tadum/versions/v6/version.json', 'pnpm-lock.yaml', ''])).toEqual([]);
    expect(touchedOutsideTadum(['prototypes/credit-activation/prototype.json', 'packages/proto-shell/src/menu.ts'])).toEqual([
      'prototypes/credit-activation/prototype.json',
      'packages/proto-shell/src/menu.ts',
    ]);
  });
  it('pnpm install в Proto обновляет lock-файл и в CI (там по умолчанию --frozen-lockfile)', () => {
    // Регрессия v6 (2026-11-09): ERR_PNPM_OUTDATED_LOCKFILE на новом пакете версии.
    expect(PROTO_INSTALL_ARGS).toEqual(['install', '--no-frozen-lockfile']);
  });
  it('клон Proto в рабочей копии (release.yml, path: proto) не делает дерево Tadum грязным', () => {
    // Регрессия v6 (2026-11-09): без /proto/ в .gitignore release:proto в CI падал на «незакоммиченных изменениях».
    const root = join(import.meta.dirname, '..');
    // В контейнере CI рабочая копия принадлежит другому пользователю: safe.directory — только для этого вызова.
    const ignored = execFileSync('git', ['-c', 'safe.directory=*', '-C', root, 'check-ignore', 'proto/packages/registry'], { encoding: 'utf8' });
    expect(ignored.trim()).toBe('proto/packages/registry');
  });
});
