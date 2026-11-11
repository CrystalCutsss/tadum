import type { HTMLAttributes, PointerEvent } from "react"
import { cn } from "cn"

// Tadum (решение Кирилла 2026-11-11; по мотивам React Bits Reflective Card, реализация своя): карточка
// «глубокий синий металл». Отражение камеры заменено градиентами — камера в песочнице просмотрщика запрещена.
// Блик и полоса отлива следуют за указателем, карточка слегка наклоняется к нему; на уходе возвращается.
// Слои и токены — @utility metal-card в globals.css, --metal-* в tokens.css. Текст внутри — белый
// (--primary-foreground) без прозрачности; прозрачность (/80) — только у крупного текста.
// Отступ по умолчанию p-6, переопределяется className. Наклон — по физической позиции указателя (RTL не важен).

type MetalCardTag = "div" | "section" | "article" | "aside" | "li"

type MetalCardProps = HTMLAttributes<HTMLElement> & {
  /** Тег корня. По умолчанию div. */
  as?: MetalCardTag
}

// Наклон и подвижный блик — только мышь (на сенсорных экранах нет наведения) и без reduced-motion.
function canTrack(event: PointerEvent<HTMLElement>): boolean {
  return event.pointerType === "mouse" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function follow(event: PointerEvent<HTMLElement>) {
  if (!canTrack(event)) return
  const el = event.currentTarget
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return
  const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
  const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
  el.style.setProperty("--metal-x", `${x * 100}%`)
  el.style.setProperty("--metal-y", `${y * 100}%`)
  el.style.setProperty("--metal-rx", `${x * 2 - 1}`)
  el.style.setProperty("--metal-ry", `${y * 2 - 1}`)
}

// Снятие свойств возвращает исходные значения @property — переход плавный.
function reset(event: PointerEvent<HTMLElement>) {
  const { style } = event.currentTarget
  for (const name of ["--metal-x", "--metal-y", "--metal-rx", "--metal-ry"]) style.removeProperty(name)
}

function MetalCard({ as: Tag = "div", className, onPointerMove, onPointerLeave, ...props }: MetalCardProps) {
  return (
    <Tag
      data-slot="metal-card"
      className={cn("metal-card rounded-2xl p-6", className)}
      onPointerMove={(event: PointerEvent<HTMLElement>) => {
        onPointerMove?.(event)
        follow(event)
      }}
      onPointerLeave={(event: PointerEvent<HTMLElement>) => {
        onPointerLeave?.(event)
        reset(event)
      }}
      {...props}
    />
  )
}

export { MetalCard, type MetalCardProps }
