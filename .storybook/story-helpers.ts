// Помощники play-тестов: перевод на языке истории и мок с чистым состоянием.
import type { ParseKeys } from 'i18next';

import { loginFlow, type PendingLogin } from '../src/entities/session';
import { getApi, type Api } from '../src/shared/api';
import { now, setClock } from '../src/shared/lib';
import { createI18n } from '../src/shared/i18n';

/** Перевод на языке, в котором отрисована история (globals.locale → <html lang>). */
export function tr(key: ParseKeys, values?: Record<string, unknown>): string {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'ar';
  return createI18n(lang).t(key, values ?? {});
}

/** Мок без сессии и без запросов кода; сеть — в норме. */
export async function freshMock(persona = 'unknown_phone'): Promise<Api> {
  const api = await getApi();
  api.demo!.setNetwork('ok');
  api.demo!.setPersona(persona);
  await api.auth.logout();
  loginFlow.finish();
  return api;
}

/** Запросить код «в прошлом» (смещение в мс назад): так в истории истёкший код или доступный повтор. */
export async function pendingLogin(phone: string, persona: string, agoMs = 0): Promise<PendingLogin> {
  const api = await freshMock(persona);
  const t = now() - agoMs;
  const restore = setClock(() => t);
  try {
    const challenge = await api.auth.requestOtp(phone);
    const pending = { phone, challenge };
    loginFlow.start(pending);
    return pending;
  } finally {
    restore();
  }
}
