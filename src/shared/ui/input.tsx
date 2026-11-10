import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Tadum (2026-11-10): размеры поля через cva. default — h-9 пресета (без изменений для существующих вызовов),
// lg — 48 px (h-12), отступы и кегль как у Button size="lg" (px-4, text-base).
// Нативный атрибут size (ширина в символах) не используется и исключён из пропсов — как size у Button.
const inputVariants = /* @__PURE__ */ cva(
  "w-full min-w-0 rounded-4xl border border-input bg-input/30 transition-colors outline-none file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      size: {
        default: "h-9 px-3 py-1 text-base file:h-7 md:text-sm",
        lg: "h-12 px-4 py-2 text-base file:h-8",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

function Input({
  className,
  type,
  size = "default",
  ...props
}: Omit<React.ComponentProps<"input">, "size"> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      data-size={size}
      className={cn(inputVariants({ size, className }))}
      {...props}
    />
  )
}

export { Input, inputVariants }
