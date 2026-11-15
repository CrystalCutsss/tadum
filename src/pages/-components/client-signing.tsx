// /c/documents/sign — сценарий подписания (SC-06, D-083): отдельный экран, а не модалка — ожидание часами и днями,
// диплинк из WhatsApp, возврат из WhatsApp и Nafith. Крошки «Application › Sign documents». Открыт не на этапе
// подписания — переход на «Заявку» (SC-06 A6); оба шага готовы (лимит active) — «Лимит одобрен» и путь назад.
import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from '@tanstack/react-router';
import { RiCheckboxCircleLine } from '@remixicon/react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { applicationQuery, applicationStage, companyQuery } from '@/entities/application';
import { limitQuery, type Limit } from '@/entities/limit';
import { track } from '@/shared/analytics';
import { useStatusPolling } from '@/shared/api';
import { Button, Card, CardContent, Icon, Skeleton, toast } from '@/shared/ui';
import { trackLimitTransition } from '@/widgets/application-stage';
import { CabinetPageHeader, LoadError } from '@/widgets/cabinet-shell';
import { SigningFlow } from '@/widgets/signing-flow';
import { SupportBar } from '@/widgets/support-bar';

export function ClientSigning() {
  const { t } = useTranslation();
  const app = useStatusPolling(applicationQuery);
  const limit = useStatusPolling(limitQuery);
  const company = useQuery(companyQuery);
  const prev = useRef<Limit['status'] | null | undefined>(undefined);
  const doneCount = limit.data?.checklist.items.filter((i) => i.status === 'done').length;

  useEffect(() => {
    if (doneCount !== undefined) track('screen_viewed', { screen_id: 'client.signing', done_count: doneCount });
    // Один просмотр на заход; повторно — когда изменилось число готовых шагов.
  }, [doneCount]);

  // Смена статуса лимита при открытом экране — тост (D-034) и limit_activated.
  useEffect(() => {
    if (limit.data === undefined) return;
    const status = limit.data?.status ?? null;
    if (prev.current !== undefined && prev.current !== status) {
      trackLimitTransition(prev.current, limit.data);
      toast(t('status.updated'));
    }
    prev.current = status;
  }, [limit.data, t]);

  if (app.isError || limit.isError) {
    return <LoadError onRetry={() => void (app.isError ? app.refetch() : limit.refetch())} support={<SupportBar context="error" />} />;
  }
  if (!app.data || limit.isPending) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  const lim = limit.data;
  const stage = applicationStage(app.data.client_status, lim);
  if (!lim || (stage !== 'signing' && stage !== 'approved')) return <Navigate to="/c/documents" replace />;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <CabinetPageHeader>
        <header className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold">{t('signing.title')}</h1>
          <p className="text-base text-muted-foreground">{stage === 'approved' ? t('signing.done') : t('signing.subtitle')}</p>
        </header>
      </CabinetPageHeader>
      {stage === 'approved' ? (
        <Card className="rounded-xl">
          <CardContent className="flex flex-col items-start gap-4">
            <p className="flex items-center gap-2 text-base font-semibold">
              <Icon icon={RiCheckboxCircleLine} className="size-5 text-status-done" />
              {t('signing.done')}
            </p>
            <Button asChild className="min-h-11">
              <Link to="/c/documents">{t('signing.back')}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <SigningFlow limit={lim} limitUpdatedAt={limit.dataUpdatedAt} company={company.data?.name ?? ''} />
      )}
    </div>
  );
}
