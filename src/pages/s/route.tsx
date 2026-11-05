// Кабинет поставщика /s/*: есть сессия и роль supplier (01-cabinet-structure.md §1). Ошибка данных маршрута — карточка внутри оболочки (SC-10 §1.8).
import { Outlet, createFileRoute } from '@tanstack/react-router';

import { decideCabinet, familyMemory, loadSessionState } from '@/entities/session';
import { setAnalyticsContext } from '@/shared/analytics';

import { CabinetLayout, CabinetRouteError } from '../-components/cabinet-layout';
import { enforce } from '../-guard';

export const Route = createFileRoute('/s')({
  beforeLoad: async ({ context, location }) => {
    enforce(decideCabinet(await loadSessionState(context.queryClient), location.href, familyMemory.last()));
    // dual: активная семья переключается на семью маршрута (диплинк из WhatsApp работает без лишних экранов).
    familyMemory.remember('supplier');
    setAnalyticsContext({ role: 'supplier' });
  },
  component: () => (
    <CabinetLayout family="supplier">
      <Outlet />
    </CabinetLayout>
  ),
  errorComponent: () => <CabinetRouteError family="supplier" />,
});
