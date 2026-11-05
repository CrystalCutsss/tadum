// Комплект документов владельца (клиент или поставщик) через DocumentsPort.
import { queryOptions } from '@tanstack/react-query';

import { getApi, type DocumentSet } from '@/shared/api';

export const documentSetQuery = (owner: DocumentSet['owner']) =>
  queryOptions({
    queryKey: ['documents', owner.kind, owner.id],
    queryFn: async () => (await getApi()).documents.getSet(owner),
  });
