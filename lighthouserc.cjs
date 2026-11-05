// Lighthouse CI (01-nfr-locale-brand.md §2.2, D-054): мобильный профиль Lighthouse по умолчанию —
// Slow 4G и CPU 4× (симуляция). Первая загрузка /c/home и /s/home: вход персоной мок-режима (?persona=).
// v1 — уровень 'warn' (отчёт без блокировки); с v2 переключить LEVEL на 'error'.
const LEVEL = 'warn';

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm preview --port 4173 --strictPort',
      startServerReadyPattern: 'Local',
      url: ['http://localhost:4173/?persona=client_active', 'http://localhost:4173/?persona=supplier_active'],
      numberOfRuns: 3,
      settings: { chromeFlags: '--no-sandbox --headless=new' },
    },
    assert: {
      assertions: {
        'categories:performance': [LEVEL, { minScore: 0.9 }],
        'categories:accessibility': [LEVEL, { minScore: 1 }],
        'categories:best-practices': [LEVEL, { minScore: 0.95 }],
        'largest-contentful-paint': [LEVEL, { maxNumericValue: 2500 }],
        'cumulative-layout-shift': [LEVEL, { maxNumericValue: 0.1 }],
        // INP в лабораторном прогоне не измеряется; ближайший прокси — Total Blocking Time.
        'total-blocking-time': [LEVEL, { maxNumericValue: 200 }],
      },
    },
    // Отчёты — файлами (артефакт CI), не во внешнее хранилище: в URL отчёта лежат адреса стенда.
    upload: { target: 'filesystem', outputDir: '.lighthouseci/reports' },
  },
};
