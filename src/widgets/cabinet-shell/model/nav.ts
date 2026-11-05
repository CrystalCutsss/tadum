// Пункты навигации по семье роли (01-cabinet-structure.md §2 — черновик). В v1 — только существующие маршруты:
// у поставщика «Ссылка», «Клиенты», «Документы», «Условия» появятся в v3/v5 (A-040).
import { RiFileTextLine, RiHomeLine, RiQuestionLine, type RemixiconComponentType } from '@remixicon/react';

import { ROUTES, type Family } from '@/shared/config';

export interface NavItem {
  to: string;
  labelKey: 'nav.home' | 'nav.documents' | 'nav.help';
  icon: RemixiconComponentType;
}

export const NAV: Readonly<Record<Family, readonly NavItem[]>> = {
  client: [
    { to: ROUTES.clientHome, labelKey: 'nav.home', icon: RiHomeLine },
    { to: ROUTES.clientDocuments, labelKey: 'nav.documents', icon: RiFileTextLine },
    { to: ROUTES.clientHelp, labelKey: 'nav.help', icon: RiQuestionLine },
  ],
  supplier: [
    { to: ROUTES.supplierHome, labelKey: 'nav.home', icon: RiHomeLine },
    { to: ROUTES.supplierHelp, labelKey: 'nav.help', icon: RiQuestionLine },
  ],
};
