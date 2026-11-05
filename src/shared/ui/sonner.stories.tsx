import type { Meta, StoryObj } from '@storybook/react-vite';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { T } from '../../../.storybook/t';
import { Button } from './button';
import { Toaster } from './sonner';

const meta = { title: 'shared/ui/Toaster', component: Toaster } satisfies Meta<typeof Toaster>;
export default meta;
type Story = StoryObj<typeof meta>;

function Demo() {
  const { t } = useTranslation();
  return (
    <>
      <Button onClick={() => toast(t('common.copy_link'))}>
        <T k="common.copy_link" />
      </Button>
      <Toaster />
    </>
  );
}

export const Default: Story = { render: () => <Demo /> };
