import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { T } from '../../../.storybook/t';
import { Button } from './button';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from './drawer';

// Портал: одна копия на историю (как Dialog/Sheet), язык и тема — из глобалов тулбара.
const meta = { title: 'shared/ui/Drawer', component: Drawer } satisfies Meta<typeof Drawer>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Снизу; dir контента — из Direction.Provider (AR — rtl). */
export const Bottom: Story = {
  render: () => (
    <Drawer defaultOpen>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            <T k="nav.more" />
          </DrawerTitle>
          <DrawerDescription>
            <T k="support.cta.question" />
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">
              <T k="common.cancel" />
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
  play: async ({ globals }) => {
    const dialog = await within(document.body).findByRole('dialog');
    await expect(dialog).toHaveAttribute('dir', globals.locale === 'en' ? 'ltr' : 'rtl');
  },
};
