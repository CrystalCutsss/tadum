// LanguageSwitch (SC-10 §1.1, A6): в арабском интерфейсе — «English», в английском — «العربية».
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { matrix } from '../../../../.storybook/decorators';

import { LanguageSwitch } from './language-switch';

const meta = { title: 'widgets/LanguageSwitch', component: LanguageSwitch, ...matrix } satisfies Meta<typeof LanguageSwitch>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const ar = within(canvasElement.querySelector('[data-matrix="ar light"]')!);
    const en = within(canvasElement.querySelector('[data-matrix="en light"]')!);
    await expect(ar.getByRole('button', { name: 'English' })).toHaveAttribute('lang', 'en');
    await expect(en.getByRole('button', { name: 'العربية' })).toHaveAttribute('lang', 'ar');
  },
};
