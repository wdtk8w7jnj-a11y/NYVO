// Parcours réels dans Chromium : rendu, interactions, historique, stockage.
import { test, expect } from '@playwright/test';

const PREFS = {
  version: 3,
  onboarded: true,
  country: 'FR',
  follows: { teams: ['paris-atlas'], competitions: [], players: [] },
  saved: { matches: [], articles: [], videos: [] },
  spoiler: { global: false, teams: [] },
};

async function withPrefs(page, prefs = PREFS) {
  await page.addInitScript((p) => {
    // Amorçage unique par onglet : window.name survit au rechargement (contrairement à
    // une lecture de localStorage, parfois vide au tout début d'une page file://).
    if (window.name !== 'nyvo-seeded') {
      localStorage.setItem('nyvo-v3', JSON.stringify(p));
      window.name = 'nyvo-seeded';
    }
  }, prefs);
}

// NYVO_URL permet de tester aussi dist/nyvo.html ouvert en file://.
const BASE = process.env.NYVO_URL || '/';
// En file:// dans un contexte Playwright éphémère, Chromium perd parfois le localStorage
// au rechargement : la persistance après rechargement n'est vérifiée qu'en HTTP.
const FILE = BASE.startsWith('file:');
async function reloadChecks(page, fn) {
  if (FILE) {
    test.info().annotations.push({ type: 'limite', description: 'persistance après rechargement non vérifiée en file://' });
    return;
  }
  await page.reload();
  await fn();
}
const hash = (page) => page.evaluate(() => location.hash);

test('premier lancement : pays, recherche, favoris, retour sans perte, accueil puis rechargement', async ({ page }) => {
  await page.goto(BASE);
  await expect(page).toHaveURL(/#\/bienvenue/);
  await expect(page.getByRole('heading', { name: 'Bienvenue sur NYVO' })).toBeVisible();
  await page.getByRole('radio', { name: 'Belgique' }).check();
  await expect(page.getByRole('radio', { name: 'Belgique' })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'English' })).toBeDisabled();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('searchbox').fill('paris');
  await page.getByText('Paris Atlas').click();
  await page.getByRole('searchbox').fill('');
  await page.getByRole('button', { name: 'Compétitions', exact: true }).click();
  await page.getByText('Coupe Élite').click();
  await expect(page.getByText('2 favoris sélectionnés')).toBeVisible();
  // Retour à l'étape 1 puis de nouveau 2 : rien n'est perdu.
  await page.getByRole('button', { name: 'Revenir au choix du pays' }).click();
  await expect(page.getByRole('radio', { name: 'Belgique' })).toBeChecked();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByText('2 favoris sélectionnés')).toBeVisible();
  await page.getByRole('button', { name: 'Accéder à l’accueil' }).click();
  await expect(page).toHaveURL(/#\/accueil/);
  await expect(page.getByRole('button', { name: /Pays de diffusion : Belgique/ })).toBeVisible();
  await expect(page.getByText('Mes matchs')).toBeVisible();
  if (!FILE) {
    await page.goto(BASE);
    await expect(page).toHaveURL(/#\/accueil/);
  }
});

test('premier lancement facultatif : « Plus tard » mène à l’accueil sans compte', async ({ page }) => {
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Plus tard' }).click();
  await expect(page).toHaveURL(/#\/accueil/);
  await expect(page.getByText('À la une')).toBeVisible();
  await expect(page.getByText('Composez « Mes matchs »')).toBeVisible();
});

test('parcours central : accueil → matchs → fiche → Où regarder → favoris, avec retour navigateur', async ({ page }) => {
  await withPrefs(page);
  await page.goto(BASE + '#/accueil');
  await page.getByRole('link', { name: 'Tous les matchs' }).click();
  await expect(page).toHaveURL(/#\/matchs/);
  await expect(page.getByText('Match suivi')).toBeVisible();
  await page.getByRole('link', { name: /Paris Atlas – Milan Stella/ }).first().click();
  await expect(page).toHaveURL(/#\/match\/pa-ms/);
  await expect(page.getByLabel(/Score 2 à 1/)).toBeVisible();
  // Où regarder
  await page.getByRole('button', { name: 'Où regarder' }).click();
  const dialog = page.getByRole('dialog', { name: 'Où regarder' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Sport Démo 1', { exact: true }).first()).toBeVisible();
  await expect(dialog.getByText('Après-match : horaire prévisionnel.')).toBeVisible();
  await expect(dialog.getByText('Sport Démo 3')).toBeVisible();
  // V0.4 : le bouton ouvre le panneau d'accès au diffuseur ; Retour revient à Où regarder.
  await dialog.getByRole('button', { name: /Ouvrir chez le diffuseur/ }).first().click();
  await expect(page.getByRole('dialog', { name: /Ouvrir chez le diffuseur/ })).toBeVisible();
  await page.goBack();
  await expect(dialog).toBeVisible();
  // Retour navigateur : ferme le panneau, reste sur la fiche.
  await page.goBack();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/#\/match\/pa-ms$/);
  // Enregistrer puis retrouver dans Favoris.
  await page.getByRole('button', { name: 'Enregistrer le match' }).click();
  await page.goBack();
  await expect(page).toHaveURL(/#\/matchs/);
  await page.getByRole('link', { name: 'Favoris' }).click();
  await page.getByRole('button', { name: 'Enregistrés' }).click();
  await expect(page.getByRole('link', { name: /Paris Atlas – Milan Stella/ })).toBeVisible();
  await reloadChecks(page, () => expect(page.getByRole('link', { name: /Paris Atlas – Milan Stella/ })).toBeVisible());
});

test('Échap ferme un panneau et rend le focus au bouton d’origine', async ({ page }) => {
  await withPrefs(page);
  await page.goto(BASE + '#/match/pa-ms');
  const opener = page.getByRole('button', { name: 'Où regarder' });
  await opener.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Où regarder' })).toBeFocused();
  expect(await hash(page)).toBe('#/match/pa-ms');
});

test('dates et filtres : la date est conservée, état vide utile, diffusés dans mon pays, tri', async ({ page }) => {
  await withPrefs(page, { ...PREFS, follows: { teams: [], competitions: [], players: [] } });
  await page.goto(BASE + '#/matchs');
  await page.getByRole('button', { name: 'Jour suivant' }).click();
  await expect(page.getByText('Demain · Démo')).toBeVisible();
  await expect(page.getByRole('link', { name: /Lyon Nord – Milan Stella/ })).toBeVisible();
  await page.getByRole('button', { name: 'Jour suivant' }).click();
  await page.getByRole('button', { name: 'En direct' }).click();
  await expect(page.getByText(/Aucune rencontre de démonstration le mardi 20 octobre/)).toBeVisible();
  expect(await hash(page)).toContain('date=2026-10-20');
  await page.getByRole('button', { name: 'Revenir au 18 octobre' }).click();
  await expect(page.getByRole('button', { name: 'En direct' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('link', { name: /Paris Atlas – Milan Stella/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Lyon Nord – Berlin Union/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Tous' }).click();
  await expect(page.getByRole('link', { name: /Marseille Sport – Lille Capitale/ })).toBeVisible();
  await page.getByRole('switch', { name: 'Diffusés en France' }).click();
  await expect(page.getByRole('link', { name: /Marseille Sport – Lille Capitale/ })).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Regrouper les matchs' }).selectOption('heure');
  await expect(page.getByRole('heading', { name: /Coupe Élite/ })).toHaveCount(0);
  // Le sélecteur de date ouvre un vrai panneau.
  await page.getByRole('button', { name: /Choisir la date/ }).click();
  await page.getByRole('button', { name: /Lundi 19 octobre/ }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  expect(await hash(page)).toContain('date=2026-10-19');
});

test('groupes de compétition repliables', async ({ page }) => {
  await withPrefs(page, { ...PREFS, follows: { teams: [], competitions: [], players: [] } });
  await page.goto(BASE + '#/matchs');
  const toggle = page.getByRole('button', { name: /Ligue Démo/ });
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await toggle.click();
  await expect(page.getByRole('button', { name: /Ligue Démo/ })).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('link', { name: /Lyon Nord – Berlin Union/ })).toBeHidden();
});

test('sans spoilers : aucun score dans le texte ni les attributs, révélation par match, protection rétablie au rechargement', async ({ page }) => {
  await withPrefs(page);
  await page.goto(BASE + '#/accueil');
  await page.getByRole('button', { name: 'Réglages' }).click();
  await page.getByRole('switch', { name: /Masquer les résultats partout/ }).click();
  await page.getByRole('button', { name: 'Fermer' }).click();
  const html = await page.locator('#app').innerHTML();
  expect(html).not.toMatch(/2 – 1|Score 2 à 1|Jules Martin|1 – 1/);
  await expect(page.getByText('Score masqué').first()).toBeVisible();
  await page.goto(BASE + '#/match/pa-ms');
  await expect(page.getByText('Le match reste masqué')).toBeVisible();
  await expect(page.getByText('Sport Démo 1').first()).toBeVisible(); // la chaîne reste accessible
  for (const tab of ['Compositions', 'Statistiques', 'Classement']) {
    await page.getByRole('tab', { name: tab }).click();
    expect(await page.locator('#app').innerHTML()).not.toMatch(/2 – 1|Jules Martin|58 %/);
  }
  expect(await page.title()).not.toMatch(/\d – \d/);
  await page.getByRole('tab', { name: 'Direct' }).click();
  await page.getByRole('button', { name: 'Révéler ce match' }).click();
  await expect(page.getByLabel(/Score 2 à 1/)).toBeVisible();
  await page.goto(BASE + '#/videos');
  await expect(page.getByText('Sans spoilers : contenu masqué')).toHaveCount(0); // contenu lié révélé avec le match
  await reloadChecks(page, async () => {
    await expect(page.getByText('Sans spoilers : contenu masqué')).toBeVisible();
    expect(await page.locator('#app').innerHTML()).not.toContain('63e minute');
  });
});

test('diffusion non confirmée : aucun bouton vers une chaîne, pays sans données', async ({ page }) => {
  await withPrefs(page);
  await page.goto(BASE + '#/match/msp-lc');
  await expect(page.getByRole('heading', { name: 'Diffusion non confirmée' })).toBeVisible();
  await expect(page.getByText('ne signifie pas que le match ne sera pas diffusé')).toBeVisible();
  await expect(page.getByRole('button', { name: /Ouvrir chez le diffuseur/ })).toHaveCount(0);
  await page.goto(BASE + '#/match/pa-ms?p=diffusion');
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Pays de diffusion').selectOption('BE');
  await expect(dialog.getByRole('heading', { name: 'Diffusion non confirmée' })).toBeVisible();
  await expect(dialog.getByText('Sport Démo 1')).toHaveCount(0);
  await expect(dialog.getByText('Aucune donnée de diffusion pour ce pays dans la démonstration.')).toBeVisible();
});

test('direct interrompu puis reprise ; données limitées sans zéro inventé', async ({ page }) => {
  await withPrefs(page);
  await page.goto(BASE + '#/match/pa-ms');
  await page.getByText('Simuler un état (démonstration)').click();
  await page.getByRole('radio', { name: 'Direct interrompu' }).check();
  await expect(page.getByRole('heading', { name: 'Direct interrompu' })).toBeVisible();
  await expect(page.getByText('Dernière mise à jour : 22:24 · Démo')).toBeVisible();
  await expect(page.getByText('Derniers événements reçus')).toBeVisible();
  await page.getByRole('button', { name: 'Réessayer' }).click();
  await expect(page.getByRole('heading', { name: 'Direct interrompu' })).toHaveCount(0);
  await page.goto(BASE + '#/match/ln-bu');
  await expect(page.getByRole('radio', { name: /Direct interrompu/ })).toBeDisabled();
  await page.goto(BASE + '#/match/mso-lci?onglet=statistiques');
  await expect(page.getByText('Statistiques non disponibles')).toBeVisible();
  await expect(page.locator('.tab-panel')).not.toContainText(/\b0\b/);
});

test('onglets de fiche au clavier (flèches) et données manquantes explicites', async ({ page }) => {
  await withPrefs(page);
  await page.goto(BASE + '#/match/pa-ms');
  await page.getByRole('tab', { name: 'Direct' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Compositions' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: 'Compositions' })).toBeFocused();
  await expect(page.getByText('Formation 4-3-3')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('Buts attendus (xG)')).toBeVisible();
  await expect(page.getByText(/Non disponible/).first()).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('heading', { name: 'Demi-finales' })).toBeVisible();
});

test('recherche : abréviation, ouverture du match, fermeture du panneau, historique effaçable', async ({ page }) => {
  await withPrefs(page);
  await page.goto(BASE + '#/accueil');
  await page.getByRole('button', { name: 'Rechercher' }).click();
  await page.getByRole('searchbox').fill('BU');
  await page.getByRole('dialog').getByRole('link', { name: /Lyon Nord – Berlin Union/ }).click();
  await expect(page).toHaveURL(/#\/match\/ln-bu/);
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.goBack();
  await expect(page).toHaveURL(/#\/accueil$/);
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.getByRole('button', { name: 'Rechercher' }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByRole('button', { name: 'BU' })).toHaveCount(1);
  await sheet.getByRole('button', { name: 'Effacer' }).click();
  await expect(sheet.getByRole('button', { name: 'BU' })).toHaveCount(0);
});

test('favoris : suivre, ne plus suivre, persistance après rechargement', async ({ page }) => {
  await withPrefs(page);
  await page.goto(BASE + '#/favoris');
  await page.getByRole('button', { name: 'Ajouter', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Joueurs' }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Jules Martin/ }).click();
  await page.getByRole('button', { name: 'Fermer' }).click();
  await expect(page.getByRole('link', { name: /Jules Martin/ })).toBeVisible();
  await page.getByRole('button', { name: 'Ne plus suivre Paris Atlas' }).click();
  await reloadChecks(page, async () => {
    await expect(page.getByRole('link', { name: /Jules Martin/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ne plus suivre Paris Atlas' })).toHaveCount(0);
  });
});

test('stockage bloqué : bannière et aucune confirmation de sauvegarde', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('bloqué', 'SecurityError'); } });
  });
  await page.goto(BASE + '#/matchs');
  await expect(page.getByText(/Stockage local indisponible/)).toBeVisible();
  await page.getByRole('button', { name: /Enregistrer Paris Atlas – Milan Stella/ }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Non sauvegardé sur cet appareil' })).toBeVisible();
});

test('restauration du défilement au retour', async ({ page }) => {
  await withPrefs(page, { ...PREFS, follows: { teams: [], competitions: [], players: [] } });
  await page.setViewportSize({ width: 390, height: 500 });
  await page.goto(BASE + '#/matchs');
  const link = page.getByRole('link', { name: /Marseille Sport – Lille Capitale/ });
  await link.scrollIntoViewIfNeeded();
  const y = await page.evaluate(() => window.scrollY);
  expect(y).toBeGreaterThan(100);
  await link.click();
  await expect(page).toHaveURL(/msp-lc/);
  await page.goBack();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(y - 40);
});

test('vidéos : aucune lecture automatique ni faux lecteur', async ({ page }) => {
  await withPrefs(page);
  await page.goto(BASE + '#/video/v1');
  expect(await page.locator('video, audio, iframe').count()).toBe(0);
  await page.getByRole('button', { name: 'Lire la vidéo' }).click();
  await expect(page.getByText(/la lecture vidéo n’est pas disponible/)).toBeVisible();
});

const ROUTES = ['#/bienvenue', '#/bienvenue?etape=2', '#/accueil', '#/matchs', '#/match/pa-ms', '#/match/pa-ms?onglet=compositions', '#/match/pa-ms?onglet=classement', '#/match/ln-bu?onglet=classement', '#/match/msp-lc', '#/programme', '#/actualites', '#/videos', '#/favoris', '#/favoris?vue=enregistres', '#/article/a1', '#/equipe/paris-atlas', '#/accueil?p=diffusion&ref=pa-ms', '#/accueil?p=reglages', '#/accueil?p=recherche', '#/programme?vue=chaine', '#/programme?vue=match&mes=1', '#/programme?p=filtres', '#/programme?p=diffuseur&ref=fr-pams-sd1', '#/programme?p=diffuseur&ref=fr-trnr-sd2', '#/acces', '#/acces/vision-sport'];

test('aucun débordement horizontal à 360 px et cibles tactiles ≥ 40 px', async ({ page }, info) => {
  test.skip(info.project.name !== 'smartphone-390', 'contrôle smartphone');
  await withPrefs(page, { ...PREFS, saved: { matches: ['pa-ms'], articles: ['a1'], videos: ['v1'] } });
  await page.setViewportSize({ width: 360, height: 740 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const r of ROUTES) {
    await page.goto(BASE + r);
    await page.waitForTimeout(80);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `débordement sur ${r}`).toBeLessThanOrEqual(0);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('button, [role="switch"], [role="tab"], .tabbar a')]
        .filter((el) => el.offsetParent !== null && !el.closest('.demo-panel summary'))
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.width > 0 && r.height < 40)
        .map(({ el, r }) => `${el.textContent.trim().slice(0, 30) || el.getAttribute('aria-label')} (${Math.round(r.height)}px)`),
    );
    expect(small, `cibles trop petites sur ${r}`).toEqual([]);
  }
  expect(errors).toEqual([]);
});

test('chaque bouton et lien possède un nom accessible', async ({ page }) => {
  await withPrefs(page, { ...PREFS, saved: { matches: ['pa-ms'], articles: ['a1'], videos: ['v1'] } });
  for (const r of ROUTES) {
    await page.goto(BASE + r);
    const unnamed = await page.evaluate(() =>
      [...document.querySelectorAll('button, a[href], input, select')]
        .filter((el) => el.offsetParent !== null && el.getAttribute('aria-hidden') !== 'true' && el.tabIndex !== -1)
        .filter((el) => {
          const label = el.getAttribute('aria-label') || el.textContent.trim() || (el.labels && [...el.labels].map((l) => l.textContent).join('').trim()) || el.getAttribute('placeholder');
          return !label;
        })
        .map((el) => el.outerHTML.slice(0, 80)),
    );
    expect(unnamed, r).toEqual([]);
  }
});
