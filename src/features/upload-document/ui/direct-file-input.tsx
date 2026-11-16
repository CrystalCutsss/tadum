// Прямой выбор файла без окна выбора источника: на компьютере «Upload» сразу открывает файловый менеджер,
// на телефоне остаётся шторка «Камера / Фото / Файлы» (решение Кирилла 2026-11-16).
import type { ChangeEvent, Ref } from 'react';

import type { UploadSource } from '../model/use-document-upload';

/** Те же форматы, что у плитки «Файлы» в SourcePicker. */
const FILE_ACCEPT = 'application/pdf,image/jpeg,image/png';

export interface DirectFileInputProps {
  /** Скрытое поле: вызывающий открывает его через `ref.current.click()` в обработчике нажатия. */
  ref: Ref<HTMLInputElement>;
  onPick: (files: File[], source: UploadSource) => void;
}

export function DirectFileInput({ ref, onPick }: DirectFileInputProps) {
  const picked = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Сброс значения: повторный выбор того же файла снова вызовет change.
    event.target.value = '';
    if (files.length > 0) onPick(files, 'files');
  };
  return <input ref={ref} type="file" className="hidden" tabIndex={-1} aria-hidden="true" accept={FILE_ACCEPT} multiple onChange={picked} />;
}
