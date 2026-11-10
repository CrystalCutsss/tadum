// Типизированные ошибки портов. UI различает их по `kind`, а не по тексту.

export type ApiErrorKind = 'network' | 'server' | 'not_found' | 'forbidden' | 'unauthorized' | 'not_implemented' | 'domain';

export abstract class ApiError extends Error {
  abstract readonly kind: ApiErrorKind;
}

/** Нет сети (офлайн, обрыв). */
export class NetworkError extends ApiError {
  readonly kind = 'network';
  constructor(message = 'network') {
    super(message);
  }
}

/** 5xx или ответ, не прошедший Zod-валидацию. */
export class ServerError extends ApiError {
  readonly kind = 'server';
  constructor(message = 'server') {
    super(message);
  }
}

export class NotFound extends ApiError {
  readonly kind = 'not_found';
  constructor(message = 'not_found') {
    super(message);
  }
}

/** Нет прав на ресурс (чужая семья ролей). */
export class Forbidden extends ApiError {
  readonly kind = 'forbidden';
  constructor(message = 'forbidden') {
    super(message);
  }
}

/** 401: сессия истекла или отсутствует (SC-01 A11, `expireSession()`). */
export class Unauthorized extends ApiError {
  readonly kind = 'unauthorized';
  constructor(message = 'unauthorized') {
    super(message);
  }
}

/** Метод HttpAdapter ещё не подключён к бэкенду. */
export class NotImplementedError extends ApiError {
  readonly kind = 'not_implemented';
  constructor(
    readonly port: string,
    readonly method: string,
  ) {
    super(`not implemented: ${port}.${method}`);
  }
}

/** Коды бизнес-отказов; совпадают с ключами ошибок сценариев. */
export type DomainErrorCode =
  | 'otp_invalid'
  | 'otp_expired'
  | 'otp_too_many_attempts'
  | 'otp_rate_limited'
  | 'otp_resend_too_early'
  | 'phone_unknown'
  | 'document_set_locked'
  | 'document.same_file_rejected'
  | 'upload.error.too_large'
  | 'upload.error.unsupported_type'
  | 'upload.error.too_many'
  | 'company.cr_invalid'
  | 'documents.submit_incomplete'
  | 'application_not_closed'
  | 'limit_exceeded'
  | 'not_allowed';

/** Бизнес-отказ (4xx с кодом). `details` — числа для текста (попытки, секунды). */
export class DomainError extends ApiError {
  readonly kind = 'domain';
  constructor(
    readonly code: DomainErrorCode,
    readonly details: Readonly<Record<string, number>> = {},
  ) {
    super(code);
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}
