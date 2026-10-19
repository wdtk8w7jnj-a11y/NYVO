import { env } from 'cloudflare:workers';
import { handlePilot } from '../../../../server/football-data.mjs';
export const dynamic = 'force-dynamic';
export function GET(request: Request) { return handlePilot(request, env); }
export function POST() { return Response.json({ error:'forbidden' }, {status:405}); }
