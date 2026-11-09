// Список документов клиента (SC-02…SC-04): баннер второго раунда, строки документов (сначала те, где нужно
// действие), плавающая карточка отправки с прогрессом «Загружено X из N» (решения Кирилла 2026-11-09).
// Попытка отправить с незагруженными документами подсвечивает их и прокручивает к верхнему, если он не виден целиком.
import { RiInformationLine } from '@remixicon/react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { documentsProgress, sortDocuments } from '@/entities/document';
import { SubmitBar } from '@/features/submit-documents';
import { track } from '@/shared/analytics';
import type { DocumentSet } from '@/shared/api';
import { Alert, AlertDescription, AlertTitle, Icon } from '@/shared/ui';

import { DocumentRow } from './document-row';

export interface DocumentListProps {
  set: DocumentSet;
  /** Можно менять файлы (права collecting + комплект draft). */
  editable: boolean;
  /** Раскрыть строку документа (?doc=portal_key из диплинка). */
  focusKey?: string | undefined;
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Прокрутить к строке, только если она видна не целиком. */
function revealRow(portalKey: string) {
  const el = document.getElementById(`doc-${portalKey}`);
  if (!el) return;
  const r = el.getBoundingClientRect();
  if (r.top >= 0 && r.bottom <= window.innerHeight) return;
  el.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
}

export function DocumentList({ set, editable, focusKey }: DocumentListProps) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [highlight, setHighlight] = useState<readonly string[]>([]);
  const onUploadingChange = useCallback((key: string, busy: boolean) => setUploading((all) => (all[key] === busy ? all : { ...all, [key]: busy })), []);
  const docs = sortDocuments(set.documents);
  const moreDocs = set.round > 1 && editable;
  // Новый клиент (ничего не загружено): первая карточка раскрыта (решение 2026-11-09).
  const firstOpen = editable && documentsProgress(set).uploaded === 0 ? docs[0]?.portal_key : undefined;

  useEffect(() => {
    if (moreDocs) track('more_docs_banner_viewed', { owner: 'client', round: set.round, requested_count: set.documents.length, repeated_count: 0 });
    if (!editable) track('documents_viewed_locked', { owner: 'client', documents_count: set.documents.length });
    // Один показ на раунд и режим.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set.round, editable]);

  useEffect(() => {
    if (focusKey) revealRow(focusKey);
  }, [focusKey]);

  const onBlocked = (keys: string[]) => {
    setHighlight(keys);
    // Верхний из подсвеченных — в порядке списка.
    const top = docs.find((d) => keys.includes(d.portal_key));
    if (top) revealRow(top.portal_key);
  };

  return (
    <div className="flex flex-col gap-3">
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
            defaultOpen={doc.portal_key === focusKey || doc.portal_key === firstOpen || (editable && doc.status === 'rejected')}
            // Подсветка гаснет сама, когда документ загружен.
            highlighted={highlight.includes(doc.portal_key) && (doc.status === 'pending' || doc.status === 'rejected')}
            onUploadingChange={onUploadingChange}
          />
        ))}
      </ul>

      {editable ? <SubmitBar set={set} uploading={Object.values(uploading).some(Boolean)} onBlocked={onBlocked} /> : null}
    </div>
  );
}
