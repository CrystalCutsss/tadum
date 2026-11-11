import type { Meta, StoryObj } from '@storybook/react-vite';
import { RiFileTextLine, RiHomeLine, RiQuestionLine, RiSettings3Line, RiWhatsappFill } from '@remixicon/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { expect, fn, userEvent, within } from 'storybook/test';

import { matrix } from '../../../.storybook/decorators';
import { T } from '../../../.storybook/t';

import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from './breadcrumb';
import { Button } from './button';
import { Icon } from './icon/icon';
import { Separator } from './separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from './sidebar';
import { Wordmark } from './wordmark';

// Принятое исключение, Кирилл 2026-11-06: белый текст кнопки WhatsApp — 3.01:1 на --whatsapp с 2026-11-11 (было 1.98:1 на #25D366).
// Отключено только правило axe color-contrast; правила матрицы (landmark) сохранены — массив rules при слиянии parameters заменяется целиком.
const whatsappA11y = {
  ...matrix.parameters,
  a11y: {
    ...matrix.parameters.a11y,
    config: { rules: [...matrix.parameters.a11y.config.rules, { id: 'color-contrast', enabled: false }] },
  },
};

// Во всех историях в футере есть кнопка WhatsApp, поэтому исключение — на уровне meta.
const meta = { title: 'shared/ui/Sidebar', ...matrix, parameters: whatsappA11y } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const desktop = { viewport: { value: 'desktop1280', isRotated: false } };
const mobile = { viewport: { value: 'mobile360', isRotated: false } };

const items = [
  { key: 'nav.home', icon: RiHomeLine },
  { key: 'nav.documents', icon: RiFileTextLine },
  { key: 'nav.help', icon: RiQuestionLine },
] as const;

interface ShellProps {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Каркас sidebar-08 (variant="inset"). Сайдбар пресета — position: fixed на весь экран, поэтому в матрице
 * каждая копия в своём контейнере с transform (containing block) и фиксированной высотой.
 */
function Shell(provider: ShellProps) {
  const { t } = useTranslation();
  return (
    <div className="h-96 transform-gpu overflow-hidden rounded-lg border">
      <SidebarProvider {...provider} className="h-full min-h-0">
        <Sidebar variant="inset" mobileTitle={t('nav.mobile_title')} mobileDescription={t('nav.mobile_description')} className="h-full">
          <SidebarHeader>
            <Wordmark variant="dot" className="px-3 py-1" />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>{t('nav.main')}</SidebarGroupLabel>
              <SidebarMenu>
                {items.map(({ key, icon }, i) => (
                  <SidebarMenuItem key={key}>
                    <SidebarMenuButton isActive={i === 0} tooltip={t(key)}>
                      <Icon icon={icon} />
                      <span>{t(key)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Icon icon={RiSettings3Line} />
                  <span>{t('nav.settings')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 px-4">
            <SidebarTrigger aria-label={t('nav.toggle_sidebar')} />
            <Separator orientation="vertical" className="h-4" />
            <Breadcrumb aria-label={t('nav.breadcrumb')}>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('nav.home')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <Button variant="whatsapp" asChild className="self-start">
              <a href="https://wa.me/" target="_blank" rel="noreferrer">
                <Icon icon={RiWhatsappFill} />
                <T k="support.whatsapp" />
              </a>
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

const panel = (root: HTMLElement, combo: string) => root.querySelector<HTMLElement>(`[data-matrix="${combo}"]`)!;
const sidebarOf = (el: HTMLElement) => el.querySelector<HTMLElement>('[data-slot="sidebar"]')!;
const triggerOf = (el: HTMLElement) => el.querySelector<HTMLElement>('[data-slot="sidebar-trigger"]')!;

/** Развёрнут: сайдбар на стороне start без side — справа в AR, слева в EN. Cookie пресета не пишется. */
export const Expanded: Story = {
  globals: desktop,
  render: () => <Shell />,
  play: async ({ canvasElement }) => {
    const ar = sidebarOf(panel(canvasElement, 'ar light'));
    const en = sidebarOf(panel(canvasElement, 'en light'));
    await expect(ar.dataset.state).toBe('expanded');
    await expect(ar.dataset.side).toBe('right');
    await expect(en.dataset.side).toBe('left');
    // Иконка триггера зеркалится в RTL.
    await expect(triggerOf(panel(canvasElement, 'ar light')).querySelector('svg')?.dataset.mirrored).toBe('true');
    await userEvent.click(triggerOf(panel(canvasElement, 'en dark')));
    await expect(sidebarOf(panel(canvasElement, 'en dark')).dataset.state).toBe('collapsed');
    await expect(document.cookie).not.toContain('sidebar_state');
  },
};

/** Свёрнут (offcanvas): контент на всю ширину, триггер разворачивает. */
export const Collapsed: Story = {
  globals: desktop,
  render: () => <Shell defaultOpen={false} />,
  play: async ({ canvasElement }) => {
    const ar = panel(canvasElement, 'ar light');
    await expect(sidebarOf(ar).dataset.state).toBe('collapsed');
    await userEvent.click(triggerOf(ar));
    await expect(sidebarOf(ar).dataset.state).toBe('expanded');
  },
};

const onOpenChange = fn();
function Controlled() {
  const [open, setOpen] = useState(true);
  return (
    <Shell
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        setOpen(next);
      }}
    />
  );
}

/** Контролируемый режим: open / onOpenChange — так виджет сохраняет состояние через storage.ts. */
export const ControlledOpen: Story = {
  globals: desktop,
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    onOpenChange.mockClear();
    const ar = panel(canvasElement, 'ar light');
    await userEvent.click(triggerOf(ar));
    await expect(onOpenChange).toHaveBeenCalledWith(false);
    await expect(sidebarOf(ar).dataset.state).toBe('collapsed');
  },
};

/** Мобильный (AR): Sheet по кнопке со стороны start — справа, dir=rtl. */
export const Mobile: Story = {
  globals: mobile,
  render: () => <Shell />,
  play: async ({ canvasElement }) => {
    await userEvent.click(triggerOf(panel(canvasElement, 'ar light')));
    const sheet = await within(document.body).findByRole('dialog');
    await expect(sheet.dataset.side).toBe('right');
    await expect(sheet.getAttribute('dir')).toBe('rtl');
  },
};

/** Мобильный (EN): Sheet со стороны start — слева, dir=ltr. */
export const MobileEnglish: Story = {
  globals: mobile,
  render: () => <Shell />,
  play: async ({ canvasElement }) => {
    await userEvent.click(triggerOf(panel(canvasElement, 'en light')));
    const sheet = await within(document.body).findByRole('dialog');
    await expect(sheet.dataset.side).toBe('left');
    await expect(sheet.getAttribute('dir')).toBe('ltr');
  },
};
