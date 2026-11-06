#!/usr/bin/env node
// Проверка контраста WCAG 2.2 AA для токенов src/styles/tokens.css в светлой и тёмной теме.
// Обязательные пары — семантические токены Tadum (статусы, прогресс лимита): при нарушении код выхода 1.
// Пары пресета shadcn только печатаются: пресет не меняется агентом (D-077), решение — за Кириллом.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { converter, parse, wcagContrast } from 'culori';

const FILE = fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url));
const toRgb = converter('rgb');

/** Переменные из блоков `:root {}` и `.dark {}` верхнего уровня (блоки внутри @media пропускаются). */
export function parseThemes(css) {
  const themes = { light: {}, dark: {} };
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let depth = 0;
  let current = null;
  let i = 0;
  while (i < clean.length) {
    const ch = clean[i];
    if (ch === '{') {
      const start = Math.max(clean.lastIndexOf('}', i - 1), clean.lastIndexOf('{', i - 1), clean.lastIndexOf(';', i - 1));
      const selector = clean.slice(start + 1, i).trim();
      if (depth === 0 && (selector === ':root' || selector === '.dark')) current = selector === ':root' ? 'light' : 'dark';
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) current = null;
    } else if (current && depth === 1 && clean.startsWith('--', i)) {
      const end = clean.indexOf(';', i);
      const decl = clean.slice(i, end);
      const colon = decl.indexOf(':');
      themes[current][decl.slice(0, colon).trim()] = decl.slice(colon + 1).trim();
      i = end;
    }
    i += 1;
  }
  // Тёмная тема наследует всё, что не переопределено.
  themes.dark = { ...themes.light, ...themes.dark };
  return themes;
}

function resolve(vars, name, seen = new Set()) {
  const raw = vars[name];
  if (raw === undefined) throw new Error(`нет токена ${name}`);
  const m = raw.match(/^var\((--[\w-]+)\)$/);
  if (!m) return raw;
  if (seen.has(m[1])) throw new Error(`цикл в ${name}`);
  seen.add(m[1]);
  return resolve(vars, m[1], seen);
}

/** Цвет токена в sRGB; полупрозрачный — накладывается на фон. */
function color(vars, name, backdrop) {
  const c = toRgb(parse(resolve(vars, name)));
  if (!c) throw new Error(`не цвет: ${name}`);
  const a = c.alpha ?? 1;
  if (a >= 1 || !backdrop) return c;
  return { mode: 'rgb', r: c.r * a + backdrop.r * (1 - a), g: c.g * a + backdrop.g * (1 - a), b: c.b * a + backdrop.b * (1 - a) };
}

const STATUSES = ['pending', 'received', 'rejected', 'approved'];

export const REQUIRED = [
  ...STATUSES.flatMap((s) => [
    { fg: `--status-${s}`, bg: `--status-${s}-muted`, min: 4.5, what: 'текст бейджа на его фоне' },
    { fg: `--status-${s}-foreground`, bg: `--status-${s}`, min: 4.5, what: 'текст на заливке статуса' },
    { fg: `--status-${s}`, bg: '--background', min: 4.5, what: 'статус на фоне страницы' },
    { fg: `--status-${s}`, bg: '--card', min: 4.5, what: 'статус на карточке' },
  ]),
  { fg: '--limit-fill', bg: '--limit-track', min: 3, what: 'заполнение лимита против дорожки (1.4.11)' },
  { fg: '--whatsapp-foreground', bg: '--whatsapp', min: 4.5, what: 'текст кнопки WhatsApp на её заливке' },
  { fg: '--limit-track', bg: '--card', min: 1, what: 'дорожка видна на карточке (информативно)' },
];

export const PRESET = [
  { fg: '--foreground', bg: '--background', min: 4.5 },
  { fg: '--card-foreground', bg: '--card', min: 4.5 },
  { fg: '--popover-foreground', bg: '--popover', min: 4.5 },
  { fg: '--primary-foreground', bg: '--primary', min: 4.5 },
  { fg: '--secondary-foreground', bg: '--secondary', min: 4.5 },
  { fg: '--muted-foreground', bg: '--muted', min: 4.5 },
  { fg: '--muted-foreground', bg: '--background', min: 4.5 },
  { fg: '--accent-foreground', bg: '--accent', min: 4.5 },
  { fg: '--destructive', bg: '--background', min: 4.5 },
  { fg: '--ring', bg: '--background', min: 3 },
];

export function check(themes, pairs) {
  const rows = [];
  for (const [theme, vars] of Object.entries(themes)) {
    const page = color(vars, '--background');
    for (const p of pairs) {
      const bg = color(vars, p.bg, page);
      const fg = color(vars, p.fg, bg);
      const ratio = wcagContrast(fg, bg);
      rows.push({ theme, ...p, ratio, ok: ratio >= p.min });
    }
  }
  return rows;
}

function main() {
  const themes = parseThemes(readFileSync(FILE, 'utf8'));
  const fmt = (r) => `${r.ok ? 'ok  ' : 'FAIL'} ${r.theme.padEnd(5)} ${r.fg} на ${r.bg}: ${r.ratio.toFixed(2)} (нужно ≥ ${r.min})${r.what ? ` — ${r.what}` : ''}`;
  console.log('Токены Tadum (обязательно):');
  const required = check(themes, REQUIRED);
  required.forEach((r) => console.log(`  ${fmt(r)}`));
  console.log('Пресет shadcn (информативно, не блокирует):');
  check(themes, PRESET).forEach((r) => console.log(`  ${fmt(r)}`));
  const failed = required.filter((r) => !r.ok).length;
  console.log(`check-contrast: ${failed ? `${failed} нарушений` : 'AA выполнен для токенов Tadum'} (светлая и тёмная тема)`);
  process.exitCode = failed ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
