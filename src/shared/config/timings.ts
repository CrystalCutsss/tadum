// Интервалы и сроки — единственный источник для UI и мока.

/** Опрос статусов заявки и чек-листа (SC-05: мок — 30 с; D-035). */
export const STATUS_POLL_INTERVAL_MS = 30_000;

/** Параметры OTP (D-021). */
export const OTP = {
  length: 4,
  ttl_ms: 5 * 60_000,
  max_attempts: 5,
  resend_after_ms: 40_000,
  /** SC-01 A2: в моке больше 3 запросов за 10 минут — `otp_rate_limited`. */
  rate_limit: { max_requests: 3, window_ms: 10 * 60_000 },
} as const;

/** Срок сессии — 30 дней, без таймаута неактивности (D-007). */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60_000;

/** Мок: отправленный комплект переходит в `in_review` через 2 с (01-statuses.md §10). */
export const MOCK_REVIEW_DELAY_MS = 2_000;

/** Мок: автополнота комплекта в демо-режиме — 10 с вместо 10 минут (01-statuses.md §4). */
export const MOCK_COMPLETION_GRACE_MS = 10_000;

/** Мок: задержка ответа 300–800 мс; `slow` добавляет ещё столько же ×4. */
export const MOCK_LATENCY = { min_ms: 300, max_ms: 800, slow_factor: 4 } as const;
