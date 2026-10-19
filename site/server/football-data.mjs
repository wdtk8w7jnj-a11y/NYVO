import {EDITORIAL} from './editorial.mjs';
import {PilotError} from './provider.mjs';
export const COMPETITIONS=[{id:2015,code:'FL1',name:'Ligue 1'},{id:2001,code:'CL',name:'Ligue des champions'},{id:2021,code:'PL',name:'Premier League'},{id:2002,code:'BL1',name:'Bundesliga'},{id:2014,code:'PD',name:'La Liga'},{id:2019,code:'SA',name:'Serie A'},{id:2003,code:'DED',name:'Eredivisie'},{id:2017,code:'PPL',name:'Primeira Liga'},{id:2016,code:'ELC',name:'Championship'},{id:2013,code:'BSA',name:'Série A brésilienne'},{id:2000,code:'WC',name:'Coupe du monde'},{id:2018,code:'EC',name:'Euro'}];
const SOURCE='football-data.org';
const OFFSET=1000000000; // Provider namespace: preserve existing API-Football favorites without collisions.
const integer=n=>Number.isSafeInteger(n)&&n>=0?n:null;
const crest=s=>typeof s==='string'&&/^https:\/\/crests\.football-data\.org\/[A-Za-z0-9_.-]+$/.test(s)?s:null;
const str=s=>typeof s==='string'?s.slice(0,200):null;
const day=t=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(t));
export function normalizeMatch(row){
 if(!integer(row?.id)||!integer(row?.homeTeam?.id)||!integer(row?.awayTeam?.id)||!Number.isFinite(Date.parse(row.utcDate)))throw new PilotError('invalid_response');
 const status={SCHEDULED:'NS',TIMED:'NS',IN_PLAY:'LIVE',PAUSED:'HT',EXTRA_TIME:'ET',PENALTY_SHOOTOUT:'P',FINISHED:'FT',SUSPENDED:'SUSP',POSTPONED:'PST',CANCELLED:'CANC',AWARDED:'AWD'}[row.status]||null;
 return {id:OFFSET+row.id,kickoff:row.utcDate,league:{id:row.competition.id,name:str(row.competition.name),emblem:crest(row.competition.emblem),season:Number(row.season?.startDate?.slice(0,4)),round:str(row.stage),matchday:integer(row.matchday)},home:{id:OFFSET+row.homeTeam.id,name:str(row.homeTeam.name),shortName:str(row.homeTeam.shortName),crest:crest(row.homeTeam.crest)},away:{id:OFFSET+row.awayTeam.id,name:str(row.awayTeam.name),shortName:str(row.awayTeam.shortName),crest:crest(row.awayTeam.crest)},status,elapsed:null,extra:null,score:{home:integer(row.score?.fullTime?.home),away:integer(row.score?.fullTime?.away)},penalties:{home:integer(row.score?.penalties?.home),away:integer(row.score?.penalties?.away)},venue:str(row.venue),events:null};
}
const json=(v,status=200)=>Response.json(v,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
export async function handlePilot(request,env,{fetcher=fetch,now=Date.now,uuid=()=>crypto.randomUUID(),sleep=ms=>new Promise(r=>setTimeout(r,ms)),serviceAuthorized=false}={}){
 const url=new URL(request.url),key=env.FOOTBALL_DATA_TOKEN;
 if(!serviceAuthorized&&!request.headers.get('oai-authenticated-user-id'))return json({error:'unauthorized'},401);
 if(request.method!=='GET'||(request.headers.get('origin')&&request.headers.get('origin')!==url.origin)||(request.headers.get('sec-fetch-site')&&!['same-origin','none'].includes(request.headers.get('sec-fetch-site'))))return json({error:'forbidden'},403);
 if(url.pathname==='/api/pilot/status'&&!url.search)return json({configured:Boolean(key&&env.DB),source:SOURCE,competitions:COMPETITIONS,budget:1000,automaticRefresh:false,refreshSeconds:300,delayed:true});
 if(url.pathname==='/api/pilot/editorial'&&!url.search)return json(EDITORIAL);
 if(!key)return json({error:'not_configured'},503);if(!env.DB)return json({error:'unavailable'},503);
 const db=env.DB.withSession?env.DB.withSession('first-primary'):env.DB;
 const first=(sql,...args)=>db.prepare(sql).bind(...args).first();
 const run=(sql,...args)=>db.prepare(sql).bind(...args).run();
 const q=Object.fromEntries(url.searchParams),exact=keys=>Object.keys(q).every(k=>keys.includes(k))&&[...url.searchParams.keys()].length===Object.keys(q).length;
 let path,kind,cacheKey,cached,token;
 const select=data=>kind==='fixtures'?data.filter(f=>day(f.kickoff)===q.date):data;
 const result=(entry,stale=false,reason=null)=>({data:select(JSON.parse(entry.payload)),fetchedAt:entry.fetched_at,expiresAt:entry.expires_at,stale,reason,source:SOURCE,delayed:true});
 try{
  const comp=COMPETITIONS.find(c=>String(c.id)===q.league);
  if(url.pathname==='/api/pilot/leagues'&&exact(['league'])&&comp){kind='leagues';path=`competitions/${comp.code}`;}
  else if(url.pathname==='/api/pilot/fixtures'&&exact(['league','season','date'])&&comp&&/^\d{4}$/.test(q.season)&&/^\d{4}-\d{2}-\d{2}$/.test(q.date)){
   const catalog=await first('SELECT payload FROM pilot_cache WHERE key=?',`fd:competitions/${comp.code}`);
   const season=catalog&&JSON.parse(catalog.payload).seasons.find(s=>String(s.year)===q.season);
   if(!season||q.date<season.start||q.date>season.end||!Number.isFinite(Date.parse(q.date))||new Date(q.date).toISOString().slice(0,10)!==q.date)throw new PilotError('invalid_selection',400);
   kind='fixtures';path=`competitions/${comp.code}/matches?season=${q.season}`;
  }else if(url.pathname==='/api/pilot/season'&&exact(['league','season'])&&comp&&/^\d{4}$/.test(q.season)){
   const catalog=await first('SELECT payload FROM pilot_cache WHERE key=?',`fd:competitions/${comp.code}`);
   if(!catalog||!JSON.parse(catalog.payload).seasons.some(s=>String(s.year)===q.season&&s.current))throw new PilotError('season_unavailable',403);
   kind='season';path=`competitions/${comp.code}/matches?season=${q.season}`;
  }else if(url.pathname==='/api/pilot/standings'&&exact(['league'])&&comp){
   kind='standings';path=`competitions/${comp.code}/standings`;
  }else if(url.pathname==='/api/pilot/fixture'&&exact(['id'])&&/^1\d{9}$/.test(q.id)){
   if(!await first('SELECT id FROM pilot_fixtures WHERE id=?',Number(q.id)))throw new PilotError('unknown_fixture',400);
   kind='fixture';path=`matches/${Number(q.id)-OFFSET}`;
  }else throw new PilotError('invalid_request',400);
  cacheKey='fd:'+path;cached=await first('SELECT * FROM pilot_cache WHERE key=?',cacheKey);
  if(cached&&cached.expires_at>now())return json(result(cached));
  await run("INSERT OR IGNORE INTO pilot_control(id) VALUES ('football-data')");
  const instant=now(),utcDay=new Date(instant).toISOString().slice(0,10),reservation=uuid();
  const acquired=await first(`UPDATE pilot_control SET used=CASE WHEN day=? THEN used+1 ELSE 1 END,day=?,token=?,last_call=MAX(last_call+7000,?),lock_until=MAX(last_call+7000,?)+20000 WHERE id='football-data' AND (day<>? OR used<1000) AND lock_until<=? AND blocked_until<=? RETURNING last_call`,utcDay,utcDay,reservation,instant,instant,utcDay,instant,instant);
  if(!acquired){const c=await first("SELECT * FROM pilot_control WHERE id='football-data'");throw new PilotError(c?.day===utcDay&&c.used>=1000?'quota_exhausted':c?.blocked_until>instant?'rate_limited':'slow_down',429);}
  token=reservation;
  await sleep(Math.max(0,acquired.last_call-now()));
  const response=await fetcher('https://api.football-data.org/v4/'+path,{headers:{'X-Auth-Token':key},signal:AbortSignal.timeout(10000),redirect:'manual'});
  const available=response.headers.get('X-RequestsAvailable'),reset=Number(response.headers.get('X-RequestCounter-Reset')),retry=Number(response.headers.get('Retry-After'));
  if(response.status===429||available==='0')await run("UPDATE pilot_control SET blocked_until=MAX(blocked_until,?) WHERE id='football-data' AND token=?",now()+Math.max(60,Number.isFinite(reset)?reset:0,Number.isFinite(retry)?retry:0)*1000,token);
  if(!response.ok)throw new PilotError(response.status===429?'rate_limited':response.status===401?'access_denied':response.status===403?'season_unavailable':response.status===404?'coverage_unavailable':'provider_unavailable',response.status===429?429:503);
  const payload=await response.json();let data;
  if(kind==='leagues'){
   if(payload.id!==comp.id||!payload.currentSeason?.startDate)throw new PilotError('invalid_response');
   const seasons=payload.seasons||[payload.currentSeason];
   data={id:comp.id,name:comp.name,emblem:crest(payload.emblem),seasons:seasons.filter(s=>s.startDate&&s.endDate).map(s=>({year:Number(s.startDate.slice(0,4)),start:s.startDate,end:s.endDate,current:s.id===payload.currentSeason.id,events:false}))};
  }else if(kind==='standings'){
   if(payload.competition?.id!==comp.id||!Array.isArray(payload.standings)||!payload.season?.startDate)throw new PilotError('invalid_response');
   data={competition:comp.id,season:Number(payload.season.startDate.slice(0,4)),tables:payload.standings.filter(t=>t.type==='TOTAL').map(t=>({stage:str(t.stage),group:str(t.group),rows:(t.table||[]).map(r=>{if(!integer(r.team?.id))throw new PilotError('invalid_response');return {position:integer(r.position),team:{id:OFFSET+r.team.id,name:str(r.team.name),crest:crest(r.team.crest)},played:integer(r.playedGames),won:integer(r.won),draw:integer(r.draw),lost:integer(r.lost),points:Number.isSafeInteger(r.points)?r.points:null,goalsFor:integer(r.goalsFor),goalsAgainst:integer(r.goalsAgainst),difference:Number.isSafeInteger(r.goalDifference)?r.goalDifference:null}})}))};
  }else{
   const rows=kind==='fixture'?[payload]:payload.matches;if(!Array.isArray(rows))throw new PilotError('invalid_response');
   data=rows.map(normalizeMatch);if(data.some(f=>!COMPETITIONS.some(c=>c.id===f.league.id)||(comp&&(f.league.id!==comp.id||f.league.season!==Number(q.season)))||(q.id&&f.id!==Number(q.id))))throw new PilotError('invalid_response');
  }
  const at=now(),expires=at+(kind==='leagues'?86400000:kind==='standings'?3600000:300000);
  const statements=[db.prepare(`INSERT INTO pilot_cache(key,fetched_at,expires_at,payload) SELECT ?,?,?,? FROM pilot_control WHERE id='football-data' AND token=? AND lock_until>? ON CONFLICT(key) DO UPDATE SET fetched_at=excluded.fetched_at,expires_at=excluded.expires_at,payload=excluded.payload`).bind(cacheKey,at,expires,JSON.stringify(data),token,at)];
  if(!['leagues','standings'].includes(kind))for(const f of data)statements.push(db.prepare("INSERT OR IGNORE INTO pilot_fixtures(id,league,season) SELECT ?,?,? FROM pilot_control WHERE id='football-data' AND token=? AND lock_until>?").bind(f.id,f.league.id,f.league.season,token,at));
  const saved=await db.batch(statements);if(!saved[0]?.meta?.changes)throw new PilotError('slow_down',429);
  await run('DELETE FROM pilot_cache WHERE key IN (SELECT key FROM pilot_cache ORDER BY fetched_at DESC LIMIT -1 OFFSET 200)');
  return json({data:select(data),fetchedAt:at,expiresAt:expires,stale:false,reason:null,source:SOURCE,delayed:true});
 }catch(error){
  const code=error instanceof PilotError?error.code:'provider_unavailable';
  if(token&&code==='provider_unavailable')await run("UPDATE pilot_control SET blocked_until=MAX(blocked_until,?) WHERE id='football-data' AND token=?",now()+30000,token).catch(()=>{});
  if(cached){try{return json(result(cached,true,code))}catch{}}
  return json({error:code},error instanceof PilotError?error.status:503);
 }finally{if(token)await run("UPDATE pilot_control SET lock_until=0,token=NULL WHERE id='football-data' AND token=?",token).catch(()=>{});}
}
