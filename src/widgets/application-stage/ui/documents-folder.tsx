// Принятые документы — папка по образцу Кирилла (2026-11-11): задняя стенка — сплошная, темнее; два крупных листа
// с загнутым уголком выступают над ней; передняя стенка — прозрачное светлое стекло. У передней стенки верхний край
// отогнут к зрителю в перспективе (верхние углы выходят за боковые края задней стенки) и имеет вырез-ступеньку —
// вырез в самой форме, без дополнительного слоя. Стенки — один SVG (без clip-path и backdrop-filter: у них были
// артефакты на нижних углах). Вся карточка — кнопка: открывает панель с документами; на наведение папка чуть
// увеличивается, листы расходятся. Цвета — только токены (primary, primary-foreground, card, muted); движение —
// duration-base / ease-standard, при prefers-reduced-motion — без анимации.
import { cn } from 'cn';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

const MOTION = 'transition-transform duration-base ease-standard motion-reduce:transition-none';

/** Лист 80×144 с загнутым верхним уголком 18 px; две строки текста; низ — почти у нижнего края папки. */
const PAPER_SHAPE = { clipPath: 'polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)' };
const FOLD_SHAPE = { clipPath: 'polygon(0 0, 100% 100%, 0 100%)' };

function Paper({ className }: { className: string }) {
  return (
    <div className={cn('absolute top-0 h-36 w-20 drop-shadow-md', MOTION, className)}>
      <div className="flex size-full flex-col gap-2.5 rounded-md bg-card p-3 pt-7" style={PAPER_SHAPE}>
        <span className="h-1.5 w-3/4 rounded-full bg-muted-foreground/30" />
        <span className="h-1.5 w-1/2 rounded-full bg-muted-foreground/20" />
      </div>
      <span className="absolute end-0 top-0 size-4.5 rounded-es-md bg-muted" style={FOLD_SHAPE} />
    </div>
  );
}

/**
 * Стенки папки в координатах 208×176 (1 единица = 1 px). Задняя: 168×128 со скруглением 18, без выреза.
 * Передняя: верх от y=72 (левая часть) и y=58 (правая, после плавной ступеньки); верхние углы шире задней стенки
 * (x 4…204 против 20…188) — край отогнут вперёд; нижние углы совпадают с углами задней стенки.
 */
const BACK = 'M38 40 H170 Q188 40 188 58 V150 Q188 168 170 168 H38 Q20 168 20 150 V58 Q20 40 38 40 Z';
const FRONT = 'M20 72 H86 C98 72 100 58 114 58 H188 Q204 58 202 74 L188 150 Q188 168 170 168 H38 Q20 168 20 150 L6 88 Q4 72 20 72 Z';
/** Верхний край передней стенки — тот же контур, что в FRONT; блик обрезан формой, поэтому лежит точно по краю. */
const FRONT_EDGE = 'M6 88 Q4 72 20 72 H86 C98 72 100 58 114 58 H188 Q204 58 202 74';
/**
 * Форма передней стенки для HTML-слоёв (размытие, шум) — маской, а не clip-path: clip-path в Chrome не обрезает
 * backdrop-filter, и размытие вылезало прямоугольником.
 */
const FRONT_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 208 176'><path d='${FRONT}'/></svg>`;
const FRONT_MASK = {
  maskImage: `url("data:image/svg+xml,${encodeURIComponent(FRONT_SVG)}")`,
  maskSize: '100% 100%',
  maskRepeat: 'no-repeat',
  WebkitMaskImage: `url("data:image/svg+xml,${encodeURIComponent(FRONT_SVG)}")`,
  WebkitMaskSize: '100% 100%',
  WebkitMaskRepeat: 'no-repeat',
};
/** Шум стекла — фрактальный шум SVG, очень слабый. */
const NOISE = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
};

export interface DocumentsFolderProps {
  count: number;
  onOpen: () => void;
  className?: string;
}

export function DocumentsFolder({ count, onOpen, className }: DocumentsFolderProps) {
  const { t } = useTranslation();
  const glass = useId();
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${t('application.folder.open')}. ${t('application.documents_accepted', { count })}`}
      className={cn(
        'group flex w-full cursor-pointer flex-col items-center justify-center gap-5 rounded-2xl bg-secondary px-6 pt-8 pb-6 text-secondary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        className,
      )}
    >
      <div className={cn('relative h-44 w-52 group-hover:scale-105', MOTION)} aria-hidden="true">
        {/* Задняя стенка — сплошная, темнее. */}
        <svg viewBox="0 0 208 176" className="absolute inset-0 size-full">
          <path d={BACK} className="fill-primary brightness-75" />
        </svg>
        {/* Листы — крупные, выступают над задней стенкой; на наведение расходятся. */}
        <Paper className="start-12 -rotate-6 group-hover:-translate-x-2 group-hover:-rotate-12 rtl:group-hover:translate-x-2" />
        <Paper className="end-12 top-1 rotate-6 group-hover:translate-x-2 group-hover:rotate-12 rtl:group-hover:-translate-x-2" />
        {/* Передняя стенка — матовое стекло: размытие листов под ним, шум, светлая подложка и синий градиент. */}
        <div className="absolute inset-0 backdrop-blur-lg" style={FRONT_MASK} />
        <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ ...FRONT_MASK, ...NOISE }} />
        <svg viewBox="0 0 208 176" className="absolute inset-0 size-full drop-shadow-lg">
          <defs>
            <linearGradient id={`${glass}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--primary)" stopOpacity="0.3" />
              <stop offset="1" stopColor="var(--primary)" stopOpacity="0.62" />
            </linearGradient>
            <clipPath id={`${glass}-clip`}>
              <path d={FRONT} />
            </clipPath>
          </defs>
          <path d={FRONT} className="fill-primary-foreground/45" />
          <path d={FRONT} fill={`url(#${glass}-fill)`} />
          {/* Блик по верхнему краю: линия вдвое толще и обрезана формой — внутри остаётся ровно по краю. */}
          <path
            d={FRONT_EDGE}
            fill="none"
            clipPath={`url(#${glass}-clip)`}
            className="stroke-primary-foreground/80"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-base font-medium">{t('application.folder.title')}</span>
        <span className="text-sm text-muted-foreground">{t('application.documents_accepted', { count })}</span>
      </span>
    </button>
  );
}
