// Папка над кнопкой «Отправить на проверку» (решения Кирилла 2026-11-12): вместо бегущей обводки, когда всё готово.
// Форма, пропорции и движение — из кода «Folder» React Bits (режим flap, вариант solid, ярлык справа; Drive «Код для папки»):
// задняя стенка 224×176 с ярлыком высотой 20 и плавными «плечами», передняя стенка — нижние 70 % папки, листы — 54 %
// ширины папки, высота ×1.22, лежат веером по FLAP_REST. Папка крупнее, скругления меньше образца (Кирилл: «сделай
// больше, уменьши все скругления»).
// Сценарий — intro образца: папка проявляется, передняя стенка откинута на −42°, листы по очереди (нижний — первым)
// падают сверху и встают на место, стенка закрывается. Потом цикл «подглядывания» образца (фаза peek: листы
// поднимаются на 10 % высоты, разворот ×1.6, разлёт ×1.3, стенка на −15°) и обратно; пауза между циклами 1 с.
// Пружины пересчитаны из образца (ω, ζ) в stiffness = ω², damping = 2ζω. Цвета — токены папки, листы без текста.
// При prefers-reduced-motion — сразу поза покоя, без движения.
import { cn } from 'cn';
import { useAnimate, useReducedMotion } from 'motion/react';
import { useEffect, useId } from 'react';

/** Геометрия образца (measureFolder, scale 1), единицы viewBox. */
const W = 224;
const H = 176;
const TAB_H = 20;
const SHOULDER = TAB_H * 0.75;
const TAB_W = W * 0.34;
/** Скругление стенок: в образце 12, у нас меньше. */
const R = 5;
const TAB_X = W - R - 5 - SHOULDER - TAB_W;
const FRONT_TOP = TAB_H + H * 0.3;
const FRONT_H = TAB_H + H - FRONT_TOP;
const DOC_W = W * 0.54;
const DOC_H = DOC_W * 1.22;
/** Скругление листа: в образце 7, у нас меньше. */
const DOC_R = 3;
/** Центр листа в покое по высоте: 5 единиц от дна папки. */
const FLOOR = TAB_H + H - 5 - DOC_H / 2;
/** Веер листов в покое (FLAP_REST образца): сдвиг по ширине, подъём по высоте, поворот. */
const REST = [
  { x: 0.16, rise: 0, r: 3 },
  { x: -0.17, rise: 0.05, r: -3.5 },
  { x: 0, rise: 0.1, r: 0.5 },
] as const;

/** Задняя стенка с ярлыком справа (backPath образца). */
const BACK = [
  `M 0 ${TAB_H + R}`,
  `Q 0 ${TAB_H} ${R} ${TAB_H}`,
  `L ${TAB_X - SHOULDER} ${TAB_H}`,
  `C ${TAB_X} ${TAB_H} ${TAB_X} 0 ${TAB_X + SHOULDER} 0`,
  `L ${TAB_X + TAB_W - SHOULDER} 0`,
  `C ${TAB_X + TAB_W} 0 ${TAB_X + TAB_W} ${TAB_H} ${TAB_X + TAB_W + SHOULDER} ${TAB_H}`,
  `L ${W - R} ${TAB_H}`,
  `Q ${W} ${TAB_H} ${W} ${TAB_H + R}`,
  `L ${W} ${TAB_H + H - R}`,
  `Q ${W} ${TAB_H + H} ${W - R} ${TAB_H + H}`,
  `L ${R} ${TAB_H + H}`,
  `Q 0 ${TAB_H + H} 0 ${TAB_H + H - R}`,
  'Z',
].join(' ');

/** Пружины образца: листы ω = 2π·2.1, стенка ω = 2π·2, затухание ζ = 1 − 0.72·bounce (bounce 0.4). */
const ZETA = 1 - 0.72 * 0.4;
const spring = (omega: number) => ({ type: 'spring', stiffness: omega * omega, damping: 2 * ZETA * omega, mass: 1 }) as const;
const ITEM_SPRING = spring(Math.PI * 2 * 2.1);
const FRONT_SPRING = spring(Math.PI * 2 * 2);
/** Тайминги intro образца, с: старт падения, шаг между листами, закрытие стенки после последнего листа, проявление. */
const DROP_START = 0.16;
const DROP_STEP = 0.085;
const CLOSE_AFTER = 0.3;
const APPEAR = 0.34;
/** Углы передней стенки образца: откинута при intro и при подглядывании. */
const FRONT_INTRO = -42;
const FRONT_PEEK = -15;
/** Пауза между циклами подглядывания и время в позе peek, с. */
const PEEK_REST = 1;
const PEEK_HOLD = 0.6;

const restPose = (i: number) => {
  const rest = REST[i] ?? REST[0];
  return { x: rest.x * W, y: -rest.rise * H, rotate: rest.r };
};
const peekPose = (i: number) => {
  const rest = REST[i] ?? REST[0];
  return { x: rest.x * W * 1.3, y: -(rest.rise + 0.1) * H, rotate: rest.r * 1.6 };
};
/** Поза до падения (introPose образца): выше на 0.8 высоты папки и половину листа, сильнее повёрнут, прозрачный. */
const introPose = (i: number) => {
  const rest = restPose(i);
  return { ...rest, y: rest.y - (H * 0.8 + DOC_H * 0.5), rotate: rest.rotate + (i % 2 ? 9 : -7), opacity: 0 };
};

const wait = (seconds: number) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));

export function SubmitFolder({ className }: { className?: string }) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reduce = useReducedMotion();
  const ids = useId();

  useEffect(() => {
    const papers = Array.from(scope.current.querySelectorAll<SVGGElement>('[data-paper]'));
    const front = scope.current.querySelector<SVGSVGElement>('[data-front]');
    if (!front) return;
    const now = { duration: 0 } as const;
    if (reduce) {
      void animate(scope.current, { opacity: 1 }, now);
      papers.forEach((paper, i) => void animate(paper, { ...restPose(i), opacity: 1 }, now));
      return;
    }
    let cancelled = false;
    const run = async () => {
      void animate(front, { rotateX: FRONT_INTRO }, now);
      papers.forEach((paper, i) => void animate(paper, introPose(i), now));
      // Проявление папки, затем листы падают по очереди: нижний (последний в стопке) — первым.
      void animate(scope.current, { opacity: [0, 1] }, { duration: APPEAR, ease: 'easeOut' });
      const drops = papers.map((paper, i) =>
        animate(paper, { ...restPose(i), opacity: 1 }, { ...ITEM_SPRING, delay: DROP_START + (papers.length - 1 - i) * DROP_STEP }),
      );
      await wait(DROP_START + papers.length * DROP_STEP + CLOSE_AFTER);
      if (cancelled) return;
      await Promise.all([animate(front, { rotateX: 0 }, FRONT_SPRING), ...drops]);
      // Цикл подглядывания: листы поднимаются и расходятся, стенка чуть откидывается; затем обратно и пауза 1 с.
      while (!cancelled) {
        await wait(PEEK_REST);
        if (cancelled) return;
        void animate(front, { rotateX: FRONT_PEEK }, FRONT_SPRING);
        papers.forEach((paper, i) => void animate(paper, peekPose(i), { ...ITEM_SPRING, delay: i * DROP_STEP * 0.35 }));
        await wait(PEEK_HOLD);
        if (cancelled) return;
        void animate(front, { rotateX: 0 }, FRONT_SPRING);
        await Promise.all(papers.map((paper, i) => animate(paper, restPose(i), { ...ITEM_SPRING, delay: i * DROP_STEP * 0.35 })));
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [animate, reduce, scope]);

  return (
    // 112 px шириной: высота — по пропорции образца (224 × 196).
    <div ref={scope} aria-hidden="true" className={cn('pointer-events-none relative w-28 opacity-0 perspective-midrange', className)}>
      <svg viewBox={`0 0 ${W} ${TAB_H + H}`} className="block w-full overflow-visible">
        <defs>
          {/* Задняя стенка — градиент «изнутри» образца: темнее книзу. */}
          <linearGradient id={`${ids}-back`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--folder-back)" stopOpacity="0.85" />
            <stop offset="1" stopColor="var(--folder-back)" />
          </linearGradient>
        </defs>
        <path d={BACK} fill={`url(#${ids}-back)`} />
        {/* Листы без текста; центр каждого — в точке покоя, движение — сдвиг и поворот группы. */}
        {REST.map((rest) => (
          <g key={rest.x} data-paper>
            <rect
              x={W / 2 - DOC_W / 2}
              y={FLOOR - DOC_H / 2}
              width={DOC_W}
              height={DOC_H}
              rx={DOC_R}
              className="fill-folder-paper stroke-folder-back drop-shadow-sm"
              strokeWidth="1"
            />
          </g>
        ))}
      </svg>
      {/* Передняя стенка — нижние 70 % папки; откидывается к зрителю от нижнего края. */}
      <svg data-front viewBox={`0 0 ${W} ${FRONT_H}`} className="absolute inset-x-0 bottom-0 block w-full origin-bottom drop-shadow-sm">
        <defs>
          {/* Лицо стенки — градиент 160° образца: светлее сверху, к низу — цвет стенки. */}
          <linearGradient id={`${ids}-front`} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0" stopColor="var(--folder-paper)" />
            <stop offset="0.48" stopColor="var(--folder-front)" />
            <stop offset="1" stopColor="var(--folder-front)" />
          </linearGradient>
        </defs>
        <rect width={W} height={FRONT_H} rx={R} fill={`url(#${ids}-front)`} />
      </svg>
    </div>
  );
}
