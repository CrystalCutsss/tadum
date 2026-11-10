import { cn } from 'cn';

// Текстовый словесный знак — плейсхолдер логотипа (D-017, D-052): латиницей «Tadum», Geist,
// в любом языке интерфейса. Появится логотип — меняется только этот файл.
// - default — «Tadum», Geist 600 (D-052); сейчас в экранах не используется;
// - dot — «tadum.» строчными, Geist 700, точка primary в светлой теме и muted-foreground (светло-серая) в тёмной
//   (решения Кирилла 2026-11-06: сайдбар кабинета; primary на тёмном сайдбаре — 1.96:1, почти не видна;
//   2026-11-10, A-059: экраны входа — вверху страницы, вдвое крупнее, text-5xl).
//   Строчные — через CSS (lowercase), поэтому доступное имя остаётся «Tadum»; точка декоративная (aria-hidden).
const BRAND = 'Tadum';

export interface WordmarkProps {
  className?: string;
  variant?: 'default' | 'dot';
}

export function Wordmark({ className, variant = 'default' }: WordmarkProps) {
  if (variant === 'dot') {
    return (
      <span dir="ltr" translate="no" data-variant="dot" className={cn('font-wordmark text-xl font-bold tracking-tight', className)}>
        <span className="lowercase">{BRAND}</span>
        <span aria-hidden="true" className="text-primary dark:text-muted-foreground">
          .
        </span>
      </span>
    );
  }
  return (
    <span dir="ltr" translate="no" className={cn('font-wordmark text-xl font-semibold tracking-tight', className)}>
      {BRAND}
    </span>
  );
}
