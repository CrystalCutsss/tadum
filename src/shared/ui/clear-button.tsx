import type * as React from "react"
import { RiCloseLine } from "@remixicon/react"
import { cn } from "cn"

import { Icon } from "./icon/icon"

// Tadum (2026-11-25): кнопка-крестик очистки поля — общая для ClearableInput и Combobox (наружу не экспортируется).
// Видимая часть — 32 px (size-8), зона касания — 44 px через псевдоэлемент after:-inset-1.5.
// mousedown отменён: фокус остаётся в поле, blur-сохранение не срабатывает раньше времени.
// Подпись (aria-label) даёт вызывающий код — строк в компоненте нет.

interface ClearButtonProps {
  label: string
  onClear: () => void
  className?: string
}

function ClearButton({ label, onClear, className }: ClearButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      data-slot="clear-button"
      className={cn(
        "absolute top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-foreground outline-none transition-colors after:absolute after:-inset-1.5 hover:text-foreground focus-visible:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
      onMouseDown={(event: React.MouseEvent) => event.preventDefault()}
      onClick={onClear}
    >
      <Icon icon={RiCloseLine} />
    </button>
  )
}

export { ClearButton }
