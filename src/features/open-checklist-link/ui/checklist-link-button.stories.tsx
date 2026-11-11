// ChecklistLinkButton (SC-06): «Открыть» — событие checklist_link_opened; во встроенном браузере — «Скопировать
// ссылку» и external_link_blocked только с хостом, без пути и кода из ссылки (правило аналитики, A-063).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { matrix } from '../../../../.storybook/decorators';
import { setAnalyticsProviders, type CapturedEvent } from '@/shared/analytics';

import { ChecklistLinkButton } from './checklist-link-button';

const meta = {
  title: 'features/open-checklist-link/ChecklistLinkButton',
  component: ChecklistLinkButton,
  ...matrix,
} satisfies Meta<typeof ChecklistLinkButton>;
export default meta;
type Story = StoryObj<typeof meta>;

const item = { key: 'spa_sadq' as const, external_url: 'https://sign.example.test/s/abc123?code=secret' };

/** Ловит события и не даёт ссылке открыть вкладку (переход в тесте не нужен). */
function captureEvents(root: HTMLElement): { events: CapturedEvent[]; restore: () => void } {
  const events: CapturedEvent[] = [];
  const restoreProviders = setAnalyticsProviders([{ capture: (e) => events.push(e) }]);
  const block = (e: Event) => e.preventDefault();
  root.addEventListener('click', block, true);
  return {
    events,
    restore: () => {
      restoreProviders();
      root.removeEventListener('click', block, true);
    },
  };
}

export const Opens: Story = {
  name: 'Открыть — checklist_link_opened {item, position}',
  args: { item, position: 1, primary: true, onOpened: fn(), inAppBrowser: () => false },
  play: async ({ canvasElement, args }) => {
    const { events, restore } = captureEvents(canvasElement);
    try {
      await userEvent.click(within(canvasElement).getAllByRole('link')[0]!);
      await expect(args.onOpened).toHaveBeenCalledOnce();
      await expect(events.map((e) => [e.name, e.props])).toEqual([['checklist_link_opened', { item: 'spa_sadq', position: 1 }]]);
    } finally {
      restore();
    }
  },
};

export const InAppBrowser: Story = {
  name: 'Встроенный браузер — «Скопировать ссылку», external_link_blocked только с хостом',
  args: { item, position: 1, primary: true, onOpened: fn(), inAppBrowser: () => true },
  play: async ({ canvasElement, args }) => {
    const { events, restore } = captureEvents(canvasElement);
    try {
      await userEvent.click(within(canvasElement).getAllByRole('link')[0]!);
      await expect(args.onOpened).not.toHaveBeenCalled();
      await expect(within(canvasElement).getAllByRole('button')).toHaveLength(1);
      await expect(events.map((e) => [e.name, e.props])).toEqual([['external_link_blocked', { item: 'spa_sadq', href_host: 'sign.example.test' }]]);
    } finally {
      restore();
    }
  },
};
