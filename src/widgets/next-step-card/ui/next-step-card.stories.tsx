// NextStepCard для каждого client_status (01-cabinet-structure.md §6) × AR/EN × light/dark.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { matrix, withRouter } from '../../../../.storybook/decorators';
import { clientNextStep, type ClientNextStepInput } from '@/entities/application';
import type { Document } from '@/shared/api';

import { NextStepCard } from './next-step-card';

const doc = (status: Document['status'], files = status === 'pending' ? 0 : 1) => ({ status, required: true, files: Array.from({ length: files }) }) as unknown as Document;
const base: Omit<ClientNextStepInput, 'client_status'> = { document_set: null, limit: null, landing_url: 'https://tadum.sa' };
const step = (input: Partial<ClientNextStepInput> & Pick<ClientNextStepInput, 'client_status'>) => clientNextStep({ ...base, ...input });

const meta = {
  title: 'widgets/NextStepCard',
  component: NextStepCard,
  ...matrix,
  // Роутер — внутри матрицы: у каждой панели своя ссылка.
  decorators: [withRouter('/c/home'), ...matrix.decorators],
} satisfies Meta<typeof NextStepCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const UploadDocuments: Story = {
  name: 'docs_required — загрузить',
  args: { step: step({ client_status: 'docs_required', document_set: { round: 1, documents: [doc('pending'), doc('pending'), doc('received')] } }) },
};
export const ReuploadRejected: Story = {
  name: 'docs_required — отклонённые',
  args: { step: step({ client_status: 'docs_required', document_set: { round: 1, documents: [doc('rejected'), doc('received')] } }) },
};
export const MoreDocsRequested: Story = {
  name: 'docs_required — дозапрос',
  args: { step: step({ client_status: 'docs_required', document_set: { round: 2, documents: [doc('pending'), doc('pending')] } }) },
};
export const SubmitReady: Story = {
  name: 'docs_required — всё загружено',
  args: { step: step({ client_status: 'docs_required', document_set: { round: 1, documents: [doc('received')] } }) },
};
export const UnderReview: Story = {
  name: 'under_review — без срока (A1)',
  args: { step: step({ client_status: 'under_review' }) },
  play: async ({ canvasElement }) => {
    // Шаг на стороне Tadum — без CTA.
    await expect(within(canvasElement).queryAllByRole('link')).toHaveLength(0);
  },
};
export const UnderReviewEta: Story = { name: 'under_review — срок из данных (A2)', args: { step: step({ client_status: 'under_review', review_eta_hours: 24 }) } };
export const UnderReviewOverdue: Story = { name: 'under_review — дольше обычного (A3)', args: { step: step({ client_status: 'under_review', review_eta_hours: 24 }), overdue: true } };
export const OfferConfirmation: Story = { name: 'approved — согласование условий', args: { step: step({ client_status: 'approved' }) } };
export const SignDocuments: Story = {
  name: 'approved — подписать',
  args: { step: step({ client_status: 'approved', limit: { status: 'ready', checklist: { completed: false, items: [] } } }) },
};
export const HowToBuy: Story = {
  name: 'approved — лимит active',
  args: { step: step({ client_status: 'approved', limit: { status: 'active', checklist: { completed: true, items: [] } } }) },
};
export const FirstPurchase: Story = { args: { step: step({ client_status: 'first_purchase' }) } };
export const Closed: Story = { args: { step: step({ client_status: 'closed' }) } };
