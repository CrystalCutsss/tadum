import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { matrix } from '../../../.storybook/decorators';
import { T } from '../../../.storybook/t';

// Утилита text-fade-end (2026-11-11): однострочный текст без многоточия, последние --text-fade-length
// уходят в прозрачность к концу строки — справа в LTR, слева в RTL (имя компании в кнопке аккаунта сайдбара).
const meta = { title: 'shared/ui/TextFade', ...matrix } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const FadeEnd: Story = {
  render: () => (
    <div className="grid w-48 gap-1">
      <span data-testid="fade" className="text-fade-end text-sm font-medium">
        <T k="documents.submit.ready_body" />
      </span>
      <span className="text-fade-end text-xs">
        <T k="documents.submit.cta" />
      </span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const fadeIn = (lang: string) =>
      canvasElement.querySelector<HTMLElement>(`[data-matrix^="${lang}"] [data-testid="fade"]`)!;
    for (const lang of ['ar', 'en']) {
      const el = fadeIn(lang);
      const style = getComputedStyle(el);
      await expect(style.whiteSpace).toBe('nowrap');
      await expect(style.overflow).toBe('hidden');
      // Текст длиннее строки — переполняет, а не переносится.
      await expect(el.scrollWidth).toBeGreaterThan(el.clientWidth);
    }
    // Затухание — к концу строки: в EN вправо, в AR влево.
    await expect(getComputedStyle(fadeIn('en')).maskImage).toContain('to right');
    await expect(getComputedStyle(fadeIn('ar')).maskImage).toContain('to left');
  },
};
