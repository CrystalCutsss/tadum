// Баннер «Со времени вашего последнего визита: {статус}» (D-034, SC-05 A6a): закрываемый, над шкалой.
// Смена статуса объявляется через aria-live="polite".
import { useTranslation } from 'react-i18next';

import type { ClientStatus } from '@/shared/api';
import { Alert, AlertDescription, Button } from '@/shared/ui';

export function StatusBanner({ to, onDismiss }: { to: ClientStatus; onDismiss: () => void }) {
  const { t } = useTranslation();
  return (
    <Alert role="status" aria-live="polite" className="flex items-center justify-between gap-3">
      <AlertDescription>{t('status.changed_banner', { status: t(`status.client.${to}`) })}</AlertDescription>
      <Button size="sm" variant="outline" onClick={onDismiss}>
        {t('status.changed_banner_dismiss')}
      </Button>
    </Alert>
  );
}
