import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { T } from '../../../.storybook/t';
import { Button } from './button';
import { SideDrawer } from './side-drawer';

// Портал: одна копия на историю (как Dialog/Sheet/Drawer). Матрица AR/EN × light/dark — четыре истории
// с глобалами locale/theme; play проверяет сторону (inline-end), dir, подпись крестика и прокрутку тела.
const meta = { title: 'shared/ui/SideDrawer', component: SideDrawer } satisfies Meta<typeof SideDrawer>;
export default meta;
type Story = StoryObj<typeof meta>;

function Demo({ initialOpen = true }: { initialOpen?: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(initialOpen);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <T k="nav.more" />
      </Button>
      <SideDrawer open={open} onOpenChange={setOpen} title={t('nav.more')} description={t('support.cta.question')} closeLabel={t('common.close')}>
        {/* Содержимое выше окна — тело должно прокручиваться, а не растягивать панель. */}
        <div className="h-svh rounded-lg border bg-muted" />
      </SideDrawer>
    </>
  );
}

const findPanel = () =>
  waitFor(
    () => {
      const el = document.querySelector<HTMLElement>('[data-slot="side-drawer-content"]');
      if (!el) throw new Error('panel not open');
      return el;
    },
    { timeout: 5000 },
  );

async function checkPanel(en: boolean, panel: HTMLElement) {
  await expect(panel).toHaveAttribute('role', 'dialog');
  await expect(panel).toHaveAttribute('dir', en ? 'ltr' : 'rtl');
  await expect(panel.getAttribute('data-mode')).toMatch(/^(drawer|sheet)$/);
  // Край inline-end (LTR — справа, RTL — слева); ждём конца анимации въезда.
  await waitFor(() => {
    const rect = panel.getBoundingClientRect();
    const edge = en ? Math.round(rect.right) === window.innerWidth : Math.round(rect.left) === 0;
    if (!edge) throw new Error('panel not at inline-end edge');
  });
  const close = within(panel).getByRole('button', { name: en ? 'Close' : 'إغلاق' });
  await waitFor(() => expect(close).toBeVisible());
  // Ширина ≤ max-w-xl (36rem) на десктопе, высота — всё окно.
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  await expect(panel.getBoundingClientRect().width).toBeLessThanOrEqual(36 * rem + 1);
  await expect(Math.round(panel.getBoundingClientRect().height)).toBe(window.innerHeight);
  const body = panel.querySelector<HTMLElement>('[data-slot="side-drawer-body"]');
  await expect(body).not.toBeNull();
  await expect(body!.scrollHeight).toBeGreaterThan(body!.clientHeight);
}

const story = (locale: 'ar' | 'en', theme: 'light' | 'dark'): Story => ({
  globals: { locale, theme, viewport: { value: 'desktop1280', isRotated: false } },
  args: { open: true, onOpenChange: () => {}, title: '', closeLabel: '' },
  render: () => <Demo />,
  play: async () => {
    // Открыта до загрузки vaul (первая история) — Sheet, иначе Drawer; проверки одинаковы для обоих.
    await checkPanel(locale === 'en', await findPanel());
  },
});

export const ArLight = story('ar', 'light');
export const EnLight = story('en', 'light');
export const ArDark = story('ar', 'dark');
export const EnDark = story('en', 'dark');

/** Открытие после загрузки vaul (как на экране: панель смонтирована закрытой) — режим Drawer, direction по языку. */
export const OpensAsDrawer: Story = {
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
  args: { open: false, onOpenChange: () => {}, title: '', closeLabel: '' },
  render: () => <Demo initialOpen={false} />,
  play: async ({ canvasElement, globals }) => {
    const en = globals.locale === 'en';
    await import('./drawer');
    // Даём эффекту useDrawerModule применить загруженный модуль.
    await waitFor(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    await userEvent.click(within(canvasElement).getByRole('button'));
    const panel = await findPanel();
    await expect(panel).toHaveAttribute('data-mode', 'drawer');
    await expect(panel).toHaveAttribute('data-vaul-drawer-direction', en ? 'right' : 'left');
    await checkPanel(en, panel);
  },
};
