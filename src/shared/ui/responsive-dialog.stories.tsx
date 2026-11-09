import type { Meta, StoryObj } from '@storybook/react-vite';
import { useTranslation } from 'react-i18next';
import { expect, within } from 'storybook/test';

import { T } from '../../../.storybook/t';
import { Button } from './button';
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from './responsive-dialog';

// Портал: одна копия на историю (как Dialog/Sheet), язык и тема — из глобалов тулбара.
// Режим (Drawer < md, Dialog ≥ md) выбирает useIsMobile по ширине окна.
const meta = { title: 'shared/ui/ResponsiveDialog', component: ResponsiveDialog } satisfies Meta<typeof ResponsiveDialog>;
export default meta;
type Story = StoryObj<typeof meta>;

function Demo() {
  const { t } = useTranslation();
  return (
    <ResponsiveDialog defaultOpen>
      <ResponsiveDialogTrigger asChild>
        <Button>
          <T k="nav.more" />
        </Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent closeLabel={t('common.close')}>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            <T k="nav.more" />
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            <T k="support.cta.question" />
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogFooter>
          <ResponsiveDialogClose asChild>
            <Button variant="outline">
              <T k="common.cancel" />
            </Button>
          </ResponsiveDialogClose>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

export const Open: Story = {
  render: () => <Demo />,
  play: async ({ globals }) => {
    const en = globals.locale === 'en';
    const dialog = await within(document.body).findByRole('dialog');
    await expect(dialog).toHaveAttribute('dir', en ? 'ltr' : 'rtl');
    await expect(dialog.getAttribute('data-mode')).toMatch(/^(dialog|drawer)$/);
    // Кнопка закрытия — с подписью из closeLabel (i18n), без хардкода.
    const close = dialog.querySelector('button[aria-label]');
    await expect(close?.getAttribute('aria-label')).toBe(en ? 'Close' : 'إغلاق');
  },
};

/**
 * size="tall" на телефоне (Кирилл 2026-11-09): Drawer почти на всю высоту окна, шапка фиксирована,
 * ResponsiveDialogBody растягивается и прокручивается (просмотр примера документа).
 */
export const Tall: Story = {
  globals: { viewport: { value: 'mobile360', isRotated: false } },
  render: function TallDemo() {
    const { t } = useTranslation();
    return (
      <ResponsiveDialog defaultOpen>
        <ResponsiveDialogContent closeLabel={t('common.close')} size="tall">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              <T k="nav.more" />
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              <T k="support.cta.question" />
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody>
            {/* Содержимое выше окна — тело должно прокручиваться, а не растягивать Drawer. */}
            <div className="h-svh rounded-lg border bg-muted" />
          </ResponsiveDialogBody>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    );
  },
  play: async ({ globals }) => {
    const en = globals.locale === 'en';
    const dialog = await within(document.body).findByRole('dialog');
    await expect(dialog.getAttribute('data-mode')).toBe('drawer');
    await expect(dialog).toHaveAttribute('data-size', 'tall');
    await expect(dialog).toHaveAttribute('dir', en ? 'ltr' : 'rtl');
    // Окно выше 80% вьюпорта (прежний предел пресета) и не выходит за него.
    const height = dialog.getBoundingClientRect().height;
    await expect(height).toBeGreaterThan(window.innerHeight * 0.8);
    await expect(height).toBeLessThanOrEqual(window.innerHeight);
    // Тело прокручивается внутри окна.
    const body = dialog.querySelector<HTMLElement>('[data-slot="responsive-dialog-body"]');
    await expect(body).not.toBeNull();
    await expect(body!.scrollHeight).toBeGreaterThan(body!.clientHeight);
  },
};

/** Телефон (< md): режим Drawer, кнопка-крестик видна и закрывает окно (Кирилл 2026-11-09). */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile360', isRotated: false } },
  render: () => <Demo />,
  play: async ({ globals }) => {
    const en = globals.locale === 'en';
    const dialog = await within(document.body).findByRole('dialog');
    await expect(dialog.getAttribute('data-mode')).toBe('drawer');
    await expect(dialog).toHaveAttribute('dir', en ? 'ltr' : 'rtl');
    const close = within(dialog).getByRole('button', { name: en ? 'Close' : 'إغلاق' });
    await expect(close).toBeVisible();
  },
};
