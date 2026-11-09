import type { Meta, StoryObj } from '@storybook/react-vite';
import { useTranslation } from 'react-i18next';
import { expect, within } from 'storybook/test';

import { T } from '../../../.storybook/t';
import { Button } from './button';
import {
  ResponsiveDialog,
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
