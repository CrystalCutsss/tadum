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

/** Лист 80×104 с загнутым верхним уголком 18 px; две строки текста. */
const PAPER_SHAPE = { clipPath: 'polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)' };
const FOLD_SHAPE = { clipPath: 'polygon(0 0, 100% 100%, 0 100%)' };

function Paper({ className }: { className: string }) {
  return (
    <div className={cn('absolute top-0 h-26 w-20 drop-shadow-md', MOTION, className)}>
      <div className="flex size-full flex-col gap-2.5 rounded-md bg-card p-3 pt-7" style={PAPER_SHAPE}>
        <span className="h-1.5 w-3/4 rounded-full bg-muted-foreground/30" />
        <span className="h-1.5 w-1/2 rounded-full bg-muted-foreground/20" />
      </div>
      <span className="absolute end-0 top-0 size-4.5 rounded-es-md bg-muted" style={FOLD_SHAPE} />
    </div>
  );
}

/**
 * Стенки папки в координатах 208×176. Задняя: прямоугольник 168×124 со скруглением 18, без выреза.
 * Передняя: от y=72 (левая часть) и y=58 (правая, после плавной ступеньки) до низа; верхние углы шире задней стенки
 * (x 4…204 против 20…188) — край отогнут вперёд, низ сужается к ширине задней стенки.
 */
const BACK = 'M38 40 H170 Q188 40 188 58 V146 Q188 164 170 164 H38 Q20 164 20 146 V58 Q20 40 38 40 Z';
const FRONT =
  'M20 72 H86 C98 72 100 58 114 58 H188 Q204 58 202 74 L190 150 Q187 168 170 168 H38 Q21 168 18 150 L6 88 Q4 72 20 72 Z';
const FRONT_EDGE = 'M8 84 Q8 72 20 72 H86 C98 72 100 58 114 58 H188 Q202 58 202 70';

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
        {/* Передняя стенка — прозрачное светлое стекло с вырезом и бликом по верхнему краю. */}
        <svg viewBox="0 0 208 176" className="absolute inset-0 size-full drop-shadow-lg">
          <defs>
            <linearGradient id={glass} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--primary)" stopOpacity="0.3" />
              <stop offset="1" stopColor="var(--primary)" stopOpacity="0.62" />
            </linearGradient>
          </defs>
          {/* Матовое стекло: светлая подложка прячет листы, поверх — синий градиент. */}
          <path d={FRONT} className="fill-primary-foreground/70" />
          <path d={FRONT} fill={`url(#${glass})`} />
          <path d={FRONT_EDGE} fill="none" className="stroke-primary-foreground/70" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="absolute end-7 bottom-5 rounded-full bg-primary-foreground/35 px-2.5 py-0.5 text-xs font-medium text-primary-foreground tabular-nums">
          {count}
        </span>
      </div>
      <span className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-base font-medium">{t('application.folder.title')}</span>
        <span className="text-sm text-muted-foreground">{t('application.documents_accepted', { count })}</span>
      </span>
    </button>
  );
}
