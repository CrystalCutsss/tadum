// Ошибки экрана кода (SC-01 A3–A10) → состояние формы, текст и причина для auth_otp_failed.
import { DomainError, NetworkError, type DomainErrorCode } from '@/shared/api';
import { OTP } from '@/shared/config';

export type OtpFormError =
  | { kind: 'invalid'; attemptsLeft: number }
  | { kind: 'expired' }
  | { kind: 'too_many_attempts' }
  | { kind: 'phone_unknown' }
  | { kind: 'rate_limited'; until: number }
  | { kind: 'resend_too_early'; until: number }
  | { kind: 'offline' }
  | { kind: 'server' };

const isCode = (e: unknown, code: DomainErrorCode): e is DomainError => e instanceof DomainError && e.code === code;

export function otpErrorFrom(error: unknown, now: number, online = true): OtpFormError {
  if (!online || error instanceof NetworkError) return { kind: 'offline' };
  if (isCode(error, 'otp_invalid')) return { kind: 'invalid', attemptsLeft: error.details.attempts_left ?? 0 };
  if (isCode(error, 'otp_expired')) return { kind: 'expired' };
  if (isCode(error, 'otp_too_many_attempts')) return { kind: 'too_many_attempts' };
  if (isCode(error, 'phone_unknown')) return { kind: 'phone_unknown' };
  if (isCode(error, 'otp_rate_limited')) return { kind: 'rate_limited', until: now + (error.details.retry_after_s ?? 60) * 1000 };
  if (isCode(error, 'otp_resend_too_early')) return { kind: 'resend_too_early', until: now + (error.details.retry_after_s ?? 40) * 1000 };
  return { kind: 'server' };
}

/** Остаток попыток показываем только после 3-й ошибки (SC-01 §4). */
export const showAttemptsLeft = (attemptsLeft: number) => attemptsLeft <= OTP.max_attempts - 3;

export type OtpMessageKey =
  | 'auth.otp.invalid'
  | 'auth.otp.invalid_retry'
  | 'auth.otp.expired'
  | 'auth.otp.too_many_attempts'
  | 'auth.phone.too_many_requests'
  | 'auth.otp.resend_in'
  | 'common.offline_retry'
  | 'common.server_error_retry';

export function otpErrorMessage(error: OtpFormError, now: number): { key: OtpMessageKey; values: Record<string, number> } | null {
  switch (error.kind) {
    case 'invalid':
      return showAttemptsLeft(error.attemptsLeft)
        ? { key: 'auth.otp.invalid', values: { count: error.attemptsLeft, attempts_left: error.attemptsLeft } }
        : { key: 'auth.otp.invalid_retry', values: {} };
    case 'expired':
      return { key: 'auth.otp.expired', values: {} };
    case 'too_many_attempts':
      return { key: 'auth.otp.too_many_attempts', values: {} };
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
    case 'phone_unknown':
      return null;
  }
}

/** A5: после 5-й ошибки ввод заблокирован до нового кода. */
export const inputLocked = (error: OtpFormError | null) => error?.kind === 'too_many_attempts';

/** A4, A5: «Отправить новый код» активна независимо от таймера; иначе — после resend_available_at (A6, A7). */
export function canResend(error: OtpFormError | null, now: number, resendAvailableAt: number): boolean {
  if (error?.kind === 'expired' || error?.kind === 'too_many_attempts') return true;
  if ((error?.kind === 'rate_limited' || error?.kind === 'resend_too_early') && now < error.until) return false;
  return now >= resendAvailableAt;
}

export type OtpFailReason = 'invalid' | 'expired' | 'too_many_attempts' | 'rate_limited' | 'phone_unknown' | 'server_error';

export function otpFailReason(error: OtpFormError): OtpFailReason | null {
  switch (error.kind) {
    case 'invalid':
      return 'invalid';
    case 'expired':
      return 'expired';
    case 'too_many_attempts':
      return 'too_many_attempts';
    case 'rate_limited':
      return 'rate_limited';
    case 'phone_unknown':
      return 'phone_unknown';
    case 'server':
      return 'server_error';
    case 'resend_too_early':
    case 'offline':
      return null;
  }
}
