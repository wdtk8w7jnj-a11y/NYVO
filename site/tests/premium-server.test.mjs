import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {creatorCandidate,syncHighlights,approveCandidate,catalogue} from '../server/highlights.mjs';
import {CREATOR_CANDIDATES,ACTIVE_CREATORS} from '../server/media-sources.mjs';
import {parseNewsFeed,newsStatus,retireReportedLabel} from '../server/news.mjs';
import {NEWS_REGISTRY,NEWS_SOURCES,NEWS_MAX_INTERVAL_MINUTES} from '../server/news-sources.mjs';
import {CR7_ANECDOTE,CR7_IMAGES} from '../server/cr7-anecdote.mjs';
import {ANECDOTES} from '../server/anecdotes.mjs';
import {validateMedia} from '../server/community.mjs';

const NOW=Date.parse('2026-10-19T08:00:00Z');
const row={id:1000559664,kickoff:'2026-10-18T13:00:00Z',status:'FT',league:{id:2015,name:'Ligue 1',season:2026},home:{id:1000000532,name:'Angers SCO',shortName:'Angers'},away:{id:1000000516,name:'Olympique de Marseille',shortName:'Marseille'},score:{home:0,away:1}};
const creator={id:'test-creator',name:'Créateur test',channelId:'UC'+'a'.repeat(22),state:'active'};
const raw={id:'Tribune1234',snippet:{title:'Angers v Marseille away day vlog',description:'',channelId:creator.channelId,publishedAt:'2026-10-18T20:00:00Z',thumbnails:{high:{url:'https://i.ytimg.com/vi/Tribune1234/hqdefault.jpg'}}},contentDetails:{duration:'PT12M'},status:{privacyStatus:'public',embeddable:true}};
function db(t){const sql=new DatabaseSync(':memory:');for(const p of ['0000_low_tana_nile.sql','0001_melted_dragon_man.sql'])sql.exec(readFileSync(new URL('../drizzle/'+p,import.meta.url),'utf8'));t.after(()=>sql.close());
 const DB={withSession(){return this},prepare(q){let a=[];return{bind(...v){a=v;return this},async first(){return sql.prepare(q).get(...a)||null},async all(){return{results:sql.prepare(q).all(...a)}},async run(){return{meta:sql.prepare(q).run(...a)}}}}};
 sql.prepare('INSERT INTO pilot_cache(key,fetched_at,expires_at,payload) VALUES(?,?,?,?)').run('fd:competitions/FL1/matches?season=2026',NOW,NOW+1e9,JSON.stringify([row]));return{DB,sql};}

test('aucun créateur « Depuis les tribunes » actif sans channel ID vérifié',()=>{
 assert.equal(ACTIVE_CREATORS.length,0);
 assert.deepEqual(CREATOR_CANDIDATES.map(c=>c.name),['AwayDays','Thogden','Footy Adventures','StuntPegg','Smiv','La Tribune Olympienne']);
 assert(CREATOR_CANDIDATES.every(c=>c.state==='candidate'&&c.channelId===null&&c.evidenceUrls.length));
});
test('vidéo de créateur : file de modération seulement, jamais un résumé officiel',async t=>{
 assert.equal(creatorCandidate(raw,[row]).status,'pending');
 assert.equal(creatorCandidate({...raw,snippet:{...raw.snippet,title:'Stadium tour vlog'}},[row]).status,'reject');
 assert.equal(creatorCandidate({...raw,snippet:{...raw.snippet,title:'Angers v Marseille',publishedAt:'2026-11-30T00:00:00Z'}},[row]).status,'reject');
 const {DB}=db(t);const calls=[];
 const fetcher=async url=>{const u=new URL(url);calls.push(u.pathname.split('/').pop());
  // Official channels have no new uploads; only the test creator publishes.
  if(u.pathname.endsWith('/channels')){const id=u.searchParams.get('id');return Response.json({items:[{id,contentDetails:{relatedPlaylists:{uploads:'UU'+id.slice(2)}}}]})}
  if(u.pathname.endsWith('/playlistItems'))return Response.json({items:u.searchParams.get('playlistId')==='UU'+'a'.repeat(22)?[{contentDetails:{videoId:raw.id}}]:[]});
  if(u.pathname.endsWith('/videos'))return Response.json({items:[raw]});
  return Response.json({items:[]});};
 const result=await syncHighlights({DB,YOUTUBE_API_KEY:'test-not-real'},{fetcher,now:()=>NOW,refreshFootball:false,creators:[creator]});
 assert.equal(result.ok,true);assert.equal(result.accepted,0);assert.equal(result.pending,1);
 assert.deepEqual(calls.slice(-3),['channels','playlistItems','videos']);assert.equal(calls.filter(c=>c==='search').length,0);
 const cat=await catalogue({DB,YOUTUBE_API_KEY:'x'},{now:()=>NOW});assert.equal(cat.videos.some(v=>v.id===raw.id),false);
 const approved=await approveCandidate({DB},raw.id,row.id,'approve',()=>NOW,[creator]);assert.equal(approved.ok,true);
 const after=await catalogue({DB,YOUTUBE_API_KEY:'x'},{now:()=>NOW});const v=after.videos.find(v=>v.id===raw.id);
 assert.equal(v.kind,'Depuis les tribunes');assert.equal(v.url,'https://www.youtube.com/watch?v=Tribune1234');assert.equal(v.reviewed,true);
});
test('média tribune refusé sans droits, auteur, rencontre ou URL YouTube canonique',()=>{
 const ok={category:'stands',id:'m1',title:'Ambiance',publisher:'Créateur',checkedAt:'2026-10-19',rightsVerified:true,authorVerified:true,matchId:row.id,matchVerified:true,context:'Parcage visiteur',url:'https://www.youtube.com/watch?v=Tribune1234'};
 assert.equal(validateMedia(ok),true);
 for(const bad of [{rightsVerified:false},{authorVerified:false},{matchVerified:false},{url:'https://youtu.be/Tribune1234'},{url:'https://www.youtube.com/watch?v=Tribune1234&t=1'},{context:''}])assert.equal(validateMedia({...ok,...bad}),false,JSON.stringify(bad));
});
test('actualités : plus d’étiquette « Information rapportée », provenance interne conservée',()=>{
 const xml='<?xml version="1.0"?><rss><channel><item><title>Un titre de football</title><link>https://www.lemonde.fr/football/article/2026/10/19/titre_1234567_3242.html</link><pubDate>Mon, 19 Oct 2026 07:00:00 GMT</pubDate></item><item><title>Mercato : une piste pour Lyon</title><link>https://www.lemonde.fr/football/article/2026/10/19/piste_1234568_3242.html</link><pubDate>Mon, 19 Oct 2026 06:00:00 GMT</pubDate></item></channel></rss>';
 const rows=parseNewsFeed(xml,NOW,NEWS_SOURCES[0]);
 assert.equal(rows.find(r=>r.title.startsWith('Un')).status,null);assert.equal(rows.find(r=>r.title.startsWith('Mercato')).status,'Rumeur');
 assert(rows.every(r=>r.provenance==='press-rss'&&r.image===null));
 assert.deepEqual(retireReportedLabel({status:'Information rapportée'}),{status:null,provenance:'press-rss'});
});
test('registre des sources : seuls Le Monde et Foot Mercato actifs, aucune image éditeur, cadence ≤ 90 min',async()=>{
 assert.deepEqual(NEWS_REGISTRY.filter(s=>s.state==='active').map(s=>s.name),['Le Monde','Foot Mercato']);
 assert(NEWS_REGISTRY.every(s=>s.images==='none'));
 for(const name of ['L’Équipe','RMC Sport','Franceinfo Sport','France 24 Sport','BBC Sport','The Guardian Football','Le Parisien'])assert(NEWS_REGISTRY.some(s=>s.name===name&&s.state!=='active'&&s.reason),name);
 assert.equal(NEWS_MAX_INTERVAL_MINUTES,90);
 const status=await newsStatus({});assert.equal(status.articles.some(a=>a.status==='Information rapportée'),false);
});
test('article CR7 : récit structuré, signature honnête, visuels vérifiés uniquement',()=>{
 const a=CR7_ANECDOTE;assert.equal(a.author,'Rédaction NYVO');assert(a.revisedAt);
 assert(a.sections.filter(s=>s.heading).length>=2&&a.sections.filter(s=>s.heading).length<=4);
 const words=a.body.join(' ').split(/\s+/).length+a.summary.split(/\s+/).length;assert(words>=360&&words<=750,String(words));
 assert(!/exclusif|«/i.test(a.body.join(' ')),'pas de citation ni d’exclusivité');
 for(const im of CR7_IMAGES)for(const k of ['id','kind','status','caption','license'])assert(im[k],im.id+' '+k);
 for(const im of CR7_IMAGES.filter(i=>i.status==='verified'))for(const k of ['src','alt','author','checkedAt','evidence'])assert(im[k],im.id+' '+k);
 assert(CR7_IMAGES.filter(i=>i.kind==='photo'&&i.status==='verified').every(i=>/postérieure|n’est pas/.test(i.caption+i.alt)));
 assert(a.sections.every(s=>!s.figure||CR7_IMAGES.find(i=>i.id===s.figure)?.status==='verified'));
 assert.equal(a.archive.playbackVerified,false);
 assert(ANECDOTES.every(x=>x.author==='Rédaction NYVO'));
});
