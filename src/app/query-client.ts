// Единственный QueryClient приложения: его видят провайдер React и гарды маршрутов (контекст роутера).
// 401 из любого запроса или мутации (истекла сессия, выход в другой вкладке — SC-10 §1.3–1.4)
// ведёт на /session-expired; обработчик ставит router.tsx.
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { Unauthorized, isApiError } from '@/shared/api';

let onUnauthorized: () => void = () => undefined;

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

const handle = (error: unknown) => {
  if (error instanceof Unauthorized) onUnauthorized();
};

/** Повторяем только сбои сети и сервера (до 2 раз); 401, 403, 404 и бизнес-отказы — сразу. */
export const shouldRetry = (failureCount: number, error: unknown): boolean =>
  failureCount < 2 && (!isApiError(error) || error.kind === 'network' || error.kind === 'server');

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handle }),
  mutationCache: new MutationCache({ onError: handle }),
  defaultOptions: { queries: { retry: shouldRetry } },
});
