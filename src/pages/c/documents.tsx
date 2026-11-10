// /c/documents — список документов клиента (SC-02…SC-05). Отдельных экранов-карточек нет (решение Кирилла
// 2026-11-09): диплинк на документ — ?doc=<portal_key>, строка раскрывается и прокручивается к началу (A-058).
import { createFileRoute } from '@tanstack/react-router';

import { applicationQuery, companyQuery } from '@/entities/application';
import { documentSetQuery } from '@/entities/document';

import { ClientDocuments } from '../-components/client-documents';

interface DocumentsSearch {
  doc?: string;
}

export const Route = createFileRoute('/c/documents')({
  validateSearch: (search: Record<string, unknown>): DocumentsSearch =>
    typeof search.doc === 'string' && /^[a-z_]{1,40}$/.test(search.doc) ? { doc: search.doc } : {},
  // Данные экрана запрашиваются вместе с загрузкой его чанка, не дожидаясь рендера (Кирилл 2026-11-10: экран открывался
  // долго). Не блокирует переход: ошибки покажет сам экран через свои запросы — те же ключи, из кэша.
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(companyQuery);
    void queryClient
      .ensureQueryData(applicationQuery)
      .then((app) => queryClient.prefetchQuery(documentSetQuery({ kind: 'application', id: app.id })))
      .catch(() => undefined);
  },
  component: DocumentsRoute,
});

function DocumentsRoute() {
  const { doc } = Route.useSearch();
  return <ClientDocuments focusKey={doc} />;
}
