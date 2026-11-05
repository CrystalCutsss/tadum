import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { Direction } from 'radix-ui';
import { useEffect, type ReactNode } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';

import { setAnalyticsContext } from '@/shared/analytics';
import { directionOf, isLanguage } from '@/shared/i18n';
import { ThemeProvider, useTheme } from '@/shared/lib';
import { Toaster, TooltipProvider } from '@/shared/ui';

import { i18n } from './i18n';
import { queryClient } from './query-client';
import { router } from './router';


// Направление для порталов Radix (Dialog, Popover, Sheet, Tooltip, Toast) следует за языком без перезагрузки.
function DirectionFromLanguage({ children }: { children: ReactNode }) {
  const { i18n: instance } = useTranslation();
  const dir = directionOf(isLanguage(instance.language) ? instance.language : 'ar');
  return <Direction.Provider dir={dir}>{children}</Direction.Provider>;
}

function ThemedToaster() {
  const { resolved } = useTheme();
  // Контекст аналитики: применённая тема (§2.2), не выбор пользователя.
  useEffect(() => setAnalyticsContext({ theme: resolved }), [resolved]);
  return <Toaster theme={resolved} />;
}

// Корневые провайдеры. TanStack Query — единственный слой данных (ADR-001).
export function Providers() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <DirectionFromLanguage>
          <TooltipProvider>
            <QueryClientProvider client={queryClient}>
              <RouterProvider router={router} />
            </QueryClientProvider>
            <ThemedToaster />
          </TooltipProvider>
        </DirectionFromLanguage>
      </ThemeProvider>
    </I18nextProvider>
  );
}
