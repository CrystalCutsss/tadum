// Ошибки экрана номера (SC-01 A1, A2, A9, A10, A13) → состояние формы и причина для auth_otp_failed.
import { DomainError, NetworkError, type DomainErrorCode } from '@/shared/api';

export type PhoneFormError =
  | { kind: 'invalid_format' }
  | { kind: 'rate_limited'; until: number }
  | { kind: 'resend_too_early'; until: number }
  | { kind: 'offline' }
  | { kind: 'server' };

const isCode = (e: unknown, code: DomainErrorCode): e is DomainError => e instanceof DomainError && e.code === code;

export function phoneErrorFrom(error: unknown, now: number, online = true): PhoneFormError {
  if (!online || error instanceof NetworkError) return { kind: 'offline' };
  if (isCode(error, 'otp_rate_limited')) return { kind: 'rate_limited', until: now + (error.details.retry_after_s ?? 60) * 1000 };
  if (isCode(error, 'otp_resend_too_early')) return { kind: 'resend_too_early', until: now + (error.details.retry_after_s ?? 40) * 1000 };
  if (isCode(error, 'not_allowed')) return { kind: 'invalid_format' };
  return { kind: 'server' };
}

/** Текст ошибки: ключ и значения для t(). */
export type PhoneMessageKey =
  | 'auth.phone.invalid_format'
  | 'auth.phone.too_many_requests'
  | 'auth.otp.resend_in'
  | 'common.offline_retry'
  | 'common.server_error_retry';

export function phoneErrorMessage(error: PhoneFormError, now: number): { key: PhoneMessageKey; values: Record<string, number> } {
  switch (error.kind) {
    case 'invalid_format':
      return { key: 'auth.phone.invalid_format', values: {} };
    case 'rate_limited': {
      const minutes = Math.max(1, Math.ceil((error.until - now) / 60_000));
      return { key: 'auth.phone.too_many_requests', values: { count: minutes, minutes } };
    }
    case 'resend_too_early':
      return { key: 'auth.otp.resend_in', values: { seconds: Math.max(1, Math.ceil((error.until - now) / 1000)) } };
    case 'offline':
      return { key: 'common.offline_retry', values: {} };
    case 'server':
      return { key: 'common.server_error_retry', values: {} };
  }
}

/** Ошибка с таймером снимается сама, когда время прошло. */
export function phoneErrorActive(error: PhoneFormError | null, now: number): boolean {
  if (!error) return false;
  return 'until' in error ? now < error.until : true;
}

/** Причина для auth_otp_failed; офлайн не отправляется (SC-01 A9 — без события). */
export function phoneFailReason(error: PhoneFormError): 'rate_limited' | 'server_error' | null {
  if (error.kind === 'rate_limited') return 'rate_limited';
  if (error.kind === 'server') return 'server_error';
  return null;
}
