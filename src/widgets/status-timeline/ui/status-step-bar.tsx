// Компактная шкала для телефона (решение Кирилла 2026-11-09): подпись только у текущего шага, остальные —
// горизонтальные сегменты со скруглениями без подписей. Порядок сегментов — по направлению письма (RTL зеркально).
// Для скринридера у каждого сегмента текст «шаг — состояние», текущий отмечен aria-current.
import { cn } from 'cn';
import { useTranslation } from 'react-i18next';

import type { TimelineStepState } from '@/entities/application';
import { formatNumber } from '@/shared/i18n';

import { orderedSteps, stepLabel, type TimelineSteps } from './status-timeline';

const FILL: Record<TimelineStepState, string> = {
  done: 'bg-status-done',
  current: 'bg-primary',
  needs_attention: 'bg-status-rejected',
  // Непройденные шаги — белые: шкала лежит на серой панели, bg-muted с ней сливался (Кирилл 2026-11-11).
  upcoming: 'bg-card',
  closed: 'bg-card',
  cancelled: 'bg-muted-foreground/40',
};

export function StatusStepBar(props: TimelineSteps) {
  const { t } = useTranslation();
  const family = props.family ?? 'client';
  const items = orderedSteps(props);
  // Текущий шаг — и при дозапросе (needs_attention на «Проверке»).
  const index = items.findIndex(({ state }) => state === 'current' || state === 'needs_attention' || state === 'cancelled');
  const current = items[Math.max(0, index)] ?? { step: 'documents', state: 'current' as const };
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-baseline justify-between gap-2 text-sm">
        <span className="flex flex-col">
          <span className="font-medium">{t(stepLabel(family, current.step, current.state))}</span>
          {current.state === 'needs_attention' ? <span className="text-xs text-status-rejected">{t('timeline.needs_more_docs')}</span> : null}
        </span>
        <span className="text-xs text-muted-foreground">
          {t('timeline.step_of', { n: formatNumber(Math.max(0, index) + 1), total: formatNumber(items.length) })}
        </span>
      </p>
      <ol aria-label={t('timeline.title')} className="flex gap-1.5">
        {items.map(({ step, state }) => {
          return (
            <li key={step} aria-current={state === 'current' || state === 'needs_attention' || state === 'cancelled' ? 'step' : undefined} className={cn('h-1.5 flex-1 rounded-full', FILL[state])}>
              <span className="sr-only">
                {t(stepLabel(family, step, state))} — {state === 'needs_attention' ? t('timeline.needs_more_docs') : t(`timeline.state.${state}`)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
