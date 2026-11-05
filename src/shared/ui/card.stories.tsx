import type { Meta, StoryObj } from '@storybook/react-vite';

import { T } from '../../../.storybook/t';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

const meta = { title: 'shared/ui/Card', component: Card } satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>
          <T k="nav.documents" />
        </CardTitle>
        <CardDescription>
          <T k="common.offline_action_hint" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <T k="support.cta.question" />
      </CardContent>
      <CardFooter>
        <Button>
          <T k="common.retry" />
        </Button>
      </CardFooter>
    </Card>
  ),
};
