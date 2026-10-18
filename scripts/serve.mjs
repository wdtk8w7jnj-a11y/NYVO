// Serveur statique minimal, sans dépendance : node scripts/serve.mjs [dossier] [port]
// Écoute sur toutes les interfaces pour permettre l'essai depuis un smartphone du même réseau.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { localAddresses } from './lib/addresses.mjs';
import { createFootball, PilotError } from '../server/football.mjs';

const root = resolve(process.argv[2] || 'app');
const port = Number(process.argv[3] || process.env.PORT || 4173);
// Persistent, private, outside app/ and dist/. One process only.
const directory = resolve(process.env.NYVO_DATA_DIR || '.nyvo-data');
if (directory === root || directory.startsWith(root + sep)) throw new Error('NYVO_DATA_DIR must be outside the public directory');
const football = await createFootball({ directory });
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) {
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.setHeader('cache-control', 'no-store');
      res.setHeader('x-content-type-options', 'nosniff');
      // Browser cross-site calls cannot spend the pilot's shared quota.
      if (req.method !== 'GET' || (req.headers['sec-fetch-site'] && !['same-origin', 'none'].includes(req.headers['sec-fetch-site'])) || (req.headers.origin && req.headers.origin !== `http://${req.headers.host}` && req.headers.origin !== `https://${req.headers.host}`)) {
        res.writeHead(403); res.end(JSON.stringify({ error: 'forbidden' })); return;
      }
      try { res.end(JSON.stringify(await football.handle(url))); }
      catch (e) { res.writeHead(e instanceof PilotError ? e.status : 503); res.end(JSON.stringify({ error: e instanceof PilotError ? e.code : 'unavailable' })); }
      return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    let path = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
    let file = join(root, path);
    if (file !== root && !file.startsWith(root + sep)) throw Object.assign(new Error('forbidden'), { code: 403 });
    if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, root.endsWith('dist') ? 'nyvo.html' : 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (e) {
    res.writeHead(e.code === 403 ? 403 : 404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(e.code === 403 ? 'Interdit' : 'Introuvable');
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`NYVO servi depuis ${root}`);
  console.log(`  → http://localhost:${port}/`);
  const addresses = process.env.NYVO_NO_IFACES ? localAddresses(() => { throw new Error('désactivé'); }) : localAddresses();
  if (addresses === null) console.log('  (adresses réseau locales indisponibles ici : seul localhost est affiché)');
  else for (const a of addresses) console.log(`  → http://${a}:${port}/ (même réseau Wi-Fi)`);
});
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close(async () => { await football.close(); process.exit(0); }));
