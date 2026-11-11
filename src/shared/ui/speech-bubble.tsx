import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Tadum (2026-11-10, экран документов клиента): облачко-подсказка с хвостиком на верхней грани.
// Хвостик — повёрнутый квадрат size-3 цвета облачка (bg-inherit), половина выступает над верхней гранью.
// Положение — логическое inset-inline-start, поэтому в RTL хвостик зеркалится сам.
// isolate + -z-10: нижняя половина квадрата рисуется под текстом, но над фоном облачка.
const speechBubbleVariants = /* @__PURE__ */ cva(
  "relative isolate block rounded-lg px-3 py-1.5 text-sm",
  {
    variants: {
      tone: {
        // Тон «внимание» — палитра статуса rejected (тёплый, не красный error; контраст — §4 02-design-system.md).
        attention: "bg-status-rejected-muted text-status-rejected",
      },
    },
    defaultVariants: {
      tone: "attention",
    },
  }
)

// Половина стороны хвостика (size-3): центр хвостика совпадает с tailOffset.
const TAIL_HALF = "var(--spacing) * 1.5"

type SpeechBubbleProps = React.ComponentProps<"div"> &
  VariantProps<typeof speechBubbleVariants> & {
    /** Расстояние от начальной (inline-start) грани облачка до центра хвостика, CSS-длина на токенах. */
    tailOffset?: string
  }

function SpeechBubble({
  className,
  tone = "attention",
  tailOffset = "calc(var(--spacing) * 5)",
  children,
  ...props
}: SpeechBubbleProps) {
  return (
    <div
      data-slot="speech-bubble"
      data-tone={tone}
      className={cn(speechBubbleVariants({ tone, className }))}
      {...props}
    >
      <span
        aria-hidden="true"
        data-slot="speech-bubble-tail"
        className="pointer-events-none absolute -top-1.5 -z-10 size-3 rotate-45 rounded-xs bg-inherit"
        style={{ insetInlineStart: `calc(${tailOffset} - ${TAIL_HALF})` }}
      />
      {children}
    </div>
  )
}

export { SpeechBubble, speechBubbleVariants, type SpeechBubbleProps }
