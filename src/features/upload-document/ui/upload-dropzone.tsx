// Зона загрузки в раскрытой строке документа: перетащить файлы (десктоп) или нажать — откроется выбор источника.
// Своей кнопки в зоне нет (решение Кирилла 2026-11-09: «Загрузить» уже есть в строке) — нажимается вся зона.
// Своего dropzone в shadcn нет — собрана из Empty с пунктирной рамкой (бенчмарк № 09).
import { cn } from 'cn';
import { useState, type DragEvent, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, Icon, RiUploadCloud2Line } from '@/shared/ui';

export interface UploadDropzoneProps {
  disabled?: boolean;
  /** Подсказка, почему зона выключена (например, офлайн). */
  disabledHint?: string;
  onChoose: () => void;
  onDropFiles: (files: File[]) => void;
}

export function UploadDropzone({ disabled = false, disabledHint, onChoose, onDropFiles }: UploadDropzoneProps) {
  const { t } = useTranslation();
  const [over, setOver] = useState(false);

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    setOver(true);
  };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOver(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onDropFiles(files);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    onChoose();
  };

  return (
    <Empty
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onChoose}
      onKeyDown={onKeyDown}
      onDragOver={onDragOver}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={cn(
        'cursor-pointer gap-2 rounded-xl border border-dashed p-4 transition-colors duration-fast outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 md:p-6',
        over && 'border-primary bg-accent',
        disabled && 'cursor-not-allowed opacity-60 hover:bg-transparent',
      )}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon icon={RiUploadCloud2Line} />
        </EmptyMedia>
        <EmptyTitle className="text-sm">{t('upload.dropzone.title')}</EmptyTitle>
        <EmptyDescription>{disabled && disabledHint ? disabledHint : t('upload.dropzone.formats', { max_mb: 10 })}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
