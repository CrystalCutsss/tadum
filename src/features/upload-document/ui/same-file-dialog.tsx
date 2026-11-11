// Окно «Это тот же файл» (решение Кирилла 2026-11-10): клиент выбрал файл, который уже есть в документе или раньше
// не подошёл. Файл не загружается; можно сразу выбрать другой. Вид — как у прежнего окна «Заменить файл?».
import { useTranslation } from 'react-i18next';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui';

export interface SameFileDialogProps {
  /** Имена файлов, которые не загрузились; пусто — окно закрыто. */
  names: readonly string[];
  onClose: () => void;
  onPickOther: () => void;
}

export function SameFileDialog({ names, onClose, onPickOther }: SameFileDialogProps) {
  const { t } = useTranslation();
  return (
    <AlertDialog open={names.length > 0} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('upload.same_file.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {/* Имя файла — латиница внутри арабского: изолируем через bdi при подстановке. */}
            {t('upload.same_file.body', { name: names.map((n) => `⁨${n}⁩`).join(', ') })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('upload.same_file.ok')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onClose();
              onPickOther();
            }}
          >
            {t('upload.same_file.choose_another')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
