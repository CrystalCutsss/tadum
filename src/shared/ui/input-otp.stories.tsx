import type { Meta, StoryObj } from '@storybook/react-vite';

import { InputOTP, InputOTPGroup, InputOTPSlot } from './input-otp';

const meta = { title: 'shared/ui/InputOTP', component: InputOTP } satisfies Meta<typeof InputOTP>;
export default meta;
type Story = StoryObj<typeof meta>;

// Код OTP — всегда LTR, даже в арабском интерфейсе (§1.2).
const render = (value?: string) => (
  <div dir="ltr">
    <InputOTP maxLength={6} inputMode="numeric" aria-label="otp" {...(value ? { value } : {})}>
      <InputOTPGroup>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <InputOTPSlot key={i} index={i} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  </div>
);

export const Empty: Story = { args: { maxLength: 6, children: null }, render: () => render() };
export const Filled: Story = { args: { maxLength: 6, children: null }, render: () => render('123456') };
