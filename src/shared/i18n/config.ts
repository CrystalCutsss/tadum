// Конфигурация i18next (01-nfr-locale-brand.md §1.1, §1.4; D-075).
// Язык определяется только так: ?lang= → сохранённый выбор → ar. Язык браузера не используется.

import i18next, { type i18n } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { setAnalyticsContext, track } from '@/shared/analytics';
import { storage } from '@/shared/lib';

import ar from './locales/ar.json';
import en from './locales/en.json';

export const SUPPORTED_LANGUAGES = ['ar', 'en'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'ar';

const STORAGE_KEY = 'lang';

export const resources = {
  ar: { translation: ar },
  en: { translation: en },
} as const;

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export function directionOf(lang: Language): 'rtl' | 'ltr' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

/** Язык без ?lang= и сохранённого выбора: арабский; на витрине Proto сборка задаёт английский (A-056). */
export const initialLanguage = (env: string | undefined = import.meta.env.VITE_DEFAULT_LANG): Language => (isLanguage(env) ? env : DEFAULT_LANGUAGE);

/** Чистая функция выбора языка: параметр URL сильнее сохранённого выбора; иначе язык по умолчанию сборки. */
export function resolveLanguage(search: string, stored: string | null, fallback: Language = initialLanguage()): { lang: Language; source: 'url' | 'stored' | 'default' } {
  const fromUrl = new URLSearchParams(search).get('lang');
  if (isLanguage(fromUrl)) return { lang: fromUrl, source: 'url' };
  if (isLanguage(stored)) return { lang: stored, source: 'stored' };
  return { lang: fallback, source: 'default' };
}

/** Проставить lang/dir на <html> без перезагрузки. */
export function applyDocumentLanguage(lang: Language, doc: Document = document): void {
  setAnalyticsContext({ lang, dir: directionOf(lang) });
  doc.documentElement.lang = lang;
  doc.documentElement.dir = directionOf(lang);
}

export function readStoredLanguage(): string | null {
  return storage.get(STORAGE_KEY);
}

/** Создать и инициализировать экземпляр i18next (синхронно: ресурсы встроены в бандл). */
export function createI18n(lang: Language): i18n {
  const instance = i18next.createInstance();
  void instance.use(initReactI18next).init({
    resources,
    lng: lang,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    fallbackLng: DEFAULT_LANGUAGE,
    initAsync: false,
    returnNull: false,
    interpolation: { prefix: '{', suffix: '}', escapeValue: false },
    react: { useSuspense: false },
  });
  return instance;
}

/** Сменить язык: i18next, <html>, хранилище и событие аналитики. */
export async function setLanguage(instance: i18n, lang: Language, source: 'switch' | 'url'): Promise<void> {
  await instance.changeLanguage(lang);
  applyDocumentLanguage(lang);
  storage.set(STORAGE_KEY, lang);
  track('language_changed', { to: lang, source });
}
