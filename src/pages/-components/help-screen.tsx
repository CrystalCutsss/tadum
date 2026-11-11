// /c/help, /s/help (SC-10): поддержка, язык, тема (только здесь, D-025), версия приложения, выход.
// Карточка установки PWA — v5.
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { LogoutButton } from '@/features/logout';
import { LanguageSwitch } from '@/widgets/language-switch';
import { SupportBar } from '@/widgets/support-bar';
import { ThemeSwitch } from '@/widgets/theme-switch';

/** На витрине — номер версии прототипа (vN), иначе — версия сборки (SC-10 §7). */
export const appVersion = (): string => import.meta.env.VITE_PROTO_VERSION || import.meta.env.VITE_APP_VERSION || 'dev';

export function HelpScreen() {
  const { t } = useTranslation();
  const ids = { language: useId(), theme: useId() };
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t('help.title')}</h1>
      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium">{t('help.support')}</h2>
        <SupportBar />
      </section>
      <section className="flex flex-col gap-2" aria-labelledby={ids.language}>
        <h2 id={ids.language} className="text-base font-medium">
          {t('help.language')}
        </h2>
        <LanguageSwitch className="min-h-11 self-start" />
      </section>
      <section className="flex flex-col gap-2">
        <h2 id={ids.theme} className="text-base font-medium">
          {t('help.theme')}
        </h2>
        <ThemeSwitch labelledBy={ids.theme} />
      </section>
      <section className="flex flex-col gap-3 border-t pt-4">
        <LogoutButton />
        <p className="text-xs text-muted-foreground">{t('help.version', { version: appVersion() })}</p>
      </section>
    </div>
  );
}
