// Блок «About your business» над документами поставщика (Кирилл 2026-11-25, A-075): CR, email, отрасль, город —
// по два поля в ряд (на телефоне — одно), слева направо и сверху вниз. Шапка — как у блока CR и документов (иконка,
// заголовок, пояснение). Каждое поле проверяется; ошибка — под полем после ухода из него или попытки отправить.
// Значение сохраняется, как только оно верное: CR — при 10 цифрах, остальное — через паузу в наборе и при уходе с поля.
// В панели отправки блок — один сегмент: готов, когда все четыре поля сохранены и верны.
import { RiBuildingLine } from '@remixicon/react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { crDigits, crError, CR_LENGTH, isValidCr } from '@/entities/application';
import { cityError, emailError, industryError, isSupplierProfileComplete } from '@/entities/supplier';
import type { Supplier } from '@/shared/api';
import {
  Combobox,
  Field,
  FieldError,
  FieldLabel,
  Icon,
  Input,
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/shared/ui';

import { useSaveProfile, type ProfileField } from '../model/use-save-profile';

const INDUSTRIES = ['food', 'construction', 'electronics', 'apparel', 'furniture', 'beauty', 'auto', 'office', 'medical', 'other'] as const;
const CITIES = [
  'riyadh',
  'jeddah',
  'mecca',
  'medina',
  'dammam',
  'khobar',
  'dhahran',
  'taif',
  'tabuk',
  'abha',
  'buraidah',
  'hail',
  'jazan',
  'najran',
  'al_ahsa',
  'yanbu',
] as const;
const FIELDS: readonly ProfileField[] = ['cr_number', 'email', 'industry', 'city'];
/** Пауза в наборе, после которой верное значение сохраняется. */
const SAVE_DELAY_MS = 600;

type Values = Record<ProfileField, string>;

const fromSupplier = (s: Pick<Supplier, ProfileField> | undefined): Values => ({
  cr_number: s?.cr_number ?? '',
  email: s?.email ?? '',
  industry: s?.industry ?? '',
  city: s?.city ?? '',
});

/** Ключ текста ошибки поля или null. */
function errorKey(field: ProfileField, value: string) {
  switch (field) {
    case 'cr_number': {
      const e = crError(value);
      return e === null ? null : e === 'required' ? ('supplier.profile.error.cr_required' as const) : ('supplier.profile.error.cr_length' as const);
    }
    case 'email': {
      const e = emailError(value);
      return e === null ? null : e === 'required' ? ('supplier.profile.error.email_required' as const) : ('supplier.profile.error.email_invalid' as const);
    }
    case 'industry': {
      const e = industryError(value);
      return e === null ? null : e === 'required' ? ('supplier.profile.error.industry_required' as const) : ('supplier.profile.error.too_short' as const);
    }
    case 'city': {
      const e = cityError(value);
      if (e === null) return null;
      if (e === 'required') return 'supplier.profile.error.city_required' as const;
      return e === 'too_short' ? ('supplier.profile.error.too_short' as const) : ('supplier.profile.error.city_letters' as const);
    }
  }
}

export interface SupplierProfileCardProps {
  supplier: Pick<Supplier, ProfileField> | undefined;
  /** Комплект ещё можно менять; после отправки поля только для чтения. */
  editable: boolean;
  /** Растёт при попытке отправить с незаполненным блоком: показать ошибки и поставить фокус в первое неверное поле. */
  attention?: number;
  /** Все четыре поля верны и сохранены — сегмент панели отправки готов. */
  onReadyChange?: (ready: boolean) => void;
}

export function SupplierProfileCard({ supplier, editable, attention = 0, onReadyChange }: SupplierProfileCardProps) {
  const { t } = useTranslation();
  const ids = { title: useId(), cr_number: useId(), email: useId(), industry: useId(), city: useId(), save: useId() };
  const saved = fromSupplier(supplier);
  const [values, setValues] = useState<Values>(saved);
  const [touched, setTouched] = useState<Record<ProfileField, boolean>>({ cr_number: false, email: false, industry: false, city: false });
  const inputs = useRef<Partial<Record<ProfileField, HTMLInputElement | null>>>({});
  const timers = useRef<Partial<Record<ProfileField, ReturnType<typeof setTimeout>>>>({});
  const save = useSaveProfile();

  // Значения пришли с сервера позже первого рендера — подставляем в нетронутые поля.
  const savedKey = FIELDS.map((f) => saved[f]).join('\u0000');
  const [seen, setSeen] = useState(savedKey);
  if (seen !== savedKey) {
    setSeen(savedKey);
    setValues((v) => Object.fromEntries(FIELDS.map((f) => [f, touched[f] ? v[f] : saved[f]])) as Values);
  }

  const ready =
    isValidCr(values.cr_number) &&
    isSupplierProfileComplete(values) &&
    FIELDS.every((f) => values[f].trim() === saved[f]);
  useEffect(() => onReadyChange?.(ready), [ready, onReadyChange]);

  useEffect(() => {
    if (attention === 0) return;
    const first = FIELDS.find((f) => errorKey(f, values[f]) !== null || values[f].trim() !== saved[f]);
    const el = first ? inputs.current[first] : null;
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el?.focus({ preventScroll: true });
    // Только на новую попытку отправки.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attention]);

  useEffect(() => () => Object.values(timers.current).forEach((id) => clearTimeout(id)), []);

  const commit = (field: ProfileField, raw: string) => {
    clearTimeout(timers.current[field]);
    const value = raw.trim();
    if (!editable || errorKey(field, value) !== null || value === saved[field]) return;
    save.mutate({ field, value });
  };

  const change = (field: ProfileField, value: string, { now = false } = {}) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (save.isError) save.reset();
    clearTimeout(timers.current[field]);
    if (now) {
      setTouched((v) => ({ ...v, [field]: true }));
      commit(field, value);
    } else timers.current[field] = setTimeout(() => commit(field, value), SAVE_DELAY_MS);
  };

  const blur = (field: ProfileField) => {
    setTouched((v) => ({ ...v, [field]: true }));
    commit(field, values[field]);
  };

  const fieldError = (field: ProfileField) => {
    // После попытки отправить ошибки видны во всех полях, как у блока CR.
    const key = touched[field] || attention > 0 ? errorKey(field, values[field]) : null;
    if (key === null) return null;
    return key === 'supplier.profile.error.too_short' ? t(key, { min: 2 }) : t(key);
  };

  const field = (name: ProfileField, label: string, control: (a11y: { id: string; describedBy?: string; invalid: boolean }) => ReactNode) => {
    const error = fieldError(name);
    const help = `${ids[name]}-error`;
    return (
      <Field data-invalid={error !== null}>
        <FieldLabel htmlFor={ids[name]}>{label}</FieldLabel>
        {control({ id: ids[name], invalid: error !== null, ...(error ? { describedBy: help } : {}) })}
        {error ? <FieldError id={help}>{error}</FieldError> : null}
      </Field>
    );
  };

  const options = (keys: readonly string[], prefix: 'industry' | 'city') =>
    keys.map((k) => {
      const label = t(`supplier.profile.${prefix}.options.${k}` as 'supplier.profile.city.options.riyadh');
      return { value: k, label };
    });

  return (
    <section id="supplier-profile" aria-labelledby={ids.title} className="scroll-mt-4 rounded-xl border bg-card p-3 text-card-foreground md:p-4">
      <Item className="flex-nowrap items-center rounded-none border-0 p-0">
        <ItemMedia variant="icon" className="flex size-10 self-center rounded-lg bg-status-received-muted text-status-received">
          <Icon icon={RiBuildingLine} />
        </ItemMedia>
        <ItemContent className="min-w-0 gap-1">
          <ItemTitle className="text-base font-semibold">
            <h2 id={ids.title}>{t('supplier.profile.title')}</h2>
          </ItemTitle>
          <ItemDescription className="line-clamp-none">{t('supplier.profile.hint')}</ItemDescription>
        </ItemContent>
      </Item>
      {/* Поля выровнены по тексту шапки, как поле CR (отступ = квадрат 40 px + зазор 14 px); на телефоне — во всю ширину. */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:ps-13.5">
        {field('cr_number', t('supplier.profile.cr_label'), (a) => (
          <Input
            ref={(el) => {
              inputs.current.cr_number = el;
            }}
            id={a.id}
            size="lg"
            className="rounded-lg"
            dir="ltr"
            inputMode="numeric"
            autoComplete="off"
            value={values.cr_number}
            readOnly={!editable}
            aria-invalid={a.invalid}
            aria-describedby={a.describedBy}
            onChange={(e) => {
              const next = crDigits(e.target.value);
              change('cr_number', next, { now: next.length === CR_LENGTH });
            }}
            onBlur={() => blur('cr_number')}
          />
        ))}
        {field('email', t('supplier.profile.email_label'), (a) => (
          <Input
            ref={(el) => {
              inputs.current.email = el;
            }}
            id={a.id}
            size="lg"
            className="rounded-lg"
            dir="ltr"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t('supplier.profile.email_placeholder')}
            value={values.email}
            readOnly={!editable}
            aria-invalid={a.invalid}
            aria-describedby={a.describedBy}
            onChange={(e) => change('email', e.target.value)}
            onBlur={() => blur('email')}
          />
        ))}
        {field('industry', t('supplier.profile.industry_label'), (a) => (
          <Combobox
            ref={(el) => {
              inputs.current.industry = el;
            }}
            id={a.id}
            options={options(INDUSTRIES, 'industry')}
            placeholder={t('supplier.profile.industry_placeholder')}
            value={values.industry}
            readOnly={!editable}
            aria-invalid={a.invalid}
            aria-describedby={a.describedBy}
            onValueChange={(v) => change('industry', v)}
            onBlur={() => blur('industry')}
          />
        ))}
        {field('city', t('supplier.profile.city_label'), (a) => (
          <Combobox
            ref={(el) => {
              inputs.current.city = el;
            }}
            id={a.id}
            options={options(CITIES, 'city')}
            placeholder={t('supplier.profile.city_placeholder')}
            autoComplete="address-level2"
            value={values.city}
            readOnly={!editable}
            aria-invalid={a.invalid}
            aria-describedby={a.describedBy}
            onValueChange={(v) => change('city', v)}
            onBlur={() => blur('city')}
          />
        ))}
      </div>
      {save.isError ? (
        <p id={ids.save} role="alert" className="mt-3 text-sm text-destructive sm:ps-13.5">
          {t('supplier.profile.error.save')}
        </p>
      ) : null}
    </section>
  );
}
