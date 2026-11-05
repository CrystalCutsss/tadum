// Выход с единственным диалогом подтверждения (SC-10, SC10-1): выход — потеря сессии на 30 дней.
// Диалог один; открывают его кнопка в настройках и пункт меню шапки.
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui';

import { useLogout } from '../model/use-logout';

export function LogoutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation();
  const { logout, pending } = useLogout();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('help.logout_confirm')}</DialogTitle>
          <DialogDescription>{t('help.logout_hint')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t('common.cancel')}</Button>
          </DialogClose>
          <Button onClick={() => void logout()} disabled={pending} aria-busy={pending}>
            {t('help.logout')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LogoutButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {t('help.logout')}
      </Button>
      <LogoutDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
