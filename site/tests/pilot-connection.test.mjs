import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {handlePilot} from '../server/pilot.mjs';
const html = readFileSync(new URL('../public/nyvo.html', import.meta.url), 'utf8');
const transport = html.slice(html.indexOf('async function vt('), html.indexOf('function da('));
function setup(fetch, timers={setTimeout,clearTimeout}) {
  const state={busy:false,error:null,status:null}; const snapshots=[];
  const ctx={refresh(){snapshots.push({...state})}};
  const runtime={q:()=>state,Zt:{offline:'offline',static:'static',invalid_response:'invalid',unavailable:'unavailable'},AbortController,fetch,location:{protocol:'https:'},...timers};
  vm.createContext(runtime);vm.runInContext(transport,runtime);
  return {state,snapshots,run:()=>runtime.vt(ctx,'status',v=>{state.status=v})};
}
test('real server handler without key produces a visible configuration result',async()=>{
  const t=setup(()=>handlePilot(new Request('https://nyvo.test/api/pilot/status',{headers:{'oai-authenticated-user-id':'test-owner'}}),{}));
  await t.run();assert.equal(t.state.status.configured,false);assert.equal(t.state.error,null);assert.equal(t.snapshots[0].busy,true);assert.equal(t.snapshots.at(-1).busy,false);
});
test('expired session gets a specific error and retry remains possible',async()=>{
  let n=0;const t=setup(async()=> ++n===1?new Response('',{status:401}):Response.json({configured:false}));
  await t.run();assert.equal(t.state.error,'unauthorized');await t.run();assert.equal(t.state.error,null);assert.equal(t.state.status.configured,false);
});
test('null, HTML and malformed status never silently leave the initial state',async()=>{
  for(const value of [null,{}, {configured:'false'}, {configured:true}]) {const t=setup(async()=>Response.json(value));await t.run();assert.equal(t.state.error,'invalid_response');}
  const t=setup(async()=>new Response('<html>Login</html>'));await t.run();assert.equal(t.state.error,'invalid_response');
});
test('network failure and timeout settle, with no duplicate request while loading',async()=>{
  let reject;let requests=0;let timeout;
  const t=setup((url,{signal})=>{requests++;return new Promise((a,b)=>{reject=b;signal.addEventListener('abort',()=>b(Object.assign(new Error(),{name:'AbortError'})))})},{setTimeout:fn=>{timeout=fn},clearTimeout(){}});
  const pending=t.run();await t.run();assert.equal(requests,1);timeout();await pending;assert.equal(t.state.error,'timeout');assert.equal(t.state.busy,false);
  const f=setup(async()=>{throw new TypeError('Failed to fetch')});await f.run();assert.equal(f.state.error,'offline');
});

test('match results and errors are brought into view; navigating away cancels scrolling',async()=>{
  const state={busy:false,error:null};let refreshed=0;const seen=[];const frames=[];
  const runtime={q:()=>state,Zt:{offline:'offline',unavailable:'unavailable'},AbortController,setTimeout,clearTimeout,
    location:{protocol:'https:',hash:'#/reels'},fetch:async()=>Response.json({data:[]}),
    requestAnimationFrame:fn=>frames.push(fn),document:{getElementById:id=>({focus:()=>seen.push(['focus',id]),scrollIntoView:()=>seen.push(['scroll',id])})}};
  vm.createContext(runtime);vm.runInContext(transport,runtime);
  const ctx={refresh(){refreshed++}};
  await runtime.vt(ctx,'fixtures?date=2026-10-19',v=>{state.list=v},'pilot-results');
  frames.shift()();assert.deepEqual(state.list.data,[]);assert.deepEqual(seen.at(-1),['scroll','pilot-results']);assert.equal(refreshed,2);
  runtime.fetch=async()=>Response.json({error:'unavailable'},{status:503});
  await runtime.vt(ctx,'fixtures',()=>{},'pilot-results');frames.shift()();assert.deepEqual(seen.at(-1),['scroll','pilot-error']);
  const before=seen.length;
  runtime.fetch=async()=>{runtime.location.hash='#/accueil';return Response.json({data:[]})};
  await runtime.vt(ctx,'fixtures',()=>{},'pilot-results');assert.equal(frames.length,0);assert.equal(seen.length,before);
});

test('published inline application remains valid JavaScript',()=>{
  const code=html.slice(html.indexOf('<script>')+8,html.indexOf('</script>',html.indexOf('<script>')));
  assert.doesNotThrow(()=>new vm.Script(code));
  assert.match(html,/id="pilot-results"/);
  assert.match(html,/La recherche est terminée/);
});
