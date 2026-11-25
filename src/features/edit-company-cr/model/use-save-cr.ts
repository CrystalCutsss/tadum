// Сохранение номера CR компании клиента (решение Кирилла 2026-11-10): без него комплект не отправить.
// У поставщика номер CR — часть блока профиля (A-075, фича edit-supplier-profile).
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { companyQuery } from '@/entities/application';
import { getApi } from '@/shared/api';

export function useSaveCr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (crNumber: string) => {
      const api = await getApi();
      queryClient.setQueryData(companyQuery.queryKey, await api.application.setCrNumber(crNumber));
    },
  });
}
