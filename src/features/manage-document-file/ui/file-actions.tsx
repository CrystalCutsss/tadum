// Действия с загруженным файлом: скачать (прямая ссылка, без blob: — встроенный браузер WhatsApp),
// заменить (через выбор источника), удалить с подтверждением. Меню «⋯» — одна цель нажатия 44 px вместо трёх мелких.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { track } from '@/shared/analytics';
import { getApi, type DocumentStatus, type FileAsset } from '@/shared/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icon,
  toast,
  RiDeleteBinLine,
  RiDownloadLine,
  RiMore2Line,
  RiRefreshLine,
} from '@/shared/ui';

export interface FileActionsProps {
  documentId: string;
  portalKey: string;
  status: DocumentStatus;
  file: FileAsset;
  /** Можно менять файлы (комплект не отправлен). */
  editable: boolean;
  onReplace: () => void;
}

export function FileActions({ documentId, portalKey, status, file, editable, onReplace }: FileActionsProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState(false);

  const remove = useMutation({
    mutationFn: async () => (await getApi()).documents.delete(documentId, file.id),
    onSuccess: async () => {
      track('document_file_deleted', { owner: 'client', portal_key: portalKey });
      toast(t('documents.file.deleted'));
      await queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: () => toast(t('documents.file.delete_failed')),
  });

  const download = async () => {
    try {
      const { url } = await (await getApi()).documents.download(file.id);
      track('document_file_downloaded', { owner: 'client', portal_key: portalKey, status });
      window.open(url, '_blank', 'noopener');
    } catch {
      toast(t('documents.file.download_failed'));
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label={t('documents.file.actions', { name: file.name })}>
            <Icon icon={RiMore2Line} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => void download()}>
            <Icon icon={RiDownloadLine} />
            {t('documents.file.download')}
          </DropdownMenuItem>
          {editable ? (
            <>
              <DropdownMenuItem onSelect={onReplace}>
                <Icon icon={RiRefreshLine} />
                {t('documents.file.replace')}
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirm(true)}>
                <Icon icon={RiDeleteBinLine} />
                {t('documents.file.delete')}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('documents.file.delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              <bdi>{file.name}</bdi>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => remove.mutate()}>{t('documents.file.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
