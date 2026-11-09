// Шкала прогресса клиента (01-cabinet-structure.md §5). Состояния шагов вычисляет entities/application
// (computeClientTimeline) — здесь только отображение. В RTL шкала зеркальна (порядок flex), галочки не зеркалятся;
// у каждого шага текстовое состояние и aria-current для текущего.
import type { RemixiconComponentType } from '@remixicon/react';
import { cn } from 'cn';
import { useTranslation } from 'react-i18next';

import { CLIENT_TIMELINE_STEPS, type ClientTimelineStep, type TimelineStepState } from '@/entities/application';
import {
  Icon,
  RiCheckboxBlankCircleFill,
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  RiProgress4Line,
} from '@/shared/ui';

// Иконки не похожи на радиокнопки (решение Кирилла 2026-11-09): готово — круг с галочкой, текущий — круг,
// заполненный наполовину («в процессе»), следующие — маленькая точка, нужно внимание — восклицательный знак.
const ICON: Record<TimelineStepState, RemixiconComponentType> = {
  done: RiCheckboxCircleFill,
  current: RiProgress4Line,
  upcoming: RiCheckboxBlankCircleFill,
  needs_attention: RiErrorWarningFill,
  closed: RiCheckboxBlankCircleFill,
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

/** `auto` — вертикально на телефоне, в строку с md; `vertical` — всегда столбиком (боковая панель экрана документов). */
export type TimelineOrientation = 'auto' | 'vertical';

export function StatusTimeline({ steps, orientation = 'auto' }: { steps: Record<ClientTimelineStep, TimelineStepState>; orientation?: TimelineOrientation }) {
  const row = orientation === 'auto';
  const { t } = useTranslation();
  return (
    <ol aria-label={t('timeline.title')} className={cn('flex flex-col gap-3', row && 'md:flex-row md:gap-2')}>
      {CLIENT_TIMELINE_STEPS.map((step) => {
        const state = steps[step];
        return (
          <li
            key={step}
            aria-current={state === 'current' || state === 'needs_attention' ? 'step' : undefined}
            className={cn('flex flex-1 items-start gap-2', row && 'md:flex-col md:items-center md:text-center')}
          >
            <span className="flex size-5 shrink-0 items-center justify-center">
              <Icon icon={ICON[state]} className={cn(state === 'upcoming' || state === 'closed' ? 'size-2.5' : 'size-5', TONE[state])} />
            </span>
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
