// /c/home (SC-05 для home, 01-cabinet-structure.md §5–6): шкала, «следующий шаг», сводка документов,
// уведомление о смене статуса (D-034), опрос (D-035). Блоки #limit и #how-to-buy — v4.
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  applicationQuery,
  companyQuery,
  computeClientTimeline,
  statusMemory,
  statusNoticeOnEnter,
  type StatusNotice,
} from '@/entities/application';
import { documentSetQuery } from '@/entities/document';
import { limitQuery } from '@/entities/limit';
import { track, usedShareBucket, type ScreenViewedProps } from '@/shared/analytics';
import { useStatusPolling, type Application, type ClientStatus, type DocumentSet, type Limit } from '@/shared/api';
import { now, toDate } from '@/shared/lib';
import { Button, Card, CardDescription, CardFooter, CardHeader, CardTitle, Skeleton, toast } from '@/shared/ui';
import { LoadError } from '@/widgets/cabinet-shell';
import { NextStepCard } from '@/widgets/next-step-card';
import { StatusBanner } from '@/widgets/status-banner';
import { StatusTimeline } from '@/widgets/status-timeline';
import { SupportBar } from '@/widgets/support-bar';

const HOUR = 3_600_000;

function hoursSinceSubmit(set: DocumentSet | undefined): number | undefined {
  return set?.submitted_at ? Math.max(0, Math.round((now() - toDate(set.submitted_at).getTime()) / HOUR)) : undefined;
}

/** screen_viewed{client.home} — контекст §3.6; только корзины и счётчики, без сумм. */
function homeViewProps(app: Application, set: DocumentSet | undefined, limit: Limit | null | undefined): Extract<ScreenViewedProps, { screen_id: 'client.home' }> {
  const hours = app.client_status === 'under_review' ? hoursSinceSubmit(set) : undefined;
  return {
    screen_id: 'client.home',
    status: app.client_status,
    ...(set ? { round: set.round } : {}),
    ...(app.client_status === 'docs_required' && set && set.round > 1 ? { requested_count: set.documents.length } : {}),
    ...(app.client_status === 'under_review' ? { has_eta: app.review_eta_hours !== undefined } : {}),
    ...(hours !== undefined ? { hours_since_submit: hours } : {}),
    ...(limit ? { limit_status: limit.status, checklist_done_count: limit.checklist.items.filter((i) => i.status === 'done').length } : {}),
    ...(limit?.status === 'active' ? { used_share_bucket: usedShareBucket(limit.used, limit.approved) } : {}),
  };
}

/** Тост при смене статуса на открытом экране и баннер при входе (D-034). */
function useStatusChangeNotice(status: ClientStatus | undefined) {
  const { t } = useTranslation();
  // Баннер решается один раз — при первых данных экрана (корректировка состояния во время рендера).
  const [entered, setEntered] = useState<ClientStatus | null>(null);
  const [notice, setNotice] = useState<StatusNotice>({ kind: 'none' });
  if (status && entered === null) {
    setEntered(status);
    setNotice(statusNoticeOnEnter(statusMemory.read(), status));
  }

  useEffect(() => {
    if (notice.kind === 'banner') track('status_change_banner_viewed', { from: notice.from, to: notice.to });
  }, [notice]);

  const opened = useRef<ClientStatus | null>(null);
  useEffect(() => {
    if (!status) return;
    const before = opened.current;
    opened.current = status;
    if (before === null) {
      // Первый показ без баннера: статус увиден.
      if (statusNoticeOnEnter(statusMemory.read(), status).kind === 'none') statusMemory.seen(status);
    } else if (before !== status) {
      toast(t('status.updated'));
      track('status_changed_while_open', { from: before, to: status });
      statusMemory.seen(status);
    }
  }, [status, t]);

  const dismiss = () => {
    if (notice.kind !== 'banner') return;
    statusMemory.dismiss(notice.from, notice.to);
    track('status_change_banner_dismissed', { from: notice.from, to: notice.to });
    setNotice({ kind: 'none' });
  };
  // Статус сменился при открытом экране — старый баннер больше не актуален.
  const current = notice.kind === 'banner' && status !== notice.to ? ({ kind: 'none' } as const) : notice;
  return { notice: current, dismiss };
}

export function ClientHome() {
  const { t, i18n } = useTranslation();
  const app = useStatusPolling(applicationQuery);
  const status = app.data?.client_status;
  const owner = { kind: 'application' as const, id: app.data?.id ?? '' };
  const set = useQuery({ ...documentSetQuery(owner), enabled: Boolean(app.data) });
  // Лимит нужен шкале с одобрения; опрашивается так же, как статус (D-035).
  const limit = useStatusPolling({ ...limitQuery, enabled: status === 'approved' || status === 'first_purchase' });
  const company = useQuery(companyQuery);
  const { notice, dismiss } = useStatusChangeNotice(status);

  const data = app.data;
  const overdue =
    data?.client_status === 'under_review' && data.review_eta_hours !== undefined && (hoursSinceSubmit(set.data) ?? 0) > data.review_eta_hours;

  useEffect(() => {
    if (data && set.data) track('screen_viewed', homeViewProps(data, set.data, limit.data));
    // Один просмотр на статус: опрос не плодит события.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.client_status, Boolean(set.data)]);

  useEffect(() => {
    if (overdue && data?.review_eta_hours !== undefined) {
      track('review_overdue_viewed', { hours_over: (hoursSinceSubmit(set.data) ?? 0) - data.review_eta_hours });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overdue]);

  if (app.isError) return <LoadError onRetry={() => void app.refetch()} support={<SupportBar context="error" />} />;
  // Шкала одобренной заявки зависит от лимита: пока он грузится, не показываем промежуточное состояние.
  const waitingLimit = (status === 'approved' || status === 'first_purchase') && limit.isPending;
  if (!data || waitingLimit) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const timeline = computeClientTimeline({ client_status: data.client_status, round: set.data?.round ?? 1, limit: limit.data ?? null });
  const companyName = (i18n.language === 'ar' ? company.data?.name_ar : undefined) ?? company.data?.name ?? '';
  const sent = set.data?.documents.filter((d) => d.status === 'received' || d.status === 'approved').length ?? 0;
  const prefill = data.client_status === 'under_review' || data.client_status === 'closed' ? { key: data.client_status, company: companyName } : undefined;

  return (
    <div className="flex flex-col gap-4">
      {notice.kind === 'banner' ? <StatusBanner to={notice.to} onDismiss={dismiss} /> : null}

      {timeline.hidden ? (
        // closed: шкала заменяется нейтральной карточкой (§5); причину не называем.
        <Card>
          <CardHeader>
            <CardTitle>{t('closed.title')}</CardTitle>
            <CardDescription>{t('closed.body')}</CardDescription>
          </CardHeader>
          {data.next_step.cta?.external_url ? (
            <CardFooter>
              <Button asChild>
                <a href={data.next_step.cta.external_url} rel="noopener" onClick={() => track('next_step_cta_clicked', { step: 'next_step.closed' })}>
                  {t('next_step.cta.apply')}
                </a>
              </Button>
            </CardFooter>
          ) : null}
        </Card>
      ) : (
        <>
          <section aria-live="polite">
            <StatusTimeline steps={timeline.steps} />
          </section>
          <NextStepCard step={data.next_step} overdue={overdue} />
        </>
      )}

      {data.client_status !== 'docs_required' && sent > 0 ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border px-4 py-3">
          <span className="text-sm">{t('home.documents_summary', { count: sent })}</span>
          <Button asChild variant="ghost" className="px-0">
            <Link to="/c/documents">{t('home.documents_view')}</Link>
          </Button>
        </div>
      ) : null}

      <SupportBar {...(prefill ? { prefill } : {})} status={data.client_status} {...(prefill ? { context: prefill.key } : {})} />
    </div>
  );
}
