import { test, expect } from '@playwright/test';

const BASE = process.env.NYVO_URL || '/';
const FILE = BASE.startsWith('file:');
const fixture = { id: 123, kickoff: '2026-10-18T19:00:00Z', league: { id: 61, name: 'Ligue 1', season: 2026 }, home: { id: 10, name: 'Équipe test domicile' }, away: { id: 20, name: 'Équipe test extérieur' }, status: '2H', elapsed: 67, extra: null, score: { home: 2, away: 1 }, penalties: {home:null,away:null}, venue: 'Stade test', events: [{ minute: 64, extra: null, team:'Équipe test domicile',player:'Buteur test',type:'Goal',detail:'Normal Goal' }] };
const envelope = data => ({ data, fetchedAt: Date.now(), expiresAt: Date.now()+300000, source:'API-Football',stale:false });
async function fakeAPI(page, mode='ok') {
  await page.route('**/api/pilot/**', async route => {
    const url = new URL(route.request().url());
    let body;
    if(url.pathname.endsWith('/status')) body={configured:true,budget:90,competitions:[{id:61,name:'Ligue 1'},{id:62,name:'Ligue 2'},{id:2,name:'Ligue des champions'}]};
    else if(url.pathname.endsWith('/leagues')) body=envelope({id:61,name:'Ligue 1',seasons:[{year:2026,start:'2026-08-01',end:'2027-06-30',current:true},{year:2023,start:'2023-08-01',end:'2024-06-30',current:false}]});
    else if(mode==='denied') return route.fulfill({status:503,json:{error:'season_unavailable'}});
    else body=envelope([fixture]);
    await route.fulfill({json:body});
  });
}
async function load(page) {
  await page.goto(BASE+'#/reels');
  await page.getByRole('button',{name:'Vérifier la connexion'}).click();
  await page.getByRole('button',{name:'Charger les saisons'}).click();
  await page.getByLabel('Date (Europe/Paris)').fill('2026-10-18');
  await page.getByRole('button',{name:'Afficher les matchs'}).click();
}
test('pilote : configuration absente honnête et démo conservée',async({page})=>{
  await page.goto(BASE+'#/reels');
  await page.getByRole('button',{name:'Vérifier la connexion'}).click();
  await expect(page.getByText(FILE ? /Les matchs réels nécessitent le serveur/ : /La connexion aux données réelles n’est pas encore configurée/)).toBeVisible();
  await page.getByRole('link',{name:'Retour à la démo'}).click();
  await expect(page.getByText('Paris Atlas').first()).toBeVisible();
});
test('pilote : calendrier, fiche, spoiler et préférences sans contenu démo',async({page})=>{
  test.skip(FILE,'API uniquement sur serveur');
  await fakeAPI(page); await load(page);
  await expect(page.getByText('Équipe test domicile')).toBeVisible();
  await expect(page.getByText('Sport Démo',{exact:false})).toHaveCount(0);
  await page.getByRole('button',{name:'Enregistrer',exact:true}).click();
  await expect(page.getByRole('button',{name:'Enregistré',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Sans spoilers : désactivé'}).click();
  await expect(page.getByText('Score masqué')).toBeVisible();
  await expect(page.getByText(/Deuxième période/)).toHaveCount(0);
  await page.getByRole('link',{name:'Voir la fiche'}).click();
  await page.getByRole('button',{name:'Actualiser la fiche'}).click();
  await expect(page.getByText('Buteur test',{exact:false})).toHaveCount(0);
  await page.getByRole('button',{name:'Révéler ce match'}).click();
  await expect(page.getByText(/Buteur test/)).toBeVisible();
  await page.getByRole('button',{name:'Masquer ce match',exact:true}).click();
  await expect(page.getByText('Score masqué')).toBeVisible();
  const prefs=await page.evaluate(()=>JSON.parse(localStorage.getItem('nyvo-v4')));
  expect(prefs.pilot.saved).toEqual([123]); expect(prefs.saved.matches).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test('pilote : saison refusée et changement de saison sans résultat fictif',async({page})=>{
  test.skip(FILE,'API uniquement sur serveur');
  await fakeAPI(page,'denied'); await load(page);
  await expect(page.getByRole('alert')).toContainText('Cette saison n’est pas accessible');
  await expect(page.locator('.pilot-card')).toHaveCount(0);
  await page.getByLabel('Saison',{exact:true}).selectOption('2023');
  await expect(page.getByLabel('Date (Europe/Paris)')).toHaveValue('2023-08-01');
  await expect(page.getByRole('alert')).toHaveCount(0);
});
test('pilote : une panne conserve le score ancien et sa provenance',async({page})=>{
  test.skip(FILE,'API uniquement sur serveur');
  await fakeAPI(page); await load(page);
  await page.route('**/api/pilot/fixtures?**',route=>route.abort());
  await page.getByRole('button',{name:'Afficher les matchs'}).click();
  await expect(page.getByRole('alert')).toContainText('Connexion interrompue');
  await expect(page.getByText('Équipe test domicile')).toBeVisible();
  await expect(page.getByText(/données anciennes, aucun direct garanti/)).toBeVisible();
});
