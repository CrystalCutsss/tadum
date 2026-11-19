// Этапы «Решение» и «Подписание» на экране «Заявка» (решения Кирилла 2026-11-11, A-063; D-084). Синяя карточка лимита
// на всю ширину, как на «Лимит одобрен»: заголовок «одобренный, ещё не активен», сумма крупно, ниже подсказка — иконка
// info в полупрозрачном круге; на «Подписании» она под суммой, в две строки, внизу — кнопка «Подписать
// документы», она ведёт на экран подписания (D-083). «Есть вопрос?» внутри этапов нет — поддержка в сайдбаре.
// Лимит cancelled / rejected: нейтральная карточка без причины (SC-06 A7).
import { RiInformationLine, RiWhatsappLine } from '@remixicon/react';
import { cn } from 'cn';
import { useEffect, type ComponentProps, type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { Limit } from '@/entities/limit';
import { track } from '@/shared/analytics';
import { supportWhatsappUrl } from '@/shared/config';
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
export function LimitCard({ limit, action, className, style }: LimitCardProps & { className?: string; style?: CSSProperties | undefined }) {
  const { t } = useTranslation();
  const hasAmount = limit.approved.amount_minor > 0;
  const decisionInfo = limit.status === 'pending' ? t('application.decision.body') : null;
  // «Подписание»: подсказка сразу под суммой, на компьютере — в две строки с ровным переносом (Кирилл 2026-11-17).
  const signingInfo = limit.status === 'ready' ? t('application.signing.info') : null;
  return (
    // Высота на компьютере — как у блока Steps и одна на обоих этапах (style от экрана, Кирилл 2026-11-17): подсказка
    // и кнопка прижаты к низу.
    <LimitSurface aria-live="polite" className={cn('justify-between gap-8', className)} style={style}>
      {/* Заголовок — начертание как у «Steps» (CardTitle); отступ до суммы — 16 px (Кирилл 2026-11-17). На «Подписании»
          под суммой — подсказка, внизу только кнопка. */}
      <div className="flex flex-col gap-4">
        <h2 className="font-heading text-base font-medium">{t('application.limit_label_approved')}</h2>
        {hasAmount ? <LimitAmount value={limit.approved} /> : <span className="text-xl">{t('application.decision.no_amount')}</span>}
        {signingInfo ? <LimitHint className="mt-2 text-balance sm:max-w-md">{signingInfo}</LimitHint> : null}
      </div>
      <div className="flex flex-col items-start gap-4">
        {decisionInfo ? <LimitHint className="sm:max-w-1/2">{decisionInfo}</LimitHint> : null}
        {action}
      </div>
    </LimitSurface>
  );
}

/**
 * Подсказка этапа: иконка info 20 px в полупрозрачном круге 40 px — как подложка иконки в блоках документов (D-084).
 * Ширина текста — от этапа: на «Решении» не шире половины карточки, на «Подписании» — в две строки.
 */
function LimitHint({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('flex items-center gap-3 text-sm text-primary-foreground', className)}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
        <Icon icon={RiInformationLine} />
      </span>
      <span>{children}</span>
    </p>
  );
}

/** Лимит отменён: нейтральный текст без причины и «Связаться с нами» — чат WhatsApp поддержки (Кирилл 2026-11-19). */
export function CancelledLimitCard() {
  const { t } = useTranslation();
  useEffect(() => track('limit_cancelled_viewed', {}), []);
  return (
    <section className="flex flex-col items-start gap-4 rounded-xl border bg-card p-4 text-card-foreground md:p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">{t('application.cancelled.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('application.cancelled.body')}</p>
      </div>
      <Button asChild className="min-h-11">
        <a href={supportWhatsappUrl()} target="_blank" rel="noopener noreferrer">
          <Icon icon={RiWhatsappLine} data-icon="inline-start" />
          {t('application.cancelled.contact')}
        </a>
      </Button>
    </section>
  );
}
