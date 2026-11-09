import * as React from "react"
import { cn } from "cn"
import { Direction } from "radix-ui"
import { RiCloseLine } from "@remixicon/react"

import { useIsMobile } from "@/shared/lib"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/drawer"
import { Icon } from "@/shared/ui/icon/icon"

// Проектный примитив по образцу shadcn drawer-dialog: на мобильных (useIsMobile, < md) — Drawer снизу,
// иначе — Dialog. Режим выбирает корень и передаёт частям через контекст.
// Чистый вызов: даёт Rollup выбросить модуль из первого чанка (бюджет, D-054).
const ResponsiveDialogContext = /* @__PURE__ */ React.createContext(false)

function useMobileMode() {
  return React.useContext(ResponsiveDialogContext)
}

type ResponsiveDialogProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

function ResponsiveDialog({ children, ...props }: ResponsiveDialogProps) {
  const isMobile = useIsMobile()
  return (
    <ResponsiveDialogContext.Provider value={isMobile}>
      {isMobile ? (
        <Drawer {...props}>{children}</Drawer>
      ) : (
        <Dialog {...props}>{children}</Dialog>
      )}
    </ResponsiveDialogContext.Provider>
  )
}

function ResponsiveDialogTrigger(
  props: React.ComponentProps<typeof DialogTrigger>
) {
  const Comp = useMobileMode() ? DrawerTrigger : DialogTrigger
  return <Comp data-slot="responsive-dialog-trigger" {...props} />
}

function ResponsiveDialogClose(props: React.ComponentProps<typeof DialogClose>) {
  const Comp = useMobileMode() ? DrawerClose : DialogClose
  return <Comp data-slot="responsive-dialog-close" {...props} />
}

function ResponsiveDialogContent({
  className,
  children,
  closeLabel,
  showCloseButton = true,
  dir,
  ...props
}: Omit<React.ComponentProps<typeof DialogContent>, "dir" | "showCloseButton"> & {
  /** Подпись кнопки закрытия для скринридера — строка из i18n. */
  closeLabel: string
  showCloseButton?: boolean
  /** Направление, если отличается от Direction.Provider (портал вне дерева с dir). */
  dir?: "ltr" | "rtl"
}) {
  const isMobile = useMobileMode()
  const direction = Direction.useDirection(dir)
  const close = showCloseButton && (
    <ResponsiveDialogClose asChild>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={closeLabel}
        className={cn("absolute", isMobile ? "top-6 end-6" : "top-4 end-4")}
      >
        <Icon icon={RiCloseLine} />
      </Button>
    </ResponsiveDialogClose>
  )
  if (isMobile) {
    return (
      <DrawerContent
        data-slot="responsive-dialog-content"
        data-mode="drawer"
        dir={direction}
        className={className}
        {...props}
      >
        {children}
        {close}
      </DrawerContent>
    )
  }
  return (
    <DialogContent
      data-slot="responsive-dialog-content"
      data-mode="dialog"
      dir={direction}
      showCloseButton={false}
      className={className}
      {...props}
    >
      {children}
      {close}
    </DialogContent>
  )
}

function ResponsiveDialogHeader(props: React.ComponentProps<"div">) {
  const Comp = useMobileMode() ? DrawerHeader : DialogHeader
  return <Comp data-slot="responsive-dialog-header" {...props} />
}

function ResponsiveDialogFooter(props: React.ComponentProps<"div">) {
  const Comp = useMobileMode() ? DrawerFooter : DialogFooter
  return <Comp data-slot="responsive-dialog-footer" {...props} />
}

function ResponsiveDialogTitle(props: React.ComponentProps<typeof DialogTitle>) {
  const Comp = useMobileMode() ? DrawerTitle : DialogTitle
  return <Comp data-slot="responsive-dialog-title" {...props} />
}

function ResponsiveDialogDescription(
  props: React.ComponentProps<typeof DialogDescription>
) {
  const Comp = useMobileMode() ? DrawerDescription : DialogDescription
  return <Comp data-slot="responsive-dialog-description" {...props} />
}

export {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
  type ResponsiveDialogProps,
}
