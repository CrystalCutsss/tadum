// Декораторы историй: матрица AR/EN × light/dark в одной истории (axe проверяет все четыре варианта),
// роутер в памяти (для Link / useNavigate) и провайдер темы.
import type { Decorator } from '@storybook/react-vite';
import { RouterProvider, createMemoryHistory, createRootRoute, createRouter } from '@tanstack/react-router';
import { Direction } from 'radix-ui';
import { useMemo, useState, type ComponentType } from 'react';
import { I18nextProvider } from 'react-i18next';

import { createI18n, directionOf, type Language } from '../src/shared/i18n';
import { ThemeProvider } from '../src/shared/lib';

const COMBOS = [
  ['ar', 'light'],
  ['en', 'light'],
  ['ar', 'dark'],
  ['en', 'dark'],
] as const;

function Panel({ lang, theme, Story }: { lang: Language; theme: 'light' | 'dark'; Story: ComponentType }) {
  const i18n = useMemo(() => createI18n(lang), [lang]);
  return (
    <I18nextProvider i18n={i18n}>
      <Direction.Provider dir={directionOf(lang)}>
        <div lang={lang} dir={directionOf(lang)} data-matrix={`${lang} ${theme}`} className={`${theme === 'dark' ? 'dark ' : ''}bg-background p-4 text-foreground`}>
          <Story />
        </div>
      </Direction.Provider>
    </I18nextProvider>
  );
}

/** Четыре панели: ar/en × light/dark. Тема — классом .dark на панели (токены наследуются). */
const withMatrix: Decorator = (Story) => (
  <div className="grid gap-2 xl:grid-cols-2">
    {COMBOS.map(([lang, theme]) => (
      <Panel key={`${lang}-${theme}`} lang={lang} theme={theme} Story={Story} />
    ))}
  </div>
);

function StoryRouter({ Story, path }: { Story: ComponentType; path: string }) {
  const [router] = useState(() =>
    createRouter({ routeTree: createRootRoute({ component: () => <Story /> }), history: createMemoryHistory({ initialEntries: [path] }) }),
  );
  return <RouterProvider router={router} />;
}

/** Роутер в памяти: компоненты с Link и useNavigate рендерятся вне приложения. */
export const withRouter =
  (path = '/c/home'): Decorator =>
  (Story) => <StoryRouter Story={Story} path={path} />;

export const withTheme: Decorator = (Story) => (
  <ThemeProvider>
    <Story />
  </ThemeProvider>
);

/**
 * Матрица для истории: `...matrix`. Четыре копии экрана неизбежно дублируют landmark-области,
 * поэтому выключены только правила уникальности landmark; контраст и остальные правила axe проверяются.
 */
export const matrix = {
  decorators: [withMatrix],
  parameters: {
    a11y: {
      config: {
        rules: ['landmark-unique', 'landmark-no-duplicate-main', 'landmark-no-duplicate-banner', 'landmark-no-duplicate-contentinfo', 'landmark-main-is-top-level'].map(
          (id) => ({ id, enabled: false }),
        ),
      },
    },
  },
};
