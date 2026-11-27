// Боковой блок главной (D-099): связь с менеджером и ссылка «Договор и документы» в «Заявку». На ≥ 1024 px — в третьей
// колонке (CabinetAside), на узких экранах — внизу основной колонки. Менеджер — блок поддержки (A-077): имени в данных нет.
import { RiArrowRightSLine, RiFileTextLine } from '@remixicon/react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import type { ClientStatus } from '@/shared/api';
import { ROUTES } from '@/shared/config';
import { Icon } from '@/shared/ui';
import { SupportBar } from '@/widgets/support-bar';

export function HomeAside({ status }: { status: ClientStatus }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      <Link
        to={ROUTES.clientDocuments}
        className="flex min-h-11 items-center gap-3 rounded-xl border bg-card p-4 text-sm font-medium text-card-foreground outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <Icon icon={RiFileTextLine} className="size-5 text-muted-foreground" />
        <span className="flex-1">{t('home.docs_link')}</span>
        <Icon icon={RiArrowRightSLine} className="size-5 text-muted-foreground" />
      </Link>
      <SupportBar status={status} />
    </div>
  );
}
