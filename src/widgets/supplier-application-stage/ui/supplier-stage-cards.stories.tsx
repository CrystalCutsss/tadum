// Этапы экрана «Заявка» поставщика (TD-001; D-087–D-090): «Вы партнёр Tadum» со ссылкой, «Остался договор», Declined,
// Lost — каждое состояние в матрице AR/EN × light/dark, axe по всем панелям; копирование — play-тест с событием.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { matrix } from '../../../../.storybook/decorators';
import { setAnalyticsProviders, type CapturedEvent } from '@/shared/analytics';

import { ContractPendingCard, HowItWorksCard, ReferralHeroCard, SupplierInactiveCard } from './supplier-stage-cards';

const meta = {
  title: 'widgets/SupplierApplicationStage',
  ...matrix,
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const URL_ = 'https://tadum.sa/s/zahrat-al-madina';

export const Partner: Story = {
  render: () => <ReferralHeroCard url={URL_} slug="zahrat-al-madina" supplierName="Zahrat Al Madina Stationery" />,
};

/** Длинный slug переносится, а не обрезается (SP-02 A6). */
export const PartnerLongSlug: Story = {
  render: () => (
    <ReferralHeroCard
      url="https://tadum.sa/s/mu2assasat-al-noor-li-tijarat-al-adawat-al-maktabiya-wa-al-qirtasiya"
      slug="mu2assasat-al-noor-li-tijarat-al-adawat-al-maktabiya-wa-al-qirtasiya"
      supplierName="مؤسسة النور لتجارة الأدوات المكتبية والقرطاسية"
    />
  ),
};

/** Копирование: Clipboard API → тост «Скопировано» и событие referral_link_copied {source: referral, method: clipboard}. */
export const PartnerCopy: Story = {
  render: () => <ReferralHeroCard url={URL_} slug="zahrat-al-madina" supplierName="Zahrat Al Madina Stationery" />,
  loaders: [
    () => {
      const events: CapturedEvent[] = [];
      const restore = setAnalyticsProviders([{ capture: (e) => events.push(e) }]);
      return { events, restore };
    },
  ],
  play: async ({ canvasElement, loaded }) => {
    const { events, restore } = loaded as {
      events: CapturedEvent[];
      restore: () => void;
    };
    const writeText = fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const panel = canvasElement.querySelector<HTMLElement>('[data-matrix]')!;
    const button = within(panel).getAllByRole('button')[0]!;
    await userEvent.click(button);
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(URL_));
    await expect(events.filter((e) => e.name === 'referral_link_copied').map((e) => e.props)).toEqual([{ source: 'referral', method: 'clipboard' }]);
    restore();
  },
};

export const ContractPending: Story = { render: () => <ContractPendingCard /> };
export const HowItWorks: Story = { render: () => <HowItWorksCard /> };
export const Declined: Story = {
  render: () => <SupplierInactiveCard kind="declined" />,
};
export const Paused: Story = {
  render: () => <SupplierInactiveCard kind="paused" />,
};
