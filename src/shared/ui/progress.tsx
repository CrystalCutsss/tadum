"use client"

import * as React from "react"
import { cn } from "cn"
import { Direction, Progress as ProgressPrimitive } from "radix-ui"

// Tadum: заливка растёт от начала строки — слева в LTR, справа в RTL.
// Сдвиг индикатора по направлению Radix (Direction.useDirection), а не по варианту rtl: —
// так направление берётся из ближайшего провайдера, а не из <html dir>.
// tone="inverse" (TD-002) — на синей поверхности (MetalCard, bg-primary): дорожка primary-foreground/25,
// индикатор primary-foreground; те же цвета, что у SegmentedProgress inverse. Контраст — в check:contrast.
const toneClasses = {
  default: { track: "bg-muted", indicator: "bg-primary" },
  inverse: { track: "bg-primary-foreground/25", indicator: "bg-primary-foreground" },
} as const

function Progress({
  className,
  value,
  dir,
  tone = "default",
  ...props
}: Omit<React.ComponentProps<typeof ProgressPrimitive.Root>, "dir"> & {
  /** Направление, если отличается от Direction.Provider. */
  dir?: "ltr" | "rtl"
  /** default — на карточке и фоне страницы; inverse — на синей поверхности (MetalCard, bg-primary). */
  tone?: "default" | "inverse"
}) {
  const colors = toneClasses[tone]
  const direction = Direction.useDirection(dir)
  const offset = 100 - (value || 0)
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      data-tone={tone}
      dir={direction}
      className={cn(
        "relative flex h-3 w-full items-center overflow-x-hidden rounded-4xl",
        colors.track,
        className
      )}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("size-full flex-1 transition-all", colors.indicator)}
        style={{ transform: `translateX(${direction === "rtl" ? offset : -offset}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
