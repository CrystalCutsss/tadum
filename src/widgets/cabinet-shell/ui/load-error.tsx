// Ошибка загрузки данных маршрута (SC-10 §1.8): карточка с «Повторить» и SupportBar; оболочка остаётся.
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui';

export function LoadError({ onRetry, support }: { onRetry: () => void; support?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('common.load_error')}</CardTitle>
        </CardHeader>
        <CardContent className="sr-only">{t('common.load_error')}</CardContent>
        <CardFooter>
          <Button onClick={onRetry}>{t('common.retry')}</Button>
        </CardFooter>
      </Card>
      {support}
    </div>
  );
}
