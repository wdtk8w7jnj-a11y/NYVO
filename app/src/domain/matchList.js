// Sélection, filtres et regroupements de la liste Matchs.
import { COMPETITIONS, COUNTRY } from '../data/catalog.js';
import { MATCHES } from '../data/matches.js';
import { dayKey } from './time.js';
import { broadcastFor } from './matchState.js';

export const FILTERS = [
  ['tous', 'Tous'],
  ['direct', 'En direct'],
  ['a-venir', 'À venir'],
  ['termines', 'Terminés'],
];
const STATUS_BY_FILTER = { direct: 'live', 'a-venir': 'upcoming', termines: 'finished' };

export function matchesOn(day, countryId) {
  const tz = COUNTRY[countryId].tz;
  return MATCHES.filter((m) => dayKey(m.kickoff, tz) === day);
}

export function isFollowedMatch(match, prefs) {
  const f = prefs.follows;
  return (
    f.teams.includes(match.home) ||
    f.teams.includes(match.away) ||
    f.competitions.includes(match.competition) ||
    prefs.saved.matches.includes(match.id)
  );
}

// Épinglés en tête de Matchs : équipes suivies ou matchs enregistrés (planche 02).
export function isPinnedMatch(match, prefs) {
  return prefs.follows.teams.includes(match.home) || prefs.follows.teams.includes(match.away) || prefs.saved.matches.includes(match.id);
}

const RANK = { live: 0, upcoming: 1, finished: 2 };
export const byStatusThenKickoff = (a, b) => RANK[a.status] - RANK[b.status] || byKickoff(a, b);

export function selectMatches({ day, filter = 'tous', broadcastOnly = false }, prefs, session) {
  const wanted = STATUS_BY_FILTER[filter];
  return matchesOn(day, prefs.country)
    .filter((m) => !wanted || m.status === wanted)
    .filter((m) => !broadcastOnly || broadcastFor(m, prefs.country, session).confirmed)
    .sort(byKickoff);
}

export function byKickoff(a, b) {
  return a.kickoff.localeCompare(b.kickoff) || a.id.localeCompare(b.id);
}

export function groupByCompetition(list) {
  return COMPETITIONS.map((competition) => ({
    competition,
    matches: list.filter((m) => m.competition === competition.id),
  })).filter((g) => g.matches.length);
}

// Rencontres du jour mises en avant : favoris d'abord, direct en tête.
export function homeHighlights(day, prefs) {
  const all = matchesOn(day, prefs.country).sort(byKickoff);
  const followed = all.filter((m) => isFollowedMatch(m, prefs));
  const rank = { live: 0, upcoming: 1, finished: 2 };
  followed.sort((a, b) => rank[a.status] - rank[b.status] || byKickoff(a, b));
  return { followed, featured: followed[0] || all.find((m) => m.status === 'live') || all[0] || null };
}
