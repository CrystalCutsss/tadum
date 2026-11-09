// Выбор источника файла (решение Кирилла 2026-11-09, бенчмарк № 14): три равные крупные плитки —
// камера, галерея, файлы. На телефоне — шторка снизу, на десктопе — модальное окно (ResponsiveDialog).
// Над плитками — короткое описание документа: что нужно и где взять.
import { RiCameraLine, RiFolderOpenLine, RiImageLine, type RemixiconComponentType } from '@remixicon/react';
import { useRef, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Button,
  Icon,
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/shared/ui';

import type { UploadSource } from '../model/use-document-upload';

const FILE_ACCEPT = 'application/pdf,image/jpeg,image/png';

interface Tile {
  source: Exclude<UploadSource, 'unknown'>;
  icon: RemixiconComponentType;
  accept: string;
  capture?: 'environment';
}

const TILES: readonly Tile[] = [
  { source: 'camera', icon: RiCameraLine, accept: 'image/*', capture: 'environment' },
  { source: 'gallery', icon: RiImageLine, accept: 'image/jpeg,image/png' },
  { source: 'files', icon: RiFolderOpenLine, accept: FILE_ACCEPT },
];

export interface SourcePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Название документа (уже переведённое). */
  title: string;
  /** Короткое описание документа (уже переведённое). */
  hint: string;
  /** Можно выбрать несколько файлов (кроме замены одного файла). */
  multiple?: boolean;
  onPick: (files: File[], source: UploadSource) => void;
}

export function SourcePicker({ open, onOpenChange, title, hint, multiple = true, onPick }: SourcePickerProps) {
  const { t } = useTranslation();
  const inputs = useRef<Partial<Record<Tile['source'], HTMLInputElement | null>>>({});

  const picked = (source: UploadSource) => (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Сброс значения: повторный выбор того же файла снова вызовет change.
    event.target.value = '';
    if (files.length === 0) return;
    onOpenChange(false);
    onPick(files, source);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent closeLabel={t('common.close')}>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{hint}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="grid grid-cols-3 gap-3 p-4 pt-0 md:p-0">
          {TILES.map((tile) => (
            <Button
              key={tile.source}
              type="button"
              variant="outline"
              className="h-auto min-h-24 flex-col gap-2 py-4 whitespace-normal"
              onClick={() => inputs.current[tile.source]?.click()}
            >
              <Icon icon={tile.icon} className="size-6" />
              <span>{t(`source_picker.${tile.source}`)}</span>
              <input
                ref={(el) => {
                  inputs.current[tile.source] = el;
                }}
                type="file"
                className="hidden"
                tabIndex={-1}
                aria-hidden="true"
                accept={tile.accept}
                {...(tile.capture ? { capture: tile.capture } : {})}
                multiple={multiple && tile.source !== 'camera'}
                onChange={picked(tile.source)}
              />
            </Button>
          ))}
        </div>
        <p className="px-4 pb-4 text-center text-sm text-muted-foreground md:p-0">{t('source_picker.formats', { max_mb: 10 })}</p>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
