import { cn } from "cn"

// Tadum (решение Кирилла 2026-11-11; приём по образцу React Bits Border Glow, реализация своя): синяя дуга
// обводки с мягким свечением обходит контейнер по кругу, затем пауза 2 s с обычной серой обводкой, и снова.
// Ставится последним дочерним элементом в позиционированный (relative/sticky/absolute) контейнер со
// скруглением и border; скругление наследует сам. Свечение выходит за контейнер на --beam-glow-radius —
// у контейнера и ближайших предков не должно быть overflow: hidden. Декоративный: aria-hidden, не ловит
// указатель, раскладку не меняет. Утилиты border-beam / -edge / -glow — в globals.css.
type BorderBeamProps = {
  className?: string
  /** false — блика нет, контейнер с обычной обводкой. По умолчанию true. */
  active?: boolean
}

function BorderBeam({ className, active = true }: BorderBeamProps) {
  if (!active) return null
  return (
    <span aria-hidden="true" data-slot="border-beam" className={cn("border-beam", className)}>
      <span data-slot="border-beam-glow" className="border-beam-glow" />
      <span data-slot="border-beam-edge" className="border-beam-edge" />
    </span>
  )
}

export { BorderBeam, type BorderBeamProps }
