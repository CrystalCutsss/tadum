// Экран «Contact name и Business name» нового клиента (Кирилл 2026-11-25, A-074): между номером и кодом.
// Оба поля обязательные (model/contact-details.ts): пока поле неверное, «Get code» неактивна, ошибка — после ухода
// из поля или попытки отправить. Значения хранятся только в памяти вкладки (loginFlow) с первого ввода — «Change number»
// их не теряет — и на бэкенд не уходят.
import { useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { loginFlow, type ContactDetails } from '@/entities/session';
import { Button, Field, FieldError, FieldGroup, FieldLabel, Input, Spinner } from '@/shared/ui';

import { businessNameError, contactNameError, DETAILS_MIN_LENGTH, type DetailsFieldError } from '../model/contact-details';
import { phoneErrorMessage } from '../model/errors';
import { useRequestOtp } from '../model/use-request-otp';

export interface ContactDetailsFormProps {
  /** Номер с прошлого экрана. */
  phone: string;
  /** Код запрошен — перейти на экран кода. */
  onRequested: () => void;
  /** Вернуться к номеру. */
  onChangePhone: () => void;
  /** Ссылка на поддержку при ошибке сервера (A10). */
  supportSlot?: React.ReactNode;
}

type DetailsMessageKey =
  | 'auth.details.contact_name_required'
  | 'auth.details.too_short'
  | 'auth.details.contact_name_letters'
  | 'auth.details.business_name_required';

const CONTACT_ERRORS = {
  required: 'auth.details.contact_name_required',
  too_short: 'auth.details.too_short',
  letters_only: 'auth.details.contact_name_letters',
} as const satisfies Record<DetailsFieldError, DetailsMessageKey>;
const BUSINESS_ERRORS = {
  required: 'auth.details.business_name_required',
  too_short: 'auth.details.too_short',
} as const satisfies Record<Exclude<DetailsFieldError, 'letters_only'>, DetailsMessageKey>;

interface DetailsFieldProps {
  label: string;
  autoComplete: string;
  value: string;
  error: string | null;
  disabled: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}

function DetailsField({ label, autoComplete, value, error, disabled, onChange, onBlur }: DetailsFieldProps) {
  const ids = { input: useId(), error: useId() };
  return (
    <Field>
      <FieldLabel htmlFor={ids.input}>{label}</FieldLabel>
      <Input
        id={ids.input}
        type="text"
        autoComplete={autoComplete}
        className="h-12 rounded-lg text-base md:text-base"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        required
        aria-invalid={error !== null}
        aria-describedby={error ? ids.error : undefined}
      />
      {error ? <FieldError id={ids.error}>{error}</FieldError> : null}
    </Field>
  );
}

export function ContactDetailsForm({ phone, onRequested, onChangePhone, supportSlot }: ContactDetailsFormProps) {
  const { t } = useTranslation();
  const saved = loginFlow.details();
  const [contactName, setContactName] = useState(saved?.contactName ?? '');
  const [businessName, setBusinessName] = useState(saved?.businessName ?? '');
  const [touched, setTouched] = useState({ contact: false, business: false });
  // Введённое сохраняется сразу (Кирилл 2026-11-25): «Change number» и возврат с экрана кода его не теряют.
  const update = (next: Partial<ContactDetails>) => {
    const details = { contactName, businessName, ...next };
    setContactName(details.contactName);
    setBusinessName(details.businessName);
    loginFlow.saveDetails(details);
  };
  const { tick, activeError, waiting, pending, send } = useRequestOtp(onRequested);

  const contactError = contactNameError(contactName);
  const businessError = businessNameError(businessName);
  const message = activeError ? phoneErrorMessage(activeError, tick) : null;
  const retryable = activeError?.kind === 'offline' || activeError?.kind === 'server';
  const invalid = contactError !== null || businessError !== null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched({ contact: true, business: true });
    if (invalid || pending || waiting) return;
    send(phone);
  };
  const shownError = <E extends DetailsFieldError>(error: E | null, map: Record<E, DetailsMessageKey>, show: boolean) =>
    !show || !error
      ? null
      : error === 'too_short'
        ? t('auth.details.too_short', { min: DETAILS_MIN_LENGTH })
        : t(map[error] as Exclude<DetailsMessageKey, 'auth.details.too_short'>);

  return (
    <form noValidate onSubmit={submit}>
      <FieldGroup className="gap-5">
        <DetailsField
          label={t('auth.details.contact_name')}
          autoComplete="name"
          value={contactName}
          error={shownError(contactError, CONTACT_ERRORS, touched.contact)}
          disabled={pending}
          onChange={(contactName) => update({ contactName })}
          onBlur={() => setTouched((v) => ({ ...v, contact: true }))}
        />
        <DetailsField
          label={t('auth.details.business_name')}
          autoComplete="organization"
          value={businessName}
          error={shownError(businessError, BUSINESS_ERRORS, touched.business)}
          disabled={pending}
          onChange={(businessName) => update({ businessName })}
          onBlur={() => setTouched((v) => ({ ...v, business: true }))}
        />
        <Field>
          {message ? <FieldError>{t(message.key, message.values)}</FieldError> : null}
          {retryable ? (
            <Button type="submit" variant="secondary" size="lg" className="h-12 w-full text-base" disabled={invalid || pending}>
              {t('common.retry')}
            </Button>
          ) : (
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full text-base"
              disabled={invalid || pending || waiting}
              aria-busy={pending}
            >
              {pending ? <Spinner aria-label={t('common.loading')} /> : null}
              {t('auth.phone.submit')}
            </Button>
          )}
          {activeError?.kind === 'server' ? supportSlot : null}
          <Button type="button" variant="ghost" className="min-h-11 w-full" onClick={onChangePhone} disabled={pending}>
            {t('auth.otp.change_phone')}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
