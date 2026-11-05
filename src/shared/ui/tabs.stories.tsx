import type { Meta, StoryObj } from '@storybook/react-vite';

import { T } from '../../../.storybook/t';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

const meta = { title: 'shared/ui/Tabs', component: Tabs } satisfies Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="home" className="max-w-sm">
      <TabsList>
        <TabsTrigger value="home">
          <T k="nav.home" />
        </TabsTrigger>
        <TabsTrigger value="docs">
          <T k="nav.documents" />
        </TabsTrigger>
        <TabsTrigger value="help">
          <T k="nav.help" />
        </TabsTrigger>
      </TabsList>
      <TabsContent value="home">
        <T k="support.cta.question" />
      </TabsContent>
      <TabsContent value="docs">
        <T k="nav.documents" />
      </TabsContent>
      <TabsContent value="help">
        <T k="nav.help" />
      </TabsContent>
    </Tabs>
  ),
};
