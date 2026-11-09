// Зона загрузки в раскрытой строке документа: перетащить файлы (десктоп) или выбрать источник.
// Своего dropzone в shadcn нет — собрана из Empty с пунктирной рамкой (бенчмарк № 09: зона остаётся над списком файлов).
import { RiUploadCloud2Line } from '@remixicon/react';
import { cn } from 'cn';
import { useState, type DragEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, Icon } from '@/shared/ui';

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

  return (
    <Empty
      onDragOver={onDragOver}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={cn('gap-3 border border-dashed p-4 md:p-6', over && 'border-primary bg-accent')}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon icon={RiUploadCloud2Line} />
        </EmptyMedia>
        <EmptyTitle className="text-sm">{t('upload.dropzone.title')}</EmptyTitle>
        <EmptyDescription>{disabled && disabledHint ? disabledHint : t('upload.dropzone.formats', { max_mb: 10 })}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button type="button" variant="outline" className="min-h-11" disabled={disabled} onClick={onChoose}>
          {t('upload.dropzone.choose')}
        </Button>
      </EmptyContent>
    </Empty>
  );
}
