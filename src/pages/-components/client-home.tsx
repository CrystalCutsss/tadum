// /c/home — главная активного клиента (D-098…D-101, бриф TD-002, SC-07): блок лимита с кнопкой новой покупки,
// «Как оформить покупку», карточка первого визита, менеджер и ссылка на договор. Доступна только при активном лимите
// (и при отменённом после активации); остальных гард маршрута ведёт в «Заявку». Шкала, «следующий шаг» и сводка
// документов на главной не показываются — они на экране «Заявка» (D-081, D-098). Статус и лимит опрашиваются (D-035),
// смена статуса — баннер и тост (D-034).
import { useQuery } from '@tanstack/react-query';
import { Navigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { applicationQuery, companyQuery, statusMemory, statusNoticeOnEnter, type StatusNotice } from '@/entities/application';
import { hasClientHome, limitQuery } from '@/entities/limit';
import { track, usedShareBucket } from '@/shared/analytics';
import { useStatusPolling, type ClientStatus } from '@/shared/api';
import { Skeleton, toast } from '@/shared/ui';
import { LimitOverview } from '@/widgets/application-stage';
import { CabinetAside, LoadError } from '@/widgets/cabinet-shell';
import { HomeAside, HowToBuy, WelcomeCard } from '@/widgets/client-home';
import { StatusBanner } from '@/widgets/status-banner';
import { SupportBar } from '@/widgets/support-bar';

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
  const limit = useStatusPolling(limitQuery);
  const company = useQuery(companyQuery);
  const status = app.data?.client_status;
  const { notice, dismiss } = useStatusChangeNotice(status);
  const lim = limit.data;

  useEffect(() => {
    if (!status || !lim) return;
    track('screen_viewed', {
      screen_id: 'client.home',
      status,
      limit_status: lim.status,
      ...(lim.status === 'active' ? { used_share_bucket: usedShareBucket(lim.used, lim.approved) } : {}),
    });
    // Один просмотр на статус заявки и лимита: опрос не плодит события.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, lim?.status]);

  if (app.isError || limit.isError) {
    const retry = app.isError ? app.refetch : limit.refetch;
    return <LoadError onRetry={() => void retry()} support={<SupportBar context="error" />} />;
  }
  if (!app.data || limit.isPending) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label={t('common.loading')}>
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }
  // Лимит перестал быть доступным при открытом экране (гард маршрута это уже проверил при входе).
  if (!lim || !hasClientHome(lim)) return <Navigate to="/c/documents" replace />;

  const companyName = (i18n.language === 'ar' ? company.data?.name_ar : undefined) ?? company.data?.name ?? '';
  const cancelled = lim.status === 'cancelled';

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sr-only">{t('nav.home')}</h1>
      {notice.kind === 'banner' ? <StatusBanner to={notice.to} onDismiss={dismiss} /> : null}
      {cancelled ? null : <WelcomeCard limitId={lim.id} />}
      <LimitOverview limit={lim} company={companyName} updatedAt={limit.dataUpdatedAt} />
      {cancelled ? null : <HowToBuy />}
      {/* Менеджер и договор: на телефоне и планшете — внизу колонки, на ≥ 1024 px — в боковой колонке. */}
      <div className="lg:hidden">
        <HomeAside support={<SupportBar status={app.data.client_status} />} />
      </div>
      <CabinetAside>
        <HomeAside support={<SupportBar status={app.data.client_status} />} />
      </CabinetAside>
    </div>
  );
}
