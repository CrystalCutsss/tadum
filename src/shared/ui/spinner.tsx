import { cn } from "cn"
import { RiLoaderLine } from "@remixicon/react"

import { Icon, type IconProps } from "@/shared/ui/icon/icon"

// Tadum: подпись для скринридера — обязательный проп (строка из i18n), без хардкода "Loading".
// role="status" — на обёртке: Icon с подписью ставит role="img", здесь иконка декоративная.
function Spinner({
  className,
  "aria-label": label,
  ...props
}: Omit<IconProps, "icon" | "label" | "aria-label"> & { "aria-label": string }) {
  return (
    <span role="status" aria-label={label} data-slot="spinner" className="inline-flex shrink-0">
      <Icon icon={RiLoaderLine} className={cn("size-4 animate-spin", className)} {...props} />
    </span>
  )
}

export { Spinner }
