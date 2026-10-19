import {env} from 'cloudflare:workers';
import {newsCatalogue,mediaCatalogue} from '../../../../server/community.mjs';
import {handlePilot,COMPETITIONS} from '../../../../server/football-data.mjs';
import {refreshNews,newsStatus} from '../../../../server/news.mjs';
export const dynamic='force-dynamic';
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
function safe(r:Request){const u=new URL(r.url);return (!r.headers.get('origin')||r.headers.get('origin')===u.origin)&&(!r.headers.get('sec-fetch-site')||['same-origin','none'].includes(r.headers.get('sec-fetch-site')!));}
export async function GET(request:Request){
 if(!request.headers.get('oai-authenticated-user-id'))return json({error:'unauthorized'},401);
 if(!safe(request))return json({error:'forbidden'},403);
 const p=new URL(request.url).pathname;
 if(p==='/api/content/news')return json(await newsStatus(env));
 if(p==='/api/content/matches')return matchSnapshot();
 return p==='/api/content/media'?json(mediaCatalogue()):json({error:'invalid_request'},400);
}
// Owner-private dispatch is the service authorization boundary, as for the
// existing highlights writer. Only fixed allowlisted provider paths are used.
// One competition per request; every request uses the existing shared quota/cache.
export async function POST(request:Request){
 if(!safe(request))return json({error:'forbidden'},403);
 const u=new URL(request.url);
 if(u.pathname==='/api/content/news'||u.pathname==='/api/content/news-status')return json(await newsStatus(env));
 if(u.pathname==='/api/content/news-update')return json(await refreshNews(env));
 if(u.pathname==='/api/content/matches')return matchSnapshot();
 if(u.pathname==='/api/content/media')return json(mediaCatalogue());
 if(u.pathname!=='/api/content/coverage')return json({error:'invalid_request'},400);
 const comp=COMPETITIONS.find(c=>String(c.id)===u.searchParams.get('league'));
 if(!comp)return json({error:'invalid_request'},400);
 const call=(path:string)=>handlePilot(new Request(u.origin+'/api/pilot/'+path),env,{serviceAuthorized:true});
 const catResponse=await call('leagues?league='+comp.id),cat=await catResponse.json() as any;
 if(!catResponse.ok)return json({competition:comp,error:cat.error},catResponse.status);
 const season=cat.data?.seasons?.find((s:any)=>s.current);
 if(!season)return json({competition:comp,error:'season_unavailable'},403);
 const res=await call('season?league='+comp.id+'&season='+season.year),data=await res.json() as any;
 return json({competition:comp,season,accessible:res.ok&&!data.stale,matches:data.data?.length??null,teams:data.data?new Set(data.data.flatMap((m:any)=>[m.home.id,m.away.id])).size:null,fetchedAt:data.fetchedAt,stale:data.stale,error:data.error||data.reason||null},res.status);
}
async function matchSnapshot(){
 if(!env.DB)return json({error:'unavailable'},503);
 const db=env.DB.withSession?env.DB.withSession('first-primary'):env.DB;
 const entries:Record<string,unknown>={},errors:Record<string,string>={};
 for(const comp of COMPETITIONS){
  const cat=await db.prepare('SELECT payload FROM pilot_cache WHERE key=?').bind('fd:competitions/'+comp.code).first() as any;
  const season=cat&&JSON.parse(cat.payload).seasons?.find((s:any)=>s.current);if(!season)continue;
  const rec=await db.prepare('SELECT * FROM pilot_cache WHERE key=?').bind('fd:competitions/'+comp.code+'/matches?season='+season.year).first() as any;
  if(!rec)continue;
  entries[comp.id]={data:JSON.parse(rec.payload),fetchedAt:rec.fetched_at,expiresAt:rec.expires_at,stale:rec.expires_at<=Date.now(),source:'football-data.org',delayed:true};
 }
 return json({entries,errors,source:'football-data.org',delayed:true});
}
