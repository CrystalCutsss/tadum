// Этапы «Решение» и «Подписание» на экране «Заявка» (решения Кирилла 2026-11-11, A-063). Раскладка экрана прежняя;
// над шагами подписания — синяя карточка лимита: сумма крупно сверху, под ней пояснение с иконкой info. Шаги подписания —
// отдельный блок под своим заголовком, в виде карточек документов. «Есть вопрос?» внутри этапов нет — поддержка в сайдбаре.
// Лимит cancelled / rejected: нейтральная карточка без причины (SC-06 A7).
import { RiInformationLine } from '@remixicon/react';
import { cn } from 'cn';
import { useEffect, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import type { Limit } from '@/entities/limit';
import { track } from '@/shared/analytics';
import { formatMoney, isLanguage } from '@/shared/i18n';
import { Button, Icon, Ltr } from '@/shared/ui';

const NBSP = '\u00a0';

/** Поверхность карточки лимита — синяя карточка; общая для этапов и «Лимит одобрен». */
export function LimitSurface({ className, ...props }: ComponentProps<'section'>) {
  return <section className={cn('flex flex-col gap-6 rounded-2xl bg-primary p-6 text-primary-foreground md:p-7', className)} {...props} />;
}

import { OnboardingChecklistView } from './onboarding-checklist';

/**
 * Сумма лимита: валюта вдвое мельче суммы и выровнена по верхней линии цифр, а не по строке (Кирилл 2026-11-11).
 * У обеих частей leading-none, поэтому разница — верхний свес строки над цифрами: для кегля 48/24 это ~2–4 px,
 * компенсируем отступом валюты сверху (2 px — подобрано по скриншоту). Порядок частей — из formatMoney (EN: SAR 150,000, AR: 150,000 ر.س).
 */
export function LimitAmount({ value }: { value: Limit['approved'] }) {
  const { i18n } = useTranslation();
  const lang = isLanguage(i18n.language) ? i18n.language : 'en';
  const parts = formatMoney(value.amount_minor / 100, lang).split(NBSP);
  return (
    <span className="flex items-start gap-1.5 font-normal tabular-nums">
      {parts.map((part) =>
        /\d/.test(part) ? (
          <span key={part} className="text-5xl leading-none">
            <Ltr>{part}</Ltr>
          </span>
        ) : (
          <span key={part} className="mt-0.5 text-2xl leading-none">
            {part}
          </span>
        ),
      )}
    </span>
  );
}

export interface LimitCardProps {
  limit: Pick<Limit, 'status' | 'approved'>;
}

/** Карточка лимита: «Limit», сумма сверху, под ней — что сейчас происходит. */
export function LimitCard({ limit }: LimitCardProps) {
  const { t } = useTranslation();
  const hasAmount = limit.approved.amount_minor > 0;
  const info = limit.status === 'pending' ? t('application.decision.body') : t('application.signing.info');
  return (
    <LimitSurface aria-live="polite">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-primary-foreground/75">{t('application.limit_label')}</span>
        {hasAmount ? <LimitAmount value={limit.approved} /> : <span className="text-xl">{t('application.decision.no_amount')}</span>}
      </div>
      <p className="flex items-start gap-2 text-sm text-primary-foreground/85">
        <Icon icon={RiInformationLine} className="mt-0.5 size-4 shrink-0" />
        <span>{info}</span>
      </p>
    </LimitSurface>
  );
}

export interface SigningStepsProps {
  limit: Pick<Limit, 'status' | 'checklist'>;
  /** Время последнего ответа сервера по лимиту (TanStack Query dataUpdatedAt). */
  limitUpdatedAt: number;
  className?: string;
}

/** Три подписи под общим заголовком; до согласования условий — неактивны. */
export function SigningSteps({ limit, limitUpdatedAt, className }: SigningStepsProps) {
  const { t } = useTranslation();
  const locked = limit.status === 'pending';
  return (
    <section className={cn('flex flex-col gap-3', className)} aria-labelledby="signing-steps-title">
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

/** Лимит отменён: нейтральный текст без причины и «Подать новую заявку» (Кирилл 2026-11-11) — на лендинг, как в SC-08. */
export function CancelledLimitCard({ applyUrl }: { applyUrl: string }) {
  const { t } = useTranslation();
  useEffect(() => track('limit_cancelled_viewed', {}), []);
  return (
    <section className="flex flex-col items-start gap-4 rounded-xl border bg-card p-4 text-card-foreground md:p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">{t('application.cancelled.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('application.cancelled.body')}</p>
      </div>
      <Button asChild className="min-h-11">
        <a href={applyUrl} rel="noopener">
          {t('application.cancelled.apply')}
        </a>
      </Button>
    </section>
  );
}
