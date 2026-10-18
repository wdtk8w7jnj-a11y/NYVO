// Serveur pilote API-Football, testé contre un fournisseur simulé en mémoire.
// Ces tests valident le mécanisme (quota, cache, vérification, activation, secret),
// pas les droits réels d'une clé : ceux-ci ne se vérifient qu'avec « npm run api:check ».
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readConfig, publicConfig, loadDotEnv } from '../../server/config.mjs';
import { createQuota, QuotaError } from '../../server/football/quota.mjs';
import { createCache } from '../../server/football/cache.mjs';
import { createClient, classifyErrors } from '../../server/football/client.mjs';
import { normalizeFixture } from '../../server/football/normalize.mjs';
import { checkAccess, activation, saveReport, estimateCost } from '../../server/football/seasons.mjs';
import { createPilot, ttlFor, TTL } from '../../server/football/service.mjs';
import { createApp } from '../../server/index.mjs';

const KEY = 'cle-de-test-0123456789';
const tmp = () => mkdtempSync(join(tmpdir(), 'nyvo-pilote-'));

function env(dir, extra = {}) {
  return readConfig({ API_FOOTBALL_KEY: KEY, NYVO_CACHE_DIR: dir, NYVO_ACCESS_REPORT: join(dir, 'acces.json'), ...extra });
}

// Fournisseur simulé : saison 2026 refusée (plan), 2024 accessible.
function fakeProvider({ refuseSeason = 2026, limitDay = 100, current = 3 } = {}) {
  const calls = [];
  const fetchImpl = async (url, opts) => {
    const u = new URL(url);
    calls.push({ path: u.pathname, params: Object.fromEntries(u.searchParams), key: opts.headers['x-apisports-key'] });
    const headers = new Headers({ 'x-ratelimit-requests-limit': String(limitDay), 'x-ratelimit-requests-remaining': String(limitDay - current - calls.length) });
    let body = { errors: [], response: [] };
    if (u.pathname === '/status') {
      body.response = { account: { firstname: 'Prénom', email: 'personne@example.com' }, subscription: { plan: 'Free', end: '2027-01-01', active: true }, requests: { current, limit_day: limitDay } };
    } else if (u.pathname === '/leagues') {
      body.response = [{ league: { id: 61, name: 'Ligue 1' }, country: { name: 'France' }, seasons: [
        { year: 2024, current: false, start: '2024-08-16', end: '2025-05-17', coverage: { fixtures: { events: true, lineups: true, statistics_fixtures: true }, standings: true, players: true } },
        { year: 2026, current: true, start: '2026-08-14', end: '2027-05-22', coverage: { fixtures: { events: true, lineups: true, statistics_fixtures: false }, standings: true, players: true } },
      ] }];
    } else if (u.pathname === '/fixtures') {
      if (Number(u.searchParams.get('season')) === refuseSeason) body = { errors: { plan: `Free plans do not have access to this season, try from 2022 to 2024.` }, response: [] };
      else body.response = [fixture()];
    }
    return new Response(JSON.stringify(body), { status: 200, headers });
  };
  return { fetchImpl, calls };
}

function fixture(over = {}) {
  return {
    fixture: { id: 1001, date: '2026-10-18T21:00:00+02:00', venue: { name: 'Stade' }, status: { short: 'NS', long: 'Not Started', elapsed: null } },
    league: { id: 61, name: 'Ligue 1', season: 2024, round: 'Regular Season - 9' },
    teams: { home: { id: 1, name: 'Équipe A' }, away: { id: 2, name: 'Équipe B' } },
    goals: { home: null, away: null },
    ...over,
  };
}

test('configuration : clé présente mais jamais sérialisée ni affichée', () => {
  const c = readConfig({ API_FOOTBALL_KEY: KEY });
  assert.equal(c.hasKey, true);
  assert.ok(!JSON.stringify(c).includes(KEY));
  assert.ok(!JSON.stringify(publicConfig(c)).includes(KEY));
  assert.equal(publicConfig(c).cle, 'configurée');
  assert.equal(c.dailyBudget, 90, 'marge de 10 % sous les 100 requêtes du plan');
  assert.equal(readConfig({}).hasKey, false);
  assert.equal(readConfig({ API_FOOTBALL_DAILY_BUDGET: '500' }).dailyBudget, 100, 'budget plafonné au quota');
  assert.equal(readConfig({}).realMatches, false, 'vrais matchs désactivés par défaut');
});

test('.env local : chargé sans écraser une variable déjà définie', () => {
  const dir = tmp();
  const file = join(dir, '.env');
  writeFileSync(file, '# commentaire\nAPI_FOOTBALL_KEY="depuis-fichier"\nNYVO_PILOT_LEAGUES=61,62\n');
  const e = { NYVO_PILOT_LEAGUES: '39' };
  loadDotEnv(file, e);
  assert.equal(e.API_FOOTBALL_KEY, 'depuis-fichier');
  assert.equal(e.NYVO_PILOT_LEAGUES, '39');
  rmSync(dir, { recursive: true });
});

test('quota : budget journalier, journée UTC, limite par minute, persistance', () => {
  const dir = tmp();
  let t = Date.parse('2026-10-18T23:58:00Z');
  const make = () => createQuota({ file: join(dir, 'q.json'), dailyLimit: 100, dailyBudget: 3, perMinute: 2, now: () => t });
  const q = make();
  q.reserve();
  q.reserve();
  assert.throws(() => q.reserve(), (e) => e instanceof QuotaError && e.code === 'quota-minute');
  t += 61_000;
  q.reserve();
  assert.throws(() => q.reserve(), (e) => e.code === 'quota-jour' && e.retryAfterSec > 0);
  assert.equal(make().snapshot().utiliseesParNyvo, 3, 'redémarrage : compteur conservé');
  t = Date.parse('2026-10-19T00:00:30Z');
  assert.equal(make().snapshot().restantesPourNyvo, 3, 'remise à zéro à 00:00 UTC');
  rmSync(dir, { recursive: true });
});

test('quota : le fournisseur fait foi s’il annonce moins de requêtes restantes', () => {
  const dir = tmp();
  const q = createQuota({ file: join(dir, 'q.json'), dailyLimit: 100, dailyBudget: 90, perMinute: 10 });
  q.syncFromHeaders(new Headers({ 'x-ratelimit-requests-remaining': '12' }));
  assert.equal(q.snapshot().restantesPourNyvo, 2, 'marge de 10 requêtes conservée');
  q.syncFromStatus(95, 100);
  assert.equal(q.snapshot().utiliseesParNyvo, 95);
  assert.throws(() => q.reserve(), (e) => e.code === 'quota-jour');
  rmSync(dir, { recursive: true });
});

test('cache : durée de vie, requêtes regroupées, valeur périmée en cas d’erreur', async () => {
  const dir = tmp();
  let t = 0;
  const cache = createCache({ dir, now: () => t });
  let loads = 0;
  const load = async () => {
    loads++;
    return { n: loads };
  };
  const [a, b] = await Promise.all([cache.get('k', 1000, load), cache.get('k', 1000, load)]);
  assert.equal(loads, 1, 'une seule requête pour deux demandes simultanées');
  assert.deepEqual(a.value, b.value);
  assert.equal((await cache.get('k', 1000, load)).source, 'cache');
  t = 5000;
  const stale = await cache.get('k', 1000, async () => {
    throw new QuotaError('quota', 'quota-jour', 10);
  });
  assert.equal(stale.stale, true);
  assert.deepEqual(stale.value, { n: 1 });
  await assert.rejects(cache.get('absent', 1000, async () => { throw new Error('x'); }));
  rmSync(dir, { recursive: true });
});

test('durées de cache adaptées au budget', () => {
  assert.equal(ttlFor('2026-10-17', '2026-10-18'), TTL.past);
  assert.equal(ttlFor('2026-10-18', '2026-10-18'), TTL.today);
  assert.equal(ttlFor('2026-10-19', '2026-10-18'), TTL.future);
  assert.ok(86_400_000 / TTL.today <= 24, 'au plus 24 rafraîchissements par jour et par compétition');
});

test('client : en-tête de clé, erreurs du fournisseur classées, clé masquée', async () => {
  const dir = tmp();
  const config = env(dir);
  const quota = createQuota({ file: join(dir, 'q.json'), dailyLimit: 100, dailyBudget: 90, perMinute: 10 });
  const { fetchImpl, calls } = fakeProvider();
  const client = createClient({ config, quota, fetchImpl });
  await client.get('/fixtures', { league: 61, season: 2024, date: '2026-10-18' });
  assert.equal(calls[0].key, KEY);
  await assert.rejects(client.get('/fixtures', { league: 61, season: 2026 }), (e) => e.code === 'plan');
  assert.deepEqual(classifyErrors({ requests: 'limit reached' }), { code: 'quota-fournisseur', message: 'limit reached' });
  assert.equal(classifyErrors([]), null);
  const leaky = createClient({ config, quota, fetchImpl: async () => { throw new Error(`échec avec ${KEY}`); } });
  await assert.rejects(leaky.get('/status'), (e) => !e.message.includes(KEY) && e.message.includes('[clé masquée]'));
  const none = createClient({ config: readConfig({ NYVO_CACHE_DIR: dir }), quota, fetchImpl });
  await assert.rejects(none.get('/status'), (e) => e.code === 'cle-absente');
  rmSync(dir, { recursive: true });
});

test('normalisation : aucun score inventé, aucun diffuseur déduit', () => {
  const ns = normalizeFixture(fixture());
  assert.equal(ns.status, 'upcoming');
  assert.equal(ns.score, null);
  assert.equal(ns.minute, null);
  assert.equal(ns.broadcast, null);
  assert.equal(ns.kickoff, '2026-10-18T19:00:00.000Z');
  const live = normalizeFixture(fixture({ fixture: { id: 2, date: '2026-10-18T19:00:00Z', status: { short: '2H', elapsed: 67 } }, goals: { home: 2, away: 1 } }));
  assert.deepEqual([live.status, live.minute, live.score], ['live', 67, [2, 1]]);
  const partial = normalizeFixture(fixture({ fixture: { id: 3, date: '2026-10-18T19:00:00Z', status: { short: 'FT' } }, goals: { home: 1, away: null } }));
  assert.equal(partial.score, null, 'score incomplet : non affiché plutôt que complété par 0');
  assert.equal(normalizeFixture(fixture({ fixture: { id: 4, date: '2026-10-18T19:00:00Z', status: { short: 'PST' } } })).status, 'postponed');
  assert.equal(normalizeFixture(fixture({ fixture: { id: 5, date: '2026-10-18T19:00:00Z', status: { short: 'XYZ' } } })).status, 'inconnu');
});

test('vérification des saisons : plan respecté, aucune donnée personnelle conservée', async () => {
  const dir = tmp();
  const config = env(dir);
  const { fetchImpl, calls } = fakeProvider();
  const pilot = createPilot({ config, fetchImpl });
  const report = await checkAccess({ client: pilot.client, quota: pilot.quota, leagues: [61], extraSeasons: [2024], today: '2026-10-18' });
  assert.equal(calls.length, estimateCost([61], [2024]));
  const s = report.competitions[0].saisons;
  assert.deepEqual(s.map((x) => [x.annee, x.courante, x.acces]), [[2026, true, 'refusee'], [2024, false, 'accessible']]);
  assert.match(s[0].message, /Free plans do not have access/);
  assert.equal(report.compte.offre, 'Free');
  const text = JSON.stringify(report);
  assert.ok(!text.includes('personne@example.com') && !text.includes('Prénom') && !text.includes(KEY));
  // Saison courante refusée : les vrais matchs restent désactivés, même demandés.
  const asked = env(dir, { NYVO_REAL_MATCHES: '1' });
  const act = activation(asked, report);
  assert.equal(act.active, false);
  assert.match(act.competitions[0].raisons.join(' '), /Saison courante non accessible/);
  rmSync(dir, { recursive: true });
});

test('activation : demande explicite + saison courante vérifiée accessible et récente', async () => {
  const dir = tmp();
  const { fetchImpl } = fakeProvider({ refuseSeason: 1900 });
  const pilot = createPilot({ config: env(dir), fetchImpl });
  const report = await checkAccess({ client: pilot.client, quota: pilot.quota, leagues: [61], today: '2026-10-18' });
  assert.equal(activation(env(dir), report).active, false, 'non demandée');
  assert.equal(activation(env(dir, { NYVO_REAL_MATCHES: '1' }), report).active, true);
  assert.equal(activation(env(dir, { NYVO_REAL_MATCHES: '1' }), report, Date.parse(report.verifiedAt) + 8 * 86_400_000).active, false, 'vérification trop ancienne');
  assert.equal(activation(env(dir, { NYVO_REAL_MATCHES: '1' }), null).active, false, 'jamais vérifiée');
  rmSync(dir, { recursive: true });
});

async function listen(app, t) {
  await new Promise((r) => app.listen(0, '127.0.0.1', r));
  // Fermeture garantie, même si une assertion échoue.
  t.after(() => {
    app.closeAllConnections();
    app.close();
  });
  return `http://127.0.0.1:${app.address().port}`;
}

test('serveur : état sans clé exposée, matchs bloqués tant que non activés', async (t) => {
  const dir = tmp();
  const { fetchImpl, calls } = fakeProvider();
  const app = createApp({ config: env(dir, { NYVO_REAL_MATCHES: '1' }), fetchImpl });
  const base = await listen(app, t);
  const etat = await fetch(`${base}/api/pilote/etat`);
  const text = await etat.text();
  assert.equal(etat.status, 200);
  assert.ok(!text.includes(KEY));
  assert.equal(JSON.parse(text).mode, 'demonstration');
  const m = await fetch(`${base}/api/pilote/matchs?date=2026-10-18`);
  assert.equal(m.status, 423);
  assert.match((await m.json()).erreur, /non activés/);
  assert.equal((await fetch(`${base}/api/pilote/matchs?date=hier`)).status, 400);
  assert.equal((await fetch(`${base}/api/pilote/etat`, { method: 'POST' })).status, 405);
  assert.equal(calls.length, 0, 'aucune requête au fournisseur sans activation');
  assert.equal((await fetch(`${base}/index.html`)).status, 200, 'le prototype reste servi');
  rmSync(dir, { recursive: true });
});

test('serveur activé : matchs réels normalisés, cache puis quota épuisé servi en périmé', async (tc) => {
  const dir = tmp();
  let t = Date.parse('2026-10-18T10:00:00Z');
  // Aucune requête consommée ailleurs ce jour-là (le compteur se recale sur /status).
  const { fetchImpl, calls } = fakeProvider({ refuseSeason: 1900, current: 0 });
  const config = env(dir, { NYVO_REAL_MATCHES: '1', API_FOOTBALL_DAILY_BUDGET: '4' });
  const pilot = createPilot({ config, fetchImpl, now: () => t });
  saveReport(config.accessReport, await checkAccess({ client: pilot.client, quota: pilot.quota, leagues: [61], today: '2026-10-18', now: () => t }));
  const app = createApp({ config, fetchImpl, now: () => t });
  const base = await listen(app, tc);
  const first = await (await fetch(`${base}/api/pilote/matchs?date=2026-10-18`)).json();
  const r = first.resultats[0];
  assert.equal(r.source, 'fournisseur');
  assert.equal(r.matchs[0].id, 'af-1001');
  assert.equal(r.matchs[0].broadcast, null);
  const before = calls.length;
  const again = await (await fetch(`${base}/api/pilote/matchs?date=2026-10-18`)).json();
  assert.equal(again.resultats[0].source, 'cache');
  assert.equal(calls.length, before, 'cache : aucune nouvelle requête');
  // Budget de 4 : 3 pour la vérification + 1 pour les matchs → épuisé.
  t += 2 * 3_600_000;
  const stale = await (await fetch(`${base}/api/pilote/matchs?date=2026-10-18`)).json();
  assert.equal(stale.resultats[0].perime, true);
  assert.match(stale.resultats[0].motif, /Budget quotidien/);
  const blocked = await fetch(`${base}/api/pilote/matchs?date=2026-10-20`);
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get('retry-after')) > 0);
  assert.equal(calls.length, before, 'aucun appel au-delà du budget');
  rmSync(dir, { recursive: true });
});

test('aucun secret versionné : .env ignoré, modèle sans valeur', () => {
  const gi = readFileSync(new URL('../../.gitignore', import.meta.url), 'utf8');
  assert.match(gi, /^\.env$/m);
  assert.match(gi, /^server\/\.cache\/$/m);
  const example = readFileSync(new URL('../../.env.example', import.meta.url), 'utf8');
  assert.match(example, /^API_FOOTBALL_KEY=$/m);
});
