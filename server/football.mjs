// API-Football pilot. Only this module knows the key. One persistent server instance.
import { mkdir, readFile, writeFile, rename, open, unlink } from 'node:fs/promises';
import { join } from 'node:path';

export const COMPETITIONS = [{ id: 61, name: 'Ligue 1' }, { id: 62, name: 'Ligue 2' }, { id: 2, name: 'Ligue des champions' }];
const ORIGIN = 'https://v3.football.api-sports.io/';
const TTL = { leagues: 86400000, fixtures: 300000 };
export class PilotError extends Error {
  constructor(code, status = 503) { super(code); this.code = code; this.status = status; }
}
const integer = n => Number.isSafeInteger(n) && n >= 0 ? n : null;
const str = v => typeof v === 'string' ? v.slice(0, 200) : null;
export function normalizeFixture(row) {
  if (!integer(row?.fixture?.id) || !integer(row?.teams?.home?.id) || !integer(row?.teams?.away?.id) || !Number.isFinite(Date.parse(row.fixture.date))) throw new PilotError('invalid_response');
  return {
    id: row.fixture.id, kickoff: row.fixture.date,
    league: { id: integer(row.league?.id), name: str(row.league?.name), season: integer(row.league?.season), round: str(row.league?.round) },
    home: { id: row.teams.home.id, name: str(row.teams.home.name) }, away: { id: row.teams.away.id, name: str(row.teams.away.name) },
    status: str(row.fixture.status?.short), elapsed: integer(row.fixture.status?.elapsed), extra: integer(row.fixture.status?.extra),
    score: { home: integer(row.goals?.home), away: integer(row.goals?.away) },
    penalties: { home: integer(row.score?.penalty?.home), away: integer(row.score?.penalty?.away) },
    venue: str(row.fixture.venue?.name),
    events: Array.isArray(row.events) ? row.events.map(e => ({ minute: integer(e.time?.elapsed), extra: integer(e.time?.extra), team: str(e.team?.name), player: str(e.player?.name), type: str(e.type), detail: str(e.detail) })) : null,
  };
}

export async function createFootball({ key = process.env.API_FOOTBALL_KEY, directory, fetcher = fetch, now = Date.now, budget = 90 } = {}) {
  if (!Number.isInteger(budget) || budget < 1 || budget > 90) throw new Error('Budget must be between 1 and 90');
  let state = { day: '', used: 0, cache: {}, blockedUntil: 0, lastCall: 0 };
  let lock;
  if (key) {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    // Refuse a second process rather than silently resetting a shared allowance.
    lock = await open(join(directory, 'pilot.lock'), 'wx', 0o600);
    try {
      state = JSON.parse(await readFile(join(directory, 'pilot.json'), 'utf8'));
      if (!state || typeof state.day !== 'string' || !Number.isInteger(state.used) || state.used < 0 || !state.cache || typeof state.cache !== 'object' || !Number.isFinite(state.lastCall) || !Number.isFinite(state.blockedUntil)) throw new Error('Invalid pilot state');
    } catch (e) {
      if (e.code !== 'ENOENT') { await lock.close(); await unlink(join(directory, 'pilot.lock')); throw new Error('Pilot storage unreadable; refusing to reset quota'); }
    }
  }
  const save = async () => {
    await writeFile(join(directory, 'pilot.json.tmp'), JSON.stringify(state), { mode: 0o600 });
    await rename(join(directory, 'pilot.json.tmp'), join(directory, 'pilot.json'));
  };
  let queue = Promise.resolve();
  const serial = fn => { const next = queue.then(fn); queue = next.catch(() => {}); return next; };
  const day = () => new Date(now()).toISOString().slice(0, 10);
  const meta = () => ({ configured: Boolean(key), source: 'API-Football', competitions: COMPETITIONS, budget, used: state.day === day() ? state.used : 0, refreshSeconds: 300, automaticRefresh: false });
  async function request(endpoint, params) {
    if (!key) throw new PilotError('not_configured');
    const query = new URLSearchParams(params).toString();
    const cacheKey = `${endpoint}?${query}`;
    return serial(async () => {
      const cached = state.cache[cacheKey];
      const packageResult = (entry, stale = false, reason = null) => ({ data: entry.data, fetchedAt: entry.at, expiresAt: entry.at + TTL[endpoint], stale, reason, source: 'API-Football' });
      if (cached && now() - cached.at < TTL[endpoint]) return packageResult(cached);
      try {
        if (state.day !== day()) { state.day = day(); state.used = 0; }
        if (state.used >= budget) throw new PilotError('quota_exhausted', 429);
        if (state.blockedUntil > now()) throw new PilotError('provider_paused', 429);
        if (now() - state.lastCall < 1200) throw new PilotError('slow_down', 429);
        // Reserve BEFORE network; a timeout or crash still spends this attempt.
        state.used++; state.lastCall = now();
        await save();
        const response = await fetcher(`${ORIGIN}${cacheKey}`, { headers: { 'x-apisports-key': key }, signal: AbortSignal.timeout(10000), redirect: 'error' });
        if (!response.ok) throw new PilotError(response.status === 429 ? 'quota_exhausted' : [401, 403].includes(response.status) ? 'access_denied' : 'provider_unavailable', response.status === 429 ? 429 : 503);
        const payload = await response.json();
        const errors = payload.errors;
        if (errors && Object.keys(errors).length) {
          const code = errors.plan ? 'season_unavailable' : errors.token ? 'access_denied' : errors.requests || errors.rateLimit ? 'quota_exhausted' : 'provider_error';
          throw new PilotError(code);
        }
        if (!Array.isArray(payload.response) || (payload.paging?.total ?? 1) > 1) throw new PilotError('invalid_response');
        let data;
        if (endpoint === 'leagues') {
          const league = payload.response.find(r => r.league?.id === Number(params.id));
          if (!league || !Array.isArray(league.seasons)) throw new PilotError('coverage_unavailable');
          data = { id: league.league.id, name: str(league.league.name), seasons: league.seasons.filter(s => Number.isInteger(s.year) && /^\d{4}-\d{2}-\d{2}$/.test(s.start) && /^\d{4}-\d{2}-\d{2}$/.test(s.end)).map(s => ({ year: s.year, start: s.start, end: s.end, current: s.current === true, events: s.coverage?.fixtures?.events === true })) };
        } else {
          data = payload.response.map(normalizeFixture);
          if (data.some(f => !COMPETITIONS.some(c => c.id === f.league.id) || (params.league && (f.league.id !== Number(params.league) || f.league.season !== Number(params.season))) || (params.id && f.id !== Number(params.id)))) throw new PilotError('invalid_response');
        }
        // Keep bounded state. No tokens or provider error bodies are persisted.
        const entries = Object.entries(state.cache).sort((a, b) => b[1].at - a[1].at).slice(0, 199);
        state.cache = Object.fromEntries(entries);
        const entry = { at: now(), data };
        state.cache[cacheKey] = entry;
        await save();
        return packageResult(entry);
      } catch (e) {
        const error = e instanceof PilotError ? e : new PilotError('provider_unavailable');
        if (!['slow_down', 'provider_paused'].includes(error.code)) {
          state.blockedUntil = now() + 120000;
          await save().catch(() => {});
        }
        if (cached) return packageResult(cached, true, error.code);
        throw error;
      }
    });
  }
  return {
    meta,
    async handle(url) {
      if (url.pathname === '/api/pilot/status' && !url.search) return meta();
      const q = Object.fromEntries(url.searchParams);
      const exact = keys => Object.keys(q).every(k => keys.includes(k)) && [...url.searchParams.keys()].length === Object.keys(q).length;
      if (url.pathname === '/api/pilot/leagues' && exact(['league']) && COMPETITIONS.some(c => String(c.id) === q.league)) return request('leagues', { id: q.league });
      if (url.pathname === '/api/pilot/fixtures' && exact(['league', 'season', 'date']) && COMPETITIONS.some(c => String(c.id) === q.league) && /^\d{4}$/.test(q.season) && /^\d{4}-\d{2}-\d{2}$/.test(q.date)) {
        // Metadata must have been explicitly loaded first. Never invent coverage/access.
        const season = state.cache[`leagues?id=${q.league}`]?.data.seasons.find(s => String(s.year) === q.season);
        if (!season || q.date < season.start || q.date > season.end || !Number.isFinite(Date.parse(q.date)) || new Date(q.date).toISOString().slice(0, 10) !== q.date) throw new PilotError('invalid_selection', 400);
        return request('fixtures', { league: q.league, season: q.season, date: q.date, timezone: 'Europe/Paris' });
      }
      if (url.pathname === '/api/pilot/fixture' && exact(['id']) && /^[1-9]\d{0,9}$/.test(q.id)) {
        const known = Object.values(state.cache).some(v => Array.isArray(v.data) && v.data.some(f => String(f.id) === q.id));
        if (!known) throw new PilotError('unknown_fixture', 400);
        return request('fixtures', { id: q.id });
      }
      throw new PilotError('invalid_request', 400);
    },
    async close() { await queue; if (lock) { await lock.close(); await unlink(join(directory, 'pilot.lock')); lock = null; } },
  };
}
