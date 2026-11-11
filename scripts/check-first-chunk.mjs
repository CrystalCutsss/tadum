// Проверка блока 5b (D-073): MockAdapter и фикстуры персон не попадают в первый чанк.
// Первый чанк — скрипт, который index.html подключает напрямую, и его статические импорты (modulepreload).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const entries = [...html.matchAll(/<(?:script[^>]+src|link[^>]+rel="modulepreload"[^>]+href)="([^"]+\.js)"/g)].map((m) => m[1]);
if (entries.length === 0) {
  console.error('check-first-chunk: в dist/index.html не найден входной скрипт');
  process.exit(1);
}
// Маркеры: строки, которые есть только в коде мока и фикстурах (id персон не годятся — их список публичный).
const MARKERS = ['mock:active', 'Rimal Al Sharq General Trading', 'Bayt Al Khayr Wholesale'];
let failed = false;
for (const src of entries) {
  const file = join(dist, src.replace(/^.*\/assets\//, 'assets/'));
  const code = readFileSync(file, 'utf8');
  const kb = (Buffer.byteLength(code) / 1024).toFixed(1);
  const found = MARKERS.filter((m) => code.includes(m));
  if (found.length) {
    failed = true;
    console.error(`✗ ${src} (${kb} КБ): найдены ${found.join(', ')}`);
  } else {
    console.log(`✓ ${src} (${kb} КБ): кода мока и фикстур нет`);
  }
}
// Проверка не пустая: мок должен быть собран — отдельным чанком.
const assets = readdirSync(join(dist, 'assets')).filter((f) => f.endsWith('.js'));
const lazy = assets.filter((f) => MARKERS.every((m) => readFileSync(join(dist, 'assets', f), 'utf8').includes(m)));
if (lazy.length === 0) {
  failed = true;
  console.error('✗ чанк с MockAdapter и фикстурами не найден: проверка была бы пустой');
} else {
  console.log(`✓ MockAdapter и фикстуры — отдельный чанк: ${lazy.join(', ')}`);
}
if (failed) process.exit(1);
