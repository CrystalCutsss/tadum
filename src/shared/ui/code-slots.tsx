import { RiCheckLine } from "@remixicon/react"
import { cn } from "cn"
import { animate, motion, motionValue, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react"
import * as React from "react"

import { Icon } from "./icon/icon"

// Tadum (решение Кирилла 2026-11-11; механика — React Bits «Code Slots», внешний вид — токены пресета):
// ввод кода отдельными ячейками. Пружинное заполнение ячейки и подъём цифры, каскад при вставке, скольжение
// каретки, «осушение» ячеек справа налево при status="error" (затем компонент сам очищается и вызывает
// onChange("")), заливка ряда и галочка при status="success". При prefers-reduced-motion — без движения.
// Текстов нет: подпись, описание и ошибку поле получает через id / aria-labelledby / aria-describedby.
// Ряд всегда LTR: код читается слева направо и в арабском интерфейсе (01-nfr-locale-brand.md §1.2).

/** Геометрия ряда в шагах --spacing: ячейка size-14 + зазор gap-3. Меняется вместе с классами ниже. */
const PITCH = 14 + 3
/** Подъём галочки при появлении — в шагах --spacing. */
const CHECK_RISE = 2
// Параметры пружин и задержек motion (секунды) — физика анимации, не CSS; сверены с исходником Code Slots.
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]
const WASH_IN = 0.3
const WASH_OUT = 0.2
const SINK_DELAY = 0.06
const SINK_STEP = 0.03
const CHECK_DELAY = 0.28
const SINK_FADE = 0.6
/** Без движения очистка после ошибки ждёт столько (мс), чтобы состояние ошибки успели увидеть. */
const REDUCED_DRAIN = 300

type CodeSlotsStatus = "idle" | "error" | "success"

interface CodeSlotsProps {
  /** Число ячеек; по умолчанию 4. Смена длины пересоздаёт ряд. */
  length?: number
  value?: string | undefined
  defaultValue?: string
  onChange?: ((code: string) => void) | undefined
  /** Вызывается один раз, когда заполнена последняя ячейка. */
  onComplete?: ((code: string) => void) | undefined
  status?: CodeSlotsStatus | undefined
  disabled?: boolean | undefined
  autoFocus?: boolean
  className?: string | undefined
  /** Атрибуты доступности — на скрытое поле ввода. */
  id?: string | undefined
  "aria-labelledby"?: string | undefined
  "aria-describedby"?: string | undefined
  /** По умолчанию — status === "error". */
  "aria-invalid"?: boolean | undefined
  "aria-busy"?: boolean | undefined
  /** Скрытое поле ввода: форма возвращает на него фокус. */
  ref?: React.Ref<HTMLInputElement>
  /** Показывать точки вместо цифр. */
  mask?: boolean
  caret?: boolean
  /** Пружина заполнения: упругость и длительность (с). */
  bounce?: number
  settle?: number
  /** Подъём цифры при появлении — в шагах --spacing. */
  rise?: number
  /** Шаг каскада при вставке и осушении, мс. */
  cascade?: number
}

interface Live {
  settle: number
  bounce: number
  cascade: number
  reduce: boolean | null
  status: CodeSlotsStatus
  onChange?: ((code: string) => void) | undefined
  onComplete?: ((code: string) => void) | undefined
}

/** Ячейки и источник изменения: "user" — ввод (колбэки уже вызваны), "prop" — снаружи через value. */
interface SlotsState {
  chars: string[]
  source: "user" | "prop"
  /** Ячейки, которые ввод задел (повтор той же цифры тоже «приземляется»). */
  touched?: number[]
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
/** Цифры кода: арабско-индийские (٠–٩, ۰–۹) приводятся к западным, прочее отбрасывается. */
const digitsOf = (raw: string | undefined) =>
  String(raw ?? "")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, "")
const DIGIT_KEY = /^[0-9٠-٩۰-۹]$/
const toSlots = (raw: string | undefined, n: number) => {
  const d = digitsOf(raw).slice(0, n)
  return Array.from({ length: n }, (_, i) => d[i] ?? "")
}
const firstEmptyOf = (slots: string[]) => {
  const i = slots.indexOf("")
  return i === -1 ? slots.length - 1 : i
}
const isFull = (slots: string[]) => slots.every(Boolean)

function CodeSlots({ length = 4, ...props }: CodeSlotsProps) {
  return <CodeSlotsRow key={length} length={length} {...props} />
}

function CodeSlotsRow({
  length,
  value,
  defaultValue = "",
  onChange,
  onComplete,
  status = "idle",
  disabled = false,
  autoFocus = false,
  className,
  id,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid,
  "aria-busy": ariaBusy,
  ref,
  mask = false,
  caret = true,
  bounce = 0.2,
  settle = 0.3,
  rise = 2,
  cascade = 20,
}: CodeSlotsProps & { length: number }) {
  const reduce = useReducedMotion()
  const inputRef = React.useRef<HTMLInputElement>(null)
  React.useImperativeHandle(ref, () => inputRef.current!, [])
  const rowRef = React.useRef<HTMLDivElement>(null)

  const [slots, setSlots] = React.useState<SlotsState>(() => ({ chars: toSlots(value ?? defaultValue, length), source: "prop" }))
  const [active, setActive] = React.useState(() => firstEmptyOf(slots.chars))
  const [focused, setFocused] = React.useState(false)
  const [draining, setDraining] = React.useState(false)
  const [leaving, setLeaving] = React.useState(false)
  // Ошибка уже при монтировании тоже осушает ячейки: стартуем как из idle.
  const [seen, setSeen] = React.useState<{ value: string | undefined; status: CodeSlotsStatus }>(() => ({
    value,
    status: status === "error" ? "idle" : status,
  }))
  const [{ mvs, drops }] = React.useState(() => ({
    mvs: slots.chars.map((c) => motionValue(c ? 1 : 0)),
    drops: slots.chars.map(() => motionValue(status === "success" ? 1 : 0)),
  }))
  const activeMv = useMotionValue(active)
  const openMv = useMotionValue(status === "success" ? 1 : 0)
  const checkMv = useMotionValue(status === "success" ? 1 : 0)

  const glide = React.useRef(new Set<number>())
  const target = React.useRef<number[]>([])
  const painted = React.useRef(slots.chars)
  const statusSeen = React.useRef<CodeSlotsStatus>(seen.status)
  const drainTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const live = React.useRef<Live>({ settle, bounce, cascade, reduce, status, onChange, onComplete })
  React.useLayoutEffect(() => {
    live.current = { settle, bounce, cascade, reduce, status, onChange, onComplete }
  })

  // Новые value и status — поправка состояния во время рендера (без setState в эффектах);
  // анимации к ним запускают эффекты ниже.
  if (value !== seen.value || status !== seen.status) {
    setSeen({ value, status })
    let chars = slots.chars
    if (value !== seen.value && value !== undefined) {
      const clean = digitsOf(value).slice(0, length)
      if (clean !== chars.join("")) {
        chars = toSlots(clean, length)
        setSlots({ chars, source: "prop" })
        setActive(firstEmptyOf(chars))
      }
    }
    if (status !== seen.status) {
      if (status === "error" && chars.some(Boolean)) {
        setDraining(true)
        setActive(0)
      }
      if (seen.status === "success" && status !== "success" && !reduce) setLeaving(true)
    }
  }

  const drive = (i: number, to: number, delayMs: number) => {
    const mv = mvs[i]
    if (!mv) return
    target.current[i] = to
    const L = live.current
    if (L.reduce) {
      mv.jump(to)
      return
    }
    void animate(mv, to, { type: "spring", duration: L.settle, bounce: L.bounce, delay: delayMs / 1000 })
  }
  const driveRef = React.useRef(drive)
  React.useLayoutEffect(() => {
    driveRef.current = drive
  })

  // Ячейки: приземление новых цифр каскадом, уход очищенных — справа налево.
  React.useEffect(() => {
    const prev = painted.current
    const next = slots.chars
    if (prev === next) return
    painted.current = next
    const L = live.current
    const hidden = L.status === "success"
    const changed = slots.touched ?? next.flatMap((ch, i) => (ch !== prev[i] ? [i] : []))
    const landing = changed.filter((i) => next[i])
    const clearing = changed.filter((i) => !next[i]).reverse()
    if (slots.source === "prop") changed.forEach((i) => glide.current.add(i))
    const step = L.reduce || hidden ? 0 : L.cascade
    landing.forEach((i, k) => {
      if (mvs[i]!.get() > 0) mvs[i]!.jump(0)
      driveRef.current(i, 1, k * step)
    })
    clearing.forEach((i, k) => {
      if (hidden) {
        target.current[i] = 0
        mvs[i]!.jump(0)
        drops[i]!.jump(0)
      } else driveRef.current(i, 0, k * step)
    })
    if (slots.source === "prop" && !isFull(prev) && isFull(next)) L.onComplete?.(next.join(""))
  }, [slots, mvs, drops])

  React.useEffect(() => {
    activeMv.jump(active)
  }, [active, activeMv])

  // Статус: заливка и галочка при success, их уход, осушение при error.
  React.useEffect(() => {
    const was = statusSeen.current
    statusSeen.current = status
    if (was === status) return
    const L = live.current
    if (status === "success") {
      if (L.reduce) {
        openMv.jump(1)
        drops.forEach((d) => d.jump(1))
        checkMv.jump(1)
        return
      }
      void animate(openMv, 1, { duration: WASH_IN, ease: EASE_OUT })
      drops.forEach(
        (d, k) => void animate(d, 1, { type: "spring", duration: 0.3, bounce: 0, delay: SINK_DELAY + k * SINK_STEP })
      )
      void animate(checkMv, 1, { type: "spring", duration: 0.35, bounce: L.bounce, delay: CHECK_DELAY })
      return
    }
    if (was === "success") {
      if (L.reduce) {
        openMv.jump(0)
        checkMv.jump(0)
        drops.forEach((d) => d.jump(0))
      } else {
        void animate(checkMv, 0, { duration: 0.15, ease: EASE_OUT })
        void animate(openMv, 0, { duration: WASH_OUT, ease: EASE_OUT, delay: 0.06 }).then(() => {
          if (openMv.get() === 0) setLeaving(false)
        })
        drops.forEach((d) => void animate(d, 0, { type: "spring", duration: 0.3, bounce: 0, delay: 0.1 }))
      }
    }
    if (status !== "error") return
    const filled = painted.current.flatMap((c, i) => (c ? [i] : [])).reverse()
    if (!filled.length) return
    const step = L.reduce ? 0 : L.cascade
    filled.forEach((i, k) => driveRef.current(i, 0, k * step))
    painted.current.forEach((_, j) => glide.current.add(j))
    clearTimeout(drainTimer.current)
    drainTimer.current = setTimeout(
      () => {
        setDraining(false)
        setSlots({ chars: Array.from({ length: mvs.length }, () => ""), source: "user" })
        live.current.onChange?.("")
      },
      L.reduce ? REDUCED_DRAIN : (filled.length - 1) * step + L.settle * 1000
    )
  }, [status, openMv, checkMv, drops, mvs])

  React.useEffect(() => () => clearTimeout(drainTimer.current), [])
  React.useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  // Каретка — в долях шага ряда; ячейки, которые ещё «летят», тянут её за собой.
  const caretX = useTransform(() => {
    const a = activeMv.get()
    let x = a
    for (let j = 0; j < mvs.length; j++) {
      const h = clamp01(mvs[j]!.get())
      if (!glide.current.has(j)) continue
      const to = target.current[j]
      if (to === undefined || h === clamp01(to)) {
        glide.current.delete(j)
        continue
      }
      x += j < a ? -(1 - h) : h
    }
    return Math.min(Math.max(x, 0), mvs.length - 1)
  })
  const caretTransform = useTransform(caretX, (x: number) => `translateX(calc(${x} * ${PITCH} * var(--spacing)))`)
  const washClip = useTransform(openMv, (o: number) => `inset(0 ${(1 - clamp01(o)) * 50}% round var(--radius-lg))`)
  const checkTransform = useTransform(
    checkMv,
    (c: number) => `translateY(calc(${(1 - clamp01(c)) * CHECK_RISE} * var(--spacing))) scale(${0.85 + 0.15 * Math.max(c, 0)})`
  )
  const checkOpacity = useTransform(checkMv, clamp01)

  const commit = (next: string[], touched: number[]) => {
    const prev = slots.chars
    setSlots({ chars: next, source: "user", touched })
    const code = next.join("")
    onChange?.(code)
    if (!isFull(prev) && isFull(next)) onComplete?.(code)
  }
  const jumpActive = (next: number) => {
    glide.current.clear()
    setActive(next)
  }
  const insert = (raw: string, from = active) => {
    const digits = digitsOf(raw)
    if (!digits) return
    const next = [...slots.chars]
    const crossed: number[] = []
    let i = from
    for (const ch of digits) {
      if (i >= length) break
      next[i] = ch
      crossed.push(i)
      i += 1
    }
    if (!crossed.length) return
    crossed.forEach((j) => glide.current.add(j))
    commit(next, crossed)
    setActive(Math.min(i, length - 1))
  }
  const clearSlot = (i: number, stepBack = false) => {
    if (!slots.chars[i]) {
      if (stepBack) jumpActive(i)
      return
    }
    const next = [...slots.chars]
    next[i] = ""
    commit(next, [i])
    if (stepBack) {
      glide.current.add(i)
      setActive(i)
    }
  }

  const busy = disabled || draining || status === "success"
  const veiled = status === "success" || leaving
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (busy || e.metaKey || e.ctrlKey || e.altKey) return
    const k = e.key
    if (DIGIT_KEY.test(k)) {
      e.preventDefault()
      insert(k)
    } else if (k === "Backspace") {
      e.preventDefault()
      if (slots.chars[active]) clearSlot(active)
      else if (active > 0) clearSlot(active - 1, true)
    } else if (k === "Delete") {
      e.preventDefault()
      clearSlot(active)
    } else if (k === "ArrowLeft") {
      e.preventDefault()
      jumpActive(Math.max(active - 1, 0))
    } else if (k === "ArrowRight") {
      e.preventDefault()
      jumpActive(Math.min(active + 1, length - 1))
    } else if (k === "Home") {
      e.preventDefault()
      jumpActive(0)
    } else if (k === "End") {
      e.preventDefault()
      jumpActive(length - 1)
    }
  }
  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (busy) return
    e.preventDefault()
    insert(e.clipboardData.getData("text"))
  }
  // Автозаполнение и экранные клавиатуры без keydown приходят сюда.
  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (busy) return
    const d = digitsOf(e.target.value)
    if (!d) return
    insert(d, d.length === 1 ? active : 0)
  }
  // Клик по ряду: активна ячейка под указателем, но не дальше первой пустой.
  const onRowMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return
    e.preventDefault()
    const row = rowRef.current
    if (row && !draining && status !== "success") {
      let i = 0
      row.querySelectorAll<HTMLElement>('[data-slot="code-slots-cell"]').forEach((cell, j) => {
        if (e.clientX >= cell.getBoundingClientRect().left) i = j
      })
      jumpActive(Math.min(i, firstEmptyOf(slots.chars)))
    }
    inputRef.current?.focus()
  }

  const showCaret = caret && focused && !disabled && !veiled && (status === "error" || !slots.chars[active])

  return (
    <div
      ref={rowRef}
      dir="ltr"
      data-slot="code-slots"
      data-status={status}
      data-disabled={disabled ? "" : undefined}
      className={cn(
        "relative inline-flex cursor-text touch-manipulation gap-3 transition-opacity duration-base",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      onMouseDown={onRowMouseDown}
    >
      <input
        ref={inputRef}
        id={id}
        className="absolute inset-0 z-4 m-0 cursor-text appearance-none border-0 bg-transparent p-0 text-base text-transparent caret-transparent opacity-0 outline-none disabled:cursor-not-allowed"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        dir="ltr"
        value=""
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-invalid={ariaInvalid ?? status === "error"}
        aria-busy={ariaBusy}
        disabled={disabled}
        readOnly={status === "success"}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onChange={onInput}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {slots.chars.map((ch, i) => (
        <Slot
          key={i}
          mv={mvs[i]!}
          drop={drops[i]!}
          char={mask && ch ? "•" : ch}
          active={focused && !veiled && i === active}
          error={status === "error"}
          rise={rise}
        />
      ))}
      <motion.span
        data-slot="code-slots-wash"
        className="pointer-events-none absolute inset-0 z-1 grid place-items-center rounded-lg bg-primary text-primary-foreground"
        aria-hidden="true"
        style={{ clipPath: washClip }}
      >
        <motion.span
          className="grid place-items-center motion-reduce:transform-none! motion-reduce:transition-opacity motion-reduce:duration-fast"
          style={{ transform: checkTransform, opacity: checkOpacity }}
        >
          <Icon icon={RiCheckLine} className="size-8" />
        </motion.span>
      </motion.span>
      <motion.span
        data-slot="code-slots-caret"
        className={cn(
          "pointer-events-none absolute start-7 top-1/4 z-3 -ms-px h-1/2 w-0.5 opacity-0",
          showCaret && "opacity-100"
        )}
        aria-hidden="true"
        style={{ transform: caretTransform }}
      >
        <span key={active} className="block size-full animate-caret-blink bg-foreground motion-reduce:animate-none" />
      </motion.span>
    </div>
  )
}

interface SlotProps {
  mv: MotionValue<number>
  drop: MotionValue<number>
  char: string
  active: boolean
  error: boolean
  rise: number
}

function Slot({ mv, drop, char, active, error, rise }: SlotProps) {
  // Последняя цифра остаётся в разметке, пока ячейка «уходит», — иначе она исчезла бы до анимации.
  const [shown, setShown] = React.useState(char)
  if (char && char !== shown) setShown(char)
  const fill = useTransform(mv, (t: number) => `scale(${Math.max(t, 0)})`)
  const lift = useTransform(
    [mv, drop],
    ([t = 0, d = 0]: number[]) => `translateY(calc(${(1 - t) * rise} * var(--spacing) + ${Math.max(d, 0) * 50}%))`
  )
  const ink = useTransform([mv, drop], ([t = 0, d = 0]: number[]) => clamp01(t) * (1 - clamp01(d / SINK_FADE)))
  return (
    <span
      data-slot="code-slots-cell"
      data-active={active ? "" : undefined}
      data-filled={char ? "" : undefined}
      aria-hidden="true"
      className={cn(
        "relative size-14 overflow-hidden rounded-lg border border-input bg-input/30 transition duration-base select-none",
        active && !error && "border-ring ring-3 ring-ring/50",
        error && "border-destructive ring-3 ring-destructive/20 dark:border-destructive/50 dark:ring-destructive/40"
      )}
    >
      <motion.span
        className={cn(
          "absolute inset-0 origin-center rounded-md transition-colors duration-base",
          error ? "bg-destructive/15" : "bg-primary/10"
        )}
        style={{ transform: fill }}
      />
      {shown ? (
        <motion.span
          className="absolute inset-0 z-2 grid place-items-center text-2xl leading-none font-semibold text-foreground tabular-nums motion-reduce:transform-none! motion-reduce:transition-opacity motion-reduce:duration-fast"
          style={{ transform: lift, opacity: ink }}
        >
          {shown}
        </motion.span>
      ) : null}
    </span>
  )
}

export { CodeSlots, type CodeSlotsProps, type CodeSlotsStatus }
