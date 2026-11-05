import type { Decorator, Preview } from '@storybook/react-vite';
import { Direction } from 'radix-ui';
import { useLayoutEffect, useMemo, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { applyDocumentLanguage, createI18n, directionOf, type Language } from '../src/shared/i18n';
import { TooltipProvider } from '../src/shared/ui';
import '../src/styles/globals.css';

// Глобалы тулбара: язык (ar | en) и тема (light | dark). Каждая история проверяется в 4 комбинациях.
function StoryProviders({ lang, theme, children }: { lang: Language; theme: 'light' | 'dark'; children: ReactNode }) {
  const i18n = useMemo(() => createI18n(lang), [lang]);
  // До отрисовки кадра: порталы Radix и тесты историй (play) видят правильные lang/dir и тему.
  useLayoutEffect(() => {
    applyDocumentLanguage(lang);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  }, [lang, theme]);
  return (
    <I18nextProvider i18n={i18n}>
      <Direction.Provider dir={directionOf(lang)}>
        <TooltipProvider>
          <div className="bg-background p-4 text-foreground">{children}</div>
        </TooltipProvider>
      </Direction.Provider>
    </I18nextProvider>
  );
}

const withProviders: Decorator = (Story, context) => (
  <StoryProviders lang={(context.globals.locale ?? 'ar') as Language} theme={(context.globals.theme ?? 'light') as 'light' | 'dark'}>
    <Story />
  </StoryProviders>
);

const preview: Preview = {
  decorators: [withProviders],
  globalTypes: {
    locale: {
      description: 'Язык интерфейса',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        items: [
          { value: 'ar', title: 'العربية (RTL)' },
          { value: 'en', title: 'English (LTR)' },
        ],
        dynamicTitle: true,
      },
    },
    theme: {
      description: 'Тема',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { locale: 'ar', theme: 'light', viewport: { value: 'mobile360', isRotated: false } },
  parameters: {
    layout: 'fullscreen',
    viewport: {
      options: {
        mobile360: { name: 'Mobile 360', styles: { width: '360px', height: '780px' }, type: 'mobile' },
        tablet768: { name: 'Tablet 768', styles: { width: '768px', height: '1024px' }, type: 'tablet' },
        desktop1280: { name: 'Desktop 1280', styles: { width: '1280px', height: '800px' }, type: 'desktop' },
      },
    },
    a11y: { test: 'error' },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
  tags: ['autodocs'],
};

export default preview;
