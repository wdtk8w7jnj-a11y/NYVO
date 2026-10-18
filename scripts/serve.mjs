// Serveur statique minimal, sans dépendance : node scripts/serve.mjs [dossier] [port]
// Écoute sur toutes les interfaces pour permettre l'essai depuis un smartphone du même réseau.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { networkInterfaces } from 'node:os';

const root = resolve(process.argv[2] || 'app');
const port = Number(process.argv[3] || process.env.PORT || 4173);
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

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let path = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
    let file = join(root, path);
    if (!file.startsWith(root)) throw Object.assign(new Error('forbidden'), { code: 403 });
    if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, root.endsWith('dist') ? 'nyvo.html' : 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch (e) {
    res.writeHead(e.code === 403 ? 403 : 404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(e.code === 403 ? 'Interdit' : 'Introuvable');
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`NYVO servi depuis ${root}`);
  console.log(`  → http://localhost:${port}/`);
  for (const list of Object.values(networkInterfaces())) {
    for (const i of list || []) if (i.family === 'IPv4' && !i.internal) console.log(`  → http://${i.address}:${port}/ (même réseau Wi-Fi)`);
  }
});
