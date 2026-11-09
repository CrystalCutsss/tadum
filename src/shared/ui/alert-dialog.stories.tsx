import type { Meta, StoryObj } from '@storybook/react-vite';

import { T } from '../../../.storybook/t';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog';

// Портал модального окна: одна копия на историю (как Dialog/Sheet), язык и тема — из глобалов тулбара.
const meta = { title: 'shared/ui/AlertDialog', component: AlertDialog } satisfies Meta<typeof AlertDialog>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  render: () => (
    <AlertDialog defaultOpen>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <T k="help.logout_confirm" />
          </AlertDialogTitle>
          <AlertDialogDescription>
            <T k="help.logout_hint" />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <T k="common.cancel" />
          </AlertDialogCancel>
          <AlertDialogAction variant="destructive">
            <T k="help.logout" />
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};
