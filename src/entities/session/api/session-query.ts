// Сессия входа через порт AuthPort. Единственный источник — ответ бэкенда (мока).
import { queryOptions, type QueryClient } from '@tanstack/react-query';

import { Unauthorized, getApi, type Session } from '@/shared/api';

export const SESSION_QUERY_KEY = ['session'] as const;

export const sessionQuery = queryOptions({
  queryKey: SESSION_QUERY_KEY,
  queryFn: async (): Promise<Session | null> => (await getApi()).auth.getSession(),
  staleTime: 60_000,
  retry: false,
});

export type SessionState = { status: 'none' } | { status: 'expired' } | { status: 'active'; session: Session };

/** Состояние сессии для гардов: 401 от порта — «истекла» (SC-01 A11), null — «нет». */
export async function loadSessionState(queryClient: QueryClient): Promise<SessionState> {
  try {
    const session = await queryClient.ensureQueryData(sessionQuery);
    return session ? { status: 'active', session } : { status: 'none' };
  } catch (e) {
    if (e instanceof Unauthorized) {
      queryClient.setQueryData(SESSION_QUERY_KEY, null);
      return { status: 'expired' };
    }
    throw e;
  }
}
