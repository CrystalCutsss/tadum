// Публичный API сегмента shared/i18n.
export {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  applyDocumentLanguage,
  createI18n,
  directionOf,
  isLanguage,
  readStoredLanguage,
  resolveLanguage,
  resources,
  setLanguage,
  type Language,
} from './config';
export {
  formatDate,
  formatDateLong,
  formatFileSize,
  formatMoney,
  formatNumber,
  formatPercent,
  formatPhone,
  formatRelative,
  formatTime,
  isKsaMobile,
  maskPhone,
} from './format';
