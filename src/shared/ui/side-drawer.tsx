import * as React from "react"
import { cn } from "cn"
import { Direction } from "radix-ui"
import { RiCloseLine } from "@remixicon/react"

import { Button } from "@/shared/ui/button"
import { Icon } from "@/shared/ui/icon/icon"
import { useDrawerModule } from "@/shared/ui/lazy-drawer"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet"

// Проектный примитив (Кирилл 2026-11-11): боковая панель — shadcn Drawer (vaul) от края inline-end
// (в LTR справа, в RTL слева). Сторона экрана физическая, поэтому выводится из Radix Direction.
// vaul грузится лениво (lazy-drawer.ts, бюджет первого чанка D-054) при монтировании; пока грузится или
// не загрузился — та же панель на Sheet (Radix Dialog) с той же стороны, окно всегда рабочее.
// Открытая как Sheet панель не переключается на Drawer до закрытия — иначе содержимое смонтируется заново.

type SideDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Заголовок панели — строка из i18n. */
  title: string
  /** Описание под заголовком — строка из i18n; без него у окна нет aria-describedby. */
  description?: string
  /** Подпись кнопки закрытия для скринридера — строка из i18n. */
  closeLabel: string
  /** Тело панели: занимает высоту под шапкой и прокручивается. */
  children?: React.ReactNode
  /** Классы контента, например ширина: по умолчанию w-full, на ≥ sm max-w-xl. */
  className?: string
  /** Направление, если отличается от Direction.Provider (портал вне дерева с dir). */
  dir?: "ltr" | "rtl"
}

function SideDrawer({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  children,
  className,
  dir,
}: SideDrawerProps) {
  const direction = Direction.useDirection(dir)
  const side = direction === "rtl" ? "left" : "right"
  const mod = useDrawerModule(true)
  const loaded = mod === "pending" || mod === "failed" ? null : mod
  // Сессия на Sheet: открыли до загрузки vaul — Sheet остаётся до закрытия.
  const [sheetSession, setSheetSession] = React.useState(open && !loaded)
  if (open && !loaded && !sheetSession) setSheetSession(true)
  if (!open && sheetSession) setSheetSession(false)
  const drawer = sheetSession ? null : loaded

  const contentClass = cn("w-full sm:max-w-xl", className)
  const describedBy = description ? {} : { "aria-describedby": undefined }
  // Возврат фокуса. Панель открывают внешней кнопкой, а не Dialog.Trigger: у модального Radix Dialog
  // onCloseAutoFocus гасит возврат FocusScope и фокусирует пустой triggerRef — фокус падал на body.
  // Запоминаем элемент с фокусом в момент открытия (до автофокуса) и возвращаем на него при закрытии.
  const returnFocusRef = React.useRef<HTMLElement | null>(null)
  const focusProps = {
    onOpenAutoFocus: () => {
      const active = document.activeElement
      returnFocusRef.current = active instanceof HTMLElement && active !== document.body ? active : null
    },
    onCloseAutoFocus: (event: Event) => {
      const target = returnFocusRef.current
      returnFocusRef.current = null
      if (!target?.isConnected) return
      event.preventDefault()
      target.focus()
    },
  }
  const close = (Close: typeof SheetClose, inDrawer: boolean) => (
    <Close asChild>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={closeLabel}
        className={cn("absolute", inDrawer ? "top-6 end-6" : "top-4 end-4")}
      >
        <Icon icon={RiCloseLine} />
      </Button>
    </Close>
  )

  if (drawer) {
    const { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } =
      drawer
    return (
      // autoFocus: vaul 1.1.x по умолчанию (autoFocus=false) гасит onOpenAutoFocus Radix Dialog — фокус
      // оставался на кнопке под оверлеем, первый Tab уходил в страницу. С ним фокус входит в панель
      // (первый фокусируемый элемент, иначе крестик), ловушка держится, при закрытии — возврат на кнопку.
      <Drawer open={open} onOpenChange={onOpenChange} direction={side} autoFocus>
        <DrawerContent
          data-slot="side-drawer-content"
          data-mode="drawer"
          dir={direction}
          customWidth
          className={contentClass}
          {...focusProps}
          {...describedBy}
        >
          <DrawerHeader className="pe-12">
            <DrawerTitle>{title}</DrawerTitle>
            {description && <DrawerDescription>{description}</DrawerDescription>}
          </DrawerHeader>
          <div data-slot="side-drawer-body" className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {children}
          </div>
          {close(DrawerClose, true)}
        </DrawerContent>
      </Drawer>
    )
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        data-slot="side-drawer-content"
        data-mode="sheet"
        side={side}
        dir={direction}
        showCloseButton={false}
        customWidth
        className={contentClass}
        {...focusProps}
        {...describedBy}
      >
        <SheetHeader className="pe-12">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div data-slot="side-drawer-body" className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          {children}
        </div>
        {close(SheetClose, false)}
      </SheetContent>
    </Sheet>
  )
}

export { SideDrawer, type SideDrawerProps }
