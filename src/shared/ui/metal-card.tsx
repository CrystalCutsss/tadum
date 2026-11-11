import { useEffect, useRef, type HTMLAttributes } from "react"
import { cn } from "cn"

import type { MetalFrame, MetalMaterial, MetalRenderer } from "./metal-card-gl"

// Tadum (решение Кирилла 2026-11-11, доработки по его ревью того же дня, раунд 3): карточка «глубокий синий
// металл». Основная реализация — WebGL2-порт React Bits «Reflective Card» (https://reactbits.dev, David Haz,
// MIT + Commons Clause; шейдер — metal-card-gl.ts, грузится лениво). Видео и камера не используются
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

// Пружина наклона и указателя — как в оригинале (жёсткость 120, демпфирование 16, шаг интегрирования 1/120 с).
const STIFFNESS = 120
const DAMPING = 16
const STEP = 1 / 120
// Блик: появление и угасание (с), как в оригинале.
const LIGHT_IN = 0.18
const LIGHT_OUT = 0.45
// Положение блика без указателя: 30 % / 20 % карточки (−1…1 от центра).
const REST_X = -0.4
const REST_Y = -0.6
const EPSILON = 0.0005

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

type Axis = { p: number; v: number; target: number }

function stepAxis(axis: Axis, h: number) {
  axis.v += (STIFFNESS * (axis.target - axis.p) - DAMPING * axis.v) * h
  axis.p += axis.v * h
}

const settled = (axis: Axis) => Math.abs(axis.target - axis.p) < EPSILON && Math.abs(axis.v) < EPSILON

/** sRGB-канал 0…1 → линейный. */
const linear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))

/** Цвет CSS (любой синтаксис, включая oklch и color-mix) → линейный sRGB через 2D-canvas. */
function makeColorReader() {
  const probe = document.createElement("canvas")
  probe.width = 1
  probe.height = 1
  const ctx = probe.getContext("2d", { willReadFrequently: true })
  return (value: string): number[] => {
    if (!ctx) return [1, 1, 1]
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = value || "transparent"
    ctx.fillRect(0, 0, 1, 1)
    const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data
    return [r, g, b].map((channel) => linear(channel / 255))
  }
}

/** Длина токена (rem или px) → CSS-пиксели. */
function toPx(value: string, rootFont: number): number {
  const number = parseFloat(value)
  if (Number.isNaN(number)) return 0
  return value.trim().endsWith("rem") ? number * rootFont : number
}

function readMaterial(root: HTMLElement, read: (value: string) => number[]): MetalMaterial {
  const style = getComputedStyle(root)
  const token = (name: string) => style.getPropertyValue(name).trim()
  const num = (name: string) => parseFloat(token(name)) || 0
  const rootFont = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  const fg = read(token("--primary-foreground"))
  const fgLum = 0.2126 * fg[0]! + 0.7152 * fg[1]! + 0.0722 * fg[2]!
  // Потолок яркости фона под текстом: (L_текста + 0.05) / целевой контраст − 0.05.
  const cap = (fgLum + 0.05) / num("--metal-gl-contrast") - 0.05
  const inset = Math.min(parseFloat(style.paddingTop) || 0, parseFloat(style.paddingInlineStart) || 0)
  return {
    deep: read(token("--metal-deep")),
    mid: read(token("--metal-mid")),
    steel: read(token("--metal-steel")),
    light: read(token("--metal-gl-highlight")),
    cap,
    radius: parseFloat(style.borderTopLeftRadius) || 0,
    inset,
    view: toPx(token("--metal-perspective"), rootFont),
    shine: num("--metal-gl-shine"),
    glare: num("--metal-gl-glare"),
    glareSize: toPx(token("--metal-gl-glare-size"), rootFont),
    bevel: toPx(token("--metal-gl-bevel"), rootFont),
    rim: num("--metal-gl-rim"),
    rough: num("--metal-gl-rough"),
    warp: num("--metal-gl-warp"),
  }
}

/** Подключает пружину наклона, блик и WebGL-поверхность к корню; возвращает отписку. */
function mountMetal(root: HTMLElement, canvas: HTMLCanvasElement): () => void {
  const tracking =
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const x: Axis = { p: 0, v: 0, target: 0 }
  const y: Axis = { p: 0, v: 0, target: 0 }
  const px: Axis = { p: REST_X, v: 0, target: REST_X }
  const py: Axis = { p: REST_Y, v: 0, target: REST_Y }
  const rest = () => parseFloat(getComputedStyle(root).getPropertyValue("--metal-gl-rest-glare")) || 0
  const light = { p: rest(), target: rest() }
  const size = { width: root.offsetWidth, height: root.offsetHeight }
  let renderer: MetalRenderer | null = null
  let material: MetalMaterial | null = null
  let read: ((value: string) => number[]) | null = null
  let raf = 0
  let last = 0
  let disposed = false

  const tiltMax = () => (parseFloat(getComputedStyle(root).getPropertyValue("--metal-tilt-max")) || 0) * (Math.PI / 180)

  const write = () => {
    if (!tracking) return
    const style = root.style
    style.setProperty("--metal-rx", x.p.toFixed(4))
    style.setProperty("--metal-ry", y.p.toFixed(4))
    style.setProperty("--metal-x", `${((px.p + 1) * 50).toFixed(2)}%`)
    style.setProperty("--metal-y", `${((py.p + 1) * 50).toFixed(2)}%`)
  }

  const draw = () => {
    if (!renderer || !material) return
    const angle = tracking ? tiltMax() : 0
    const frame: MetalFrame = {
      width: size.width,
      height: size.height,
      rotateX: y.p * angle,
      rotateY: -x.p * angle,
      pointerX: px.p * size.width * 0.5,
      pointerY: py.p * size.height * 0.5,
      glare: light.p,
    }
    renderer.render(frame, material)
  }

  const frame = (now: number) => {
    raf = 0
    const dt = Math.min(0.05, (now - last) / 1000 || 0)
    last = now
    const steps = Math.max(1, Math.ceil(dt / STEP))
    const h = dt / steps
    for (let i = 0; i < steps; i++) for (const axis of [x, y, px, py]) stepAxis(axis, h)
    const tau = light.target > light.p ? LIGHT_IN : LIGHT_OUT
    light.p += (light.target - light.p) * (1 - Math.exp(-dt / tau))
    const moving = ![x, y, px, py].every(settled) || Math.abs(light.target - light.p) > 0.002
    if (!moving) {
      for (const axis of [x, y, px, py]) {
        axis.p = axis.target
        axis.v = 0
      }
      light.p = light.target
    }
    write()
    draw()
    if (moving && !disposed) raf = requestAnimationFrame(frame)
  }

  const wake = () => {
    if (raf || disposed) return
    last = performance.now()
    raf = requestAnimationFrame(frame)
  }

  const resize = () => {
    size.width = root.offsetWidth
    size.height = root.offsetHeight
    const scale = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.max(1, Math.round(size.width * scale))
    canvas.height = Math.max(1, Math.round(size.height * scale))
    if (read) material = readMaterial(root, read)
    draw()
  }

  // Указатель меряется по статичному корню: прямоугольник не меняется от наклона.
  const aimAt = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return
    const rect = root.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const nx = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1)
    const ny = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1)
    x.target = nx
    y.target = ny
    px.target = nx
    py.target = ny
    light.target = 1
    wake()
  }
  const release = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return
    x.target = 0
    y.target = 0
    px.target = REST_X
    py.target = REST_Y
    light.target = rest()
    wake()
  }
  if (tracking) {
    root.addEventListener("pointerenter", aimAt)
    root.addEventListener("pointermove", aimAt)
    root.addEventListener("pointerleave", release)
  }

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(root)

  // Смена темы (класс или стиль на <html>) — перечитать токены и перерисовать.
  const themeObserver = new MutationObserver(() => {
    if (!read) return
    material = readMaterial(root, read)
    light.target = light.target === 1 ? 1 : rest()
    draw()
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] })

  const fallback = () => {
    renderer?.dispose()
    renderer = null
    delete root.dataset.gl
  }
  const onLost = (event: Event) => {
    event.preventDefault()
    fallback()
  }
  canvas.addEventListener("webglcontextlost", onLost)

  void import("./metal-card-gl")
    .then(({ createMetalRenderer }) => {
      if (disposed) return
      renderer = createMetalRenderer(canvas)
      if (!renderer) return
      read = makeColorReader()
      resize()
      root.dataset.gl = "on"
    })
    .catch(fallback)

  return () => {
    disposed = true
    cancelAnimationFrame(raf)
    resizeObserver.disconnect()
    themeObserver.disconnect()
    canvas.removeEventListener("webglcontextlost", onLost)
    if (tracking) {
      root.removeEventListener("pointerenter", aimAt)
      root.removeEventListener("pointermove", aimAt)
      root.removeEventListener("pointerleave", release)
    }
    fallback()
  }
}

function MetalCard({ as: Tag = "div", className, children, ...props }: MetalCardProps) {
  const rootRef = useRef<HTMLElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    return mountMetal(root, canvas)
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
