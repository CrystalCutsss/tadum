import type { Meta, StoryObj } from '@storybook/react-vite';
import { RiFileTextLine } from '@remixicon/react';

import { matrix } from '../../../.storybook/decorators';
import { T } from '../../../.storybook/t';
import { Button } from './button';
import { Icon } from './icon/icon';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from './item';

const meta = { title: 'shared/ui/Item', component: Item, ...matrix } satisfies Meta<typeof Item>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Outline: Story = {
  render: () => (
    <ItemGroup>
      <Item variant="outline" role="listitem">
        <ItemMedia variant="icon">
          <Icon icon={RiFileTextLine} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>
            <T k="nav.documents" />
          </ItemTitle>
          <ItemDescription>
            <T k="document.status.pending" />
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="sm" variant="outline">
            <T k="home.documents_view" />
          </Button>
        </ItemActions>
      </Item>
    </ItemGroup>
  ),
};
