import type { Meta, StoryObj } from '@storybook/react-vite';

import { T } from '../../../.storybook/t';
import { Ltr } from './ltr';
import { StatusBadge } from './status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

const meta = { title: 'shared/ui/Table', component: Table } satisfies Meta<typeof Table>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <T k="nav.clients" />
          </TableHead>
          <TableHead>
            <T k="nav.documents" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>
            <Ltr>+966 50 123 4567</Ltr>
          </TableCell>
          <TableCell>
            <StatusBadge kind="supplier_view" status="under_review" />
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <Ltr>+966 55 765 4321</Ltr>
          </TableCell>
          <TableCell>
            <StatusBadge kind="supplier_view" status="closed" />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};
