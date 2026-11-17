// Этапы «Решение» и «Подписание» на экране «Заявка» (решения Кирилла 2026-11-11, A-063; D-084). Синяя карточка лимита
// на всю ширину, как на «Лимит одобрен»: заголовок «одобренный, ещё не активен», сумма крупно, ниже подсказка — иконка
// info в полупрозрачном круге и текст не шире половины карточки. На «Подписании» под подсказкой — кнопка «Подписать
// документы», она ведёт на экран подписания (D-083). «Есть вопрос?» внутри этапов нет — поддержка в сайдбаре.
// Лимит cancelled / rejected: нейтральная карточка без причины (SC-06 A7).
import { RiInformationLine } from '@remixicon/react';
import { cn } from 'cn';
import { useEffect, type ComponentProps, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { Limit } from '@/entities/limit';
import { track } from '@/shared/analytics';
import { formatMoney, isLanguage } from '@/shared/i18n';
import { Button, Icon, Ltr, MetalCard } from '@/shared/ui';


const NBSP = '\u00a0';

/**
 * Поверхность карточки лимита — «металлическая» карточка с глубиной и бликом за указателем (MetalCard, Кирилл 2026-11-11);
 * общая для этапов и «Лимит одобрен». Мелкий текст на ней — только primary-foreground без прозрачности (AA под бликом).
 */
export function LimitSurface({ className, ...props }: ComponentProps<'section'>) {
  return <MetalCard as="section" className={cn('flex flex-col gap-6 p-6 md:p-7', className)} {...props} />;
}


/**
 * Сумма лимита: валюта втрое мельче суммы (48 / 14 px) и выровнена по верхней линии цифр, а не по строке (Кирилл 2026-11-11).
 * У обеих частей leading-none, поэтому разница — верхний свес строки над цифрами; компенсируем отступом валюты сверху
 * (6 px — подобрано по скриншоту). Порядок частей — из formatMoney (EN: SAR 150,000, AR: 150,000 ر.س).
 */
export function LimitAmount({ value }: { value: Limit['approved'] }) {
  const { i18n } = useTranslation();
  const lang = isLanguage(i18n.language) ? i18n.language : 'en';
  const parts = formatMoney(value.amount_minor / 100, lang).split(NBSP);
  return (
    <span className="flex items-start gap-1 font-normal tabular-nums">
      {parts.map((part) =>
        /\d/.test(part) ? (
          <span key={part} className="text-5xl leading-none">
            <Ltr>{part}</Ltr>
          </span>
        ) : (
          <span key={part} className="mt-1.5 text-sm leading-none">
            {part}
          </span>
        ),
      )}
    </span>
  );
}

export interface LimitCardProps {
  limit: Pick<Limit, 'status' | 'approved'>;
  /** Этап «Подписание»: кнопка «Подписать документы» под подсказкой (D-083). */
  action?: ReactNode;
}

/**
 * Карточка лимита на этапах «Решение» и «Подписание» (D-084): заголовок «одобренный, ещё не активен» и сумма сверху,
 * ниже подсказка этапа — на «Решении» «менеджер позвонит», на «Подписании» «подпишите договор и вексель» над кнопкой.
 */
export function LimitCard({ limit, action, className }: LimitCardProps & { className?: string }) {
  const { t } = useTranslation();
  const hasAmount = limit.approved.amount_minor > 0;
  const info = limit.status === 'pending' ? t('application.decision.body') : limit.status === 'ready' ? t('application.signing.info') : null;
  return (
    <LimitSurface aria-live="polite" className={cn('gap-8', className)}>
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-medium">{t('application.limit_label_approved')}</h2>
        {hasAmount ? <LimitAmount value={limit.approved} /> : <span className="text-xl">{t('application.decision.no_amount')}</span>}
      </div>
      <div className="flex flex-col items-start gap-4">
        {info ? <LimitHint>{info}</LimitHint> : null}
        {action}
      </div>
    </LimitSurface>
  );
}

/**
 * Подсказка этапа: иконка info 20 px в полупрозрачном круге 40 px — как подложка иконки в блоках документов;
 * текст не шире половины карточки на ≥640 px (Кирилл 2026-11-17, D-084).
 */
function LimitHint({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-sm text-primary-foreground sm:max-w-1/2">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
        <Icon icon={RiInformationLine} />
      </span>
      <span>{children}</span>
    </p>
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
