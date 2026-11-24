// /s/documents — экран «Заявка» (Application) поставщика (бриф TD-001; SP-03; D-087–D-091). Основа — клиентский экран
// «Заявка»: те же список документов, отправка и шкала шагов. Этапы после отправки: проверка → «Остался договор»
// (D-090) → «Вы партнёр Tadum» с реферальной ссылкой вместо карточки лимита (D-089). Declined — нейтральный экран,
// Lost — только чтение с баннером. Срок проверки поставщику не показываем (D-091).
import { useQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { documentSetQuery } from '@/entities/document';
import { computeSupplierTimeline, supplierApplicationStage, supplierCan, supplierQuery, type SupplierStatus } from '@/entities/supplier';
import { track } from '@/shared/analytics';
import { useStatusPolling, type DocumentSet } from '@/shared/api';
import { useIsMobile } from '@/shared/lib';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  SideDrawer,
  Skeleton,
  toast,
} from '@/shared/ui';
import { CabinetAside, CabinetPageHeader, LoadError } from '@/widgets/cabinet-shell';
import { DocumentList } from '@/widgets/document-list';
import { StatusStepBar, StatusTimeline } from '@/widgets/status-timeline';
import { ContractPendingCard, PausedBanner, ReferralHeroCard, SupplierClosedCard } from '@/widgets/supplier-application-stage';
import { SupportBar } from '@/widgets/support-bar';

/** Панель шагов — как у клиента: фон secondary, вторичный текст с контрастом AA. */
const PANEL_MUTED = '[&_.text-muted-foreground]:text-secondary-foreground/65';

/** Смена статуса поставщика при открытом экране — тост (D-034); переход в partner — тоже тост, без отдельного экрана (D-089). */
function useStatusChangeNotice(status: SupplierStatus | undefined) {
  const { t } = useTranslation();
  const prev = useRef<SupplierStatus | undefined>(undefined);
  useEffect(() => {
    if (status === undefined) return;
    if (prev.current !== undefined && prev.current !== status) toast(t('status.updated'));
    prev.current = status;
  }, [status, t]);
}

/** Комплект только для чтения — в выдвижной панели (как D-082): сбоку на компьютере, снизу на телефоне. */
function DocumentsPanel({ set, open, onOpenChange }: { set: DocumentSet; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const title = t('supplier.partner.documents_link');
  const description = t('application.documents_accepted', { count: set.documents.length });
  const list = <DocumentList set={set} editable={false} archive crReady onCrMissing={() => undefined} />;
  if (isMobile) {
    return (
      <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
        <ResponsiveDialogContent size="tall" closeLabel={t('common.close')}>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>{description}</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody>{list}</ResponsiveDialogBody>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    );
  }
  return (
    <SideDrawer open={open} onOpenChange={onOpenChange} title={title} description={description} closeLabel={t('common.close')}>
      {list}
    </SideDrawer>
  );
}

export function SupplierDocuments() {
  const { t } = useTranslation();
  const supplier = useStatusPolling(supplierQuery);
  const owner = { kind: 'supplier' as const, id: supplier.data?.id ?? '' };
  const set = useQuery({ ...documentSetQuery(owner), enabled: Boolean(supplier.data) });
  const [docsOpen, setDocsOpen] = useState(false);
  useStatusChangeNotice(supplier.data?.supplier_status);

  const data = supplier.data;
  const status = data?.supplier_status;
  const locked = set.data?.locked ?? true;
  const editable = status ? supplierCan('upload_or_replace_file', { supplier_status: status, locked }) : false;

  useEffect(() => {
    if (!set.data) return;
    const docs = set.data.documents;
    track('screen_viewed', {
      screen_id: 'supplier.documents',
      uploaded: docs.filter((d) => d.files.length > 0).length,
      total: docs.length,
      has_rejected: docs.some((d) => d.status === 'rejected'),
    });
    // Один просмотр на статус и раунд.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, set.data?.round]);

  if (supplier.isError || set.isError) {
    const retry = supplier.isError ? supplier.refetch : set.refetch;
    return <LoadError onRetry={() => void retry()} support={<SupportBar context="error" />} />;
  }
  if (!data || !status || !set.data) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-3 w-full" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  const stage = supplierApplicationStage(status);
  // «Вы партнёр Tadum» — путь пройден, шкала не нужна (как «Лимит одобрен» у клиента, Кирилл 2026-11-11).
  const steps = stage === 'partner' ? null : computeSupplierTimeline(status, set.data.locked);
  const subtitle =
    // На остальных этапах статус уже в карточке — без подзаголовка (как «Лимит одобрен» у клиента).
    stage === 'documents' ? (editable ? t('documents.subtitle') : t('documents.subtitle_locked')) : null;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <CabinetPageHeader>
        <header className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold">{t('documents.title')}</h1>
          {subtitle ? <p className="text-base text-muted-foreground">{subtitle}</p> : null}
        </header>
      </CabinetPageHeader>

      {steps ? (
        <>
          <div className={cn('flex flex-col gap-2 rounded-xl bg-secondary p-3 text-secondary-foreground lg:hidden', PANEL_MUTED)}>
            <StatusStepBar family="supplier" steps={steps} />
          </div>
          <CabinetAside>
            <div className="sticky top-4 flex w-1/2 max-w-full min-w-56 flex-col gap-4">
              <Card className={cn('gap-4 rounded-xl py-5 bg-secondary text-secondary-foreground ring-0', PANEL_MUTED)}>
                <CardHeader>
                  <CardTitle>{t('documents.review.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <StatusTimeline family="supplier" steps={steps} orientation="vertical" />
                </CardContent>
              </Card>
            </div>
          </CabinetAside>
        </>
      ) : null}

      {stage === 'documents' || stage === 'paused' ? (
        <>
          {stage === 'paused' ? <PausedBanner /> : null}
          <DocumentList set={set.data} editable={editable} crReady onCrMissing={() => undefined} />
          {!editable && stage === 'documents' ? (
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-base">{t('documents.locked.title')}</CardTitle>
                <CardDescription>{t('documents.locked.body')}</CardDescription>
              </CardHeader>
            </Card>
          ) : null}
        </>
      ) : stage === 'contract' ? (
        <ContractPendingCard />
      ) : stage === 'partner' ? (
        <>
          <ReferralHeroCard url={data.referral_url} slug={data.slug} supplierName={data.name} onOpenDocuments={() => setDocsOpen(true)} />
          <DocumentsPanel set={set.data} open={docsOpen} onOpenChange={setDocsOpen} />
        </>
      ) : (
        <SupplierClosedCard />
      )}
    </div>
  );
}
