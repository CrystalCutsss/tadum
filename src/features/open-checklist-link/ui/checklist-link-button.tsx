// «Открыть» у пункта чек-листа (SC-06 §1, A6, D-035): ссылка в новой вкладке с rel="noopener", локальная отметка
// «открыто» с временем клика и событие checklist_link_opened. Во встроенном браузере мессенджера (WhatsApp) ссылка
// может не открыться — вместо перехода подсказка и «Скопировать ссылку». Саму ссылку (в ней бывает одноразовый код)
// в аналитику и логи не отправляем — только хост.
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { markChecklistOpened, type ChecklistItem } from '@/entities/limit';
import { track } from '@/shared/analytics';
import { isInAppBrowser, now } from '@/shared/lib';
import { Button, Icon, RiExternalLinkLine, toast } from '@/shared/ui';

export interface ChecklistLinkButtonProps {
  item: Pick<ChecklistItem, 'key' | 'external_url'> & { external_url: string };
  /** Позиция пункта в чек-листе, с 1 — для события. */
  position: number;
  /** Акцентная кнопка — у первого незавершённого пункта, у остальных — вторичная; `again` — ссылка «Открыть снова». */
  primary: boolean;
  again?: boolean;
  /** Клиент открыл ссылку — экран сразу показывает «ждём подтверждения». */
  onOpened: () => void;
}

const hostOf = (url: string) => {
  try {
    return new URL(url, window.location.href).host;
  } catch {
    return '';
  }
};

export function ChecklistLinkButton({ item, position, primary, again = false, onOpened }: ChecklistLinkButtonProps) {
  const { t } = useTranslation();
  const [blocked, setBlocked] = useState(false);
  const variant = again ? 'link' : primary ? 'default' : 'secondary';

  if (blocked) {
    return (
      <div className={again ? 'flex flex-col items-start gap-1' : 'flex flex-col items-end gap-1 text-end'}>
        <p className="text-sm text-muted-foreground">{t('common.open_in_browser')}</p>
        <Button
          type="button"
          variant={variant}
          className="min-h-11"
          onClick={() => {
            void navigator.clipboard
              ?.writeText(new URL(item.external_url, window.location.href).href)
              .then(() => toast(t('checklist.link_copied')))
              .catch(() => undefined);
          }}
        >
          {t('common.copy_link')}
        </Button>
      </div>
    );
  }

  return (
    <Button asChild variant={variant} className={again ? 'h-auto min-h-11 justify-start px-0' : 'min-h-11'}>
      <a
        href={item.external_url}
        target="_blank"
        rel="noopener"
        onClick={(e) => {
          if (isInAppBrowser()) {
            e.preventDefault();
            setBlocked(true);
            track('external_link_blocked', { item: item.key, href_host: hostOf(item.external_url) });
            return;
          }
          markChecklistOpened(item.key, now());
          track('checklist_link_opened', { item: item.key, position });
          onOpened();
        }}
      >
        {again ? t('checklist.open_again') : t('checklist.open')}
        <Icon icon={RiExternalLinkLine} data-icon="inline-end" className="size-4" />
      </a>
    </Button>
  );
}
