import type { RemixiconComponentType } from '@remixicon/react';
import { cn } from 'cn';
import type { ComponentProps } from 'react';

// Фабрика локальных копий иконок Remix Icon (https://remixicon.com, Remix Icon License 1.0,
// https://github.com/Remix-Design/RemixIcon/blob/master/License, © Remix Design).
// Зачем: @remixicon/react — один модуль, и Rollup кладёт все используемые из него иконки в первый чанк.
// Иконки ленивых экранов лежат в отдельных модулях (document-icons, status-icons) и уезжают в их чанки.
// Тот же SVG и тот же API, что у @remixicon/react: пропы size, color, className, класс remixicon;
// тип RemixiconComponentType, поэтому их принимает обёртка Icon.

type GlyphProps = ComponentProps<RemixiconComponentType>;

export function createIcon(d: string, displayName: string): RemixiconComponentType {
  const Glyph = ({ size = 24, color = 'currentColor', className, ...rest }: GlyphProps) => (
    <svg
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
      width={size}
      height={size}
      fill={color}
      {...rest}
      className={cn('remixicon', className)}
    >
      <path d={d} />
    </svg>
  );
  Glyph.displayName = displayName;
  return Glyph;
}
