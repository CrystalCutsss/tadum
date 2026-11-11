// Этапы «Решение» и «Подписание» на экране «Заявка» (решения Кирилла 2026-11-11, A-063). Раскладка экрана прежняя;
// над шагами подписания — синяя карточка лимита: сумма крупно сверху, под ней пояснение с иконкой info. Шаги подписания —
// отдельный блок под своим заголовком, в виде карточек документов. «Есть вопрос?» внутри этапов нет — поддержка в сайдбаре.
// Лимит cancelled / rejected: нейтральная карточка без причины (SC-06 A7).
import { RiInformationLine } from '@remixicon/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import type { Limit } from '@/entities/limit';
import { track } from '@/shared/analytics';
import { formatMoney, isLanguage } from '@/shared/i18n';
import { Icon, Ltr } from '@/shared/ui';

import { OnboardingChecklistView } from './onboarding-checklist';

export interface LimitCardProps {
  limit: Pick<Limit, 'status' | 'approved'>;
}

/** Синяя карточка лимита: «Limit», сумма вдвое крупнее прежней, под ней — что сейчас происходит. */
export function LimitCard({ limit }: LimitCardProps) {
  const { t, i18n } = useTranslation();
  const lang = isLanguage(i18n.language) ? i18n.language : 'en';
  const hasAmount = limit.approved.amount_minor > 0;
  const info = limit.status === 'pending' ? t('application.decision.body') : t('application.signing.info');
  return (
    <section className="flex flex-col gap-5 rounded-xl bg-primary p-5 text-primary-foreground md:p-6" aria-live="polite">
      <div className="flex flex-col gap-1">
        <span className="text-sm text-primary-foreground/75">{t('application.limit_label')}</span>
        {hasAmount ? (
          <span className="text-5xl leading-tight font-semibold tabular-nums">
            <Ltr>{formatMoney(limit.approved.amount_minor / 100, lang)}</Ltr>
          </span>
        ) : (
          <span className="text-xl font-medium">{t('application.decision.no_amount')}</span>
        )}
      </div>
      <p className="flex items-start gap-2 text-sm text-primary-foreground/85">
        <Icon icon={RiInformationLine} className="mt-0.5 size-4 shrink-0" />
        <span>{info}</span>
      </p>
    </section>
  );
}

export interface SigningStepsProps {
  limit: Pick<Limit, 'status' | 'checklist'>;
  /** Время последнего ответа сервера по лимиту (TanStack Query dataUpdatedAt). */
  limitUpdatedAt: number;
}

/** Три подписи под общим заголовком; до согласования условий — неактивны. */
export function SigningSteps({ limit, limitUpdatedAt }: SigningStepsProps) {
  const { t } = useTranslation();
  const locked = limit.status === 'pending';
  return (
    <section className="flex flex-col gap-3" aria-labelledby="signing-steps-title">
      <header className="flex flex-col gap-1">
        <h2 id="signing-steps-title" className="text-base font-semibold">
          {t('checklist.title')}
        </h2>
        <p className="text-sm text-muted-foreground">{locked ? t('checklist.locked_hint') : t('application.signing.body')}</p>
      </header>
      <OnboardingChecklistView items={limit.checklist.items} locked={locked} dataUpdatedAt={limitUpdatedAt} />
    </section>
  );
}

/** Лимит отменён: нейтральный текст без причины. */
export function CancelledLimitCard() {
  const { t } = useTranslation();
  useEffect(() => track('limit_cancelled_viewed', {}), []);
  return (
    <section className="flex flex-col gap-1 rounded-xl border bg-card p-4 text-card-foreground md:p-5">
      <h2 className="text-base font-semibold">{t('application.cancelled.title')}</h2>
      <p className="text-sm text-muted-foreground">{t('application.cancelled.body')}</p>
    </section>
  );
}
