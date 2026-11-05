// Переключатель языка (SC-10 §1.1, A6): кнопка с названием другого языка на нём самом; цель ≥ 44 px.
import { useTranslation } from 'react-i18next';

import { useSwitchLanguage } from '@/features/switch-language';
import { Button } from '@/shared/ui';

export function LanguageSwitch({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { other, switchTo } = useSwitchLanguage();
  return (
    <Button variant="ghost" className={className ?? 'min-h-11 min-w-11'} lang={other} onClick={() => switchTo(other)}>
      {t(other === 'en' ? 'lang.switch_to_en' : 'lang.switch_to_ar')}
    </Button>
  );
}
