// Planches de comparaison maquette validée / rendu du prototype (smartphone 390 × 844).
// node scripts/compare.mjs [dossier] [url]   (serveur requis : npm start)
import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';

const out = process.argv[2] || 'docs/captures/comparaisons';
const base = process.argv[3] || 'http://localhost:4173/';
const REF = new URL('../reference/v0.2/01_MAQUETTES_VALIDEES/', import.meta.url);
await mkdir(out, { recursive: true });

const PREFS = {
  version: 3, onboarded: true, country: 'FR',
  follows: { teams: ['paris-atlas', 'milan-stella-f'], competitions: ['coupe-elite', 'ligue-demo'], players: ['jules-martin'] },
  saved: { matches: ['pa-ms'], articles: ['a4'], videos: ['v4'] },
  savedAt: { 'matches:pa-ms': 3, 'articles:a4': 2, 'videos:v4': 1 },
  spoiler: { global: false, teams: [] },
};
const SPOIL = { ...PREFS, spoiler: { global: true, teams: [] } };

const BOARDS = [
  ['01_ACCUEIL', [['#/accueil', PREFS]]],
  ['02_MATCHS', [['#/matchs', { ...PREFS, follows: { ...PREFS.follows, competitions: [] } }]]],
  ['03_FICHE_MATCH', [['#/match/pa-ms', PREFS]]],
  ['04_OU_REGARDER', [['#/match/pa-ms?p=diffusion', PREFS]]],
  ['05_SANS_SPOILERS', [['#/match/pa-ms', SPOIL]]],
  ['06_DIFFUSION_NON_CONFIRMEE_ET_DIRECT_INTERROMPU', [['#/match/msp-lc', PREFS], ['#/match/pa-ms?etat=interrupted', PREFS]]],
  ['07_FAVORIS_MON_ESPACE_ET_ENREGISTRES', [['#/favoris', PREFS], ['#/favoris?vue=enregistres', PREFS]]],
  ['08_PREMIER_LANCEMENT', [['#/bienvenue', null], ['#/bienvenue?etape=2', null]]],
  ['09_ACTUALITES_ET_VIDEOS', [['#/actualites?fil=general', PREFS], ['#/videos', SPOIL]]],
];

const browser = await chromium.launch();
async function shot(hash, prefs) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  if (prefs) await ctx.addInitScript((p) => localStorage.setItem('nyvo-v3', JSON.stringify(p)), prefs);
  const page = await ctx.newPage();
  await page.goto(base + hash);
  await page.waitForTimeout(300);
  const buf = await page.screenshot();
  await ctx.close();
  return buf.toString('base64');
}

for (const [name, states] of BOARDS) {
  const ref = (await readFile(new URL(`${name}.png`, REF))).toString('base64');
  const shots = [];
  for (const [hash, prefs] of states) shots.push(await shot(hash, prefs));
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.setContent(`<body style="margin:0;background:#111;color:#ddd;font:16px system-ui;padding:20px;display:flex;gap:24px;align-items:flex-start">
    <figure style="margin:0"><figcaption style="margin-bottom:8px">Maquette validée · ${name}</figcaption><img src="data:image/png;base64,${ref}" style="height:820px"></figure>
    <figure style="margin:0"><figcaption style="margin-bottom:8px">Prototype V0.3 · Chromium 390 × 844</figcaption><div style="display:flex;gap:12px">${shots
      .map((s) => `<img src="data:image/png;base64,${s}" style="height:820px;border-radius:24px;border:1px solid #333">`)
      .join('')}</div></figure></body>`);
  await page.screenshot({ path: `${out}/${name}.jpg`, type: 'jpeg', quality: 82, fullPage: true });
  await page.close();
}
await browser.close();
console.log(`Comparaisons enregistrées dans ${out}`);
