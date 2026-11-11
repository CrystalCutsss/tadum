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
import { Icon } from "@/shared/ui/icon/icon"
import { type DrawerModule, useDrawerModule } from "@/shared/ui/lazy-drawer"

// Проектный примитив по образцу shadcn drawer-dialog: на мобильных (useIsMobile, < md) — Drawer снизу,
// иначе — Dialog. Режим выбирает корень и передаёт частям через контекст.
// Drawer (vaul) грузится лениво (lazy-drawer.ts, бюджет первого чанка D-054) при первом монтировании
// корня на телефоне; пока он грузится, корень — закрытый Dialog: триггер виден, окно не мигает и
// открывается уже как Drawer (defaultOpen/open применяются к Drawer после загрузки).
// Чанк не загрузился (офлайн без кэша) — откат на Dialog, окно остаётся рабочим.

// Режим частей: null — Dialog; модуль Drawer — Drawer; "pending" — телефон, Drawer ещё грузится.
type Mode = DrawerModule | "pending" | null

// Чистый вызов: даёт Rollup выбросить модуль из первого чанка (бюджет, D-054).
const ResponsiveDialogContext = /* @__PURE__ */ React.createContext<Mode>(null)

function useDrawer() {
  const mode = React.useContext(ResponsiveDialogContext)
  return mode === "pending" ? null : mode
}

type ResponsiveDialogProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

function ResponsiveDialog({ children, ...props }: ResponsiveDialogProps) {
  const isMobile = useIsMobile()
  const drawer = useDrawerModule(isMobile)
  const mode: Mode = isMobile && drawer !== "failed" ? drawer : null
  let root: React.ReactNode
  if (mode === "pending") root = <Dialog open={false}>{children}</Dialog>
  else if (mode) root = <mode.Drawer {...props}>{children}</mode.Drawer>
  else root = <Dialog {...props}>{children}</Dialog>
  return (
    <ResponsiveDialogContext.Provider value={mode}>
      {root}
    </ResponsiveDialogContext.Provider>
  )
}

function ResponsiveDialogTrigger(
  props: React.ComponentProps<typeof DialogTrigger>
) {
  const Comp = useDrawer()?.DrawerTrigger ?? DialogTrigger
  return <Comp data-slot="responsive-dialog-trigger" {...props} />
}

function ResponsiveDialogClose(props: React.ComponentProps<typeof DialogClose>) {
  const Comp = useDrawer()?.DrawerClose ?? DialogClose
  return <Comp data-slot="responsive-dialog-close" {...props} />
}

function ResponsiveDialogContent({
  className,
  children,
  closeLabel,
  showCloseButton = true,
  dir,
  size = "default",
  ...props
}: Omit<React.ComponentProps<typeof DialogContent>, "dir" | "showCloseButton"> & {
  /** Подпись кнопки закрытия для скринридера — строка из i18n. */
  closeLabel: string
  showCloseButton?: boolean
  /** Направление, если отличается от Direction.Provider (портал вне дерева с dir). */
  dir?: "ltr" | "rtl"
  /**
   * tall — окно почти на всю высоту (просмотр примера документа, Кирилл 2026-11-09): Drawer — от верхнего края
   * до низа, Dialog — до 90% окна. Шапка фиксирована, ResponsiveDialogBody растягивается и прокручивается.
   */
  size?: "default" | "tall"
}) {
  const drawer = useDrawer()
  const isMobile = drawer !== null
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
  if (drawer) {
    const { DrawerContent } = drawer
    return (
      <DrawerContent
        data-slot="responsive-dialog-content"
        data-mode="drawer"
        data-size={size}
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
      data-size={size}
      dir={direction}
      showCloseButton={false}
      className={cn(size === "tall" && "flex max-h-9/10 flex-col", className)}
      {...props}
    >
      {children}
      {close}
    </DialogContent>
  )
}

function ResponsiveDialogHeader(props: React.ComponentProps<"div">) {
  const Comp = useDrawer()?.DrawerHeader ?? DialogHeader
  return <Comp data-slot="responsive-dialog-header" {...props} />
}

/**
 * Тело окна: занимает оставшуюся высоту под шапкой и прокручивается (нужно для size="tall").
 * Отступы: в Drawer — как у шапки и подвала (px-4, pb-4), в Dialog — от контента (p-6, gap-6).
 */
function ResponsiveDialogBody({ className, ...props }: React.ComponentProps<"div">) {
  const isMobile = useDrawer() !== null
  return (
    <div
      data-slot="responsive-dialog-body"
      className={cn("min-h-0 flex-1 overflow-y-auto", isMobile && "px-4 pb-4", className)}
      {...props}
    />
  )
}

function ResponsiveDialogFooter(props: React.ComponentProps<"div">) {
  const Comp = useDrawer()?.DrawerFooter ?? DialogFooter
  return <Comp data-slot="responsive-dialog-footer" {...props} />
}

function ResponsiveDialogTitle(props: React.ComponentProps<typeof DialogTitle>) {
  const Comp = useDrawer()?.DrawerTitle ?? DialogTitle
  return <Comp data-slot="responsive-dialog-title" {...props} />
}

function ResponsiveDialogDescription(
  props: React.ComponentProps<typeof DialogDescription>
) {
  const Comp = useDrawer()?.DrawerDescription ?? DialogDescription
  return <Comp data-slot="responsive-dialog-description" {...props} />
}

export {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
  type ResponsiveDialogProps,
}
