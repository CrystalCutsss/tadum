import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { T } from '../../../.storybook/t';

const meta = { title: 'shared/ui/Typography' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

// Проверка блока 4a: оба семейства загружены и арабский не падает в системный шрифт (§3.2).
export const Fonts: Story = {
  globals: { locale: 'ar' },
  render: () => (
    <div className="space-y-2">
      <h2 className="text-2xl font-semibold">
        <T k="nav.documents" />
      </h2>
      <p>
        <T k="common.storage_unavailable" />
      </p>
      <p lang="en">Your documents · SAR 150,000</p>
    </div>
  ),
  play: async () => {
    await document.fonts.load('16px "IBM Plex Sans Arabic"', 'تدوم');
    await document.fonts.load('16px "Geist Variable"', 'Tadum');
    await expect(document.fonts.check('16px "IBM Plex Sans Arabic"', 'تدوم')).toBe(true);
    await expect(document.fonts.check('16px "Geist Variable"', 'Tadum')).toBe(true);
    await expect(getComputedStyle(document.body).fontFamily).toContain('IBM Plex Sans Arabic');
  },
};
