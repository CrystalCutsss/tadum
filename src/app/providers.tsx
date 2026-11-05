import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { useState } from 'react';
import { I18nextProvider } from 'react-i18next';

import { i18n } from './i18n';
import { router } from './router';

// Корневые провайдеры. TanStack Query — единственный слой данных (ADR-001).
// DirectionProvider для порталов Radix добавляется вместе с shadcn в блоке 4a.
export function Providers() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </I18nextProvider>
  );
}
