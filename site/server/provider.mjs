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

