// Повторы запросов: 401 и бизнес-отказы не повторяются (иначе экран «Сессия истекла» опаздывает на секунды).
import { describe, expect, it } from 'vitest';

import { DomainError, NetworkError, NotFound, ServerError, Unauthorized } from '@/shared/api';

import { shouldRetry } from './query-client';

describe('shouldRetry', () => {
  it('сеть и сервер — до 2 повторов', () => {
    expect(shouldRetry(0, new NetworkError())).toBe(true);
    expect(shouldRetry(1, new ServerError())).toBe(true);
    expect(shouldRetry(2, new ServerError())).toBe(false);
  });
  it('401, 404 и бизнес-отказы — без повторов', () => {
    for (const e of [new Unauthorized(), new NotFound(), new DomainError('not_allowed')]) expect(shouldRetry(0, e)).toBe(false);
  });
});
