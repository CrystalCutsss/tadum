import * as React from "react"
import { RiCheckLine } from "@remixicon/react"
import { cn } from "cn"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { Icon } from "@/shared/ui/icon/icon"

// Checkbox из реестра radix-maia (shadcn CLI, пресет b1ZQ7Gl9c). Адаптация:
// - радиус 6px пресета выражен через токен: calc(var(--radius) * 0.4) ≈ 5.6px;
// - зона касания — псевдоэлемент after:-inset-3.5 вокруг квадрата 16px, итого 44×44 (в пресете 40×32);
// - галочка — через Icon (нейтральная, в RTL не зеркалится).
// data-checked — вариант из shadcn/tailwind.css, отвечает data-state="checked" у Radix.
function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-[calc(var(--radius)*0.4)] border border-input transition-shadow outline-none group-has-disabled/field:opacity-50 group-has-[:focus-visible]/field-label:ring-0 group-has-[:focus-visible]/field-label:not-data-checked:border-input after:absolute after:-inset-3.5 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground group-has-[:focus-visible]/field-label:data-checked:border-primary dark:data-checked:bg-primary",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <Icon icon={RiCheckLine} className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
