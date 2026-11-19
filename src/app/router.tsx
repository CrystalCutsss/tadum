import { createRouter } from '@tanstack/react-router';

import { SESSION_QUERY_KEY, authMemory } from '@/entities/session';
import { ROUTES, safeReturnTo } from '@/shared/config';

import { queryClient, setUnauthorizedHandler } from './query-client';
import { routeTree } from './routeTree.gen';

// basepath берётся из базового пути сборки: '/' локально, '/p/tadum/vN/' на витрине.
const basepath = import.meta.env.BASE_URL.replace(/\/$/, '');

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  // 404 всегда рисует корень: внутри /c и /s оболочка не показывается для несуществующих путей.
  notFoundMode: 'root',
  ...(basepath ? { basepath } : {}),
});

setUnauthorizedHandler(() => {
  const { pathname, searchStr } = router.state.location;
  if (pathname === ROUTES.sessionExpired) return;
  // Сессии уже нет (клиент сам вышел): запросы, ещё открытые после выхода и «Назад», отвечают 401 — это не
  // «сессия истекла». Без проверки «Назад» после выхода на миг показывало вход, затем /session-expired (SC-10).
  if (queryClient.getQueryData(SESSION_QUERY_KEY) === null) return;
  if (safeReturnTo(pathname + searchStr)) authMemory.setReturnTo(pathname + searchStr);
  queryClient.setQueryData(SESSION_QUERY_KEY, null);
  void router.navigate({ to: ROUTES.sessionExpired, replace: true });
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
