// Карточка «следующий шаг» (01-cabinet-structure.md §6): на чьей стороне шаг и что делать.
// Текст — только из ключей; срок — только если meta.hours пришёл из данных (D-033). Шаг вычисляет entities.
import { Link } from '@tanstack/react-router';
import type { ParseKeys } from 'i18next';
import { useTranslation } from 'react-i18next';

import { track, type NextStepKey } from '@/shared/analytics';
import type { NextStep } from '@/shared/api';
import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle, Icon, RiTimeLine } from '@/shared/ui';

export interface NextStepCardProps {
  step: NextStep;
  /** SC-05 A3: проверка дольше обычного — мягкая строка про поддержку, текст не тревожный. */
  overdue?: boolean;
}

export function NextStepCard({ step, overdue = false }: NextStepCardProps) {
  const { t } = useTranslation();
  const count = step.meta?.count ?? step.meta?.hours;
  const values = { ...(count !== undefined ? { count } : {}), ...(step.meta?.hours !== undefined ? { hours: step.meta.hours } : {}) };
  const text = t(step.text_key as ParseKeys, values);
  const onCta = () => track('next_step_cta_clicked', { step: step.text_key as NextStepKey });
  const cta = step.cta;
  const [to, hash] = (cta?.route ?? '').split('#');

  return (
    <Card>
      {step.owner !== 'none' ? (
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
            {step.owner === 'tadum' ? <Icon icon={RiTimeLine} /> : null}
            {t(step.owner === 'tadum' ? 'next_step.owner.tadum' : 'next_step.owner.user')}
          </CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className="flex flex-col gap-2">
        <p className="text-base">{text}</p>
        {overdue ? <p className="text-sm text-muted-foreground">{t('next_step.under_review_longer')}</p> : null}
      </CardContent>
      {cta ? (
        <CardFooter>
          {cta.external_url ? (
            <Button asChild>
              <a href={cta.external_url} rel="noopener" onClick={onCta}>
                {t(cta.label_key as ParseKeys)}
              </a>
            </Button>
          ) : (
            <Button asChild>
              <Link to={to as '/'} {...(hash ? { hash } : {})} onClick={onCta}>
                {t(cta.label_key as ParseKeys)}
              </Link>
            </Button>
          )}
        </CardFooter>
      ) : null}
    </Card>
  );
}
