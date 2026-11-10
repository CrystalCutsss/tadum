// Экран auth.otp (SC-01 §1, A3–A10, A13): одно поле на 4 цифры с автоотправкой, повтор через 40 с, 5 попыток.
// Разметка — блок shadcn login-05: шапка по центру, FieldGroup → Field → кнопки во всю ширину.
import { useMutation } from '@tanstack/react-query';
import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { authMemory, loginFlow, type PendingLogin } from '@/entities/session';
import { track } from '@/shared/analytics';
import { getApi, type OtpChallenge, type Session } from '@/shared/api';
import { OTP } from '@/shared/config';
import { maskPhone } from '@/shared/i18n';
import { now, toDate, useNow } from '@/shared/lib';
import { Button, Field, FieldDescription, FieldGroup, Input, toast } from '@/shared/ui';

import { canResend, inputLocked, otpErrorFrom, otpErrorMessage, otpFailReason, type OtpFormError } from '../model/errors';

/** Номер внутри арабской фразы — изолированный LTR-фрагмент (LRI … PDI, 01-nfr-locale-brand.md §1.2). */
const ltrIsolate = (text: string) => `\u2066${text}\u2069`;
const isOnline = () => typeof navigator === 'undefined' || navigator.onLine !== false;
const ms = (iso: string) => toDate(iso).getTime();
/** Только цифры кода: арабско-индийские (٠–٩, ۰–۹) приводим к западным, прочее отбрасываем. */
const codeDigits = (raw: string) =>
  raw
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, '')
    .slice(0, OTP.length);

export interface OtpFormProps {
  pending: PendingLogin;
  onVerified: (session: Session) => void;
  /** A8: номер без заявки — экран «Заявка не найдена», сессия не создаётся. */
  onUnknown: () => void;
  /** A13: вернуться к номеру. */
  onChangePhone: () => void;
  supportSlot?: React.ReactNode;
}

export function OtpForm({ pending, onVerified, onUnknown, onChangePhone, supportSlot }: OtpFormProps) {
  const { t } = useTranslation();
  const ids = { title: useId(), error: useId() };
  const inputRef = useRef<HTMLInputElement>(null);
  const [challenge, setChallenge] = useState<OtpChallenge>(pending.challenge);
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [error, setError] = useState<OtpFormError | null>(null);
  const tick = useNow(1000);

  // A4: код истёк по часам — то же состояние, что и ответ otp_expired.
  const expiredByClock = tick >= ms(challenge.expires_at);
  const shown: OtpFormError | null = error ?? (expiredByClock ? { kind: 'expired' } : null);
  const locked = inputLocked(shown) || shown?.kind === 'expired';
  const resendAt = ms(challenge.resend_available_at);
  const resendEnabled = canResend(shown, tick, resendAt);
  const secondsLeft = Math.max(0, Math.ceil((resendAt - tick) / 1000));

  const verify = useMutation({
    mutationFn: async (code: string) => (await getApi()).auth.verifyOtp(pending.phone, code),
    onSuccess: (session) => {
      loginFlow.finish();
      onVerified(session);
    },
    onError: (e) => {
      const next = otpErrorFrom(e, now(), isOnline());
      const reason = otpFailReason(next);
      if (reason) {
        track('auth_otp_failed', next.kind === 'invalid' ? { reason, attempt: OTP.max_attempts - next.attemptsLeft } : { reason });
      }
      if (next.kind === 'phone_unknown') {
        loginFlow.finish();
        onUnknown();
        return;
      }
      setError(next);
      if (next.kind === 'invalid') {
        // A3: поле очищается, фокус в поле.
        setValue('');
        inputRef.current?.focus();
      }
    },
  });

  const resend = useMutation({
    mutationFn: async () => (await getApi()).auth.requestOtp(pending.phone),
    onSuccess: (next) => {
      loginFlow.start({ phone: pending.phone, challenge: next });
      setChallenge(next);
      setError(null);
      setValue('');
      setSubmitted(null);
      toast(t('auth.otp.resent'));
      track('auth_otp_requested', { channel: next.channel, resend: true, source: authMemory.source() });
      inputRef.current?.focus();
    },
    onError: (e) => {
      const next = otpErrorFrom(e, now(), isOnline());
      setError(next);
      const reason = otpFailReason(next);
      if (reason) track('auth_otp_failed', { reason });
    },
  });

  const submit = (code: string) => {
    if (code.length !== OTP.length || verify.isPending || locked) return;
    setSubmitted(code);
    setError(null);
    verify.mutate(code);
  };

  const message = shown ? otpErrorMessage(shown, tick) : null;
  const retryable = shown?.kind === 'offline' || shown?.kind === 'server';
  // Кнопка «Подтвердить» — только если автоотправка не сработала (вставка, экранная клавиатура без событий).
  const needsConfirm = value.length === OTP.length && value !== submitted && !verify.isPending && !locked;
  const channel = t(challenge.channel === 'sms' ? 'auth.channel.sms' : 'auth.channel.whatsapp');

  return (
    <FieldGroup className="gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 id={ids.title} className="text-xl font-bold">
          {t('auth.otp.title')}
        </h1>
        <FieldDescription className="text-center">
          {t('auth.otp.sent_to', { phone: ltrIsolate(maskPhone(pending.phone)), channel })}
        </FieldDescription>
        <Button type="button" variant="ghost" size="sm" onClick={onChangePhone}>
          {t('auth.otp.change_phone')}
        </Button>
      </div>

      <Field className="gap-2">
        <Input
          ref={inputRef}
          dir="ltr"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          maxLength={OTP.length}
          className="h-12 text-center text-lg tracking-widest tabular-nums md:text-lg"
          value={value}
          onChange={(e) => {
            const next = codeDigits(e.target.value);
            setValue(next);
            if (shown?.kind === 'invalid') setError(null);
            // Автоотправка после 4-й цифры — и при наборе, и при вставке целиком.
            if (next.length === OTP.length && next !== value) submit(next);
          }}
          disabled={verify.isPending || locked}
          aria-labelledby={ids.title}
          aria-describedby={message ? ids.error : undefined}
          aria-invalid={shown !== null && shown.kind !== 'offline'}
          aria-busy={verify.isPending}
        />
        <p id={ids.error} data-slot="field-error" role="alert" aria-live="assertive" className="min-h-5 text-center text-sm text-destructive">
          {message ? t(message.key, message.values) : null}
        </p>
      </Field>

      <Field className="gap-3">
        {needsConfirm ? (
          <Button type="button" className="w-full" onClick={() => submit(value)}>
            {t('auth.otp.confirm')}
          </Button>
        ) : null}
        {retryable && submitted ? (
          <Button type="button" variant="outline" className="w-full" onClick={() => submit(submitted)}>
            {t('common.retry')}
          </Button>
        ) : null}
        <Button type="button" variant="ghost" className="w-full" disabled={!resendEnabled || resend.isPending} onClick={() => resend.mutate()}>
          {resendEnabled ? t('auth.otp.resend') : t('auth.otp.resend_in', { seconds: secondsLeft })}
        </Button>
        {shown?.kind === 'server' ? supportSlot : null}
      </Field>
    </FieldGroup>
  );
}
