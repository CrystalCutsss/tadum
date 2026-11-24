// /s/documents — экран «Заявка» (Application) поставщика (бриф TD-001, SP-03): документы и этапы до реферальной ссылки.
// Сюда ведёт вход поставщика, пока нет его главной (Кирилл 2026-11-24, TD-001 §12).
import { createFileRoute } from '@tanstack/react-router';

import { documentSetQuery } from '@/entities/document';
import { supplierQuery } from '@/entities/supplier';

import { SupplierDocuments } from '../-components/supplier-documents';

export const Route = createFileRoute('/s/documents')({
  // Данные запрашиваются вместе с чанком экрана, не блокируя переход (как /c/documents).
  loader: ({ context: { queryClient } }) => {
    void queryClient
      .ensureQueryData(supplierQuery)
      .then((s) => queryClient.prefetchQuery(documentSetQuery({ kind: 'supplier', id: s.id })))
      .catch(() => undefined);
  },
  component: SupplierDocuments,
});
