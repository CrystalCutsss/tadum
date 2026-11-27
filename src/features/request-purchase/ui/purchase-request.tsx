// «Новая покупка» на главной (D-100, бриф TD-002 §2, §3): одна главная кнопка под суммой лимита открывает форму —
// диалог на компьютере, шторка на телефоне. Два поля: сумма и поставщик (свободный текст). «Отправить в WhatsApp»
// открывает чат поддержки с готовым текстом и закрывает форму. Пустые поля и сумма больше доступной блокируют отправку.
// Значения формы не сохраняются и в аналитику не уходят — только корзины суммы и доли лимита.
import { RiWhatsappLine } from "@remixicon/react";
import { useId, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import type { Limit } from "@/entities/limit";
import { amountBucket, track, usedShareBucket } from "@/shared/analytics";
import type { Money } from "@/shared/api";
import { formatMoney, isLanguage } from "@/shared/i18n";
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Icon,
  Input,
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/shared/ui";

import {
  SUPPLIER_MAX,
  checkPurchase,
  purchaseRequestUrl,
  type PurchaseDraft,
} from "../model/purchase-request";

export interface PurchaseRequestProps {
  limit: Pick<Limit, "approved" | "used">;
  /** Доступно к покупке (availableOf). */
  available: Money;
  /** Название компании на языке интерфейса — в текст сообщения. */
  company: string;
  /** Вид главной кнопки: на синей карточке лимита — secondary (белая). */
  triggerVariant?: "default" | "secondary";
  /** Открыть форму сразу (истории). */
  defaultOpen?: boolean;
}

const EMPTY: PurchaseDraft = { amount: "", supplier: "" };

export function PurchaseRequest({
  limit,
  available,
  company,
  triggerVariant = "default",
  defaultOpen = false,
}: PurchaseRequestProps) {
  const { t, i18n } = useTranslation();
  const lang = isLanguage(i18n.language) ? i18n.language : "en";
  const ids = { amount: useId(), supplier: useId(), hint: useId() };
  const [open, setOpen] = useState(defaultOpen);
  const [draft, setDraft] = useState<PurchaseDraft>(EMPTY);
  const [touched, setTouched] = useState({ amount: false, supplier: false });
  const amountRef = useRef<HTMLInputElement>(null);
  const supplierRef = useRef<HTMLInputElement>(null);

  const check = checkPurchase(draft, available);
  const availableText = formatMoney(available.amount_minor / 100, lang);
  const share = usedShareBucket(limit.used, limit.approved);
  // Сумма больше доступной — подсказка сразу, пока клиент печатает; пустые поля — после ухода из поля.
  const amountError =
    check.amountError === "home.purchase.amount_over"
      ? t("home.purchase.amount_over", { amount: availableText })
      : touched.amount && check.amountError
        ? t(check.amountError)
        : null;
  const supplierError =
    touched.supplier && check.supplierError ? t(check.supplierError) : null;

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) track("purchase_request_opened", { used_share_bucket: share });
    else {
      setDraft(EMPTY);
      setTouched({ amount: false, supplier: false });
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    // Отправка заблокирована (aria-disabled), но кнопка остаётся в фокусе и Enter работает: показываем все ошибки
    // и ведём фокус в первое неверное поле — так понятно, почему сообщение не отправлено (WCAG 3.3.1).
    if (!check.valid || !check.amount) {
      setTouched({ amount: true, supplier: true });
      (check.amountError ? amountRef : supplierRef).current?.focus();
      return;
    }
    track("purchase_request_whatsapp_opened", {
      amount_bucket: amountBucket(check.amount),
      used_share_bucket: share,
    });
    window.open(
      purchaseRequestUrl(t, lang, {
        company,
        supplier: draft.supplier,
        amount: check.amount,
      }),
      "_blank",
      "noopener,noreferrer",
    );
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      {/* Триггер диалога: после закрытия фокус возвращается на кнопку. */}
      <ResponsiveDialogTrigger asChild>
        <Button
          type="button"
          size="lg"
          variant={triggerVariant}
          className="min-h-11 w-full sm:w-auto"
        >
          {t("home.purchase.cta")}
        </Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent
        closeLabel={t("common.close")}
        aria-describedby={undefined}
      >
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {t("home.purchase.title")}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <form
          noValidate
          onSubmit={submit}
          className="flex flex-col gap-5 p-4 pt-0 md:p-0"
        >
          <Field data-invalid={amountError !== null}>
            <FieldLabel htmlFor={ids.amount}>
              {t("home.purchase.amount")}
            </FieldLabel>
            <FieldDescription id={ids.hint}>
              {t("home.purchase.amount_hint", { amount: availableText })}
            </FieldDescription>
            <Input
              ref={amountRef}
              id={ids.amount}
              size="lg"
              aria-required="true"
              dir="ltr"
              inputMode="decimal"
              autoComplete="off"
              value={draft.amount}
              aria-invalid={amountError !== null}
              aria-describedby={
                amountError ? `${ids.hint} ${ids.amount}-error` : ids.hint
              }
              onChange={(e) =>
                setDraft((d) => ({ ...d, amount: e.target.value }))
              }
              onBlur={() => setTouched((v) => ({ ...v, amount: true }))}
            />
            {amountError ? (
              <FieldError id={`${ids.amount}-error`}>{amountError}</FieldError>
            ) : null}
          </Field>
          <Field data-invalid={supplierError !== null}>
            <FieldLabel htmlFor={ids.supplier}>
              {t("home.purchase.supplier")}
            </FieldLabel>
            <Input
              ref={supplierRef}
              id={ids.supplier}
              size="lg"
              aria-required="true"
              // Название латиницей — LTR, арабское — RTL (точка в «Co.» не уходит в начало).
              dir="auto"
              autoComplete="organization"
              maxLength={SUPPLIER_MAX}
              value={draft.supplier}
              aria-invalid={supplierError !== null}
              aria-describedby={
                supplierError ? `${ids.supplier}-error` : undefined
              }
              onChange={(e) =>
                setDraft((d) => ({ ...d, supplier: e.target.value }))
              }
              onBlur={() => setTouched((v) => ({ ...v, supplier: true }))}
            />
            {supplierError ? (
              <FieldError id={`${ids.supplier}-error`}>
                {supplierError}
              </FieldError>
            ) : null}
          </Field>
          <Button
            type="submit"
            size="lg"
            className="min-h-11 w-full aria-disabled:opacity-50"
            aria-disabled={!check.valid}
          >
            <Icon icon={RiWhatsappLine} data-icon="inline-start" />
            {t("home.purchase.submit")}
          </Button>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
