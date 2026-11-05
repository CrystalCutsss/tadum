// Корень: контекст роутера, screen_viewed по смене маршрута, 404 (SC-10). Оболочка кабинета — блок 6b.
import { Outlet, createRootRouteWithContext, useRouterState } from '@tanstack/react-router';
import { Suspense, lazy, useEffect } from 'react';

import { setAnalyticsContext, track, type ScreenViewedProps } from '@/shared/analytics';
import { screenIdFor } from '@/shared/config';

import { NotFoundScreen } from './-components/not-found-screen';
import type { RouterContext } from './-router-context';

// Демо-панель витрины: динамический импорт; при VITE_DEMO_PANEL=0 ветка вырезается вместе с импортом (D-073).
const DemoPanel =
  import.meta.env.VITE_DEMO_PANEL !== '0' && (import.meta.env.VITE_API_MODE ?? 'mock') === 'mock'
    ? lazy(() => import('@/widgets/demo-panel').then((m) => ({ default: m.DemoPanel })))
    : null;

/** Экраны без собственных данных: screen_viewed отправляет корень. Экраны с данными (§3.6) — сами, когда данные готовы. */
type SimpleScreen = Extract<ScreenViewedProps, { screen_id: 'auth.phone' | 'auth.otp' | 'auth.not_found' | 'auth.expired' | 'client.help' | 'supplier.help' }>;
const SIMPLE: ReadonlySet<string> = new Set<SimpleScreen['screen_id']>(['auth.phone', 'auth.otp', 'auth.not_found', 'auth.expired', 'client.help', 'supplier.help']);
const isSimple = (id: string | null): id is SimpleScreen['screen_id'] => id !== null && SIMPLE.has(id);

function Root() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    const screen = screenIdFor(pathname);
    if (screen) setAnalyticsContext({ screen_id: screen });
    if (isSimple(screen)) track('screen_viewed', { screen_id: screen });
  }, [pathname]);
  return (
    <>
      <Outlet />
      {DemoPanel ? (
        <Suspense fallback={null}>
          <DemoPanel />
        </Suspense>
      ) : null}
    </>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Root,
  notFoundComponent: NotFoundScreen,
});
