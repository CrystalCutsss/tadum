// Смена языка без перезагрузки (SC-10 §1.1): i18next, <html lang/dir>, хранилище, language_changed.
import { useTranslation } from 'react-i18next';

import { isLanguage, setLanguage, type Language } from '@/shared/i18n';

export function useSwitchLanguage(): { language: Language; other: Language; switchTo: (lang: Language) => void } {
  const { i18n } = useTranslation();
  const language: Language = isLanguage(i18n.language) ? i18n.language : 'ar';
  return {
    language,
    other: language === 'ar' ? 'en' : 'ar',
    switchTo: (lang) => {
      if (lang !== language) void setLanguage(i18n, lang, 'switch');
    },
  };
}
