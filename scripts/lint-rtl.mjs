// lint:rtl (DoD §4): grep физических классов Tailwind в src/ — дублирует ESLint (eslint-plugin-rtl-friendly)
// на случай классов вне className (cva, строковые константы, CSS @apply).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PHYSICAL = /(?<![\w-])-?(?:[a-z]+:)*(ml|mr|pl|pr|left|right|rounded-[lr]|rounded-(?:tl|tr|bl|br)|border-[lr]|scroll-m[lr]|scroll-p[lr])-[\w./[\]-]+|(?<![\w-])(?:[a-z]+:)*text-(?:left|right)(?![\w-])/g;
const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'node_modules') walk(p);
    } else if (/\.(tsx?|css)$/.test(e.name) && !e.name.endsWith('.gen.ts')) files.push(p);
  }
})('src');

let found = 0;
for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
      // Осознанные исключения помечены так же, как для ESLint.
      if (lines[i - 1]?.includes('eslint-disable-next-line rtl-friendly/no-physical-properties')) return;
      // Только строки с классами: className, cva/cn, @apply, строковые литералы.
      if (!/className|cva\(|cn\(|@apply|['"`]/.test(line)) return;
      for (const m of line.matchAll(PHYSICAL)) {
        found++;
        console.error(`${f}:${i + 1}: физический класс «${m[0]}» — используйте логический (ms-/me-/ps-/pe-/start-/end-/text-start/text-end)`);
      }
    });
}
if (found) process.exit(1);
console.log(`lint:rtl: ${files.length} файлов, физических классов нет`);
