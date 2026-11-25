// Сохранение профиля поставщика (A-075): номер CR — своим методом порта (D-093), email, отрасль и город — setProfile.
// Ответ порта сразу кладётся в кэш поставщика: экран и панель отправки видят сохранённые значения.
// Сохранения идут по очереди: поля сохраняются независимо, и параллельные запросы перезаписывали бы друг друга.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

import { supplierQuery } from '@/entities/supplier';
import { getApi, type SupplierProfilePatch } from '@/shared/api';

export type ProfileField = 'cr_number' | keyof SupplierProfilePatch;

export function useSaveProfile() {
  const queryClient = useQueryClient();
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  return useMutation({
    mutationFn: ({ field, value }: { field: ProfileField; value: string }) => {
      const run = async () => {
        const api = await getApi();
        const supplier = field === 'cr_number' ? await api.supplier.setCrNumber(value) : await api.supplier.setProfile({ [field]: value });
        queryClient.setQueryData(supplierQuery.queryKey, supplier);
      };
      const next = queue.current.then(run, run);
      queue.current = next.catch(() => undefined);
      return next;
    },
  });
}
