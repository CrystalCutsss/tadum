import { Toaster as Sonner, type ToasterProps } from "sonner"

import {
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiErrorWarningLine,
  RiInformationLine,
  RiLoaderLine,
} from "./icon/toast-icons"

// Тема приходит пропом из app/theme.tsx (в Tadum нет next-themes).
const Toaster = ({ theme = "system", ...props }: ToasterProps) => {
  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: (
          <RiCheckboxCircleLine className="size-4" />
        ),
        info: (
          <RiInformationLine className="size-4" />
        ),
        warning: (
          <RiErrorWarningLine className="size-4" />
        ),
        error: (
          <RiCloseCircleLine className="size-4" />
        ),
        loading: (
          <RiLoaderLine className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        // Тень и кольцо — как у DropdownMenuContent (решение Кирилла 2026-11-09).
        // `!` перебивает селекторы sonner `[data-sonner-toast][data-styled]`
        // (своя тень и граница 1px); фокус-кольцо клавиатуры сохраняется.
        classNames: {
          toast:
            "cn-toast border-0! shadow-2xl! ring-1 ring-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:ring-foreground/10",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
