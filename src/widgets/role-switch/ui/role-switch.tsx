// Переключатель «Клиент | Поставщик» для dual (01-cabinet-structure.md §4, SP-01) и подсказка один раз.
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { roleHint, useSwitchRole } from '@/features/switch-role';
import { track } from '@/shared/analytics';
import type { Family } from '@/shared/config';
import { Button, Popover, PopoverAnchor, PopoverContent, ToggleGroup, ToggleGroupItem } from '@/shared/ui';

export function RoleSwitch({ current }: { current: Family }) {
  const { t } = useTranslation();
  const switchRole = useSwitchRole(current);
  const [hintOpen, setHintOpen] = useState(() => !roleHint.seen());

  useEffect(() => {
    if (hintOpen) track('role_hint_shown', {});
    // Подсказка показывается один раз за всё время: флаг ставится при первом показе.
    roleHint.markSeen();
  }, [hintOpen]);

  const dismiss = () => {
    setHintOpen(false);
    track('role_hint_dismissed', {});
  };

  return (
    <Popover open={hintOpen} onOpenChange={(open) => (open ? undefined : dismiss())}>
      <PopoverAnchor asChild>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={current}
          onValueChange={(v) => {
            if (v === 'client' || v === 'supplier') switchRole(v);
          }}
          aria-label={`${t('role.client')} / ${t('role.supplier')}`}
        >
          <ToggleGroupItem value="client" className="min-h-11">
            {t('role.client')}
          </ToggleGroupItem>
          <ToggleGroupItem value="supplier" className="min-h-11">
            {t('role.supplier')}
          </ToggleGroupItem>
        </ToggleGroup>
      </PopoverAnchor>
      <PopoverContent aria-label={t('role.hint_supplier')} className="flex flex-col gap-3">
        <p className="text-sm">{t('role.hint_supplier')}</p>
        <Button size="sm" className="self-end" onClick={dismiss}>
          {t('role.hint_dismiss')}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
