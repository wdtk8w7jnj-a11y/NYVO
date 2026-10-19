import {env} from 'cloudflare:workers';
import {handlePilot} from '../../../server/football-data.mjs';
export const dynamic='force-dynamic';
export async function GET(request:Request) {
 const secret=(env as any).NYVO_DIAGNOSTIC_TOKEN;
 if(!secret || request.headers.get('x-nyvo-diagnostic')!==secret) return Response.json({error:'unauthorized'},{status:401});
 const url=new URL(request.url); const path=url.searchParams.get('path')||'status';
 if(!/^(status|leagues|fixtures|fixture|season|standings|editorial)(\?|$)/.test(path)) return Response.json({error:'invalid_request'},{status:400});
 return handlePilot(new Request(new URL('/api/pilot/'+path,url.origin)),env,{serviceAuthorized:true});
}
