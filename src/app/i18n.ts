// Запуск i18n приложения: выбрать язык, проставить <html>, убрать ?lang= из адреса.
import { applyDocumentLanguage, createI18n, readStoredLanguage, resolveLanguage, setLanguage } from '@/shared/i18n';

const { lang, source } = resolveLanguage(window.location.search, readStoredLanguage());

export const i18n = createI18n(lang);
applyDocumentLanguage(lang);

if (source === 'url') {
  // ?lang= сильнее сохранённого выбора: запоминаем его и убираем из URL (SC-10, критерии приёмки).
  void setLanguage(i18n, lang, 'url');
  const url = new URL(window.location.href);
  url.searchParams.delete('lang');
  window.history.replaceState(window.history.state, '', url);
}
