import type { RemixiconComponentType } from '@remixicon/react';
import { cn } from 'cn';
import type { ComponentProps } from 'react';

type GlyphProps = ComponentProps<RemixiconComponentType>;

// Иконка кнопки темы, как ModeSwitcher на ui.shadcn.com: Tabler Icons «brightness»
// (https://tabler.io/icons/icon/brightness, лицензия MIT, © Paweł Kuna).
// В Remix Icon подходящей нет; сигнатура props совпадает с иконками Remix, поэтому её принимает обёртка Icon.
// Нейтральная: в RTL не зеркалится (в mirroredIcons не входит).
export const ThemeToggleIcon: RemixiconComponentType = ({
  size = 24,
  color = 'currentColor',
  className,
  ...rest
}: GlyphProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...rest}
    className={cn('remixicon', className)}
  >
    <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
    <path d="M12 3l0 18" />
    <path d="M12 9l4.65 -4.65" />
    <path d="M12 14.3l7.37 -7.37" />
    <path d="M12 19.6l8.85 -8.85" />
  </svg>
);
