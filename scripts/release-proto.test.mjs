// Тесты чистых функций release:proto (блок 9).
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { PERSONA_IDS } from '../src/shared/api/fixtures/types';

import { PERSONA_ITEMS, frozenManifest, injectProtoTags, parseReleaseNotes, versionMeta, versionPackage } from './release-proto.mjs';

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
  it('ось «Персона» покрывает всех персон мока; первый пункт — обычный вход', () => {
    expect(PERSONA_ITEMS[0].id).toBe('login');
    expect(PERSONA_ITEMS.slice(1).map((p) => p.id)).toEqual([...PERSONA_IDS]);
  });

  it('версия заморожена, history-маршрутизация, имя пакета по правилу Proto', () => {
    const v = versionMeta({ version: 'v1', title: 't', changelog: ['c'], date: '2026-11-05' });
    expect(v).toMatchObject({ version: 'v1', status: 'frozen', routing: 'history' });
    expect(v.axes.map((a) => a.id)).toEqual(['persona', 'lang']);
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
