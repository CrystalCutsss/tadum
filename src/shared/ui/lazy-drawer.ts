import * as React from "react"

// Ленивая загрузка Drawer (vaul) для ResponsiveDialog и SideDrawer. У vaul побочный эффект при импорте
// (вставка CSS): статический импорт или реэкспорт из @/shared/ui затянул бы его в первый чанк
// (бюджет 200 kB, D-054). Модуль запрашивается один раз на приложение; не загрузился (офлайн без кэша) —
// "failed", компоненты откатываются на Dialog/Sheet, следующая попытка — при следующем монтировании.
export type DrawerModule = Pick<
  typeof import("@/shared/ui/drawer"),
  | "Drawer"
  | "DrawerClose"
  | "DrawerContent"
  | "DrawerDescription"
  | "DrawerFooter"
  | "DrawerHeader"
  | "DrawerTitle"
  | "DrawerTrigger"
>

let drawerModule: DrawerModule | null = null
let drawerRequest: Promise<DrawerModule | "failed"> | null = null

function loadDrawer() {
  drawerRequest ??= import("@/shared/ui/drawer").then(
    ({
      Drawer,
      DrawerClose,
      DrawerContent,
      DrawerDescription,
      DrawerFooter,
      DrawerHeader,
      DrawerTitle,
      DrawerTrigger,
    }) =>
      (drawerModule = {
        Drawer,
        DrawerClose,
        DrawerContent,
        DrawerDescription,
        DrawerFooter,
        DrawerHeader,
        DrawerTitle,
        DrawerTrigger,
      }),
    () => {
      drawerRequest = null // следующая попытка — при следующем монтировании
      return "failed" as const
    }
  )
  return drawerRequest
}

/** Модуль Drawer: "pending" — грузится (или enabled=false), "failed" — не загрузился. */
export function useDrawerModule(enabled: boolean): DrawerModule | "pending" | "failed" {
  const [mod, setMod] = React.useState<DrawerModule | "failed" | null>(drawerModule)
  React.useEffect(() => {
    if (!enabled || mod) return
    let active = true
    void loadDrawer().then((m) => {
      if (active) setMod(m)
    })
    return () => {
      active = false
    }
  }, [enabled, mod])
  return mod ?? "pending"
}
