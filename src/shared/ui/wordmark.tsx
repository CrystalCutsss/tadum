import { cn } from 'cn';

// Текстовый словесный знак — плейсхолдер логотипа (D-017, D-052): латиницей «Tadum», Geist 600,
// в любом языке интерфейса. Появится логотип — меняется только этот файл.
const BRAND = 'Tadum';

export function Wordmark({ className }: { className?: string }) {
  return (
    <span dir="ltr" translate="no" className={cn('font-wordmark text-xl font-semibold tracking-tight', className)}>
      {BRAND}
    </span>
  );
}
