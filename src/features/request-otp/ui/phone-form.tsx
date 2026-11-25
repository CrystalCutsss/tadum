// Экран auth.phone (SC-01 §1, A1, A2, A9, A10, A13): поле номера с маской, «Получить код».
// Вариант с полем Business name (Кирилл 2026-11-19, A-071): поле обязательное — пустое (или из одних пробелов)
// не пускает дальше, после ухода из поля — ошибка; значение никуда не уходит.
// Вариант «новый клиент» (A-074): форма не запрашивает код, а отдаёт номер в onPhoneEntered — код запросит
// следующий экран, «Contact name и Business name».
// Разметка — блок shadcn login-05 (FieldGroup → Field → кнопка во всю ширину).
import { useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { loginFlow } from '@/entities/session';
import { formatNationalInput, nationalDigits, toKsaMobile } from '@/shared/lib';
import { Button, Field, FieldError, FieldGroup, FieldLabel, Input, Spinner } from '@/shared/ui';

import { phoneErrorMessage, type PhoneFormError } from '../model/errors';
import { useRequestOtp } from '../model/use-request-otp';

const KSA_PREFIX = '+966';

export interface PhoneFormProps {
  /** Код запрошен — перейти на экран кода. */
  onRequested: () => void;
  /** Ссылка на поддержку при ошибке сервера (A10). */
  supportSlot?: React.ReactNode;
  /** Вариант входа с полем Business name под номером (A-071). */
  withBusinessName?: boolean;
  /** Новый клиент (A-074): номер введён — перейти к экрану имени и компании, код не запрашивать. */
  onPhoneEntered?: () => void;
}

export function PhoneForm({ onRequested, supportSlot, withBusinessName = false, onPhoneEntered }: PhoneFormProps) {
  const { t } = useTranslation();
  const ids = { input: useId(), error: useId(), label: useId(), prefix: useId(), business: useId(), businessError: useId() };
  const [businessName, setBusinessName] = useState('');
  const [businessBlurred, setBusinessBlurred] = useState(false);
  const [digits, setDigits] = useState(() => nationalDigits(loginFlow.lastPhone() ?? ''));
  const [blurred, setBlurred] = useState(false);
  const { tick, error, setError, activeError, waiting, pending, send } = useRequestOtp(onRequested);

  const phone = toKsaMobile(digits);
  // A1: инлайн-ошибка, если номер не с 5 или (после ухода из поля) неполный.
  const formatInvalid = digits.length > 0 && (digits[0] !== '5' || (blurred && !phone));
  const shown: PhoneFormError | null = formatInvalid ? { kind: 'invalid_format' } : activeError;

  const businessMissing = withBusinessName && businessName.trim() === '';
  const businessInvalid = businessMissing && businessBlurred;
  const blocked = !phone || formatInvalid || businessMissing || pending || waiting;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setBusinessBlurred(true);
    if (!phone || blocked) return;
    if (onPhoneEntered) {
      loginFlow.enterPhone(phone);
      onPhoneEntered();
    } else send(phone);
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
          {/* Код страны — внутри поля слева, как маска (Кирилл 2026-11-11); клики по нему проходят в поле. */}
          <div dir="ltr" className="relative">
            <span
              id={ids.prefix}
              className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-base text-foreground"
            >
              {KSA_PREFIX}
            </span>
            <Input
              id={ids.input}
              dir="ltr"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder={t('auth.phone.placeholder')}
              className="h-12 rounded-lg ps-20 text-base md:text-base"
              value={formatNationalInput(digits)}
              onChange={(e) => {
                setDigits(nationalDigits(e.target.value));
                if (error?.kind === 'invalid_format') setError(null);
              }}
              onBlur={() => setBlurred(true)}
              disabled={pending}
              aria-invalid={shown !== null}
              aria-describedby={message ? `${ids.prefix} ${ids.error}` : ids.prefix}
            />
          </div>
          {message ? <FieldError id={ids.error}>{t(message.key, message.values)}</FieldError> : null}
        </Field>
        {withBusinessName ? (
          <Field>
            <FieldLabel htmlFor={ids.business}>{t('auth.phone.business_name')}</FieldLabel>
            <Input
              id={ids.business}
              type="text"
              autoComplete="organization"
              className="h-12 rounded-lg text-base md:text-base"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              onBlur={() => setBusinessBlurred(true)}
              disabled={pending}
              required
              aria-invalid={businessInvalid}
              aria-describedby={businessInvalid ? ids.businessError : undefined}
            />
            {businessInvalid ? <FieldError id={ids.businessError}>{t('auth.phone.business_name_required')}</FieldError> : null}
          </Field>
        ) : null}
        <Field>
          {retryable ? (
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              className="h-12 w-full text-base"
              disabled={!phone || businessMissing || pending}
            >
              {t('common.retry')}
            </Button>
          ) : (
            <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={blocked} aria-busy={pending}>
              {pending ? <Spinner aria-label={t('common.loading')} /> : null}
              {onPhoneEntered ? t('auth.phone.continue') : t('auth.phone.submit')}
            </Button>
          )}
          {shown?.kind === 'server' ? supportSlot : null}
        </Field>
      </FieldGroup>
    </form>
  );
}
