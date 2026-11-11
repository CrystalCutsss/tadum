// Принятые документы — папка (Кирилл 2026-11-11, образец — карточка папки с документами внутри стеклянного шейпа):
// задняя стенка и язычок в основном синем, два листа внутри, передняя стенка — полупрозрачная синяя с размытием.
// Вся карточка — кнопка: открывает панель с документами. На наведение папка чуть увеличивается, листы расходятся.
// Цвета — только токены primary с прозрачностью; движение — токены duration-base / ease-standard,
// при prefers-reduced-motion — без анимации.
import { cn } from 'cn';
import { useTranslation } from 'react-i18next';

const MOTION = 'transition-transform duration-base ease-standard motion-reduce:transition-none';

function Paper({ className }: { className: string }) {
  return (
    <div className={cn('absolute top-2 flex h-24 w-20 flex-col gap-1.5 rounded-md bg-card p-2.5 shadow-md', MOTION, className)}>
      <span className="h-1 w-3/4 rounded-full bg-muted-foreground/30" />
      <span className="h-1 w-1/2 rounded-full bg-muted-foreground/30" />
      <span className="h-1 w-2/3 rounded-full bg-muted-foreground/20" />
      <span className="h-1 w-1/2 rounded-full bg-muted-foreground/20" />
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
        'group flex w-full cursor-pointer flex-col items-center gap-4 rounded-2xl bg-secondary p-5 text-secondary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        className,
      )}
    >
      <div className={cn('relative h-36 w-48 group-hover:scale-105', MOTION)} aria-hidden="true">
        {/* Задняя стенка с язычком. */}
        <div className="absolute start-3 top-0 h-6 w-16 rounded-t-lg bg-primary brightness-75" />
        <div className="absolute inset-x-0 top-3 bottom-0 rounded-xl bg-primary brightness-75" />
        {/* Листы: на наведение расходятся. */}
        <Paper className="start-9 -rotate-6 group-hover:-translate-x-2 group-hover:-rotate-12 rtl:group-hover:translate-x-2" />
        <Paper className="end-9 rotate-6 group-hover:translate-x-2 group-hover:rotate-12 rtl:group-hover:-translate-x-2" />
        {/* Передняя стенка — стекло в оттенках синего. */}
        <div className="absolute inset-x-0 bottom-0 flex h-3/5 items-end justify-end rounded-xl bg-linear-to-b from-primary/40 to-primary/75 p-3 shadow-lg ring-1 ring-primary-foreground/20 backdrop-blur-md">
          <span className="rounded-full bg-primary-foreground/20 px-2.5 py-0.5 text-xs font-medium text-primary-foreground tabular-nums">
            {count}
          </span>
        </div>
      </div>
      <span className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-base font-medium">{t('application.folder.title')}</span>
        <span className="text-sm text-muted-foreground">{t('application.documents_accepted', { count })}</span>
      </span>
    </button>
  );
}
