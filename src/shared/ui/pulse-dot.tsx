import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Tadum (2026-11-11): точка статуса с расходящимся кольцом — замена иконки предупреждения в строках
// документов с ошибкой. Обёртка размером с точку (size-2), кольцо — absolute поверх неё и растёт за её
// пределы: overflow не обрезается, центрирование — у потребителя (flex items-center justify-center).
// Декоративная: aria-hidden, смысл несёт текст строки. При prefers-reduced-motion — только точка.
const pulseDotVariants = /* @__PURE__ */ cva("", {
  variants: {
    tone: {
      // Тёплый «внимание» статуса rejected (не красный error).
      rejected: "bg-status-rejected",
    },
  },
  defaultVariants: {
    tone: "rejected",
  },
})

type PulseDotProps = VariantProps<typeof pulseDotVariants> & {
  className?: string
}

function PulseDot({ className, tone }: PulseDotProps) {
  const color = pulseDotVariants({ tone })
  return (
    <span aria-hidden="true" data-slot="pulse-dot" data-tone={tone ?? "rejected"} className={cn("relative inline-flex size-2 shrink-0", className)}>
      <span data-slot="pulse-dot-ring" className={cn("absolute inset-0 rounded-full animate-pulse-ring", color)} />
      <span className={cn("relative size-2 rounded-full", color)} />
    </span>
  )
}

export { PulseDot, type PulseDotProps }
