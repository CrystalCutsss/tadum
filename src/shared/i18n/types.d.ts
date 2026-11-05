// Типизация ключей i18n по ar.json: опечатка в ключе — ошибка tsc.
import 'i18next';

import type ar from './locales/ar.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof ar };
    returnNull: false;
  }
}
