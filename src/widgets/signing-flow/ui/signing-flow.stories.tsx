// Сценарий подписания (SC-06, D-085): договор SPA в Sadq и вексель в Nafith по ссылкам из SMS — одинаковый интерфейс
// (Кирилл 2026-11-19), матрица AR/EN × light/dark, axe по четырём панелям; скачивание копии и «не получилось» — в play.
import type { ParseKeys } from 'i18next';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { matrix, withRouter } from '../../../../.storybook/decorators';
import type { ChecklistItem, Limit } from '@/entities/limit';
import { setAnalyticsProviders, type CapturedEvent } from '@/shared/analytics';
import { createI18n } from '@/shared/i18n';

import { SigningFlow } from './signing-flow';

const meta = {
  title: 'widgets/SigningFlow',
  ...matrix,
  decorators: [...matrix.decorators, withRouter('/c/documents/sign')],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function panels(canvasElement: HTMLElement) {
  return Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-matrix]')).map((el) => {
    const lang = el.getAttribute('lang') === 'en' ? 'en' : 'ar';
    const i18n = createI18n(lang);
    return { el, c: within(el), t: (key: ParseKeys, values?: Record<string, unknown>): string => i18n.t(key, values ?? {}) };
  });
}

/** Карточки документов панели (без вложенных шагов инструкции). */
const steps = (el: HTMLElement) => Array.from(el.querySelectorAll<HTMLElement>('ol[aria-label] > li'));

function eventsLoader() {
  const events: CapturedEvent[] = [];
  const restore = setAnalyticsProviders([{ capture: (e) => events.push(e) }]);
  return { events, restore };
}
type Captured = { events: CapturedEvent[]; restore: () => void };

const checklist = (spa: ChecklistItem['status'], pn: ChecklistItem['status']): Pick<Limit, 'checklist'> => ({
  checklist: {
    items: [
      { key: 'spa', status: spa, document_url: '/demo/spa.pdf' },
      { key: 'pn_nafith', status: pn, document_url: '/demo/pn.pdf' },
    ],
    completed: spa === 'done' && pn === 'done',
  },
});

export const BothPending: Story = {
  name: 'Оба документа ждут подписи: серые бейджи, инструкции про SMS без кнопок',
  render: () => <SigningFlow limit={checklist('pending', 'pending')} />,
  play: async ({ canvasElement }) => {
    for (const { el, t } of panels(canvasElement)) {
      const [spa, pn] = steps(el);
      for (const [step, doc] of [
        [spa!, 'spa'],
        [pn!, 'pn'],
      ] as const) {
        await expect(step).toHaveTextContent(t('signing.status_required'));
        await expect(within(step).getByText(t(`signing.${doc}.body`))).toBeVisible();
        await expect(within(step).getByText(t(`signing.${doc}.step_sms`))).toBeVisible();
        await expect(within(step).getByText(t(`signing.${doc}.step_sign`))).toBeVisible();
        // До подписи кнопок нет — ни скачивания, ни перехода в Nafith (Кирилл 2026-11-19).
        await expect(within(step).queryAllByRole('link')).toHaveLength(0);
        await expect(within(step).queryAllByRole('button')).toHaveLength(0);
      }
    }
  },
};

export const SpaSignedPnPending: Story = {
  name: 'Договор подписан: зелёный бейдж и «Download»; вексель ждёт подписи',
  loaders: [() => ({ captured: eventsLoader() })],
  render: () => <SigningFlow limit={checklist('done', 'pending')} />,
  play: async ({ canvasElement, loaded }) => {
    const { events, restore } = (loaded as { captured: Captured }).captured;
    const block = (e: Event) => e.preventDefault();
    canvasElement.addEventListener('click', block, true);
    try {
      for (const { el, t } of panels(canvasElement)) {
        const [spa, pn] = steps(el);
        await expect(spa).toHaveTextContent(t('signing.status_signed'));
        await expect(spa).toHaveTextContent(t('signing.spa.signed_body'));
        await expect(within(spa!).queryByText(t('signing.spa.step_sms'))).toBeNull();
        const download = within(spa!).getByRole('link', { name: t('signing.download') });
        await expect(download).toHaveAttribute('href', '/demo/spa.pdf');
        // Кнопка нейтральная, не основная синяя.
        await expect(download).toHaveAttribute('data-variant', 'secondary');
        await expect(pn).toHaveTextContent(t('signing.status_required'));
      }
      const [first] = panels(canvasElement);
      await userEvent.click(within(steps(first!.el)[0]!).getByRole('link', { name: first!.t('signing.download') }));
      await expect(events.map((e) => e.name)).toEqual(['spa_downloaded']);
    } finally {
      canvasElement.removeEventListener('click', block, true);
      restore();
    }
  },
};

export const PnSigned: Story = {
  name: 'Вексель подписан раньше договора: зелёный бейдж, «Download» копии векселя и pn_downloaded',
  loaders: [() => ({ captured: eventsLoader() })],
  render: () => <SigningFlow limit={checklist('pending', 'done')} />,
  play: async ({ canvasElement, loaded }) => {
    const { events, restore } = (loaded as { captured: Captured }).captured;
    const block = (e: Event) => e.preventDefault();
    canvasElement.addEventListener('click', block, true);
    try {
      for (const { el, t } of panels(canvasElement)) {
        const [spa, pn] = steps(el);
        await expect(spa).toHaveTextContent(t('signing.status_required'));
        await expect(pn).toHaveTextContent(t('signing.status_signed'));
        await expect(pn).toHaveTextContent(t('signing.pn.signed_body'));
        await expect(within(pn!).getByRole('link', { name: t('signing.download') })).toHaveAttribute('href', '/demo/pn.pdf');
      }
      const [first] = panels(canvasElement);
      await userEvent.click(within(steps(first!.el)[1]!).getByRole('link', { name: first!.t('signing.download') }));
      await expect(events.map((e) => e.name)).toEqual(['pn_downloaded']);
    } finally {
      canvasElement.removeEventListener('click', block, true);
      restore();
    }
  },
};

export const PnFailed: Story = {
  name: 'Вексель не подтвердился — нейтральный текст и checklist_item_failed_viewed',
  loaders: [() => ({ captured: eventsLoader() })],
  render: () => <SigningFlow limit={checklist('done', 'failed')} />,
  play: async ({ canvasElement, loaded }) => {
    const { events, restore } = (loaded as { captured: Captured }).captured;
    try {
      for (const { el, t } of panels(canvasElement)) {
        const pn = steps(el)[1]!;
        await expect(pn).toHaveTextContent(t('checklist.status.failed'));
        await expect(within(pn).getByText(t('checklist.item_failed'))).toBeVisible();
      }
      await expect(events.filter((e) => e.name === 'checklist_item_failed_viewed').map((e) => e.props)).toEqual(Array(4).fill({ item: 'pn_nafith' }));
    } finally {
      restore();
    }
  },
};
