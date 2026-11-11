// Карточка этапа над списком документов на экране «Заявка» (решения Кирилла 2026-11-11: раскладка экрана не меняется,
// этап встраивается карточкой). Вид — как у карточки документа: белая карточка с заголовком и серая нижняя панель.
// «Решение» (лимит pending): «от вас ничего не требуется, менеджер позвонит» и «Вопросы?» — бенчмарк, Mercury № 52.
// «Подписание» (лимит ready): чек-лист SC-06. Лимит cancelled / rejected: нейтральный текст без причины (SC-06 A7).
import { RiCheckboxCircleLine, RiPhoneLine, RiQuillPenLine, RiInformationLine, type RemixiconComponentType } from '@remixicon/react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import type { Limit } from '@/entities/limit';
import { track } from '@/shared/analytics';
import { formatMoney, isLanguage } from '@/shared/i18n';
import { Icon, Item, ItemContent, ItemDescription, ItemMedia, ItemTitle, Ltr } from '@/shared/ui';

import { OnboardingChecklistView } from './onboarding-checklist';

export interface ApplicationStageCardProps {
  limit: Pick<Limit, 'status' | 'approved' | 'checklist'>;
  /** Время последнего ответа сервера по лимиту (TanStack Query dataUpdatedAt). */
  limitUpdatedAt: number;
  /** Строка «Есть вопрос? Напишите нам» — собирает страница из виджета поддержки. */
  support?: ReactNode;
}

function StageHeader({ icon, title, body, children }: { icon: RemixiconComponentType; title: string; body: string; children?: ReactNode }) {
  return (
    <Item className="flex-nowrap items-start rounded-none border-0 p-0">
      <ItemMedia variant="icon" className="hidden sm:flex">
        <Icon icon={icon} />
      </ItemMedia>
      <ItemContent className="min-w-0 gap-1">
        <ItemTitle className="text-base">
          <h2>{title}</h2>
        </ItemTitle>
        <ItemDescription className="line-clamp-none">{body}</ItemDescription>
        {children}
      </ItemContent>
    </Item>
  );
}

function Amount({ value }: { value: Limit['approved'] }) {
  const { t, i18n } = useTranslation();
  const lang = isLanguage(i18n.language) ? i18n.language : 'en';
  return (
    <div className="mt-2 flex flex-col gap-0.5">
      <span className="text-sm text-muted-foreground">{t('application.amount_label')}</span>
      <span className="text-2xl font-semibold tabular-nums">
        <Ltr>{formatMoney(value.amount_minor / 100, lang)}</Ltr>
      </span>
    </div>
  );
}

export function ApplicationStageCard({ limit, limitUpdatedAt, support }: ApplicationStageCardProps) {
  const { t } = useTranslation();
  const cancelled = limit.status === 'cancelled' || limit.status === 'rejected';

  useEffect(() => {
    if (cancelled) track('limit_cancelled_viewed', {});
  }, [cancelled]);

  const hasAmount = limit.approved.amount_minor > 0;
  const head =
    limit.status === 'pending' ? (
      <>
        <StageHeader icon={RiPhoneLine} title={t('application.decision.title')} body={t('application.decision.body')}>
          {hasAmount ? <Amount value={limit.approved} /> : <p className="mt-2 text-sm text-muted-foreground">{t('application.decision.no_amount')}</p>}
        </StageHeader>
      </>
    ) : cancelled ? (
      <StageHeader icon={RiInformationLine} title={t('application.cancelled.title')} body={t('application.cancelled.body')} />
    ) : limit.status === 'active' ? (
      <StageHeader icon={RiCheckboxCircleLine} title={t('application.summary.title')} body={t('application.summary.no_action')} />
    ) : (
      <>
        <StageHeader icon={RiQuillPenLine} title={t('application.signing.title')} body={t('application.signing.body')}>
          <Amount value={limit.approved} />
        </StageHeader>
      </>
    );

  return (
    <section className="flex flex-col rounded-xl bg-secondary" aria-live="polite">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 text-card-foreground md:p-4">{head}</div>
      <div className="flex flex-col gap-3 p-3 md:p-4">
        {limit.status === 'pending' || limit.status === 'ready' ? (
          <>
            <OnboardingChecklistView items={limit.checklist.items} locked={limit.status === 'pending'} dataUpdatedAt={limitUpdatedAt} />
            {limit.status === 'pending' ? <p className="text-sm text-muted-foreground">{t('checklist.locked_hint')}</p> : null}
          </>
        ) : null}
        {support}
      </div>
    </section>
  );
}
