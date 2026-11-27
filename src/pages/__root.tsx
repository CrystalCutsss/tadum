// Корень: контекст роутера, screen_viewed по смене маршрута, 404 (SC-10). Оболочка кабинета — блок 6b.
import { Outlet, createRootRouteWithContext, useRouterState } from '@tanstack/react-router';
import type { ParseKeys, TFunction } from 'i18next';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { setAnalyticsContext, track, type ScreenViewedProps } from '@/shared/analytics';
import { screenIdFor, type ScreenId } from '@/shared/config';

import { NotFoundScreen } from './-components/not-found-screen';
import type { RouterContext } from './-router-context';

/** Экраны без собственных данных: screen_viewed отправляет корень. Экраны с данными (§3.6) — сами, когда данные готовы. */
type SimpleScreen = Extract<ScreenViewedProps, { screen_id: 'auth.phone' | 'auth.details' | 'auth.otp' | 'auth.not_found' | 'auth.expired' | 'client.help' | 'supplier.help' }>;
const SIMPLE: ReadonlySet<string> = new Set<SimpleScreen['screen_id']>(['auth.phone', 'auth.details', 'auth.otp', 'auth.not_found', 'auth.expired', 'client.help', 'supplier.help']);
const isSimple = (id: string | null): id is SimpleScreen['screen_id'] => id !== null && SIMPLE.has(id);

/**
 * Заголовок вкладки по экрану (WCAG 2.4.2; решение Кирилла 2026-11-27): «{экран} — Tadum». Бренд латиницей в обоих
 * языках (D-052). Экран входа и неизвестные адреса — просто «Tadum».
 */
const TITLES: Readonly<Partial<Record<ScreenId, ParseKeys>>> = {
  'auth.details': 'auth.details.title',
  'auth.otp': 'auth.otp.title',
  'auth.not_found': 'auth.not_found.title',
  'auth.expired': 'auth.expired.title',
  'client.home': 'nav.home',
  'client.documents': 'nav.application',
  'client.signing': 'signing.title',
  'client.help': 'help.title',
  'supplier.home': 'nav.home',
  'supplier.documents': 'nav.application',
  'supplier.help': 'help.title',
};

function documentTitle(t: TFunction, screen: ScreenId | null): string {
  const key = screen ? TITLES[screen] : undefined;
  return key ? t('meta.title', { page: t(key) }) : 'Tadum';
}

function Root() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t, i18n } = useTranslation();
  useEffect(() => {
    document.title = documentTitle(t, screenIdFor(pathname));
  }, [pathname, t, i18n.language]);
  useEffect(() => {
    const screen = screenIdFor(pathname);
    if (screen) setAnalyticsContext({ screen_id: screen });
    if (isSimple(screen)) track('screen_viewed', { screen_id: screen });
  }, [pathname]);
  return <Outlet />;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Root,
  notFoundComponent: NotFoundScreen,
});
