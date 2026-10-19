// Serveur local de recette : exécute les modules serveur réels du Site (pilote
// football-data, résumés, actualités, médias) sur SQLite en mémoire, avec un
// fournisseur football simulé (tests/fixtures). Écoute uniquement 127.0.0.1.
// Usage : node scripts/dev-fixtures.mjs [port] [fichier html] [horloge ISO]
import {createServer} from 'node:http';
import {readFileSync,existsSync} from 'node:fs';
import {extname,join,normalize} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {handlePilot,COMPETITIONS} from '../server/football-data.mjs';
import {catalogue} from '../server/highlights.mjs';
import {newsStatus} from '../server/news.mjs';
import {mediaCatalogue} from '../server/community.mjs';
import {fixtureFetcher} from '../tests/fixtures/football-data.mjs';

const root=new URL('..',import.meta.url).pathname;
const port=Number(process.argv[2]||4180);
const htmlFile=process.argv[3]||join(root,'public/nyvo.html');
const clock=process.argv[4]?Date.parse(process.argv[4]):null;
const now=()=>clock??Date.now();

const sqlite=new DatabaseSync(':memory:');
for(const f of ['0000_low_tana_nile.sql','0001_melted_dragon_man.sql'])sqlite.exec(readFileSync(join(root,'drizzle',f),'utf8'));
const DB={
 withSession(){return this},
 prepare(sql){let args=[];return{bind(...v){args=v;return this},async first(){return sqlite.prepare(sql).get(...args)||null},async all(){return{results:sqlite.prepare(sql).all(...args)}},async run(){return{meta:sqlite.prepare(sql).run(...args)}}}},
 async batch(list){sqlite.exec('BEGIN');try{const out=[];for(const s of list)out.push(await s.run());sqlite.exec('COMMIT');return out}catch(e){sqlite.exec('ROLLBACK');throw e}}
};
// Placeholder token: never a real credential; the fixture fetcher ignores it.
const env={DB,FOOTBALL_DATA_TOKEN:'local-fixture-only'};
const fetcher=fixtureFetcher(now);
const types={'.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json','.json':'application/json'};

async function matchSnapshot(){
 const entries={};
 for(const comp of COMPETITIONS){
  const cat=await DB.prepare('SELECT payload FROM pilot_cache WHERE key=?').bind('fd:competitions/'+comp.code).first();
  const season=cat&&JSON.parse(cat.payload).seasons?.find(s=>s.current);if(!season)continue;
  const rec=await DB.prepare('SELECT * FROM pilot_cache WHERE key=?').bind('fd:competitions/'+comp.code+'/matches?season='+season.year).first();
  if(rec)entries[comp.id]={data:JSON.parse(rec.payload),fetchedAt:rec.fetched_at,expiresAt:rec.expires_at,stale:rec.expires_at<=now(),source:'football-data.org',delayed:true};
 }
 return {entries,errors:{},source:'football-data.org',delayed:true};
}

createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1:'+port);
 const send=(status,body,type='application/json')=>{res.writeHead(status,{'content-type':type,'cache-control':'no-store'});res.end(typeof body==='string'||Buffer.isBuffer(body)?body:JSON.stringify(body))};
 try{
  if(url.pathname.startsWith('/api/pilot/')){
   // Local stand-in for the Sites identity header (owner-only in production).
   const r=await handlePilot(new Request(url,{headers:{'oai-authenticated-user-id':'local-test'}}),env,{fetcher,now,sleep:async()=>{}});
   return send(r.status,await r.text());
  }
  if(url.pathname==='/api/content/matches')return send(200,await matchSnapshot());
  if(url.pathname==='/api/content/news')return send(200,await newsStatus(env,{now}));
  if(url.pathname==='/api/content/media')return send(200,mediaCatalogue());
  if(url.pathname==='/api/highlights/catalogue')return send(200,await catalogue(env,{now}));
  if(url.pathname.startsWith('/api/'))return send(400,{error:'invalid_request'});
  if(url.pathname==='/')return send(200,readFileSync(htmlFile),types['.html']);
  const file=normalize(join(root,'public',url.pathname));
  if(!file.startsWith(join(root,'public'))||!existsSync(file))return send(404,'not found','text/plain');
  return send(200,readFileSync(file),types[extname(file)]||'application/octet-stream');
 }catch(e){send(500,{error:'server_error',detail:String(e?.message||e)})}
}).listen(port,'127.0.0.1',()=>console.log('NYVO local test server http://127.0.0.1:'+port));
