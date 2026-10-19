// Captures de recette : iPhone 12 (390 × 844 CSS) et desktop, horloge figée.
// Usage : node scripts/captures.mjs <url du serveur local> <dossier> [horloge ISO]
import {chromium} from '@playwright/test';
import {mkdirSync} from 'node:fs';

const [base='http://127.0.0.1:4180/',out='captures',clockIso='2026-10-20T16:30:00Z']=process.argv.slice(2);
mkdirSync(out,{recursive:true});
const prefs=(extra={})=>({version:4,onboarded:true,country:'FR',lang:'fr',follows:{teams:[],competitions:[],players:[]},saved:{matches:[],articles:[],videos:[]},savedAt:{},spoiler:{global:false,teams:[]},
 pilot:{saved:[1000559664],spoilerMatches:[],spoilerTeams:[],followedTeams:[1000000516,1000000524],savedVideos:[],seenVideos:[],videoLanguage:'fr',competitions:[2015,2001],competitionsVersion:2,savedNews:[]},access:{},searchHistory:[],accountCardDismissed:true,...extra});
const shots=[
 ['01-accueil','#/accueil'],
 ['02-matchs','#/matchs'],
 ['03-matchs-filtres','#/matchs',async p=>{await p.getByRole('button',{name:/Filtres/}).first().click();await p.waitForTimeout(400)}],
 ['04-fiche-match','#/reels?id=1000559671'],
 ['05-videos','#/videos'],
 ['06-fiche-video','#/videos?video=cfbv7R2jw8E'],
 ['07-actualites','#/actualites'],
 ['08-article-cr7','#/actualites?story=anecdote-cr7-dix-sept-2014'],
 ['09-equipe','#/reels?team=1000000516'],
 ['10-favoris','#/favoris'],
 ['11-sans-spoilers-accueil','#/accueil',null,{spoiler:{global:true,teams:[]}}],
 ['12-matchs-journee-vide','#/matchs',async p=>{await p.evaluate(()=>{location.hash='#/matchs';});const day=p.locator('[data-action="sig-date"],[data-action="premium-day"]').first();await p.evaluate(()=>{const s=window.__nyvo.session;s.real&&(s.real.date='2026-10-19');window.__nyvo.render('replace')});await p.waitForTimeout(300)}],
];
const browser=await chromium.launch();
for(const [device,opts] of [['iphone12',{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}],['desktop',{viewport:{width:1440,height:900},deviceScaleFactor:1}]]){
 for(const [name,hash,act,extra] of shots){
  const ctx=await browser.newContext({...opts,locale:'fr-FR',timezoneId:'Europe/Paris',colorScheme:'dark'});
  const page=await ctx.newPage();
  await page.clock.install({time:new Date(clockIso)});
  await page.addInitScript(v=>{try{localStorage.setItem('nyvo-v4',v)}catch{}},JSON.stringify(prefs(extra)));
  const external=[];page.on('request',r=>{const u=new URL(r.url());if(!['127.0.0.1','localhost'].includes(u.hostname))external.push(u.hostname)});
  await page.goto(base+hash);await page.waitForTimeout(900);
  if(act)await act(page);
  await page.waitForTimeout(400);
  await page.screenshot({path:`${out}/${device}-${name}.png`,fullPage:device==='iphone12'&&!name.includes('filtres')});
  if(external.length)console.log(name,device,'requêtes externes tentées (bloquées hors ligne) :',[...new Set(external)].join(', '));
  await ctx.close();
 }
}
await browser.close();
console.log('captures →',out);
