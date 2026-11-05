// Экраны v1 для axe и скриншотов: как открыть каждый в нужном языке.
import type { Page } from '@playwright/test';

import { asPersona, expect, tr, type Lang } from './fixtures';

export interface Screen {
  id: string;
  open: (page: Page, lang: Lang) => Promise<void>;
}

const persona = (id: string, persona: string, path: string, ready: (page: Page, lang: Lang) => Promise<void>): Screen => ({
  id,
  open: async (page, lang) => {
    await asPersona(page, persona, lang, path);
    await ready(page, lang);
    // Данные загружены: скелетонов (aria-busy) не осталось.
    await expect(page.locator('main [aria-busy="true"]')).toHaveCount(0);
  },
});

const heading = (key: string) => async (page: Page, lang: Lang) => {
  await expect(page.getByRole('heading', { name: tr(lang, key) }).first()).toBeVisible();
};

export const SCREENS: readonly Screen[] = [
  {
    id: 'auth.phone',
    open: async (page, lang) => {
      await page.goto(`/login?lang=${lang}`);
      await heading('auth.phone.title')(page, lang);
    },
  },
  {
    id: 'auth.otp',
    open: async (page, lang) => {
      await page.goto(`/login?lang=${lang}`);
      await page.getByRole('main').getByRole('textbox').fill('500000001');
      await page.getByRole('button', { name: tr(lang, 'auth.phone.submit') }).click();
      await heading('auth.otp.title')(page, lang);
    },
  },
  {
    id: 'auth.not_found',
    open: async (page, lang) => {
      await page.goto(`/not-found?lang=${lang}`);
      await heading('auth.not_found.title')(page, lang);
    },
  },
  {
    id: 'auth.expired',
    open: async (page, lang) => {
      await page.goto(`/session-expired?lang=${lang}`);
      await heading('auth.expired.title')(page, lang);
    },
  },
  {
    id: 'system.404',
    open: async (page, lang) => {
      await page.goto(`/nowhere?lang=${lang}`);
      await heading('notfound.title')(page, lang);
    },
  },
  persona('client.home-docs_required', 'client_new', '/', async (page, lang) => {
    await expect(page.getByText(tr(lang, 'next_step.upload_documents', { count: 7 }))).toBeVisible();
  }),
  persona('client.home-under_review', 'client_submitted', '/', async (page, lang) => {
    await expect(page.getByText(tr(lang, 'next_step.under_review_eta', { count: 24, hours: 24 }))).toBeVisible();
  }),
  persona('client.home-approved', 'client_approved_unsigned', '/', async (page, lang) => {
    await expect(page.getByText(tr(lang, 'next_step.sign_documents'))).toBeVisible();
  }),
  persona('client.home-closed', 'client_closed_rejected', '/', async (page, lang) => {
    await expect(page.getByText(tr(lang, 'closed.title'))).toBeVisible();
  }),
  persona('client.documents', 'client_new', '/c/documents', heading('stub.coming_soon.title')),
  persona('client.help', 'client_active', '/c/help', heading('help.title')),
  persona('supplier.home', 'supplier_active', '/s/home', heading('stub.coming_soon.title')),
  persona('supplier.help', 'supplier_active', '/s/help', heading('help.title')),
  persona('dual.home', 'dual_active', '/', async (page, lang) => {
    await expect(page.getByRole('radio', { name: tr(lang, 'role.supplier') })).toBeVisible();
    await expect(page.getByText(tr(lang, 'next_step.how_to_buy'))).toBeVisible();
  }),
];
