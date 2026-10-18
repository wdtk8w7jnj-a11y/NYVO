import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';

test('HTTP pilote : aucune clé demandée au navigateur, routes limitées et refus cross-site', async t => {
  const reservation = createServer().listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const child = spawn(process.execPath, ['scripts/serve.mjs', 'app', String(port)], { cwd: new URL('../../',import.meta.url), env: {...process.env, API_FOOTBALL_KEY:'', NYVO_DATA_DIR:'.nyvo-data-test-unused', NYVO_NO_IFACES:'1'}, stdio:['ignore','pipe','pipe'] });
  let logs=''; child.stdout.on('data', b=>{logs+=b;}); child.stderr.on('data', b=>{logs+=b;});
  t.after(async()=>{if(child.exitCode===null){child.kill('SIGTERM');await once(child,'exit');}});
  await Promise.race([new Promise(resolve=>child.stdout.on('data',()=>{if(logs.includes('localhost:'))resolve();})),new Promise((_,reject)=>{const timer=setTimeout(()=>reject(new Error('Server startup timeout')),5000);timer.unref();})]);
  const base=`http://127.0.0.1:${port}`;
  const status=await fetch(base+'/api/pilot/status'); assert.equal(status.status,200); assert.equal((await status.json()).configured,false);
  for(const options of [{method:'POST'},{headers:{origin:'https://other.example'}},{headers:{'sec-fetch-site':'cross-site'}}]) assert.equal((await fetch(base+'/api/pilot/status',options)).status,403);
  const invalid=await fetch(base+'/api/pilot/anything?url=https://other.example');assert.equal(invalid.status,400);
  assert.equal((await fetch(base+'/api/pilot/leagues?league=61')).status,503);
  for(const path of ['/.env','/server/football.mjs','/%2e%2e%2f.env']) assert.notEqual((await fetch(base+path)).status,200);
  assert.equal((await fetch(base+'/')).status,200);
});
