import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handlePilot } from '../server/pilot.mjs';

function setup(t) {
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../drizzle/0000_low_tana_nile.sql',import.meta.url),'utf8'));
  t.after(()=>sqlite.close());
  const DB={
    withSession(){return this;},
    prepare(sql){let args=[];return {bind(...values){args=values;return this;},async first(){return sqlite.prepare(sql).get(...args)||null;},async run(){return {meta:sqlite.prepare(sql).run(...args)};}};},
    async batch(statements){sqlite.exec('BEGIN');try{const rows=[];for(const s of statements)rows.push(await s.run());sqlite.exec('COMMIT');return rows;}catch(e){sqlite.exec('ROLLBACK');throw e;}},
  };
  let clock=Date.parse('2026-10-18T20:00:00Z'),calls=0;
  const league={league:{id:61,name:'Ligue 1'},seasons:[{year:2026,start:'2026-08-01',end:'2027-06-30',current:true}]};
  const fixture={fixture:{id:123,date:'2026-10-18T19:00:00Z',status:{short:'FT'}},league:{id:61,name:'Ligue 1',season:2026},teams:{home:{id:1,name:'A'},away:{id:2,name:'B'}},goals:{home:2,away:null}};
  let implementation=async url=>({ok:true,json:async()=>({response:url.includes('/leagues?')?[league]:[fixture],errors:[]})});
  const env={DB,API_FOOTBALL_KEY:'test-key-not-real'};
  const call=(path,headers={'oai-authenticated-user-id':'private-test-user'},customEnv=env)=>handlePilot(new Request('https://nyvo.test/api/pilot/'+path,{headers}),customEnv,{now:()=>clock,fetcher:async(...args)=>{calls++;return implementation(...args);}});
  return {call,env,sqlite,fixture,get calls(){return calls;},tick:ms=>clock+=ms,mock:fn=>implementation=fn,clock:()=>clock};
}
test('accès privé, origine, statut sans clé et aucun appel fournisseur',async t=>{
  const s=setup(t);
  assert.equal((await s.call('status',{})).status,401);
  assert.equal((await s.call('status',{'oai-authenticated-user-id':'x',origin:'https://evil.test'})).status,403);
  assert.equal((await (await s.call('status',undefined,{DB:s.env.DB})).json()).configured,false);
  assert.equal((await s.call('leagues?league=61',undefined,{DB:s.env.DB})).status,503);
  assert.equal(s.calls,0);
});
test('cache D1 et quota survivent à une nouvelle invocation sans mémoire locale',async t=>{
  const s=setup(t);const a=await (await s.call('leagues?league=61')).json();
  const b=await (await s.call('leagues?league=61',undefined,{...s.env})).json();
  assert.deepEqual(a,b);assert.equal(s.calls,1);
  assert.equal(s.sqlite.prepare('SELECT used FROM pilot_control').get().used,1);
  assert.ok(!JSON.stringify(a).includes('test-key'));
  assert.ok(!s.sqlite.prepare('SELECT payload FROM pilot_cache').get().payload.includes('test-key'));
});
test('concurrence : 20 demandes ne réservent qu’un appel',async t=>{
  const s=setup(t);const results=await Promise.all(Array.from({length:20},()=>s.call('leagues?league=61')));
  assert.equal(s.calls,1);assert.equal(results.filter(r=>r.status===200).length,1);
  assert.equal(s.sqlite.prepare('SELECT used FROM pilot_control').get().used,1);
});
test('le 90e appel bloque les autres et nouveau jour UTC ouvre un nouveau budget',async t=>{
  const s=setup(t);await s.call('leagues?league=61');
  s.sqlite.exec('DELETE FROM pilot_cache; UPDATE pilot_control SET used=89');s.tick(2000);
  await Promise.all(Array.from({length:10},()=>s.call('leagues?league=61')));
  assert.equal(s.calls,2);s.sqlite.exec('DELETE FROM pilot_cache');s.tick(2000);
  assert.equal((await (await s.call('leagues?league=61')).json()).error,'quota_exhausted');
  s.tick(86400000);assert.equal((await s.call('leagues?league=61')).status,200);
  assert.equal(s.sqlite.prepare('SELECT used FROM pilot_control').get().used,1);
});
test('saisons, détails connus, données nulles et proxy limité',async t=>{
  const s=setup(t);assert.equal((await s.call('leagues?league=39')).status,400);
  assert.equal((await s.call('fixture?id=123')).status,400);
  assert.equal(s.calls,0);await s.call('leagues?league=61');s.tick(2000);
  assert.equal((await s.call('fixtures?league=61&season=2026&date=2027-02-30')).status,400);
  const r=await (await s.call('fixtures?league=61&season=2026&date=2026-10-18')).json();
  assert.equal(r.data[0].score.away,null);s.tick(2000);
  assert.equal((await s.call('fixture?id=123')).status,200);
});
test('panne : conserve ancien cache et date, compte la tentative et applique une pause',async t=>{
  const s=setup(t);const a=await (await s.call('leagues?league=61')).json();
  s.tick(86400001);s.mock(async()=>{throw Error('network');});
  const b=await (await s.call('leagues?league=61')).json();
  assert.equal(b.stale,true);assert.equal(b.fetchedAt,a.fetchedAt);
  await s.call('leagues?league=61');assert.equal(s.calls,2);
});
test('forfait refusé sans fuite du corps fournisseur',async t=>{
  const s=setup(t);s.mock(async()=>({ok:true,json:async()=>({errors:{plan:'secret-body'},response:[]})}));
  const r=await s.call('leagues?league=61');assert.deepEqual(await r.json(),{error:'season_unavailable'});
  assert.equal(s.sqlite.prepare('SELECT used FROM pilot_control').get().used,1);
});
test('réponse tardive après expiration du verrou : ne remplace pas le cache plus récent',async t=>{
  const s=setup(t);let release;
  s.mock(()=>new Promise(resolve=>{release=resolve;}));
  const first=s.call('leagues?league=61');
  while(!release)await new Promise(resolve=>setImmediate(resolve));
  s.tick(31000);s.mock(async()=>({ok:true,json:async()=>({response:[{league:{id:61,name:'Newest'},seasons:[]}]})}));
  assert.equal((await s.call('leagues?league=61')).status,200);
  release({ok:true,json:async()=>({response:[{league:{id:61,name:'Old'},seasons:[]}]})});
  assert.equal((await first).status,429);
  const cache=JSON.parse(s.sqlite.prepare('SELECT payload FROM pilot_cache').get().payload);assert.equal(cache.name,'Newest');
});
test('archives: one season call shared by dates, Paris date filtering and 24h cache',async t=>{
 const s=setup(t);const rows=[{...s.fixture,fixture:{...s.fixture.fixture,date:'2024-08-16T22:30:00Z'},league:{...s.fixture.league,season:2024}},{...s.fixture,fixture:{...s.fixture.fixture,id:124,date:'2024-08-16T19:00:00Z'},league:{...s.fixture.league,season:2024}}];
 s.mock(async url=>{if(url.includes('/leagues?'))return Response.json({response:[{league:{id:61,name:'Ligue 1'},seasons:[{year:2024,start:'2024-08-16',end:'2025-05-29'}]}]});assert.equal(new URL(url).searchParams.has('date'),false);return Response.json({response:rows});});
 await s.call('leagues?league=61');s.tick(2000);
 const first=await (await s.call('fixtures?league=61&season=2024&date=2024-08-16')).json();assert.deepEqual(first.data.map(f=>f.id),[124]);assert.equal(first.expiresAt-first.fetchedAt,86400000);
 const next=await (await s.call('fixtures?league=61&season=2024&date=2024-08-17')).json();assert.deepEqual(next.data.map(f=>f.id),[123]);assert.equal(s.calls,2);
});

test('edge fetch uses manual redirects and rejects redirect responses without following',async t=>{
 const s=setup(t);s.mock(async(url,options)=>{assert.equal(options.redirect,'manual');return new Response(null,{status:302,headers:{location:'https://other.invalid'}})});
 const response=await s.call('leagues?league=61');assert.equal(response.status,503);assert.equal((await response.json()).error,'provider_unavailable');assert.equal(s.calls,1);
});
