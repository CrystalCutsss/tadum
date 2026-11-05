// Лимит текущей заявки через LimitPort. До одобрения лимита нет — порт отвечает NotFound, здесь это null.
import { queryOptions } from '@tanstack/react-query';

import { NotFound, getApi, type Limit } from '@/shared/api';

export const limitQuery = queryOptions({
  queryKey: ['limit', 'current'],
  queryFn: async (): Promise<Limit | null> => {
    try {
      return await (await getApi()).limit.get();
    } catch (e) {
      if (e instanceof NotFound) return null;
      throw e;
    }
  },
});
