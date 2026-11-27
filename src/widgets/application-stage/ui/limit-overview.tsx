// Блок #limit главной (D-099, бриф TD-002 §2–§4; бенчмарк № 110, 159): доступная сумма крупно, полоса доли
// использованного с подписью, «одобрено» и «использовано», «обновлено {time}» (всегда; офлайн — «данные на {time}»).
// Под суммой одна главная кнопка: «Новая покупка»; лимит выбран полностью — «Написать менеджеру» (SC-07 A2).
// Лимит отменён после активации — суммы остаются, под блоком нейтральная плашка и «Связаться с нами» (A4, D-086).
import { RiWhatsappLine } from '@remixicon/react';
import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { availableOf, limitShare, type Limit } from '@/entities/limit';
import { PurchaseRequest } from '@/features/request-purchase';
import { track } from '@/shared/analytics';
import { supportWhatsappUrl } from '@/shared/config';
import { formatMoney, formatPercent, formatRelative, isLanguage } from '@/shared/i18n';
import { useNow, useOnline } from '@/shared/lib';
import { Button, Icon, Ltr, Progress } from '@/shared/ui';
import { LimitAmount, LimitSurface } from './application-stage-card';

const MINUTE = 60_000;

export interface LimitOverviewProps {
  limit: Pick<Limit, 'status' | 'approved' | 'used' | 'available'>;
  /** Название компании на языке интерфейса — в готовые тексты WhatsApp. */
  company: string;
  /** Время последнего успешного получения сумм (dataUpdatedAt запроса). */
  updatedAt: number;
  /** Офлайн для историй; в приложении — из useOnline. */
  forceOffline?: boolean;
}

export function LimitOverview({ limit, company, updatedAt, forceOffline = false }: LimitOverviewProps) {
  const { t, i18n } = useTranslation();
  const lang = isLanguage(i18n.language) ? i18n.language : 'en';
  const online = useOnline() && !forceOffline;
  const now = useNow(MINUTE);
  const share = limitShare(limit);
  const available = availableOf(limit);
  const cancelled = limit.status === 'cancelled';
  const fullyUsed = !cancelled && available.amount_minor === 0;
  const money = (m: Limit['approved']) => formatMoney(m.amount_minor / 100, lang);

  useEffect(() => {
    if (share.inconsistent) track('data_inconsistency', { kind: 'used_exceeds_approved' });
  }, [share.inconsistent]);
  useEffect(() => {
    if (fullyUsed) track('limit_fully_used_viewed', {});
  }, [fullyUsed]);

  const time = formatRelative(updatedAt, t, now);
  const usage = share.percent === 0 ? t('limit.not_used_yet') : fullyUsed ? t('limit.fully_used') : t('limit.used_share', { percent: formatPercent(share.percent, lang) });

  let action: ReactNode = null;
  if (fullyUsed) {
    action = (
      <Button asChild size="lg" variant="secondary" className="min-h-11 w-full sm:w-auto">
        <a href={supportWhatsappUrl(t('support.prefill.limit_full', { company }))} target="_blank" rel="noopener noreferrer">
          <Icon icon={RiWhatsappLine} data-icon="inline-start" />
          {t('home.manager.cta')}
        </a>
      </Button>
    );
  } else if (!cancelled) {
    action = <PurchaseRequest limit={limit} available={available} company={company} triggerVariant="secondary" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <LimitSurface id="limit" aria-labelledby="limit-title" className="scroll-mt-4 gap-5">
        <div className="flex flex-col gap-3">
          <h2 id="limit-title" className="font-heading text-base font-medium">
            {t('limit.available')}
          </h2>
          <LimitAmount value={available} />
        </div>
        <div className="flex flex-col gap-2">
          {/* Полоса — от начала строки (Progress зеркалится сам); величина продублирована текстом. Индикатор и дорожка —
              белые на синей карточке, как текст на ней. */}
          <Progress
            value={share.share * 100}
            aria-label={usage}
            tone="inverse"
            className="h-2"
          />
          <p className="text-sm text-primary-foreground">{usage}</p>
          {fullyUsed ? <p className="text-sm text-primary-foreground">{t('limit.fully_used_hint')}</p> : null}
        </div>
        <dl className="flex flex-wrap gap-x-10 gap-y-3">
          <Amount label={t('limit.approved')} value={money(limit.approved)} />
          <Amount label={t('limit.used')} value={money(limit.used)} />
        </dl>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {action ? <div>{action}</div> : null}
          <p className="text-xs text-primary-foreground">{online ? t('limit.updated_at', { time }) : t('common.cached_at', { time })}</p>
        </div>
      </LimitSurface>
      {cancelled ? <CancelledNotice /> : null}
    </div>
  );
}

function Amount({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-sm text-primary-foreground">{label}</dt>
      <dd className="tabular-nums">
        <Ltr>{value}</Ltr>
      </dd>
    </div>
  );
}

/** Лимит отменён после активации (SC-07 A4, бенчмарк № 175): серая плашка без причины и «Связаться с нами». */
function CancelledNotice() {
  const { t } = useTranslation();
  useEffect(() => track('limit_cancelled_viewed', {}), []);
  return (
    <section role="status" className="flex flex-col items-start gap-3 rounded-xl bg-muted p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p>{t('limit.cancelled')}</p>
      <Button asChild variant="outline" className="min-h-11 shrink-0">
        <a href={supportWhatsappUrl()} target="_blank" rel="noopener noreferrer">
          <Icon icon={RiWhatsappLine} data-icon="inline-start" />
          {t('application.cancelled.contact')}
        </a>
      </Button>
    </section>
  );
}
