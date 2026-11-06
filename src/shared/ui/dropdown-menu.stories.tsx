import type { Meta, StoryObj } from '@storybook/react-vite';
import { useLayoutEffect, useRef, useState } from 'react';
import { expect, waitFor } from 'storybook/test';

import { matrix } from '../../../.storybook/decorators';
import { T } from '../../../.storybook/t';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';

const meta = { title: 'shared/ui/DropdownMenu', component: DropdownMenu } satisfies Meta<typeof DropdownMenu>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  render: () => (
    <DropdownMenu defaultOpen modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <T k="nav.more" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          <T k="nav.more" />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <T k="nav.offer" />
        </DropdownMenuItem>
        <DropdownMenuItem>
          <T k="nav.help" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

/**
 * Меню уходит в портал (body) и не наследует тему и язык панели матрицы. Только для истории:
 * читаем ближайшую панель [data-matrix] и повторяем её тему (.dark) и lang на содержимом меню.
 */
function usePanelTheme() {
  const ref = useRef<HTMLDivElement>(null);
  const [panel, setPanel] = useState<{ dark: boolean; lang?: string | undefined }>({ dark: false });
  useLayoutEffect(() => {
    const el = ref.current?.closest<HTMLElement>('[data-matrix]');
    setPanel({ dark: el?.classList.contains('dark') ?? false, lang: el?.lang });
  }, []);
  return { ref, panel };
}

/** Сегментный переключатель ролей в меню аккаунта: радиопункты без индикатора (indicator={false}) в ряд. */
function RoleSegment() {
  const { ref, panel } = usePanelTheme();
  const [role, setRole] = useState('client');
  return (
    // Высота панели — чтобы открытые меню четырёх копий матрицы не перекрывали соседние панели.
    <div ref={ref} className="h-48">
      <DropdownMenu defaultOpen modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <T k="nav.account" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={panel.dark ? 'dark' : undefined}
          lang={panel.lang}
          // Четыре открытых меню в матрице: фокус в соседнем меню не должен закрывать это.
          onFocusOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DropdownMenuLabel>
            <T k="nav.switch_role" />
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup value={role} onValueChange={setRole} className="grid grid-cols-2 gap-1">
            <DropdownMenuRadioItem value="client" indicator={false}>
              <T k="role.client" />
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="supplier" indicator={false}>
              <T k="role.supplier" />
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <T k="nav.settings" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export const RadioSegment: Story = {
  ...matrix,
  render: () => <RoleSegment />,
  play: async () => {
    await waitFor(() => expect(document.querySelectorAll('[data-slot="dropdown-menu-radio-item"]').length).toBe(8));
    const items = document.querySelectorAll('[data-slot="dropdown-menu-radio-item"]');
    // Без индикатора: нет слота галочки, выбранный пункт помечен aria-checked.
    await expect(document.querySelector('[data-slot="dropdown-menu-radio-item-indicator"]')).toBeNull();
    await expect(items[0]?.getAttribute('aria-checked')).toBe('true');
    await expect(items[1]?.getAttribute('aria-checked')).toBe('false');
  },
};
