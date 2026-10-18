// Serveur du pilote NYVO : sert le prototype et une API interne qui relaie API-Football.
// La clé reste sur le serveur ; le navigateur n'appelle jamais le fournisseur directement.
//   node server/index.mjs [port]      (npm run pilote)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDotEnv, readConfig, publicConfig } from './config.mjs';
import { createPilot } from './football/service.mjs';
import { activation, loadReport } from './football/seasons.mjs';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
const SECURITY = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'cache-control': 'no-store' };

function json(res, status, body, extra = {}) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...SECURITY, ...extra });
  res.end(JSON.stringify(body));
}

export function createApp({ config, fetchImpl, staticRoot = resolve(fileURLToPath(new URL('../app', import.meta.url))), now } = {}) {
  const pilot = createPilot({ config, fetchImpl, now });

  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')) {
        if (req.method !== 'GET') return json(res, 405, { erreur: 'Méthode non autorisée.' });
        if (url.pathname === '/api/pilote/etat') {
          const report = loadReport(config.accessReport);
          return json(res, 200, {
            mode: pilot.state().active ? 'pilote' : 'demonstration',
            configuration: publicConfig(config),
            quota: pilot.quota.snapshot(),
            verification: report ? { date: report.verifiedAt, compte: report.compte, competitions: report.competitions } : null,
            activation: pilot.state(),
          });
        }
        if (url.pathname === '/api/pilote/matchs') {
          const date = url.searchParams.get('date') || '';
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) return json(res, 400, { erreur: 'Paramètre date attendu au format AAAA-MM-JJ.' });
          const act = pilot.state();
          if (!act.active) return json(res, 423, { erreur: 'Vrais matchs non activés : le prototype reste en données de démonstration.', activation: act });
          const data = await pilot.fixtures(date);
          const quotaBlocked = data.resultats.every((r) => r.matchs === null && /^quota/.test(r.code || ''));
          if (quotaBlocked) {
            const retry = Math.max(...data.resultats.map((r) => r.reessayerDansSec || 60));
            return json(res, 429, { erreur: 'Quota NYVO atteint, aucune donnée en cache pour cette date.', ...data }, { 'retry-after': String(retry) });
          }
          return json(res, 200, data);
        }
        return json(res, 404, { erreur: 'Route inconnue.' });
      }
      // Fichiers statiques du prototype.
      const path = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
      let file = join(staticRoot, path);
      if (!file.startsWith(staticRoot)) return json(res, 403, { erreur: 'Interdit.' });
      if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, 'index.html');
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', ...SECURITY });
      res.end(body);
    } catch (err) {
      if (err?.code === 'ENOENT') return json(res, 404, { erreur: 'Introuvable.' });
      json(res, 500, { erreur: 'Erreur interne du serveur pilote.' });
    }
  });
}

// Lancement direct.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  loadDotEnv();
  const config = readConfig();
  const port = Number(process.argv[2] || process.env.PORT || 4180);
  // Écoute locale par défaut : l'exposition réseau se fait derrière un hébergeur ou un proxy.
  const host = process.env.NYVO_HOST || '127.0.0.1';
  createApp({ config }).listen(port, host, () => {
    const pub = publicConfig(config);
    console.log(`Serveur pilote NYVO : http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/`);
    console.log(`  Clé API-Football : ${pub.cle} · budget ${pub.budgetNyvo}/${pub.quotaJournalier} requêtes par jour · compétitions ${pub.competitionsPilote.join(', ')}`);
    console.log(`  Vrais matchs : ${activation(config, loadReport(config.accessReport)).active ? 'activés' : 'désactivés (données de démonstration)'}`);
  });
}
