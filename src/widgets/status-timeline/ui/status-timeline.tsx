// Шкала прогресса клиента (01-cabinet-structure.md §5). Состояния шагов вычисляет entities/application
// (computeClientTimeline) — здесь только отображение. В RTL шкала зеркальна (порядок flex), галочки не зеркалятся;
// у каждого шага текстовое состояние и aria-current для текущего.
import { RiCheckLine, RiErrorWarningLine, RiRecordCircleLine, RiCheckboxBlankCircleLine, type RemixiconComponentType } from '@remixicon/react';
import { cn } from 'cn';
import { useTranslation } from 'react-i18next';

import { CLIENT_TIMELINE_STEPS, type ClientTimelineStep, type TimelineStepState } from '@/entities/application';
import { Icon } from '@/shared/ui';

const ICON: Record<TimelineStepState, RemixiconComponentType> = {
  done: RiCheckLine,
  current: RiRecordCircleLine,
  upcoming: RiCheckboxBlankCircleLine,
  needs_attention: RiErrorWarningLine,
  closed: RiCheckboxBlankCircleLine,
};

// Цвет — только у иконки; подписи — цвета текста (AA в обеих темах). needs_attention — цвет статуса rejected,
// а не «ошибка системы» (§5).
const TONE: Record<TimelineStepState, string> = {
  done: 'text-status-approved',
  current: 'text-primary',
  upcoming: 'text-muted-foreground',
  needs_attention: 'text-status-rejected',
  closed: 'text-muted-foreground',
};

export function StatusTimeline({ steps }: { steps: Record<ClientTimelineStep, TimelineStepState> }) {
  const { t } = useTranslation();
  return (
    <ol aria-label={t('timeline.title')} className="flex flex-col gap-3 md:flex-row md:gap-2">
      {CLIENT_TIMELINE_STEPS.map((step) => {
        const state = steps[step];
        return (
          <li
            key={step}
            aria-current={state === 'current' ? 'step' : undefined}
            className="flex flex-1 items-start gap-2 md:flex-col md:items-center md:text-center"
          >
            <Icon icon={ICON[state]} className={cn('size-5 shrink-0', TONE[state])} />
            <div className="flex flex-col">
              <span className={cn('text-sm', state === 'current' || state === 'needs_attention' ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                {t(`timeline.client.${step}`)}
              </span>
              <span className={cn('text-xs', state === 'needs_attention' ? 'text-status-rejected' : 'text-muted-foreground')}>
                {state === 'needs_attention' ? t('timeline.needs_more_docs') : t(`timeline.state.${state}`)}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
