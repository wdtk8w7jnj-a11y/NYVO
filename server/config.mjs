// Configuration du serveur pilote. La clé API n'est lue que depuis l'environnement
// (ou un fichier .env local ignoré par Git) et n'est jamais journalisée ni exposée.
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);

// Lecture minimale d'un .env local : n'écrase jamais une variable déjà définie.
export function loadDotEnv(path = resolve(ROOT, '.env'), env = process.env) {
  if (!existsSync(path)) return false;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || line.trimStart().startsWith('#')) continue;
    const value = m[2].replace(/^(['"])(.*)\1$/, '$2');
    if (env[m[1]] === undefined || env[m[1]] === '') env[m[1]] = value;
  }
  return true;
}

const int = (v, def, min = 0) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n >= min ? n : def;
};

export function readConfig(env = process.env) {
  const dailyLimit = int(env.API_FOOTBALL_DAILY_LIMIT, 100, 1);
  const leagues = String(env.NYVO_PILOT_LEAGUES || '61')
    .split(',')
    .map((x) => Number.parseInt(x, 10))
    .filter((n) => Number.isInteger(n) && n > 0);
  const key = (env.API_FOOTBALL_KEY || '').trim();
  return {
    // La clé est gardée dans une fermeture : JSON.stringify(config) ne la contient pas.
    getKey: () => key,
    hasKey: key.length > 0,
    baseUrl: (env.API_FOOTBALL_BASE || 'https://v3.football.api-sports.io').replace(/\/+$/, ''),
    dailyLimit,
    // Marge de sécurité : NYVO s'arrête avant le quota du fournisseur.
    dailyBudget: Math.min(int(env.API_FOOTBALL_DAILY_BUDGET, Math.floor(dailyLimit * 0.9), 1), dailyLimit),
    perMinute: int(env.API_FOOTBALL_PER_MINUTE, 10, 1),
    leagues: leagues.length ? [...new Set(leagues)] : [61],
    realMatches: env.NYVO_REAL_MATCHES === '1',
    cacheDir: resolve(env.NYVO_CACHE_DIR || resolve(ROOT, 'server/.cache')),
    accessReport: resolve(env.NYVO_ACCESS_REPORT || resolve(ROOT, 'server/.cache/acces-saisons.json')),
    timeoutMs: int(env.API_FOOTBALL_TIMEOUT_MS, 10000, 1000),
  };
}

// Version affichable : jamais la clé, seulement sa présence.
export function publicConfig(c) {
  return {
    cle: c.hasKey ? 'configurée' : 'absente',
    fournisseur: new URL(c.baseUrl).host,
    quotaJournalier: c.dailyLimit,
    budgetNyvo: c.dailyBudget,
    parMinute: c.perMinute,
    competitionsPilote: c.leagues,
    vraisMatchsDemandes: c.realMatches,
  };
}
