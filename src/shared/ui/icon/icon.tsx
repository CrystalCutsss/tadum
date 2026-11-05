import type { LucideIcon, LucideProps } from 'lucide-react';

// Обёртка над lucide-react. В RTL зеркалится только иконка из списка mirroredIcons
// (направленные: стрелки, шевроны, «назад», «далее», вход/выход). Нейтральные — часы, телефон,
// документ, галочка, крестик, лупа, play, QR — не зеркалятся (01-nfr-locale-brand.md §1.2).
export const mirroredIcons: ReadonlySet<string> = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeftToLine',
  'ArrowRightToLine',
  'ChevronLeft',
  'ChevronRight',
  'ChevronsLeft',
  'ChevronsRight',
  'MoveLeft',
  'MoveRight',
  'Undo2',
  'Redo2',
  'LogIn',
  'LogOut',
  'Send',
]);

export function isMirrored(icon: LucideIcon): boolean {
  return mirroredIcons.has(icon.displayName ?? '');
}

export interface IconProps extends Omit<LucideProps, 'ref'> {
  icon: LucideIcon;
  /** Подпись для скринридера; без неё иконка декоративная. */
  label?: string;
}

export function Icon({ icon: Glyph, label, className, ...rest }: IconProps) {
  const mirrored = isMirrored(Glyph);
  const classes = [mirrored ? 'rtl:-scale-x-100' : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <Glyph
      {...rest}
      className={classes || undefined}
      data-mirrored={mirrored ? '' : undefined}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
    />
  );
}
