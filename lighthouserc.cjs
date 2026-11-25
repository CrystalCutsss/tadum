// Lighthouse CI (01-nfr-locale-brand.md §2.2, D-054): мобильный профиль Lighthouse по умолчанию —
// Slow 4G и CPU 4× (симуляция). Первая загрузка кабинетов: вход персоной мок-режима (?persona=) сразу на экране —
// не через `/`: корень перенаправляет в кабинет, и на повторном прогоне Lighthouse считал загрузку прерванной
// (FAILED_DOCUMENT_REQUEST, net::ERR_ABORTED; Кирилл 2026-11-25). Поставщик входит на «Заявку» (/s/documents, TD-001).
// v1 — уровень 'warn' (отчёт без блокировки); с v2 переключить LEVEL на 'error'.
const LEVEL = 'warn';

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm preview --port 4173 --strictPort',
      startServerReadyPattern: 'Local',
      url: [
        'http://localhost:4173/c/home?persona=client_active',
        'http://localhost:4173/s/documents?persona=supplier_active',
      ],
      numberOfRuns: 3,
      // В контейнере CI /dev/shm — 64 МБ: вкладка Chrome падала на повторном прогоне («Target closed»,
      // ERR_ABORTED). --disable-dev-shm-usage переносит общую память в /tmp (Кирилл 2026-11-25).
      settings: { chromeFlags: '--no-sandbox --headless=new --disable-dev-shm-usage' },
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
