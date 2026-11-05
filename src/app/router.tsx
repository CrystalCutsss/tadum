import { createRouter } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';

// basepath берётся из базового пути сборки: '/' локально, '/p/tadum/vN/' на витрине.
const basepath = import.meta.env.BASE_URL.replace(/\/$/, '');

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  ...(basepath ? { basepath } : {}),
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
