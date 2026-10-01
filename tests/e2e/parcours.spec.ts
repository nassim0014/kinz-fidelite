import { expect, type Browser, type Page, test } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { makeDb } from '../../src/db';
import { customers } from '../../src/db/schema';

async function join(page: Page, firstName: string, phone: string) {
  await page.goto('/rejoindre?nouveau=1');
  await page.getByLabel('Prénom').fill(firstName);
  await page.getByLabel('Téléphone').fill(phone);
  await page.getByRole('button', { name: 'Créer ma carte' }).click();
  await expect(page).toHaveURL(/\/c\/[A-Za-z0-9_-]{22}$/);
}

async function staffPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ baseURL: 'http://localhost:3100' });
  const page = await context.newPage();
  await page.goto('/staff/login');
  await page.getByLabel('Nom').fill('E2E');
  await page.getByLabel('PIN').fill('123456');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/staff$/);
  return page;
}

async function findCustomer(staff: Page, phone: string, name: string) {
  await staff.getByLabel('Téléphone du client').fill(phone);
  await staff.getByRole('button', { name: 'Rechercher' }).click();
  await expect(staff.getByRole('heading', { name })).toBeVisible();
}

test('un client rejoint, est tamponné une seule fois par jour, et voit sa carte se mettre à jour', async ({
  page,
  browser,
}) => {
  await join(page, 'Salma', '22 123 456');
  await expect(page.getByText('0 / 13')).toBeVisible();

  const staff = await staffPage(browser);
  await findCustomer(staff, '22123456', 'Salma');
  await staff.getByLabel('Montant du ticket (TND)').fill('85,500');
  await staff.getByRole('button', { name: 'Tamponner' }).click();
  await expect(staff.getByRole('status')).toHaveText('+1 tampon · +2 pépins · Niveau 2 atteint !');
  await expect(staff.getByText("Déjà tamponné aujourd'hui")).toBeVisible();

  await staff.getByRole('button', { name: 'Renvoyer la carte' }).click();
  await expect(staff.getByRole('link', { name: 'Envoyer par WhatsApp' })).toHaveAttribute(
    'href',
    /^https:\/\/wa\.me\/21622123456\?text=.*%2Fc%2F/,
  );
  await expect(staff.getByRole('link', { name: 'Envoyer par SMS' })).toHaveAttribute(
    'href',
    /^sms:\+21622123456\?body=/,
  );

  await page.reload();
  await expect(page.getByText('1 / 13')).toBeVisible();
  await expect(page.getByText('Niveau 2')).toBeVisible();
});

test('un numéro déjà inscrit ne donne pas accès à la carte existante', async ({ page }) => {
  await join(page, 'Leila', '22 999 000');
  await page.goto('/rejoindre?nouveau=1');
  await page.getByLabel('Prénom').fill('Intrus');
  await page.getByLabel('Téléphone').fill('22999000');
  await page.getByRole('button', { name: 'Créer ma carte' }).click();
  // getByText, not getByRole('alert'): Next's route announcer also has role="alert".
  await expect(page.getByText(/déjà une carte/)).toBeVisible();
  await expect(page).toHaveURL(/\/rejoindre/);
});

test("l'équipe applique une récompense et la carte repart à zéro", async ({ page, browser }) => {
  await join(page, 'Amira', '22 555 111');
  const db = makeDb(process.env.DATABASE_URL!, { max: 1 });
  await db.update(customers).set({ cardStamps: 3 }).where(eq(customers.phone, '+21622555111'));
  await db.$client.end();

  const staff = await staffPage(browser);
  await findCustomer(staff, '22555111', 'Amira');
  await staff.getByRole('button', { name: /Utiliser le palier 3/ }).click();
  await staff.getByRole('button', { name: 'Confirmer', exact: true }).click();
  await expect(staff.getByRole('status')).toContainText('Récompense appliquée');
  await expect(staff.getByText('0 / 13')).toBeVisible();
});

test('un ticket de 300 TND ou plus demande une confirmation avant de tamponner', async ({
  page,
  browser,
}) => {
  await join(page, 'Nour', '22 777 888');

  const staff = await staffPage(browser);
  await findCustomer(staff, '22777888', 'Nour');
  await staff.getByLabel('Montant du ticket (TND)').fill('350');
  await staff.getByRole('button', { name: 'Tamponner' }).click();
  await expect(staff.getByRole('button', { name: 'Confirmer 350 TND' })).toBeVisible();
  await expect(staff.getByRole('status')).toHaveCount(0);

  await staff.getByRole('button', { name: 'Confirmer 350 TND' }).click();
  await expect(staff.getByRole('status')).toContainText('+3 tampons');
});
