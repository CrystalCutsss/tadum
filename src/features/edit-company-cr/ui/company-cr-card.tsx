// Блок «Номер CR» над документами (решение Кирилла 2026-11-10): карточка как у документа (обводка, та же ширина),
// поле — половина блока на компьютере и вся ширина на телефоне, высота 48 px. Только цифры, ровно 10;
// ошибка — assistive text под полем, без ошибки текста под полем нет. Номер сохраняется, как только набраны 10 цифр, и при уходе с поля.
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { crDigits, crError, CR_LENGTH } from '@/entities/application';
import type { Company } from '@/shared/api';
import { Field, FieldError, FieldLabel, Input, Spinner } from '@/shared/ui';

import { useSaveCr } from '../model/use-save-cr';

export interface CompanyCrCardProps {
  company: Pick<Company, 'cr_number'> | undefined;
  /** Комплект ещё можно менять; после отправки поле только для чтения. */
  editable: boolean;
  /** Растёт при попытке отправить без номера: показать ошибку, прокрутить и поставить фокус в поле. */
  attention?: number;
}

export function CompanyCrCard({ company, editable, attention = 0 }: CompanyCrCardProps) {
  const { t } = useTranslation();
  const ids = { input: useId(), help: useId(), title: useId() };
  const saved = company?.cr_number ?? '';
  const [value, setValue] = useState(saved);
  const [touched, setTouched] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const save = useSaveCr();

  // Номер пришёл с сервера позже первого рендера — подставляем, если клиент ещё ничего не ввёл.
  const [seen, setSeen] = useState(saved);
  if (seen !== saved) {
    setSeen(saved);
    if (!touched) setValue(saved);
  }

  useEffect(() => {
    if (attention === 0) return;
    input.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    input.current?.focus({ preventScroll: true });
  }, [attention]);

  const commit = (next: string) => {
    if (!editable || crError(next) !== null || next === saved || save.isPending) return;
    save.mutate(next);
  };

  const error = touched || attention > 0 ? crError(value) : null;
  const message = error ? t(error === 'required' ? 'cr.error.required' : 'cr.error.length') : save.isError ? t('cr.error.save') : null;

  return (
    <section id="company-cr" aria-labelledby={ids.title} className="scroll-mt-4 rounded-xl border bg-card p-3 text-card-foreground md:p-4">
      <div className="flex flex-col gap-1">
        <h2 id={ids.title} className="text-sm font-medium">
          {t('cr.title')}
        </h2>
        <p className="text-sm text-muted-foreground">{t('cr.hint')}</p>
      </div>
      <Field data-invalid={message !== null} className="mt-3 w-full md:w-1/2">
        <FieldLabel htmlFor={ids.input} className="sr-only">
          {t('cr.label')}
        </FieldLabel>
        <div className="relative">
          <Input
            ref={input}
            id={ids.input}
            size="lg"
            // Скругление как у кнопок «Upload» (решение Кирилла 2026-11-10).
            className="rounded-lg"
            dir="ltr"
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="done"
            // Без maxLength: вставка «CR: 1010-000-003» должна сохранить цифры, лишнее отрезает crDigits.
            value={value}
            readOnly={!editable}
            aria-invalid={message !== null}
            aria-describedby={message ? ids.help : undefined}
            onChange={(e) => {
              const next = crDigits(e.target.value);
              setValue(next);
              if (save.isError) save.reset();
              if (next.length === CR_LENGTH) {
                setTouched(true);
                commit(next);
              }
            }}
            onBlur={() => {
              setTouched(true);
              commit(value);
            }}
          />
          {save.isPending ? <Spinner className="absolute end-3 top-1/2 -translate-y-1/2" aria-label={t('common.loading')} /> : null}
        </div>
        {/* Текст под полем — только ошибка (решение Кирилла 2026-11-10). */}
        {message ? <FieldError id={ids.help}>{message}</FieldError> : null}
      </Field>
    </section>
  );
}
