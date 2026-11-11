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

/** Экран кода: сколько показывать анимацию успеха в ячейках (заливка и галочка) перед переходом (Кирилл 2026-11-11). */
export const OTP_SUCCESS_HOLD_MS = 700;

/** Срок сессии — 30 дней, без таймаута неактивности (D-007). */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60_000;

/** Мок: отправленный комплект переходит в `in_review` через 2 с (01-statuses.md §10). */
export const MOCK_REVIEW_DELAY_MS = 2_000;

/** Мок: задержка ответа 80–250 мс (было 300–800 — экран открывался 4–5 с, Кирилл 2026-11-10); `slow` — ×4. */
export const MOCK_LATENCY = { min_ms: 80, max_ms: 250, slow_factor: 4 } as const;
