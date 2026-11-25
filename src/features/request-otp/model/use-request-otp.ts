// Запрос кода (SC-01 §1): мутация, ошибки A2/A9/A10 с таймером и события auth_otp_*.
// Общий для экрана номера и экрана «Contact name и Business name» нового клиента (A-074).
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { authMemory, loginFlow } from '@/entities/session';
import { track } from '@/shared/analytics';
import { getApi, type OtpChallenge } from '@/shared/api';
import { now, useNow } from '@/shared/lib';

import { phoneErrorActive, phoneErrorFrom, phoneFailReason, type PhoneFormError } from './errors';

const isOnline = () => typeof navigator === 'undefined' || navigator.onLine !== false;

export function useRequestOtp(onRequested: () => void) {
  const [error, setError] = useState<PhoneFormError | null>(null);
  // useNow отдаёт новое время только раз в секунду, а первое значение — время монтирования формы;
  // без now() сразу после ошибки с таймером обратный отсчёт показывал бы на минуту больше.
  const tick = Math.max(useNow(error && 'until' in error ? 1000 : null), now());

  const request = useMutation({
    mutationFn: async (value: string): Promise<OtpChallenge> => (await getApi()).auth.requestOtp(value),
    onSuccess: (challenge, value) => {
      loginFlow.start({ phone: value, challenge });
      track('auth_otp_requested', { channel: challenge.channel, resend: false, source: authMemory.source() });
      onRequested();
    },
    onError: (e) => {
      const next = phoneErrorFrom(e, now(), isOnline());
      setError(next);
      const reason = phoneFailReason(next);
      if (reason) track('auth_otp_failed', { reason });
    },
  });

  const activeError = phoneErrorActive(error, tick) ? error : null;
  return {
    tick,
    error,
    setError,
    activeError,
    /** Ошибка с таймером (A2) не даёт запросить код снова до конца отсчёта. */
    waiting: activeError !== null && 'until' in activeError,
    pending: request.isPending,
    send: (phone: string) => {
      setError(null);
      request.mutate(phone);
    },
  };
}
