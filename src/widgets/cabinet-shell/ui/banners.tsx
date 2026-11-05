// Баннеры оболочки: офлайн (SC-10 §1.6 — состояние, не маршрут; не перекрывает шапку) и недоступное хранилище (A3, один раз).
import { RiErrorWarningLine, RiWifiOffLine } from '@remixicon/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { onStorageUnavailable, useOnline } from '@/shared/lib';
import { Alert, AlertDescription, Icon } from '@/shared/ui';

export function OfflineBanner({ forceOffline = false }: { forceOffline?: boolean }) {
  const { t } = useTranslation();
  const online = useOnline();
  if (online && !forceOffline) return null;
  return (
    <Alert role="status">
      <Icon icon={RiWifiOffLine} />
      <AlertDescription>{t('common.offline_banner')}</AlertDescription>
    </Alert>
  );
}

export function StorageBanner({ force = false }: { force?: boolean }) {
  const { t } = useTranslation();
  const [unavailable, setUnavailable] = useState(force);
  useEffect(() => onStorageUnavailable(() => setUnavailable(true)), []);
  if (!unavailable) return null;
  return (
    <Alert role="status">
      <Icon icon={RiErrorWarningLine} />
      <AlertDescription>{t('common.storage_unavailable')}</AlertDescription>
    </Alert>
  );
}
