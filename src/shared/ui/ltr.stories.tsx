import type { Meta, StoryObj } from '@storybook/react-vite';

import { T } from '../../../.storybook/t';
import { Ltr } from './ltr';

const meta = { title: 'shared/ui/Ltr', component: Ltr } satisfies Meta<typeof Ltr>;
export default meta;
type Story = StoryObj<typeof meta>;

// Телефон, IBAN и URL внутри арабского текста не переворачиваются.
export const InText: Story = {
  args: { children: null },
  render: () => (
    <p>
      <T k="support.cta.question" /> <Ltr>+966 50 123 4567</Ltr> · <Ltr>SA03 8000 0000 6080 1016 7519</Ltr> · <Ltr>info@tadum.sa</Ltr>
    </p>
  ),
};
