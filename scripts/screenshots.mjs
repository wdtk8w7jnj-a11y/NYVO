// Captures des écrans principaux : node scripts/screenshots.mjs [dossier] [url]
// Nécessite le serveur (npm start) et Chromium (Playwright).
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const out = process.argv[2] || 'docs/captures';
const base = process.argv[3] || 'http://localhost:4173/';
await mkdir(out, { recursive: true });

const ACCESS = { FR: { services: { 'vision-sport': { offer: 'football', options: [] }, arena: { offer: null, options: [] } }, legacy: [] } };
const PREFS = { version: 4, access: ACCESS, onboarded: true, country: 'FR', follows: { teams: ['paris-atlas', 'milan-stella-f'], competitions: ['coupe-elite', 'ligue-demo'], players: ['jules-martin'] }, saved: { matches: ['pa-ms'], articles: ['a4'], videos: ['v4'] }, savedAt: { 'matches:pa-ms': 3, 'articles:a4': 2, 'videos:v4': 1 }, spoiler: { global: false, teams: [] } };

const SHOTS = [
  ['01-premier-lancement-1', '#/bienvenue', null],
  ['02-premier-lancement-2', '#/bienvenue?etape=2', null],
  ['03-accueil', '#/accueil', PREFS],
  ['04-matchs', '#/matchs', PREFS],
  ['05-fiche-match', '#/match/pa-ms', PREFS],
  ['06-ou-regarder', '#/match/pa-ms?p=diffusion', PREFS],
  ['07-sans-spoilers', '#/match/pa-ms', { ...PREFS, spoiler: { global: true, teams: [] } }],
  ['08-non-confirmee', '#/match/msp-lc', PREFS],
  ['09-direct-interrompu', '#/match/pa-ms?etat=interrupted', PREFS],
  ['10-donnees-limitees', '#/match/mso-lci', PREFS],
  ['11-favoris-mon-espace', '#/favoris', PREFS],
  ['12-favoris-enregistres', '#/favoris?vue=enregistres', PREFS],
  ['13-actualites', '#/actualites?fil=general', PREFS],
  ['14-videos', '#/videos', { ...PREFS, spoiler: { global: true, teams: [] } }],
  ['16-recherche', '#/accueil?p=recherche', PREFS],
  ['17-compositions', '#/match/pa-ms?onglet=compositions', PREFS],
  ['18-statistiques', '#/match/pa-ms?onglet=statistiques', PREFS],
  ['19-classement', '#/match/ln-bu?onglet=classement', PREFS],
  ['20-programme-horaire', '#/programme', PREFS],
  ['21-programme-chaine', '#/programme?vue=chaine', PREFS],
  ['22-programme-match', '#/programme?vue=match', PREFS],
  ['23-filtres', '#/programme?p=filtres', PREFS],
  ['24-mes-acces', '#/acces', PREFS],
  ['25-choisir-offre', '#/acces/vision-sport', PREFS],
  ['26-programme-mes-acces', '#/programme?vue=match&mes=1', PREFS],
  ['27-ouvrir-diffuseur', '#/programme?p=diffuseur&ref=fr-pams-sd1', PREFS],
  ['28-lien-indisponible', '#/programme?p=diffuseur&ref=fr-trnr-sd2', PREFS],
];

const browser = await chromium.launch();
for (const [w, h, suffix] of [[390, 844, 'mobile'], [1280, 800, 'chromebook']]) {
  for (const [name, hash, prefs] of SHOTS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    if (prefs) await ctx.addInitScript((p) => localStorage.setItem('nyvo-v4', JSON.stringify(p)), prefs);
    const page = await ctx.newPage();
    await page.goto(base + hash);
    await page.waitForTimeout(250);
    if (name === '16-recherche') await page.keyboard.type('pa');
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${out}/${name}-${suffix}.jpg`, type: 'jpeg', quality: 80, fullPage: !hash.includes('p=') });
    await ctx.close();
  }
}
await browser.close();
console.log(`Captures enregistrées dans ${out}`);
