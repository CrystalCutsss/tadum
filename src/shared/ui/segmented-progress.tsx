import * as React from "react"
import { cn } from "cn"

// Tadum (2026-11-12): сегментированный прогресс — по сегменту на документ и поле CR панели отправки.
// Сегменты в ряд (flex): порядок логический, в RTL ряд зеркалится сам — первый сегмент у начала строки.
// tone="inverse" — на синей заливке панели (bg-primary). Подпись и текст значения задаёт потребитель
// (aria-label / aria-labelledby, aria-valuetext) — строк в компоненте нет.
type SegmentedProgressProps = Omit<
  React.ComponentProps<"div">,
  "role" | "aria-valuemin" | "aria-valuemax" | "aria-valuenow" | "children"
> & {
  /** Заполнен ли сегмент; порядок — от начала строки. */
  segments: readonly boolean[]
  /** default — на карточке; inverse — на заливке bg-primary. */
  tone?: "default" | "inverse"
}

const toneClasses = {
  default: { empty: "bg-muted", filled: "bg-primary" },
  inverse: { empty: "bg-primary-foreground/25", filled: "bg-primary-foreground" },
} as const

function SegmentedProgress({ segments, tone = "default", className, ...props }: SegmentedProgressProps) {
  const filled = segments.filter(Boolean).length
  const colors = toneClasses[tone]
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={segments.length}
      aria-valuenow={filled}
      data-slot="segmented-progress"
      data-tone={tone}
      className={cn("flex w-full items-center gap-1", className)}
      {...props}
    >
      {segments.map((isFilled, index) => (
        <span
          // Сегменты не переупорядочиваются: индекс — устойчивый ключ.
          key={index}
          data-slot="segmented-progress-segment"
          data-filled={isFilled ? "" : undefined}
          className={cn(
            "h-2 flex-1 rounded-full transition-colors duration-slow ease-standard",
            isFilled ? colors.filled : colors.empty
          )}
        />
      ))}
    </div>
  )
}

export { SegmentedProgress, type SegmentedProgressProps }
