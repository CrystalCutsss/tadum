import { useEffect, useRef, type HTMLAttributes } from "react"
import { cn } from "cn"

// Tadum (решение Кирилла 2026-11-11, доработки по его ревью того же дня, раунд 3): карточка «глубокий синий
// металл». Основная реализация — WebGL2-порт React Bits «Reflective Card» (https://reactbits.dev, David Haz,
// MIT + Commons Clause): шейдер, пружина наклона и чтение токенов — metal-card-gl.ts, грузится лениво. Видео и камера не используются
// (песочница просмотрщика запрещает камеру): металл отражает процедурную «комнату» и софтбоксы.
// Корень — статичная обёртка: держит раскладку, слушает указатель (прямоугольник корня, а не наклонённого
// тела — без дрожания у углов) и сам не трансформируется. Наклоняются его прямые дети — canvas поверхности и
// содержимое — и CSS-слои ::before/::after, все на один угол с общей перспективой: карточка поворачивается
// целиком, угол под указателем выходит к зрителю. Наклон — пружина (жёсткость/демпфирование как в оригинале).
// Без WebGL2 или при потере контекста видны CSS-слои @utility metal-card (globals.css) — запасной вариант.
// prefers-reduced-motion и сенсорные экраны — без наклона, один статичный кадр с бликом у верхнего левого угла.
// Цвета и силы бликов — токены --metal-* (tokens.css), перечитываются при смене темы.
// Текст внутри — белый (--primary-foreground) без прозрачности. Отступ по умолчанию p-6, переопределяется
// className. Наклон — по физической позиции указателя (RTL не важен).

type MetalCardTag = "div" | "section" | "article" | "aside" | "li"

type MetalCardProps = HTMLAttributes<HTMLElement> & {
  /** Тег корня. По умолчанию div. */
  as?: MetalCardTag
}

function MetalCard({ as: Tag = "div", className, children, ...props }: MetalCardProps) {
  const rootRef = useRef<HTMLElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    // Шейдер, пружина и чтение токенов — ленивым модулем: в первый чанк не попадают.
    let cleanup: (() => void) | undefined
    let cancelled = false
    void import("./metal-card-gl").then(
      ({ mountMetal }) => {
        if (!cancelled) cleanup = mountMetal(root, canvas)
      },
      // Модуль не загрузился (офлайн без кеша) — остаются статичные CSS-слои.
      () => undefined,
    )
    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [])

  return (
    <Tag
      ref={(node: HTMLElement | null) => {
        rootRef.current = node
      }}
      data-slot="metal-card"
      className={cn("metal-card rounded-2xl p-6", className)}
      {...props}
    >
      <canvas ref={canvasRef} data-slot="metal-card-gl" aria-hidden="true" />
      {children}
    </Tag>
  )
}

export { MetalCard, type MetalCardProps }
