import type { Meta, StoryObj } from '@storybook/react-vite';
import { useTranslation } from 'react-i18next';
import { expect } from 'storybook/test';

import { matrix } from '../../../.storybook/decorators';

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './breadcrumb';

const meta = { title: 'shared/ui/Breadcrumb', ...matrix } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Trail({ ellipsis = false }: { ellipsis?: boolean }) {
  const { t } = useTranslation();
  return (
    <Breadcrumb aria-label={t('nav.breadcrumb')}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{t('nav.home')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {ellipsis && (
          <>
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}
        <BreadcrumbItem>
          <BreadcrumbPage>{t('nav.documents')}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/**
 * Разделитель-шеврон через Icon: в AR зеркалится, в EN — нет.
 * globals.locale = en: вариант Tailwind rtl: учитывает и <html dir>, поэтому при html dir=rtl
 * EN-панель матрицы тоже зеркалилась бы (артефакт матрицы; в приложении dir один на документ).
 */
export const Default: Story = {
  globals: { locale: 'en' },
  render: () => <Trail />,
  play: async ({ canvasElement }) => {
    const chevron = (combo: string) =>
      canvasElement.querySelector(`[data-matrix="${combo}"] [data-slot="breadcrumb-separator"] svg`)!;
    await expect(getComputedStyle(chevron('ar light')).scale).toBe('-1 1');
    await expect(getComputedStyle(chevron('en light')).scale).toBe('none');
    await expect(canvasElement.querySelector('[data-matrix="en light"] nav')?.getAttribute('aria-label')).toBeTruthy();
  },
};

export const WithEllipsis: Story = { render: () => <Trail ellipsis /> };
