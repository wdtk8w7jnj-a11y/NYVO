import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createFootball, normalizeFixture } from '../../server/football.mjs';
import { defaults, sanitize } from '../../app/src/state/store.js';
import { fixtureCard, maskedFixture } from '../../app/src/screens/pilot.js';

const league = { league: { id: 61, name: 'Ligue 1' }, seasons: [{ year: 2026, start: '2026-08-01', end: '2027-06-30', current: true, coverage: { fixtures: { events: true } } }] };
const fixture = { fixture: { id: 123, date: '2026-10-18T19:00:00Z', status: { short: '2H', elapsed: 67 }, venue: { name: 'Stade' } }, league: { id: 61, name: 'Ligue 1', season: 2026 }, teams: { home: { id: 10, name: '<script>alert(1)</script>' }, away: { id: 20, name: 'Visiteurs' } }, goals: { home: 2, away: null } };
const listPath = '/api/pilot/fixtures?league=61&season=2026&date=2026-10-18';
async function setup(t, options={}) {
  const directory = await mkdtemp(join(tmpdir(), 'nyvo-test-'));
  let clock = Date.parse('2026-10-18T20:00:00Z');
  let calls = [];
  let impl = async url => ({ ok:true, json: async () => ({ response: url.includes('/leagues?') ? [league] : [fixture], errors: [], paging: { total:1 } }) });
  const config = { directory, key:'test-secret-never-return', now:()=>clock, fetcher:async (...args)=>{calls.push(args);return impl(...args);}, ...options };
  let api = await createFootball(config);
  t.after(async()=>{ await api.close(); await rm(directory,{recursive:true,force:true}); });
  return { get api(){return api;}, calls, directory, tick:(ms=2000)=>clock+=ms, mock:fn=>impl=fn,
    get:path=>api.handle(new URL(path,'http://local')), restart:async()=>{await api.close();api=await createFootball(config);}, config };
}
test('pilote : sans clé, statut local et aucune requête fournisseur', async t=>{
  const s = await setup(t,{key:''}); assert.equal((await s.get('/api/pilot/status')).configured,false);
  await assert.rejects(s.get('/api/pilot/leagues?league=61'), {code:'not_configured'}); assert.equal(s.calls.length,0);
});
test('pilote : cache partagé, requêtes concurrentes regroupées et quota persistant', async t=>{
  const s=await setup(t);
  const results=await Promise.all(Array.from({length:10},()=>s.get('/api/pilot/leagues?league=61')));
  assert.equal(s.calls.length,1); assert.deepEqual(results[0],results[9]);
  s.tick(); await s.get(listPath); assert.equal(s.calls.length,2);
  await s.restart(); await s.get(listPath); assert.equal(s.calls.length,2); assert.equal(s.api.meta().used,2);
  assert.ok(!JSON.stringify(results).includes('test-secret'));
  assert.ok(!(await readFile(join(s.directory,'pilot.json'),'utf8')).includes('test-secret'));
  assert.equal(s.calls[0][1].headers['x-apisports-key'],'test-secret-never-return');
});
test('pilote : plafond quotidien, réserve avant erreur et passage du jour UTC', async t=>{
  const s=await setup(t,{budget:1}); await s.get('/api/pilot/leagues?league=61'); s.tick();
  await assert.rejects(s.get(listPath),{code:'quota_exhausted'}); assert.equal(s.calls.length,1);
  s.tick(86400000); await s.get(listPath); assert.equal(s.calls.length,2); assert.equal(s.api.meta().used,1);
});
test('pilote : erreurs HTTP 200 de forfait explicites et frein aux nouvelles demandes', async t=>{
  const s=await setup(t); await s.get('/api/pilot/leagues?league=61'); s.tick();
  s.mock(async()=>({ok:true,json:async()=>({errors:{plan:'sensitive upstream body'},response:[]})}));
  await assert.rejects(s.get(listPath),{code:'season_unavailable'});
  assert.equal(s.api.meta().used,2);
  s.tick(); await assert.rejects(s.get(listPath),{code:'provider_paused'}); assert.equal(s.calls.length,2);
});
test('pilote : timeout conserve les données anciennes sans rajeunir leur date', async t=>{
  const s=await setup(t); await s.get('/api/pilot/leagues?league=61'); s.tick(); const first=await s.get(listPath);
  s.tick(301000); s.mock(async()=>{throw new Error('timeout with secret');}); const stale=await s.get(listPath);
  assert.equal(stale.stale,true); assert.equal(stale.fetchedAt,first.fetchedAt); assert.equal(stale.reason,'provider_unavailable'); assert.equal(s.api.meta().used,3);
  await s.get(listPath); assert.equal(s.calls.length,3);
});
test('pilote : pas de proxy libre, pas de saison inventée ni de détail inconnu', async t=>{
  const s=await setup(t);
  for(const path of ['/api/pilot/fixtures?url=https://evil.test', '/api/pilot/leagues?league=39', '/api/pilot/leagues?league=61&league=61', '/api/pilot/fixture?id=123', listPath]) await assert.rejects(s.get(path));
  assert.equal(s.calls.length,0);
  await s.get('/api/pilot/leagues?league=61'); s.tick();
  await assert.rejects(s.get(listPath.replace('2026-10-18','2027-02-30')), {code:'invalid_selection'});
  await s.get(listPath); s.tick(); await s.get('/api/pilot/fixture?id=123'); assert.equal(s.calls.length,3);
});
test('pilote : second serveur refusé et fichier corrompu ne remet pas le compteur à zéro', async t=>{
  const s=await setup(t); await assert.rejects(createFootball(s.config), {code:'EEXIST'});
  await s.api.close(); await writeFile(join(s.directory,'pilot.json'),'broken');
  await assert.rejects(createFootball(s.config), /storage unreadable/);
});
test('pilote : réponses incohérentes ou paginées refusées', async t=>{
  const s=await setup(t); await s.get('/api/pilot/leagues?league=61'); s.tick();
  s.mock(async()=>({ok:true,json:async()=>({response:[{...fixture,league:{id:39,season:2026}}]})}));
  await assert.rejects(s.get(listPath),{code:'invalid_response'});
  s.tick(121000); s.mock(async()=>({ok:true,json:async()=>({response:[fixture],paging:{total:2}})}));
  await assert.rejects(s.get(listPath),{code:'invalid_response'});
});
test('pilote : normalisation conserve null, absence événements et statut suspendu', ()=>{
  const f=normalizeFixture(fixture); assert.equal(f.score.away,null); assert.equal(f.events,null);
  assert.equal(normalizeFixture({...fixture,fixture:{...fixture.fixture,status:{short:'SUSP'}}}).status,'SUSP');
  assert.throws(()=>normalizeFixture({}),{code:'invalid_response'});
});
test('pilote : clé refusée et limite fournisseur sont distinguées sans exposer le corps', async t=>{
  const s=await setup(t);
  s.mock(async()=>({ok:false,status:401}));
  await assert.rejects(s.get('/api/pilot/leagues?league=61'),{code:'access_denied'});
  s.tick(121000);s.mock(async()=>({ok:false,status:429}));
  await assert.rejects(s.get('/api/pilot/leagues?league=61'),{code:'quota_exhausted'});
  s.tick();await assert.rejects(s.get('/api/pilot/leagues?league=61'),{code:'provider_paused'});
  assert.equal(s.calls.length,2);
});
test('pilote : pas de spoilers dans le HTML, échappement et préférences séparées', ()=>{
  const prefs=defaults(); const ctx={prefs,session:{}}; const f=normalizeFixture(fixture);
  prefs.spoiler.global=true; let html=String(fixtureCard(f,ctx));
  assert.ok(html.includes('Score masqué')); assert.ok(!html.includes('Deuxième période')); assert.ok(!html.includes('<script>')); assert.ok(!html.includes('Sport Démo'));
  assert.ok(html.includes('Diffusion non confirmée'));
  ctx.session.pilot.revealed.add(f.id); assert.equal(maskedFixture(f,ctx),false);
  prefs.pilot.saved=[123,-1,'123']; prefs.pilot.spoilerTeams=[10]; prefs.spoiler.global=false; ctx.session.pilot.revealed.clear();
  assert.equal(maskedFixture(f,ctx),true); assert.deepEqual(sanitize(prefs).pilot.saved,[123]); assert.deepEqual(sanitize(prefs).saved.matches,[]);
});
