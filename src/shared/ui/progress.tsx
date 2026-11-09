"use client"

import * as React from "react"
import { cn } from "cn"
import { Direction, Progress as ProgressPrimitive } from "radix-ui"

// Tadum: заливка растёт от начала строки — слева в LTR, справа в RTL.
// Сдвиг индикатора по направлению Radix (Direction.useDirection), а не по варианту rtl: —
// так направление берётся из ближайшего провайдера, а не из <html dir>.
function Progress({
  className,
  value,
  dir,
  ...props
}: Omit<React.ComponentProps<typeof ProgressPrimitive.Root>, "dir"> & {
  /** Направление, если отличается от Direction.Provider. */
  dir?: "ltr" | "rtl"
}) {
  const direction = Direction.useDirection(dir)
  const offset = 100 - (value || 0)
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      dir={direction}
      className={cn(
        "relative flex h-3 w-full items-center overflow-x-hidden rounded-4xl bg-muted",
        className
      )}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="size-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(${direction === "rtl" ? offset : -offset}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
