import type { ReactNode } from 'react';

// Изолированный LTR-фрагмент внутри арабского текста: телефон, IBAN, CR, URL, e-mail, OTP,
// суммы с кодом валюты, латинские аббревиатуры (01-nfr-locale-brand.md §1.2).
export function Ltr({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <bdi dir="ltr" className={className}>
      {children}
    </bdi>
  );
}
