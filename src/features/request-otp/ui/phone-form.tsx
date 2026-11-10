// Экран auth.phone (SC-01 §1, A1, A2, A9, A10, A13): поле номера с маской, «Получить код».
// Разметка — блок shadcn login-05 (FieldGroup → Field → кнопка во всю ширину).
import { useMutation } from '@tanstack/react-query';
import { useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { authMemory, loginFlow } from '@/entities/session';
import { track } from '@/shared/analytics';
import { getApi, type OtpChallenge } from '@/shared/api';
import { formatNationalInput, nationalDigits, now, toKsaMobile, useNow } from '@/shared/lib';
import { Button, Field, FieldError, FieldGroup, FieldLabel, Input, Ltr, Spinner } from '@/shared/ui';

import { phoneErrorActive, phoneErrorFrom, phoneErrorMessage, phoneFailReason, type PhoneFormError } from '../model/errors';

const KSA_PREFIX = '+966';
const isOnline = () => typeof navigator === 'undefined' || navigator.onLine !== false;

export interface PhoneFormProps {
  /** Код запрошен — перейти на экран кода. */
  onRequested: () => void;
  /** Ссылка на поддержку при ошибке сервера (A10). */
  supportSlot?: React.ReactNode;
}

export function PhoneForm({ onRequested, supportSlot }: PhoneFormProps) {
  const { t } = useTranslation();
  const ids = { input: useId(), error: useId(), label: useId() };
  const [digits, setDigits] = useState(() => nationalDigits(loginFlow.lastPhone() ?? ''));
  const [blurred, setBlurred] = useState(false);
  const [error, setError] = useState<PhoneFormError | null>(null);
  // useNow отдаёт новое время только раз в секунду, а первое значение — время монтирования формы;
  // без now() сразу после ошибки с таймером обратный отсчёт показывал бы на минуту больше.
  const tick = Math.max(useNow(error && 'until' in error ? 1000 : null), now());

  const phone = toKsaMobile(digits);
  // A1: инлайн-ошибка, если номер не с 5 или (после ухода из поля) неполный.
  const formatInvalid = digits.length > 0 && (digits[0] !== '5' || (blurred && !phone));
  const activeError = phoneErrorActive(error, tick) ? error : null;
  const shown: PhoneFormError | null = formatInvalid ? { kind: 'invalid_format' } : activeError;

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

  const blocked = !phone || formatInvalid || request.isPending || (activeError !== null && 'until' in activeError);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (phone && !blocked) {
      setError(null);
      request.mutate(phone);
    }
  };
  const message = shown ? phoneErrorMessage(shown, tick) : null;
  const retryable = shown?.kind === 'offline' || shown?.kind === 'server';

  return (
    <form noValidate onSubmit={submit}>
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel id={ids.label} htmlFor={ids.input}>
            {t('auth.phone.label')}
          </FieldLabel>
          <div dir="ltr" className="flex items-center gap-2">
            <Ltr className="text-base text-muted-foreground">{KSA_PREFIX}</Ltr>
            <Input
              id={ids.input}
              dir="ltr"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder={t('auth.phone.placeholder')}
              className="h-12 rounded-lg text-base md:text-base"
              value={formatNationalInput(digits)}
              onChange={(e) => {
                setDigits(nationalDigits(e.target.value));
                if (error?.kind === 'invalid_format') setError(null);
              }}
              onBlur={() => setBlurred(true)}
              disabled={request.isPending}
              aria-invalid={shown !== null}
              aria-describedby={message ? ids.error : undefined}
            />
          </div>
          {message ? <FieldError id={ids.error}>{t(message.key, message.values)}</FieldError> : null}
        </Field>
        <Field>
          {retryable ? (
            <Button type="submit" variant="outline" size="lg" className="h-12 w-full text-base" disabled={!phone || request.isPending}>
              {t('common.retry')}
            </Button>
          ) : (
            <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={blocked} aria-busy={request.isPending}>
              {request.isPending ? <Spinner aria-label={t('common.loading')} /> : null}
              {t('auth.phone.submit')}
            </Button>
          )}
          {shown?.kind === 'server' ? supportSlot : null}
        </Field>
      </FieldGroup>
    </form>
  );
}
