/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_PATH?: string;
  readonly VITE_API_MODE?: 'mock' | 'http';
  readonly VITE_DEMO_PANEL?: '1' | '0';
  readonly VITE_ANALYTICS?: 'console' | 'demo' | 'posthog';
  readonly VITE_PROTO_VERSION?: string;
  readonly VITE_SUPPORT_WHATSAPP?: string;
  readonly VITE_SUPPORT_EMAIL?: string;
  readonly VITE_LANDING_URL?: string;
  /** Версия сборки для аналитики: package.json + короткий хеш коммита (vite.config.ts). */
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
