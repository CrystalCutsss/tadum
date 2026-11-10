import {
  RiCheckboxCircleLine,
  RiCheckLine,
  RiCloseCircleLine,
  RiErrorWarningLine,
  RiSendPlane2Line,
  type RemixiconComponentType,
} from '@remixicon/react';
import { cn } from 'cn';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import {
  RiFolderOpenLine,
  RiHourglassLine,
  RiShoppingBag3Line,
  RiUploadCloud2Line,
} from './icon/document-icons';
import { Icon } from './icon/icon';

// Бейдж статуса. Статусы различимы иконкой и текстом, не только цветом (WCAG 1.4.1).
// Цвета — семантические токены --status-* (tokens.css): closed у поставщика — нейтральный, не rejected.

export type DocumentStatus = 'pending' | 'received' | 'rejected' | 'approved';
export type SupplierViewStatus = 'applied' | 'collecting_docs' | 'under_review' | 'approved' | 'first_purchase' | 'closed';

type Tone = 'pending' | 'received' | 'rejected' | 'approved' | 'neutral';

const TONE_CLASS: Record<Tone, string> = {
  pending: 'bg-status-pending-muted text-status-pending',
  received: 'bg-status-received-muted text-status-received',
  rejected: 'bg-status-rejected-muted text-status-rejected',
  approved: 'bg-status-approved-muted text-status-approved',
  neutral: 'bg-muted text-muted-foreground',
};

type Meta = { tone: Tone; icon: RemixiconComponentType; label: () => string };

// Ключи i18n — явными строками, чтобы их видел i18next-cli.
const documentMeta = (t: TFunction): Record<DocumentStatus, Meta> => ({
  pending: { tone: 'pending', icon: RiUploadCloud2Line, label: () => t('document.status.pending') },
  received: { tone: 'received', icon: RiCheckLine, label: () => t('document.status.received') },
  rejected: { tone: 'rejected', icon: RiErrorWarningLine, label: () => t('document.status.rejected') },
  approved: { tone: 'approved', icon: RiCheckboxCircleLine, label: () => t('document.status.approved') },
});

const supplierViewMeta = (t: TFunction): Record<SupplierViewStatus, Meta> => ({
  applied: { tone: 'pending', icon: RiSendPlane2Line, label: () => t('status.supplier_view.applied') },
  collecting_docs: { tone: 'pending', icon: RiFolderOpenLine, label: () => t('status.supplier_view.collecting_docs') },
  under_review: { tone: 'received', icon: RiHourglassLine, label: () => t('status.supplier_view.under_review') },
  approved: { tone: 'approved', icon: RiCheckboxCircleLine, label: () => t('status.supplier_view.approved') },
  first_purchase: { tone: 'approved', icon: RiShoppingBag3Line, label: () => t('status.supplier_view.first_purchase') },
  closed: { tone: 'neutral', icon: RiCloseCircleLine, label: () => t('status.supplier_view.closed') },
});

export type StatusBadgeProps =
  | { kind: 'document'; status: DocumentStatus; className?: string }
  | { kind: 'supplier_view'; status: SupplierViewStatus; className?: string };

export function StatusBadge(props: StatusBadgeProps) {
  const { t } = useTranslation();
  const { tone, icon, label } = props.kind === 'document' ? documentMeta(t)[props.status] : supplierViewMeta(t)[props.status];
  return (
    <span
      data-slot="status-badge"
      data-status={props.status}
      className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium', TONE_CLASS[tone], props.className)}
    >
      <Icon icon={icon} className="size-4" />
      {label()}
    </span>
  );
}
