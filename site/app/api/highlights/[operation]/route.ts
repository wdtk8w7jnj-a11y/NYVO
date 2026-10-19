import {env} from 'cloudflare:workers';
import {catalogue,syncHighlights,reviewCatalogue,approveCandidate} from '../../../../server/highlights.mjs';
export const dynamic='force-dynamic';
const response=(v:unknown,status=200)=>Response.json(v,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
function safe(request:Request){const u=new URL(request.url);return (!request.headers.get('origin')||request.headers.get('origin')===u.origin)&&(!request.headers.get('sec-fetch-site')||['same-origin','none'].includes(request.headers.get('sec-fetch-site')!));}
export async function GET(request:Request){
 if(!request.headers.get('oai-authenticated-user-id'))return response({error:'unauthorized'},401);
 if(!safe(request))return response({error:'forbidden'},403);
 const path=new URL(request.url).pathname;
 try{if(path==='/api/highlights/catalogue')return response(await catalogue(env));if(path==='/api/highlights/review')return response({candidates:await reviewCatalogue(env)});return response({error:'invalid_request'},400)}catch{return response({error:'storage_unavailable'},503)}
}
export async function POST(request:Request){
 if(!safe(request))return response({error:'forbidden'},403);
 const path=new URL(request.url).pathname;
 // Shared catalogue writer. Hosted access is enforced by the owner-private Sites
 // dispatch boundary, including platform service access for unattended tasks.
 // This endpoint must never be moved to a public/shared Site without explicit auth.
 try{if(path==='/api/highlights/status')return response(await catalogue(env));if(path==='/api/highlights/update'){const result=await syncHighlights(env,{scheduled:new URL(request.url).searchParams.get('scheduled')==='1'});return response(result,result.ok?200:503)}
 if(path==='/api/highlights/review'){
  if(!request.headers.get('oai-authenticated-user-id'))return response({error:'unauthorized'},401);
  const data=await request.json().catch(()=>null);if(!data||!/^[A-Za-z0-9_-]{11}$/.test(data.id)||!['approve','reject'].includes(data.decision))return response({error:'invalid_request'},400);
  const result=await approveCandidate(env,data.id,Number(data.matchId),data.decision);return response(result,result.ok?200:400);
 }return response({error:'invalid_request'},400)}catch{return response({error:'update_failed'},503)}
}
