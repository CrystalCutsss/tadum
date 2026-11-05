// Бюджеты размера (01-nfr-locale-brand.md §2.2, D-054). v1: отчёт без блокировки — в CI job size
// помечен allow_failure / continue-on-error; с v2 — блокирует merge.
const { readFileSync } = require('node:fs');

const html = readFileSync('dist/index.html', 'utf8');
const asset = (href) => `dist/assets/${href.split('/assets/')[1]}`;
// Первый чанк — входной скрипт dist/index.html и его modulepreload (как в scripts/check-first-chunk.mjs).
const firstChunk = [...html.matchAll(/<(?:script[^>]+src|link[^>]+rel="modulepreload"[^>]+href)="([^"]+\.js)"/g)].map((m) => asset(m[1]));

module.exports = [
  { name: 'Первый JS-чанк (оболочка + маршрут)', path: firstChunk, limit: '200 kB', gzip: true },
  // Весь JS считаем вместе с демо-панелью и моком — строже бюджета, который их исключает.
  { name: 'Весь JS приложения', path: 'dist/assets/*.js', limit: '400 kB', gzip: true },
  // Первый экран: основное начертание 400 текущего языка (woff2 уже сжаты).
  { name: 'Шрифт первого экрана — AR', path: 'dist/assets/ibm-plex-sans-arabic-arabic-400-normal-*.woff2', limit: '120 kB', brotli: false, gzip: false },
  { name: 'Шрифт первого экрана — EN', path: 'dist/assets/geist-latin-wght-normal-*.woff2', limit: '120 kB', brotli: false, gzip: false },
];
