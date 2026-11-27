// Блок #how-to-buy (SC-07 §1, §3; D-099, D-100; бенчмарк № 81, 119): три шага текстом, без своей кнопки —
// главная кнопка одна, под суммой. Клиент сворачивает блок до заголовка; состояние запоминается (homeFlags).
// Переход по ссылке …/c/home#how-to-buy раскрывает свёрнутый блок и прокручивает к нему.
import { useRouterState } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { track } from '@/shared/analytics';
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui';

import { homeFlags } from '../model/home-flags';

export const HOW_TO_BUY_ID = 'how-to-buy';
const STEPS = ['how_to_buy.step1', 'how_to_buy.step2', 'how_to_buy.step3'] as const;

export function HowToBuy() {
  const { t } = useTranslation();
  const hash = useRouterState({ select: (s) => s.location.hash });
  const linked = hash === HOW_TO_BUY_ID;
  const [open, setOpen] = useState(() => linked || !homeFlags.howToBuyCollapsed());
  const ref = useRef<HTMLElement>(null);

  // Ссылка на блок: раскрыть (если свёрнут) и прокрутить к нему.
  useEffect(() => {
    if (!linked) return;
    setOpen(true);
    ref.current?.scrollIntoView({ block: 'start' });
  }, [linked]);

  // how_to_buy_viewed — один раз, когда блок попал в область видимости.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      track('how_to_buy_viewed', {});
      observer.disconnect();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const toggle = (next: boolean) => {
    setOpen(next);
    homeFlags.setHowToBuyCollapsed(!next);
    track('how_to_buy_toggled', { open: next });
  };

  return (
    <Collapsible open={open} onOpenChange={toggle} asChild>
      <section ref={ref} id={HOW_TO_BUY_ID} aria-labelledby="how-to-buy-title" className="scroll-mt-4 rounded-xl border bg-card p-4 text-card-foreground md:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 id="how-to-buy-title" className="text-base font-semibold">
            {open ? (
              t('how_to_buy.title')
            ) : (
              <CollapsibleTrigger asChild>
                <Button variant="link" className="h-auto min-h-11 px-0 text-base font-semibold whitespace-normal">
                  {t('how_to_buy.show')}
                </Button>
              </CollapsibleTrigger>
            )}
          </h2>
          {open ? (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="min-h-11 shrink-0">
                {t('how_to_buy.hide')}
              </Button>
            </CollapsibleTrigger>
          ) : null}
        </div>
        <CollapsibleContent>
          <ol className="mt-4 flex flex-col gap-4">
            {STEPS.map((key, i) => (
              <li key={key} className="flex items-start gap-3">
                {/* Номер шага — не направленный знак, не зеркалится. */}
                <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium tabular-nums">
                  {i + 1}
                </span>
                <p className="pt-0.5 text-sm">{t(key)}</p>
              </li>
            ))}
          </ol>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}
