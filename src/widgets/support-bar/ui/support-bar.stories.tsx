// SupportBar: WhatsApp (wa.me, готовый текст на языке интерфейса) и e-mail.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { matrix } from '../../../../.storybook/decorators';

import { SupportBar } from './support-bar';

const meta = { title: 'widgets/SupportBar', component: SupportBar, ...matrix } satisfies Meta<typeof SupportBar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const [whatsapp] = within(canvasElement).getAllByRole('link', { name: /WhatsApp|واتساب/ });
    await expect(whatsapp).toHaveAttribute('href', 'https://wa.me/966579768881');
    await expect(within(canvasElement).getAllByRole('link', { name: /Email|البريد/ })[0]).toHaveAttribute('href', 'mailto:info@tadum.sa');
  },
};

export const WithPrefill: Story = {
  name: 'С готовым текстом (SC-05)',
  args: { prefill: { key: 'under_review', company: 'Danah Medical Supplies' }, status: 'under_review', context: 'under_review' },
  play: async ({ canvasElement }) => {
    const [whatsapp] = within(canvasElement).getAllByRole('link', { name: /WhatsApp|واتساب/ });
    await expect(whatsapp!.getAttribute('href')).toContain('?text=');
  },
};
