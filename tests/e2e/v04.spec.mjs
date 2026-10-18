// Parcours V0.4 dans Chromium : Programme TV, filtres, Mes accès, accès au diffuseur.
import { test, expect } from '@playwright/test';

const BASE = process.env.NYVO_URL || '/';
const FILE = BASE.startsWith('file:');
const PREFS = {
  version: 4,
  onboarded: true,
  country: 'FR',
  follows: { teams: ['paris-atlas'], competitions: [], players: [] },
  saved: { matches: [], articles: [], videos: [] },
  spoiler: { global: false, teams: [] },
  access: {},
};

async function seed(page, prefs = PREFS, key = 'nyvo-v4') {
  await page.addInitScript(
    ([p, k]) => {
      if (window.name !== 'nyvo-seeded') {
        localStorage.setItem(k, JSON.stringify(p));
        window.name = 'nyvo-seeded';
      }
    },
    [prefs, key],
  );
}
const hash = (page) => page.evaluate(() => location.hash);
const withAccess = (services) => ({ ...PREFS, access: { FR: { services, legacy: [] } } });

test('trois vues, même état : date, filtres et position conservés ; ordre horaire corrigé', async ({ page }) => {
  await seed(page);
  await page.goto(BASE + '#/programme');
  // Horaire : la rencontre non confirmée de 21:00 précède l'après-match de 23:00.
  const rows = page.locator('.pg-timeline > .tl-row');
  const texts = await rows.allInnerTexts();
  const nc = texts.findIndex((t) => t.includes('Marseille Sport – Lille Capitale'));
  const post = texts.findIndex((t) => t.includes('Après-match') && t.includes('Paris Atlas'));
  expect(nc).toBeGreaterThan(-1);
  expect(nc).toBeLessThan(post);
  await page.getByRole('button', { name: 'Favoris', exact: true }).click();
  await page.getByRole('button', { name: 'Chaîne', exact: true }).click();
  expect(await hash(page)).toMatch(/vue=chaine/);
  expect(await hash(page)).toMatch(/fav=1/);
  await expect(page.getByRole('heading', { name: /Sport Démo 1/ })).toBeVisible();
  await page.getByRole('button', { name: 'Match', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Paris Atlas – Milan Stella' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Lyon Nord – Berlin Union' })).toHaveCount(0); // filtre Favoris conservé
  await page.getByRole('link', { name: 'Paris Atlas – Milan Stella' }).click();
  await expect(page).toHaveURL(/#\/match\/pa-ms/);
  await page.goBack();
  expect(await hash(page)).toMatch(/vue=match/);
  expect(await hash(page)).toMatch(/fav=1/);
  await expect(page.getByRole('button', { name: 'Favoris', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('filtres détaillés : brouillon, Échap annule, Réinitialiser puis Appliquer seul valide', async ({ page }) => {
  await seed(page);
  await page.goto(BASE + '#/programme');
  const opener = page.getByRole('button', { name: /Filtres détaillés/ });
  await opener.click();
  let dialog = page.getByRole('dialog', { name: /Filtres du programme/ });
  await dialog.getByRole('checkbox', { name: 'Avant-match' }).click();
  await expect(dialog.getByRole('checkbox', { name: 'Avant-match' })).toHaveAttribute('aria-checked', 'false');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  expect(await hash(page)).not.toMatch(/types=/);
  await expect(page.locator('.type-badge', { hasText: 'Avant-match' }).first()).toBeVisible();
  // Retour navigateur : annule aussi.
  await opener.click();
  await expect(dialog.getByRole('checkbox', { name: 'Avant-match' })).toHaveAttribute('aria-checked', 'true');
  await dialog.getByRole('radio', { name: 'Payant' }).click();
  await page.goBack();
  await expect(dialog).toBeHidden();
  expect(await hash(page)).not.toMatch(/acces=/);
  // Appliquer.
  await opener.click();
  await dialog.getByRole('checkbox', { name: 'Avant-match' }).click();
  await dialog.getByRole('button', { name: 'Toutes les compétitions' }).click();
  await dialog.getByRole('checkbox', { name: 'Coupe Élite' }).check();
  await dialog.getByRole('button', { name: 'Appliquer' }).click();
  await expect(dialog).toBeHidden();
  expect(await hash(page)).toMatch(/comp=coupe-elite/);
  await expect(page.locator('.type-badge', { hasText: 'Avant-match' })).toHaveCount(0);
  await expect(page.locator('.qf', { hasText: 'Coupe Élite' })).toBeVisible(); // réglage rapide = même état
  // Réinitialiser ne s'applique qu'avec Appliquer.
  await opener.click();
  dialog = page.getByRole('dialog', { name: /Filtres du programme/ });
  await dialog.getByRole('button', { name: 'Réinitialiser' }).click();
  await expect(dialog.getByRole('checkbox', { name: 'Avant-match' })).toHaveAttribute('aria-checked', 'true');
  expect(await hash(page)).toMatch(/comp=coupe-elite/);
  await dialog.getByRole('button', { name: 'Appliquer' }).click();
  await expect(dialog).toBeHidden();
  expect(await hash(page)).not.toMatch(/comp=|types=/);
  // Aucun type : Appliquer désactivé.
  await opener.click();
  for (const t of ['Avant-match', 'Match intégral', 'Multiplex', 'Après-match']) await dialog.getByRole('checkbox', { name: t }).click();
  await expect(dialog.getByRole('button', { name: 'Appliquer' })).toBeDisabled();
  await expect(dialog.getByRole('alert')).toContainText('au moins un type');
});

test('état vide : périmètre expliqué et retour à tout le programme', async ({ page }) => {
  await seed(page);
  await page.goto(BASE + '#/programme?acces=gratuit');
  await expect(page.getByText(/Aucun programme ne correspond à ces filtres pour France/)).toBeVisible();
  await page.getByRole('button', { name: 'Voir tout le programme' }).click();
  expect(await hash(page)).not.toMatch(/acces=/);
  await expect(page.locator('.pg-card').first()).toBeVisible();
});

test('Mes accès : déclarer une offre, filtrer le programme, « Voir tout » ne retire que ce filtre', async ({ page }) => {
  await seed(page);
  await page.goto(BASE + '#/acces');
  await expect(page.getByRole('heading', { name: 'Mes accès' })).toBeVisible();
  await page.getByLabel('Choisir une offre').first().selectOption('football');
  await expect(page.getByText('Inclusion vérifiée · Démo')).toBeVisible();
  await page.getByRole('checkbox', { name: /Arena Démo/ }).check();
  await expect(page.getByText('Inclusion des chaînes non confirmée.')).toBeVisible();
  await expect(page.getByText('Modifications non enregistrées')).toBeVisible();
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Aucun abonnement n’a été souscrit' })).toBeVisible();
  await page.goto(BASE + '#/programme?vue=match');
  await page.getByRole('button', { name: /Mes accès/ }).first().click();
  await expect(page.getByText('Mes accès activé')).toBeVisible();
  await expect(page.getByText('Vision Sport Démo · Pack Football')).toBeVisible();
  await expect(page.getByText('Chaînes incluses dans ton offre déclarée').first()).toBeVisible();
  await expect(page.locator('.pg-card', { hasText: 'Sport Démo 3' })).toHaveCount(0); // option non déclarée
  await expect(page.getByText(/diffusions? non confirmées? exclues?/)).toBeVisible();
  await page.getByRole('button', { name: 'Voir tout le programme' }).click();
  const h = await hash(page);
  expect(h).toMatch(/vue=match/);
  expect(h).not.toMatch(/mes=1/);
});

test('Choisir mon offre : option ajoutée seulement si cochée, confirmation puis enregistrement', async ({ page }) => {
  await seed(page, withAccess({ 'vision-sport': { offer: 'essentiel', options: [] } }));
  await page.goto(BASE + '#/acces');
  await page.getByRole('link', { name: 'Offre et options' }).click();
  await expect(page).toHaveURL(/#\/acces\/vision-sport/);
  await expect(page.getByRole('radio', { name: /Pack Essentiel/ })).toBeChecked();
  await page.getByRole('checkbox', { name: /Option Sport Plus/ }).check();
  await page.getByRole('button', { name: 'Confirmer mon offre' }).click();
  await expect(page).toHaveURL(/#\/acces$/);
  await expect(page.getByText('Modifications non enregistrées')).toBeVisible();
  await expect(page.getByText(/Sport Démo 1 et Sport Démo 3/)).toBeVisible();
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await page.goto(BASE + '#/programme?mes=1');
  await expect(page.locator('.pg-card', { hasText: 'Sport Démo 3' })).toHaveCount(1);
  await expect(page.locator('.pg-card', { hasText: 'Sport Démo 2' })).toHaveCount(0);
});

test('offre introuvable : le service reste à préciser et n’est pas utilisé par le filtre', async ({ page }) => {
  await seed(page);
  await page.goto(BASE + '#/acces/vision-sport');
  await page.getByText('Ton offre est introuvable ?').click();
  await page.getByRole('button', { name: 'Garder à préciser' }).click();
  await expect(page).toHaveURL(/#\/acces$/);
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await page.goto(BASE + '#/programme?mes=1');
  await expect(page.getByText('Aucune correspondance vérifiée pour tes services.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Gérer mes services' }).first()).toBeVisible();
});

test('migration V0.3 : chaînes cochées conservées comme accès historiques à préciser', async ({ page }) => {
  await seed(page, { version: 3, onboarded: true, country: 'FR', services: ['sd1'], follows: { teams: ['milan-stella'], competitions: [], players: [] }, saved: { matches: ['ln-bu'], articles: [], videos: [] }, spoiler: { global: false, teams: [] } }, 'nyvo-v3');
  await page.goto(BASE + '#/acces');
  await expect(page.getByRole('heading', { name: 'Accès historiques à préciser' })).toBeVisible();
  await expect(page.locator('.legacy')).toContainText('Sport Démo 1');
  await page.goto(BASE + '#/favoris?vue=enregistres');
  await expect(page.getByRole('link', { name: /Lyon Nord – Berlin Union/ })).toBeVisible();
});

test('pays : une offre française n’est pas reprise en Belgique', async ({ page }) => {
  await seed(page, withAccess({ 'vision-sport': { offer: 'football', options: [] } }));
  await page.goto(BASE + '#/acces');
  await page.getByRole('button', { name: /Pays de diffusion/ }).click();
  // Le choix ferme le panneau : un clic suffit (check() attendrait un état qui disparaît).
  await page.getByRole('dialog').getByText('Belgique', { exact: true }).click({ force: true });
  await expect(page.getByText('Aucun service de démonstration référencé pour Belgique.')).toBeVisible();
  await page.goto(BASE + '#/programme?mes=1');
  await expect(page.getByText(/Programme non disponible pour Belgique/)).toBeVisible();
});

test('accès au diffuseur : simulation explicite, aucune ouverture ni requête externe', async ({ page, context }) => {
  const external = [];
  page.on('request', (r) => {
    if (r.url().includes('.example')) external.push(r.url());
  });
  await seed(page, withAccess({ 'vision-sport': { offer: 'football', options: [] } }));
  await page.goto(BASE + '#/programme');
  await page.getByRole('button', { name: /Match intégral, Paris Atlas – Milan Stella, 21:00, Sport Démo 1/ }).click();
  const dialog = page.getByRole('dialog', { name: /Ouvrir chez le diffuseur/ });
  await expect(dialog.getByText('vision-sport.example')).toBeVisible();
  await expect(dialog.getByText('Chaîne incluse dans ton offre déclarée')).toBeVisible();
  await expect(dialog.getByText('Payant · Abonnement requis')).toBeVisible();
  await dialog.getByRole('button', { name: /Ouvrir chez le diffuseur/ }).click();
  await expect(dialog.getByRole('status')).toContainText('aucune ouverture réelle');
  await dialog.getByRole('button', { name: /Ouvrir le site/ }).click();
  expect(context.pages()).toHaveLength(1);
  expect(await hash(page)).toMatch(/p=diffuseur/);
  expect(external).toEqual([]);
});

test('lien indisponible : pas d’annulation supposée, signalement simulé après geste explicite', async ({ page }) => {
  await seed(page);
  await page.goto(BASE + '#/programme?p=diffuseur&ref=fr-trnr-sd2');
  const dialog = page.getByRole('dialog', { name: /Accès au diffuseur/ });
  await expect(dialog.getByRole('heading', { name: 'Lien indisponible' })).toBeVisible();
  await expect(dialog.getByText('Cela ne signifie pas que la diffusion est annulée.', { exact: false })).toBeVisible();
  await dialog.getByRole('button', { name: 'Signaler le lien' }).click();
  await expect(dialog.getByText(/Rien n’est envoyé/)).toBeVisible();
  await dialog.getByRole('button', { name: 'Simuler le signalement' }).click();
  await expect(dialog.getByText('Simulation de signalement : rien n’a été envoyé.')).toBeVisible();
  expect(await dialog.innerText()).not.toMatch(/Signalement envoyé/i);
  await dialog.getByRole('button', { name: 'Voir les autres diffusions' }).click();
  await expect(page.getByRole('dialog', { name: 'Où regarder' })).toBeVisible();
});

test('Où regarder : message Mes accès corrigé', async ({ page }) => {
  await seed(page, withAccess({ 'vision-sport': { offer: 'essentiel', options: [] } }));
  await page.goto(BASE + '#/match/tr-nr?p=diffusion');
  const dialog = page.getByRole('dialog', { name: 'Où regarder' });
  await dialog.getByRole('button', { name: 'Mes accès' }).click();
  await expect(dialog.getByText('Aucune diffusion confirmée ne correspond à tes offres renseignées.')).toBeVisible();
  expect(await dialog.innerText()).not.toContain('Aucune de vos offres sélectionnées');
});

test('sans spoilers : le programme montre horaires et chaînes, jamais de score', async ({ page }) => {
  await seed(page, { ...PREFS, spoiler: { global: true, teams: [] } });
  for (const r of ['#/programme', '#/programme?vue=chaine', '#/programme?vue=match', '#/programme?p=diffuseur&ref=fr-pams-sd1']) {
    await page.goto(BASE + r);
    const html = await page.locator('body').innerHTML();
    expect(html, r).not.toMatch(/2 – 1|1 – 1|Score 2 à 1/);
    await expect(page.getByText('Sport Démo 1').first()).toBeVisible();
  }
});

test('persistance après rechargement des accès déclarés', async ({ page }) => {
  test.skip(FILE, 'persistance après rechargement non vérifiée en file://');
  await seed(page);
  await page.goto(BASE + '#/acces');
  await page.getByLabel('Choisir une offre').first().selectOption('football');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await page.reload();
  await expect(page.getByLabel('Mon offre').first()).toHaveValue('football');
});
