import { COMPETITIONS, PilotError, normalizeFixture } from './provider.mjs';
const UPSTREAM = 'https://v3.football.api-sports.io/';
const TTL = { leagues:86400000, fixtures:300000 };
const json = (value, status=200) => Response.json(value, {status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});

export async function handlePilot(request, env, {fetcher=fetch, now=Date.now, uuid=()=>crypto.randomUUID(),serviceAuthorized=false}={}) {
  const url=new URL(request.url);
  // Sites dispatch authenticates these headers; no public access is granted here.
  if(!serviceAuthorized && !request.headers.get('oai-authenticated-user-id')) return json({error:'unauthorized'},401);
  if(request.method!=='GET' || (request.headers.get('origin') && request.headers.get('origin')!==url.origin) || (request.headers.get('sec-fetch-site') && !['same-origin','none'].includes(request.headers.get('sec-fetch-site')))) return json({error:'forbidden'},403);
  const statusPath=url.pathname==='/api/pilot/status' && !url.search;
  const key=env.API_FOOTBALL_KEY;
  if(statusPath) return json({configured:Boolean(key && env.DB),source:'API-Football',competitions:COMPETITIONS,budget:90,preferredSeason:2024,automaticRefresh:false,refreshSeconds:300});
  if(!key) return json({error:'not_configured'},503);
  if(!env.DB) return json({error:'unavailable'},503);
  const db=env.DB.withSession ? env.DB.withSession('first-primary') : env.DB;
  const first=(sql,...args)=>db.prepare(sql).bind(...args).first();
  const run=(sql,...args)=>db.prepare(sql).bind(...args).run();
  const q=Object.fromEntries(url.searchParams);
  const exact=keys=>Object.keys(q).every(k=>keys.includes(k)) && [...url.searchParams.keys()].length===Object.keys(q).length;
  let endpoint,params,cached,cacheKey,token;
  let archive=false,stage='cache';
  const selectDate=data=>archive ? data.filter(f=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(f.kickoff))===q.date) : data;
  const result=(entry,stale=false,reason=null)=>({data:selectDate(JSON.parse(entry.payload)),fetchedAt:entry.fetched_at,expiresAt:entry.expires_at,stale,reason,source:'API-Football'});
  try {
    if(url.pathname==='/api/pilot/leagues' && exact(['league']) && COMPETITIONS.some(c=>String(c.id)===q.league)) {
      endpoint='leagues';params={id:q.league};
    } else if(url.pathname==='/api/pilot/fixtures' && exact(['league','season','date']) && COMPETITIONS.some(c=>String(c.id)===q.league) && /^\d{4}$/.test(q.season) && /^\d{4}-\d{2}-\d{2}$/.test(q.date)) {
      const catalog=await first('SELECT payload FROM pilot_cache WHERE key=?',`leagues?id=${q.league}`);
      const season=catalog && JSON.parse(catalog.payload).seasons.find(s=>String(s.year)===q.season);
      if(!season || q.date<season.start || q.date>season.end || !Number.isFinite(Date.parse(q.date)) || new Date(q.date).toISOString().slice(0,10)!==q.date) throw new PilotError('invalid_selection',400);
      // Historical seasons are retrieved through the provider's supported season query.
      // Share one archive cache across dates; filter locally in the displayed timezone.
      archive=Number(q.season)<new Date(now()).getUTCFullYear();
      endpoint='fixtures';params={league:q.league,season:q.season,...(archive?{}:{date:q.date}),timezone:'Europe/Paris'};
    } else if(url.pathname==='/api/pilot/fixture' && exact(['id']) && /^[1-9]\d{0,9}$/.test(q.id)) {
      if(!await first('SELECT id FROM pilot_fixtures WHERE id=?',Number(q.id))) throw new PilotError('unknown_fixture',400);
      endpoint='fixtures';params={id:q.id};
    } else throw new PilotError('invalid_request',400);
    cacheKey=`${endpoint}?${new URLSearchParams(params)}`;
    cached=await first('SELECT * FROM pilot_cache WHERE key=?',cacheKey);
    if(cached && cached.expires_at>now()) return json(result(cached));
    await run("INSERT OR IGNORE INTO pilot_control (id) VALUES ('global')");
    const instant=now(),day=new Date(instant).toISOString().slice(0,10),reservation=uuid();
    // Atomic across Workers: reserve the attempt and acquire a bounded lease.
    const acquired=await first(`UPDATE pilot_control SET used=CASE WHEN day=? THEN used+1 ELSE 1 END,day=?,token=?,lock_until=?,last_call=?
      WHERE id='global' AND (day<>? OR used<90) AND lock_until<=? AND blocked_until<=? AND last_call<=? RETURNING id`,day,day,reservation,instant+30000,instant,day,instant,instant,instant-1200);
    if(!acquired) {
      const control=await first("SELECT * FROM pilot_control WHERE id='global'");
      const code=control?.day===day && control.used>=90 ? 'quota_exhausted' : control?.blocked_until>instant ? 'provider_paused' : 'slow_down';
      throw new PilotError(code,429);
    }
    token=reservation;
    stage='upstream';
    const response=await fetcher(UPSTREAM+cacheKey,{headers:{'x-apisports-key':key},signal:AbortSignal.timeout(10000),redirect:'manual'});
    if(!response.ok) throw new PilotError(response.status===429?'rate_limited':[401,403].includes(response.status)?'access_denied':'provider_unavailable',503);
    stage='decode';
    const payload=await response.json();
    if(payload.errors && Object.keys(payload.errors).length) {
      console.error(JSON.stringify({event:'provider_rejection',fields:Object.keys(payload.errors),rateLimit:payload.errors.rateLimit?String(payload.errors.rateLimit).split(key).join('[redacted]').slice(0,200):null}));
      throw new PilotError(payload.errors.plan?'season_unavailable':payload.errors.token?'access_denied':payload.errors.rateLimit?'rate_limited':payload.errors.requests?'quota_exhausted':'provider_error');
    }
    if(!Array.isArray(payload.response)||(payload.paging?.total??1)>1) throw new PilotError('invalid_response');
    let data;
    if(endpoint==='leagues') {
      const league=payload.response.find(r=>r.league?.id===Number(params.id));
      if(!league||!Array.isArray(league.seasons)) throw new PilotError('coverage_unavailable');
      data={id:league.league.id,name:String(league.league.name||'').slice(0,200),seasons:league.seasons.filter(s=>Number.isInteger(s.year)&&/^\d{4}-\d{2}-\d{2}$/.test(s.start)&&/^\d{4}-\d{2}-\d{2}$/.test(s.end)).map(s=>({year:s.year,start:s.start,end:s.end,current:s.current===true,events:s.coverage?.fixtures?.events===true}))};
    } else {
      data=payload.response.map(normalizeFixture);
      if(data.some(f=>!COMPETITIONS.some(c=>c.id===f.league.id)||(params.league&&(f.league.id!==Number(params.league)||f.league.season!==Number(params.season)))||(params.id&&f.id!==Number(params.id)))) throw new PilotError('invalid_response');
    }
    stage='persist';
    const at=now(),expires=at+(archive?86400000:TTL[endpoint]);
    // An expired lease must not overwrite a newer response.
    const statements=[db.prepare(`INSERT INTO pilot_cache (key,fetched_at,expires_at,payload) SELECT ?,?,?,? FROM pilot_control WHERE id='global' AND token=? AND lock_until>?
      ON CONFLICT(key) DO UPDATE SET fetched_at=excluded.fetched_at,expires_at=excluded.expires_at,payload=excluded.payload`).bind(cacheKey,at,expires,JSON.stringify(data),token,at)];
    if(endpoint==='fixtures') for(const f of data) statements.push(db.prepare(`INSERT OR IGNORE INTO pilot_fixtures (id,league,season) SELECT ?,?,? FROM pilot_control WHERE id='global' AND token=? AND lock_until>?`).bind(f.id,f.league.id,f.league.season,token,at));
    const saved=await db.batch(statements);
    if(!saved[0]?.meta?.changes) throw new PilotError('slow_down',429);
    await run('DELETE FROM pilot_cache WHERE key IN (SELECT key FROM pilot_cache ORDER BY fetched_at DESC LIMIT -1 OFFSET 200)');
    return json({data:selectDate(data),fetchedAt:at,expiresAt:expires,stale:false,reason:null,source:'API-Football'});
  } catch(error) {
    const code=error instanceof PilotError?error.code:'provider_unavailable';
    console.error(JSON.stringify({event:'pilot_failure',stage,code,message:String(error.message||'').split(key).join('[redacted]').slice(0,400)}));
    if(token && !['slow_down','provider_paused','season_unavailable'].includes(code)) await run("UPDATE pilot_control SET blocked_until=? WHERE id='global' AND token=?",now()+120000,token).catch(()=>{});
    if(cached) { try{return json(result(cached,true,code));}catch{/* corrupt cache cannot be served */} }
    return json({error:code},error instanceof PilotError?error.status:503);
  } finally {
    if(token) await run("UPDATE pilot_control SET lock_until=0,token=NULL WHERE id='global' AND token=?",token).catch(()=>{});
  }
}
