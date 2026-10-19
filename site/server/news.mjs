import {XMLParser,XMLValidator} from 'fast-xml-parser';
import {ARTICLES as EDITORIAL_ARTICLES} from './community.mjs';
import {ANECDOTES} from './anecdotes.mjs';
import {NEWS_SOURCES,NEWS_CANDIDATES} from './news-sources.mjs';
const ARTICLES=[...EDITORIAL_ARTICLES,...ANECDOTES];
export const NEWS_SOURCE=NEWS_SOURCES[0];
export const NEWS_TTL=3000000;
const TTL=NEWS_TTL;
const array=v=>v==null?[]:Array.isArray(v)?v:[v];
const text=v=>String(typeof v==='object'?v?.['#text']||'':v||'').replace(/<[^>]*>/g,'').trim();
const stableId=value=>{let hash=2166136261;for(const ch of value)hash=Math.imul(hash^ch.charCodeAt(0),16777619);return(hash>>>0).toString(36)};
export function parseNewsFeed(xml,at,source=NEWS_SOURCE){
 if(typeof xml!=='string'||xml.length>1000000||/<!DOCTYPE|<!ENTITY/i.test(xml)||XMLValidator.validate(xml)!==true)throw new Error('invalid_feed');
 const doc=new XMLParser({ignoreAttributes:false,parseTagValue:false,trimValues:true}).parse(xml);
 if(!doc?.rss?.channel)throw new Error('invalid_feed');
 const seen=new Set,items=[];
 for(const row of array(doc.rss.channel.item).slice(0,100)){
  const title=text(row.title),link=text(row.link),pub=Date.parse(text(row.pubDate));let url;
  try{url=new URL(link)}catch{continue}
  if(url.protocol!=='https:'||!source.hosts.includes(url.hostname)||url.username||url.password||!title||title.length>500||!Number.isFinite(pub)||pub>at+300000||pub<at-30*86400000||seen.has(url.href))continue;
  seen.add(url.href);const slug=url.pathname.split('/').at(-1)?.replace(/\.html$/,'')||'';
  const number=slug.match(/(\d{5,})_(\d+)$/);
  const id=source.id==='lemonde-football'&&number?'lm-'+number[1]+'-'+number[2]:source.id+'-'+stableId(url.href),category=/mercato|transfert|recrutement/i.test(title+' '+array(row.category).map(text).join(' '))?'mercato':/justice|tribunal|procès|violence|racisme/i.test(title)?'hors-terrain':'football';
  items.push({id,subject:id,title,summary:source.excerpt?text(row.description).slice(0,500):'',status:/rumeur|piste|viserait|pourrait|serait|intéress[ée]/i.test(title)?'Rumeur':'Information rapportée',category,league:null,teamIds:[],matchIds:[],spoilerSensitive:true,publishedAt:new Date(pub).toISOString(),checkedAt:new Date(at).toISOString(),sources:[{name:source.name,url:url.href,official:false}],image:null,language:source.language,sourceId:source.id,automatic:true,contentOrigin:'rss',access:'L’article complet peut être réservé aux abonnés.'});
 }
 // A valid empty feed is allowed; malformed HTML must never clear the cache.
 return items.sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
}
async function oneStatus(env,{now=Date.now,source=NEWS_SOURCE}={}){
 const KEY='news:'+source.id,CONTROL=KEY;
 if(!env.DB)return{articles:ARTICLES,automatic:false,state:'storage_missing',error:'storage_missing',checkedAt:null,sourceMode:'editorial',sources:[source]};
 const db=env.DB.withSession?env.DB.withSession('first-primary'):env.DB;
 const cached=await db.prepare('SELECT * FROM pilot_cache WHERE key=?').bind(KEY).first();
 const control=await db.prepare('SELECT * FROM pilot_control WHERE id=?').bind(CONTROL).first();
 const data=cached?JSON.parse(cached.payload):{articles:[],etag:null,lastModified:null};
 const state=control?.blocked_until>now()?'paused':cached?'ready':'waiting';
 return{articles:[...data.articles,...ARTICLES].sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)),automatic:Boolean(cached),state,error:state==='paused'?'feed_unavailable':null,stale:!cached||cached.expires_at<=now(),checkedAt:cached?new Date(cached.fetched_at).toISOString():null,nextCheck:Math.max(cached?.expires_at||0,control?.blocked_until||0),intervalSeconds:TTL/1000,sourceMode:'rss',sources:[{...source,state,count:data.articles.length,lastSuccess:cached?new Date(cached.fetched_at).toISOString():null,lastAttempt:control?.last_call?new Date(control.last_call).toISOString():null,nextCheck:Math.max(cached?.expires_at||0,control?.blocked_until||0),error:state==='paused'?'feed_unavailable':null}],notice:'Lecteur RSS personnel privé. Article complet chez la source. Contrôle planifié horaire ; pauses des éditeurs prioritaires.'};
}
async function limitedText(response){
 if(Number(response.headers.get('content-length'))>1000000)throw new Error('feed_too_large');
 const reader=response.body.getReader(),chunks=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>1000000)throw new Error('feed_too_large');chunks.push(value)}}finally{await reader.cancel().catch(()=>{})}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.byteLength}return new TextDecoder().decode(bytes);
}
async function refreshOne(env,{now=Date.now,fetcher=fetch,uuid=()=>crypto.randomUUID(),source=NEWS_SOURCE}={}){
 const KEY='news:'+source.id,CONTROL=KEY;
 if(!env.DB)return oneStatus(env,{now,source});
 const db=env.DB.withSession?env.DB.withSession('first-primary'):env.DB,at=now();
 const cached=await db.prepare('SELECT * FROM pilot_cache WHERE key=?').bind(KEY).first();
 if(cached?.expires_at>at)return oneStatus(env,{now,source});
 await db.prepare('INSERT OR IGNORE INTO pilot_control(id) VALUES (?)').bind(CONTROL).run();
 const token=uuid(),lease=await db.prepare('UPDATE pilot_control SET token=?,lock_until=?,last_call=? WHERE id=? AND lock_until<=? AND blocked_until<=? AND last_call<=? RETURNING id').bind(token,at+30000,at,CONTROL,at,at,at-TTL).first();
 if(!lease)return oneStatus(env,{now,source});
 let pause=TTL;
 try{
  const prev=cached?JSON.parse(cached.payload):{},headers={'Accept':'application/rss+xml, application/xml;q=0.9'};
  if(prev.etag)headers['If-None-Match']=prev.etag;if(prev.lastModified)headers['If-Modified-Since']=prev.lastModified;
  const res=await fetcher(source.url,{headers,redirect:'manual',signal:AbortSignal.timeout(12000)});
  pause=retryDelay(res.headers.get('retry-after'),now());
  let payload;
  if(res.status===304&&cached)payload=prev;
  else{if(!res.ok)throw new Error('feed_unavailable');const xml=await limitedText(res);const articles=parseNewsFeed(xml,now(),source);payload={articles,etag:res.headers.get('etag'),lastModified:res.headers.get('last-modified')};}
  const instant=now();
  await db.prepare('INSERT INTO pilot_cache(key,fetched_at,expires_at,payload) SELECT ?,?,?,? FROM pilot_control WHERE id=? AND token=? AND lock_until>? ON CONFLICT(key) DO UPDATE SET fetched_at=excluded.fetched_at,expires_at=excluded.expires_at,payload=excluded.payload').bind(KEY,instant,instant+TTL,JSON.stringify(payload),CONTROL,token,instant).run();
  await db.prepare('UPDATE pilot_control SET blocked_until=0 WHERE id=? AND token=?').bind(CONTROL,token).run();
 }catch{
  // Retain the previous payload and verification time. No immediate retries.
  await db.prepare('UPDATE pilot_control SET blocked_until=? WHERE id=? AND token=?').bind(now()+pause,CONTROL,token).run();
 }finally{await db.prepare('UPDATE pilot_control SET token=NULL,lock_until=0 WHERE id=? AND token=?').bind(CONTROL,token).run()}
 return oneStatus(env,{now,source});
}

export function retryDelay(header,at){const seconds=Number(header),date=Date.parse(header);return Math.max(TTL,Number.isFinite(seconds)&&seconds>0?seconds*1000:Number.isFinite(date)?date-at:0);}
export async function newsStatus(env,options={}){
 const sources=options.sources||NEWS_SOURCES,states=await Promise.all(sources.map(source=>oneStatus(env,{...options,source})));
 const articles=[...new Map(states.flatMap(s=>s.articles).map(a=>[a.id,a])).values()].sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)),checks=states.map(s=>s.checkedAt).filter(Boolean),paused=states.filter(s=>s.state==='paused').length;
 return{articles,automatic:states.some(s=>s.automatic),state:paused===states.length?'paused':paused?'partial':states.some(s=>s.state==='ready')?'ready':states[0]?.state,error:paused?'feed_unavailable':null,stale:states.some(s=>s.stale),checkedAt:checks.length?checks.sort()[0]:null,intervalSeconds:TTL/1000,sources:states.flatMap(s=>s.sources),candidates:NEWS_CANDIDATES,notice:states[0]?.notice};
}
export async function refreshNews(env,options={}){
 // Per-source leases and independent failures; no retries inside this invocation.
 await Promise.all((options.sources||NEWS_SOURCES).map(source=>refreshOne(env,{...options,source})));
 return newsStatus(env,options);
}
