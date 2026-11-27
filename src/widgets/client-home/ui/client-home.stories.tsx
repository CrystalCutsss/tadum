// Блоки главной активного клиента (бриф TD-002 §4): «Как оформить покупку» (раскрыт, свёрнут, длинный арабский текст),
// карточка первого визита, боковой блок — в матрице AR/EN × light/dark.
import type { ParseKeys } from 'i18next';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { matrix, withRouter } from '../../../../.storybook/decorators';
import { setAnalyticsProviders, type CapturedEvent } from '@/shared/analytics';
import { createI18n } from '@/shared/i18n';
import { storage } from '@/shared/lib';

import { HomeAside } from './home-aside';
import { HowToBuy } from './how-to-buy';
import { WelcomeCard } from './welcome-card';

const meta = { title: 'widgets/ClientHome', decorators: [withRouter('/c/home'), ...matrix.decorators], parameters: matrix.parameters } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function panels(canvasElement: HTMLElement) {
  return Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-matrix]')).map((el) => {
    const i18n = createI18n(el.getAttribute('lang') === 'en' ? 'en' : 'ar');
    return { el, c: within(el), t: (key: ParseKeys): string => i18n.t(key) };
  });
}
function capture() {
  const events: CapturedEvent[] = [];
  const restore = setAnalyticsProviders([{ capture: (e) => events.push(e) }]);
  return { events, restore };
}

export const HowToBuyOpen: Story = {
  name: 'HowToBuy — три шага и «Скрыть»',
  loaders: [() => storage.remove('home:how_to_buy_collapsed')],
  render: () => <HowToBuy />,
  play: async ({ canvasElement }) => {
    for (const { c, t } of panels(canvasElement)) {
      await expect(c.getByRole('heading', { name: t('how_to_buy.title') })).toBeVisible();
      await expect(c.getAllByRole('listitem')).toHaveLength(3);
      await expect(c.getByRole('button', { name: t('how_to_buy.hide') })).toHaveAttribute('aria-expanded', 'true');
      // Своей кнопки WhatsApp в блоке нет (D-100).
      await expect(c.queryByRole('link')).toBeNull();
    }
  },
};

export const HowToBuyToggle: Story = {
  name: 'HowToBuy — свернуть и развернуть, состояние запоминается',
  loaders: [() => ({ captured: (storage.remove('home:how_to_buy_collapsed'), capture()) })],
  render: () => <HowToBuy />,
  play: async ({ canvasElement, loaded }) => {
    const { events, restore } = (loaded as { captured: ReturnType<typeof capture> }).captured;
    try {
      const { c, t } = panels(canvasElement)[0]!;
      await userEvent.click(c.getByRole('button', { name: t('how_to_buy.hide') }));
      await waitFor(() => expect(c.queryAllByRole('listitem')).toHaveLength(0));
      await expect(storage.get('home:how_to_buy_collapsed')).toBe('1');
      const show = c.getByRole('button', { name: t('how_to_buy.show') });
      await expect(show).toHaveAttribute('aria-expanded', 'false');
      await userEvent.click(show);
      await waitFor(() => expect(c.getAllByRole('listitem')).toHaveLength(3));
      await expect(storage.get('home:how_to_buy_collapsed')).toBeNull();
      await expect(events.filter((e) => e.name === 'how_to_buy_toggled').map((e) => e.props)).toEqual([{ open: false }, { open: true }]);
    } finally {
      restore();
      storage.remove('home:how_to_buy_collapsed');
    }
  },
};

export const HowToBuyCollapsed: Story = {
  name: 'HowToBuy — свёрнут: только заголовок-ссылка',
  loaders: [() => storage.set('home:how_to_buy_collapsed', '1')],
  render: () => <HowToBuy />,
  play: async ({ canvasElement }) => {
    for (const { c, t } of panels(canvasElement)) {
      await expect(c.getByRole('button', { name: t('how_to_buy.show') })).toBeVisible();
      await expect(c.queryAllByRole('listitem')).toHaveLength(0);
    }
    storage.remove('home:how_to_buy_collapsed');
  },
};

export const HowToBuyNarrow: Story = {
  name: 'HowToBuy — 360 px, длинный арабский текст переносится',
  globals: { viewport: { value: 'mobile360', isRotated: false } },
  loaders: [() => storage.remove('home:how_to_buy_collapsed')],
  render: () => (
    <div className="w-80 max-w-full">
      <HowToBuy />
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const { el } of panels(canvasElement)) {
      const section = el.querySelector<HTMLElement>('section')!;
      await expect(section.scrollWidth).toBeLessThanOrEqual(section.clientWidth);
    }
  },
};

export const Welcome: Story = {
  name: 'WelcomeCard — «Что теперь можно» и «Понятно»',
  loaders: [() => ({ captured: (storage.remove('home:welcome_dismissed:lim_story'), capture()) })],
  render: () => <WelcomeCard limitId="lim_story" />,
  play: async ({ canvasElement, loaded }) => {
    const { events, restore } = (loaded as { captured: ReturnType<typeof capture> }).captured;
    try {
      const all = panels(canvasElement);
      for (const { c, t } of all) {
        await expect(c.getByRole('heading', { name: t('home.welcome.title') })).toBeVisible();
        await expect(c.getAllByRole('listitem')).toHaveLength(3);
      }
      await expect(events.filter((e) => e.name === 'home_welcome_viewed')).toHaveLength(4);
      const { c, t } = all[0]!;
      await userEvent.click(c.getByRole('button', { name: t('home.welcome.dismiss') }));
      await expect(c.queryByRole('heading', { name: t('home.welcome.title') })).toBeNull();
      await expect(storage.get('home:welcome_dismissed:lim_story')).toBe('1');
      await expect(events.filter((e) => e.name === 'home_welcome_dismissed')).toHaveLength(1);
    } finally {
      restore();
      storage.remove('home:welcome_dismissed:lim_story');
    }
  },
};

export const Aside: Story = {
  name: 'HomeAside — «Договор и документы» ведёт в «Заявку»',
  render: () => <HomeAside support={null} />,
  play: async ({ canvasElement }) => {
    for (const { c, t } of panels(canvasElement)) {
      await expect(c.getByRole('link', { name: t('home.docs_link') })).toHaveAttribute('href', '/c/documents');
    }
  },
};
