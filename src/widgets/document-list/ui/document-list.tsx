// Список документов клиента (SC-02…SC-04): сводка «Загружено X из N», баннер второго раунда,
// строки документов (сначала те, где нужно действие), нижняя панель отправки. После отправки — только чтение.
import { RiInformationLine } from '@remixicon/react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { documentsProgress, sortDocuments } from '@/entities/document';
import { SubmitBar } from '@/features/submit-documents';
import { track } from '@/shared/analytics';
import type { DocumentSet } from '@/shared/api';
import { formatNumber } from '@/shared/i18n';
import { Alert, AlertDescription, AlertTitle, Icon, Progress } from '@/shared/ui';

import { DocumentRow } from './document-row';

export interface DocumentListProps {
  set: DocumentSet;
  /** Можно менять файлы (права collecting + комплект draft). */
  editable: boolean;
  /** Раскрыть строку документа (?doc=portal_key из диплинка). */
  focusKey?: string | undefined;
}

export function DocumentList({ set, editable, focusKey }: DocumentListProps) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const onUploadingChange = useCallback((key: string, busy: boolean) => setUploading((all) => (all[key] === busy ? all : { ...all, [key]: busy })), []);
  const progress = documentsProgress(set);
  const docs = sortDocuments(set.documents);
  const moreDocs = set.round > 1 && editable;

  useEffect(() => {
    if (moreDocs) track('more_docs_banner_viewed', { owner: 'client', round: set.round, requested_count: set.documents.length, repeated_count: 0 });
    if (!editable) track('documents_viewed_locked', { owner: 'client', documents_count: set.documents.length });
    // Один показ на раунд и режим.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set.round, editable]);

  useEffect(() => {
    if (!focusKey) return;
    document.getElementById(`doc-${focusKey}`)?.scrollIntoView({ block: 'start' });
  }, [focusKey]);

  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="documents-progress" className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="documents-progress" className="text-sm font-medium">
            {editable ? t('documents.progress', { uploaded: formatNumber(progress.uploaded), total: formatNumber(progress.total) }) : t('documents.sent', { count: progress.uploaded })}
          </h2>
        </div>
        <Progress value={progress.total === 0 ? 0 : (progress.uploaded / progress.total) * 100} aria-labelledby="documents-progress" />
      </section>

      {moreDocs ? (
        <Alert>
          <Icon icon={RiInformationLine} />
          <AlertTitle>{t('documents.more.title', { count: set.documents.length })}</AlertTitle>
          <AlertDescription>{t('documents.more.body')}</AlertDescription>
        </Alert>
      ) : null}

      <ul className="flex flex-col gap-3" aria-label={t('documents.list_label')}>
        {docs.map((doc) => (
          <DocumentRow
            key={doc.id}
            doc={doc}
            editable={editable}
            defaultOpen={doc.portal_key === focusKey || (editable && doc.status === 'rejected')}
            onUploadingChange={onUploadingChange}
          />
        ))}
      </ul>

      {editable ? <SubmitBar set={set} uploading={Object.values(uploading).some(Boolean)} /> : null}
    </div>
  );
}
