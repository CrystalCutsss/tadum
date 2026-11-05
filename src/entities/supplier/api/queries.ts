// Запрос поставщика через SupplierPort.
import { queryOptions } from '@tanstack/react-query';

import { getApi } from '@/shared/api';

export const supplierQuery = queryOptions({
  queryKey: ['supplier', 'current'],
  queryFn: async () => (await getApi()).supplier.get(),
});
