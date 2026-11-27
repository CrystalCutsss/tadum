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
  // /c/home — главная активного клиента (D-098, TD-002); клиент без активного лимита попадает в «Заявку».
  persona('client.home', 'client_active', '/', heading('limit.available')),
  // График платежей (D-102): взнос со сроком в прошлом на главной, история и детали взноса в панели.
  persona('client.home.repayments', 'client_first_purchase', '/', heading('repayments.title')),
  persona('client.home.repayment_details', 'client_first_purchase', '/c/home', async (page, lang) => {
    await page.locator('#repayments').getByRole('button', { name: /10,000/ }).first().click();
    const panel = page.getByRole('dialog', { name: tr(lang, 'repayments.details.title') });
    await expect(panel.getByRole('heading', { name: tr(lang, 'repayments.how_to_pay.title') })).toBeVisible();
    await panel.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));
  }),
  persona('client.home.purchase', 'client_active', '/c/home', async (page, lang) => {
    await page.getByRole('button', { name: tr(lang, 'home.purchase.cta') }).click();
    const dialog = page.getByRole('dialog', { name: tr(lang, 'home.purchase.title') });
    await expect(dialog).toBeVisible();
    // Снимок — после анимации появления (на 768 окно иначе снималось полупрозрачным).
    await dialog.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));
  }),
  persona('client.documents', 'client_new', '/c/documents', heading('documents.title')),
  // Этапы «Заявки» после одобрения (A-063): «Решение», «Подписание», «Лимит одобрен» и подробности заявки.
  persona('client.application.decision', 'client_offer_pending', '/c/documents', heading('documents.title')),
  persona('client.application.signing', 'client_signing_partial', '/c/documents', heading('documents.title')),
  persona('client.signing', 'client_signing_partial', '/c/documents/sign', heading('signing.title')),
  persona('client.application.approved', 'client_active', '/c/documents', heading('application.summary.title')),
  persona('client.application.details', 'client_active', '/c/documents', async (page, lang) => {
    await page.getByRole('button', { name: tr(lang, 'application.summary.open') }).click();
    await expect(page.getByRole('dialog', { name: tr(lang, 'application.details.title') })).toBeVisible();
  }),
  persona('client.help', 'client_active', '/c/help', heading('help.title')),
  persona('supplier.home', 'supplier_active', '/s/home', heading('stub.coming_soon.title')),
  // Экран «Заявка» поставщика по этапам (TD-001): документы, проверка, договор, партнёр со ссылкой, Declined, Lost.
  persona('supplier.application.documents', 'supplier_new', '/s/documents', heading('documents.title')),
  persona('supplier.application.review', 'supplier_review', '/s/documents', heading('documents.title')),
  persona('supplier.application.contract', 'supplier_contract', '/s/documents', heading('supplier.contract.title')),
  persona('supplier.application.partner', 'supplier_partner', '/s/documents', heading('supplier.partner.title')),
  persona('supplier.application.declined', 'supplier_declined', '/s/documents', heading('supplier.declined.title')),
  persona('supplier.application.paused', 'supplier_lost', '/s/documents', heading('supplier.paused.title')),
  persona('supplier.help', 'supplier_active', '/s/help', heading('help.title')),
];
