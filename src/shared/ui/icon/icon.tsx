import {
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
  RiArrowLeftDoubleLine,
  RiArrowLeftLine,
  RiArrowLeftSLine,
  RiArrowRightDoubleLine,
  RiArrowRightLine,
  RiArrowRightSLine,
  RiLoginBoxLine,
  RiLogoutBoxLine,
  RiLogoutBoxRLine,
  RiSendPlane2Line,
  RiSendPlaneLine,
  RiSideBarLine,
  type RemixiconComponentType,
} from '@remixicon/react';
import { cn } from 'cn';
import type { ComponentProps } from 'react';

// Обёртка над Remix Icon (библиотека иконок пресета shadcn, D-077).
// В RTL зеркалится только иконка из списка mirroredIcons: стрелки, шевроны, «назад», «далее», вход/выход, отправка, панель сбоку.
// Нейтральные — часы, телефон, документ, галочка, крестик, лупа, play, QR — не зеркалятся (01-nfr-locale-brand.md §1.2).
export const mirroredIcons: ReadonlySet<RemixiconComponentType> = new Set([
  RiArrowLeftLine,
  RiArrowRightLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiArrowLeftDoubleLine,
  RiArrowRightDoubleLine,
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
  RiLoginBoxLine,
  RiLogoutBoxLine,
  RiLogoutBoxRLine,
  RiSendPlaneLine,
  RiSendPlane2Line,
  // Панель сбоку: сайдбар встаёт на сторону start, иконка показывает ту же сторону.
  RiSideBarLine,
]);

export function isMirrored(icon: RemixiconComponentType): boolean {
  return mirroredIcons.has(icon);
}

export interface IconProps extends Omit<ComponentProps<RemixiconComponentType>, 'ref'> {
  icon: RemixiconComponentType;
  /** Подпись для скринридера; без неё иконка декоративная. */
  label?: string;
}

export function Icon({ icon: Glyph, label, className, ...rest }: IconProps) {
  const mirrored = isMirrored(Glyph);
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  return (
    <Glyph
      {...rest}
      {...a11y}
      className={cn('size-5 shrink-0', mirrored && 'rtl:-scale-x-100', className)}
      data-mirrored={mirrored}
    />
  );
}
