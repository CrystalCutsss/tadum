import { createRouter } from '@tanstack/react-router';

import { queryClient } from './query-client';
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

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
