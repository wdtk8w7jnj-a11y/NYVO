// Parcours de recette Premium sur le serveur local (scripts/dev-fixtures.mjs).
// Lancer : node scripts/dev-fixtures.mjs 4183 "" 2026-10-20T16:30:00Z puis
// NYVO_URL=http://127.0.0.1:4183/ npx playwright test -c tests/e2e/playwright.config.mjs
import {test,expect} from '@playwright/test';
const BASE=process.env.NYVO_URL||'http://127.0.0.1:4183/';
const prefs=(extra={})=>JSON.stringify({version:4,onboarded:true,country:'FR',spoiler:{global:false,teams:[]},pilot:{saved:[],spoilerMatches:[],spoilerTeams:[],followedTeams:[1000000516,1000000524],savedVideos:[],seenVideos:[],videoLanguage:'fr',competitions:[2015,2001],competitionsVersion:2,savedNews:[]},...extra});
async function open(page,hash,extra){
 await page.clock.install({time:new Date('2026-10-20T16:30:00Z')});
 await page.addInitScript(v=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem('nyvo-v4',v);sessionStorage.setItem('seeded','1')}},prefs(extra));
 await page.goto(BASE+hash);
}
const calls=page=>{const list=[];page.on('request',r=>{const u=new URL(r.url());list.push(u.pathname+u.search)});return list};

test('accueil : une éditoriale, matchs suivis, au plus deux résumés, aucune illustration de stade',async({page})=>{
 await open(page,'#/accueil');
 await expect(page.locator('.pm-lead').first()).toBeVisible();
 await expect(page.getByRole('heading',{name:'Vos matchs'})).toBeVisible();
 expect(await page.locator('.pm-rail .pm-vcard').count()).toBeLessThanOrEqual(2);
 expect(await page.locator('img[src*="football-editorial"]').count()).toBe(0);
 await expect(page.locator('body')).not.toContainText('Information rapportée');
});

test('matchs : liste unifiée, filtre local sans appel fournisseur, retour avec date, filtres et défilement conservés',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await open(page,'#/matchs');
 await expect(page.locator('.pm-row').first()).toBeVisible();
 await expect(page.getByRole('tab',{name:/Ligue des champions/})).toHaveCount(0);
 await page.locator('[data-action="pm-day"][data-value="2026-10-21"]').first().click();
 const list=calls(page);
 await page.getByRole('button',{name:/^Filtres/}).click();
 await page.locator('[data-action="pm-draft-set"][data-key="competition"][data-value="2001"]').click();
 await page.getByRole('button',{name:'Appliquer'}).click();
 await expect(page.locator('.pm-count')).toHaveText('1');
 expect(list.filter(u=>u.startsWith('/api/pilot/')||u.startsWith('/api/content/')).length).toBe(0);
 const rows=page.locator('.pm-row');expect(await rows.count()).toBeGreaterThan(2);
 await page.evaluate(()=>window.scrollTo(0,400));const y=await page.evaluate(()=>scrollY);
 await rows.nth(2).locator('.pm-rowlink').click();
 await expect(page.locator('.sig-detailhead h1')).toHaveText('Fiche match');
 await page.goBack();
 await expect(page.locator('[data-action="pm-day"][aria-pressed="true"]').first()).toHaveAttribute('data-value','2026-10-21');
 await expect(page.locator('.pm-count')).toHaveText('1');
 expect(Math.abs(await page.evaluate(()=>scrollY)-y)).toBeLessThan(40);
});

test('journée vide : message, vraies dates proposées, la date choisie ne change pas seule',async({page})=>{
 await open(page,'#/matchs');
 await page.locator('[data-action="pm-day"][data-value="2026-10-19"]').first().click();
 await expect(page.locator('.sig-empty h2')).toHaveText('Aucune rencontre ce jour-là');
 await expect(page.locator('[data-action="pm-day"][aria-pressed="true"]').first()).toHaveAttribute('data-value','2026-10-19');
 const next=page.locator('.sig-empty [data-action="pm-day"]').first();
 await expect(next).toHaveAttribute('data-value','2026-10-20');
 await expect(next).toContainText('mardi 20 octobre');
});

test('score absent : jamais zéro, tiret neutre',async({page})=>{
 await open(page,'#/matchs');
 await page.locator('[data-action="pm-day"][data-value="2026-10-17"]').first().click();
 const unknown=page.locator('.pm-score',{hasText:'Score indisponible'});
 if(await unknown.count())await expect(unknown.first().locator('b')).toHaveText('–');
});

test('vidéo : zéro iframe, zéro IFrame API, bouton externe vers l’URL canonique',async({page})=>{
 const list=calls(page);
 await open(page,'#/videos?video=cfbv7R2jw8E');
 const cta=page.getByRole('link',{name:/Voir sur YouTube/});
 await expect(cta).toHaveAttribute('href','https://www.youtube.com/watch?v=cfbv7R2jw8E');
 await expect(cta).toHaveAttribute('target','_blank');
 await expect(cta).toHaveAttribute('rel',/noopener/);
 expect(await page.locator('iframe').count()).toBe(0);
 expect(list.some(u=>u.includes('iframe_api')||u.includes('/embed/'))).toBe(false);
});

test('vidéo absente du catalogue : aucune autre rencontre substituée',async({page})=>{
 await open(page,'#/videos?video=AAAAAAAAAAA');
 await expect(page.locator('.sig-empty h2')).toHaveText('Vidéo indisponible');
 expect(await page.locator('.pm-vcard').count()).toBe(0);
});

test('sans spoilers : scores, titres et miniatures des résumés masqués avant révélation',async({page})=>{
 const list=calls(page);
 await open(page,'#/accueil',{spoiler:{global:true,teams:[]}});
 await expect(page.locator('.pm-score.is-masked').first()).toBeVisible();
 expect(await page.locator('.pm-row .pm-score b').count()).toBe(0);
 expect(list.some(u=>u.includes('ytimg'))).toBe(false);
 await expect(page.locator('body')).not.toContainText('Troyes – Marseille · Résumé');
 await page.goto(BASE+'#/videos?video=cfbv7R2jw8E');
 await expect(page.locator('.pm-hero16.is-masked')).toBeVisible();
 await page.getByRole('button',{name:'Révéler cette vidéo'}).click();
 await expect(page.getByRole('link',{name:/Voir sur YouTube/})).toBeVisible();
});

test('article CR7 : chapô, intertitres, signature, crédits ; pas de photo non vérifiée',async({page})=>{
 await open(page,'#/actualites?story=anecdote-cr7-dix-sept-2014');
 await expect(page.locator('.pm-article h1')).toContainText('Dix-sept buts');
 await expect(page.locator('.pm-byline')).toContainText('Rédaction NYVO');
 expect(await page.locator('.pm-article h2').count()).toBeGreaterThanOrEqual(3);
 await expect(page.locator('.pm-record strong')).toHaveText('17 buts');
 expect(await page.locator('img[src*="Final_Champions_League_2014"]').count()).toBe(0);
 for(const fig of await page.locator('.pm-figure,.pm-cover').all())await expect(fig.locator('figcaption')).not.toBeEmpty();
});

test('favoris et préférences persistants après rechargement',async({page})=>{
 await open(page,'#/matchs');
 await page.locator('[data-action="pm-day"][data-value="2026-10-21"]').first().click();
 const star=page.locator('.pm-row .sig-save').first();await star.click();
 await expect(star).toHaveAttribute('aria-pressed','true');
 await page.reload();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('nyvo-v4')).pilot);
 expect(saved.saved.length).toBe(1);expect(saved.followedTeams).toEqual([1000000516,1000000524]);
});
