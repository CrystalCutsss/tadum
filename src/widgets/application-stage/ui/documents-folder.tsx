// Принятые документы — папка (Кирилл 2026-11-11, образец — карточка папки с документами внутри стеклянного шейпа):
// задняя стенка — простая, без выемки; два листа с загнутым уголком выступают над ней; передняя стенка — полупрозрачное
// синее стекло с размытием, наклонена в перспективе и с выемкой-ступенькой по верхнему краю. Вся карточка — кнопка:
// открывает панель с документами. На наведение папка чуть увеличивается, листы расходятся, передняя стенка
// приоткрывается. Цвета — только токены primary с прозрачностью; движение — токены duration-base / ease-standard,
// при prefers-reduced-motion — без анимации. Формы (clip-path) — во встроенных стилях: декоративные, в px макета 160×128.
import { cn } from 'cn';
import { useTranslation } from 'react-i18next';

const MOTION = 'transition-transform duration-base ease-standard motion-reduce:transition-none';

/** Передняя стенка 160×80: левый край выше, плавная ступенька-выемка (18 px) на ~70 px, углы скруглены. */
const FRONT_SHAPE = { clipPath: "path('M12 0 H50 C62 0 62 18 76 18 H148 Q160 18 160 30 V68 Q160 80 148 80 H12 Q0 80 0 68 V12 Q0 0 12 0 Z')" };
/** Лист 56×72 с загнутым верхним уголком 14 px. */
const PAPER_SHAPE = { clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)' };
const FOLD_SHAPE = { clipPath: 'polygon(0 0, 100% 100%, 0 100%)' };

function Paper({ className }: { className: string }) {
  return (
    <div className={cn('absolute -top-3 h-18 w-14 drop-shadow-md', MOTION, className)}>
      <div className="flex size-full flex-col gap-2 rounded-sm bg-card p-2.5 pt-5" style={PAPER_SHAPE}>
        <span className="h-1 w-3/4 rounded-full bg-muted-foreground/30" />
        <span className="h-1 w-1/2 rounded-full bg-muted-foreground/20" />
      </div>
      {/* Загнутый уголок. */}
      <span className="absolute end-0 top-0 size-3.5 rounded-es-sm bg-muted" style={FOLD_SHAPE} />
    </div>
  );
}

export interface DocumentsFolderProps {
  count: number;
  onOpen: () => void;
  className?: string;
}

export function DocumentsFolder({ count, onOpen, className }: DocumentsFolderProps) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${t('application.folder.open')}. ${t('application.documents_accepted', { count })}`}
      className={cn(
        'group flex w-full cursor-pointer flex-col items-center gap-4 rounded-2xl bg-secondary px-8 pt-10 pb-5 text-secondary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        className,
      )}
    >
      <div className={cn('relative h-32 w-40 perspective-distant group-hover:scale-105', MOTION)} aria-hidden="true">
        {/* Задняя стенка — без выемки. */}
        <div className="absolute inset-x-0 top-3 bottom-0 rounded-xl bg-primary/45" />
        {/* Листы выступают над стенкой; на наведение расходятся. */}
        <Paper className="start-9 -rotate-6 group-hover:-translate-x-2 group-hover:-rotate-12 rtl:group-hover:translate-x-2" />
        <Paper className="end-9 rotate-6 group-hover:translate-x-2 group-hover:rotate-12 rtl:group-hover:-translate-x-2" />
        {/* Передняя стенка — стекло, наклонена в перспективе; на наведение приоткрывается. */}
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 flex h-20 origin-bottom rotate-x-12 items-end justify-end bg-linear-to-b from-primary/25 to-primary/50 p-3 backdrop-blur-md group-hover:rotate-x-24',
            MOTION,
          )}
          style={FRONT_SHAPE}
        >
          <span className="rounded-full bg-primary-foreground/30 px-2.5 py-0.5 text-xs font-medium text-primary-foreground tabular-nums">{count}</span>
        </div>
      </div>
      <span className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-base font-medium">{t('application.folder.title')}</span>
        <span className="text-sm text-muted-foreground">{t('application.documents_accepted', { count })}</span>
      </span>
    </button>
  );
}
