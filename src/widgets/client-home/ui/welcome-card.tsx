// Карточка первого визита после активации лимита (D-101, бенчмарк № 106): «Что теперь можно» — три строки и «Понятно».
// После закрытия больше не показывается (флаг по id лимита).
import { RiCheckLine } from '@remixicon/react';
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { track } from '@/shared/analytics';
import { Button, Icon } from '@/shared/ui';

import { homeFlags } from '../model/home-flags';

const ITEMS = ['home.welcome.item1', 'home.welcome.item2', 'home.welcome.item3'] as const;

export function WelcomeCard({ limitId }: { limitId: string }) {
  const { t } = useTranslation();
  const titleId = useId();
  const [visible, setVisible] = useState(() => !homeFlags.welcomeDismissed(limitId));

  useEffect(() => {
    if (visible) track('home_welcome_viewed', {});
    // Один показ на монтирование.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;
  const dismiss = () => {
    homeFlags.dismissWelcome(limitId);
    track('home_welcome_dismissed', {});
    setVisible(false);
  };

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4 rounded-xl border bg-card p-4 text-card-foreground md:p-5">
      <h2 id={titleId} className="text-base font-semibold">
        {t('home.welcome.title')}
      </h2>
      <ul className="flex flex-col gap-3">
        {ITEMS.map((key) => (
          <li key={key} className="flex items-start gap-3 text-sm">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon icon={RiCheckLine} className="size-4" />
            </span>
            <span className="pt-0.5">{t(key)}</span>
          </li>
        ))}
      </ul>
      <div>
        <Button type="button" variant="secondary" className="min-h-11" onClick={dismiss}>
          {t('home.welcome.dismiss')}
        </Button>
      </div>
    </section>
  );
}
