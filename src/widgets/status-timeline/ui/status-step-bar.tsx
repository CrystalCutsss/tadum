// Компактная шкала для телефона (решение Кирилла 2026-11-09): подпись только у текущего шага, остальные —
// горизонтальные сегменты со скруглениями без подписей. Порядок сегментов — по направлению письма (RTL зеркально).
// Для скринридера у каждого сегмента текст «шаг — состояние», текущий отмечен aria-current.
import { cn } from 'cn';
import { useTranslation } from 'react-i18next';

import { CLIENT_TIMELINE_STEPS, type ClientTimelineStep, type TimelineStepState } from '@/entities/application';
import { formatNumber } from '@/shared/i18n';

const FILL: Record<TimelineStepState, string> = {
  done: 'bg-status-done',
  current: 'bg-primary',
  needs_attention: 'bg-status-rejected',
  // Непройденные шаги — белые: шкала лежит на серой панели, bg-muted с ней сливался (Кирилл 2026-11-11).
  upcoming: 'bg-card',
  closed: 'bg-card',
};

export function StatusStepBar({ steps }: { steps: Record<ClientTimelineStep, TimelineStepState> }) {
  const { t } = useTranslation();
  // Текущий шаг — и при дозапросе (needs_attention на «Проверке»).
  const index = CLIENT_TIMELINE_STEPS.findIndex((s) => steps[s] === 'current' || steps[s] === 'needs_attention');
  const current = CLIENT_TIMELINE_STEPS[Math.max(0, index)] ?? 'documents';
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-baseline justify-between gap-2 text-sm">
        <span className="flex flex-col">
          <span className="font-medium">{t(`timeline.client.${current}`)}</span>
          {steps[current] === 'needs_attention' ? <span className="text-xs text-status-rejected">{t('timeline.needs_more_docs')}</span> : null}
        </span>
        <span className="text-xs text-muted-foreground">
          {t('timeline.step_of', { n: formatNumber(Math.max(0, index) + 1), total: formatNumber(CLIENT_TIMELINE_STEPS.length) })}
        </span>
      </p>
      <ol aria-label={t('timeline.title')} className="flex gap-1.5">
        {CLIENT_TIMELINE_STEPS.map((step) => {
          const state = steps[step];
          return (
            <li key={step} aria-current={state === 'current' || state === 'needs_attention' ? 'step' : undefined} className={cn('h-1.5 flex-1 rounded-full', FILL[state])}>
              <span className="sr-only">
                {t(`timeline.client.${step}`)} — {state === 'needs_attention' ? t('timeline.needs_more_docs') : t(`timeline.state.${state}`)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
