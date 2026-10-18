// Programme TV : entrées chronologiques dérivées des diffusions confirmées.
import { CHANNELS, COUNTRY } from '../data/catalog.js';
import { MATCHES } from '../data/matches.js';
import { dayKey } from './time.js';
import { broadcastFor, isMasked } from './matchState.js';
import { isFollowedMatch } from './matchList.js';

export const KIND_LABEL = { pre: 'Avant-match', match: 'Match intégral', post: 'Après-match' };

export function guideEntries({ day, filter = 'tous', competition = 'toutes', myAccess = false }, prefs, session) {
  const tz = COUNTRY[prefs.country].tz;
  const entries = [];
  for (const m of MATCHES) {
    const b = broadcastFor(m, prefs.country, session);
    if (!b.confirmed) continue;
    for (const s of b.schedule) {
      if (dayKey(s.at, tz) !== day) continue;
      entries.push({ ...s, match: m, label: KIND_LABEL[s.kind] });
    }
  }
  return entries
    .filter((e) => filter !== 'favoris' || isFollowedMatch(e.match, prefs))
    .filter((e) => filter !== 'gratuit' || e.access === 'Gratuit')
    .filter((e) => filter !== 'payant' || e.access === 'Payant')
    .filter((e) => competition === 'toutes' || e.match.competition === competition)
    .filter((e) => !myAccess || prefs.services.includes(e.channel))
    .sort((a, b) => a.at.localeCompare(b.at) || a.channel.localeCompare(b.channel));
}

export function byChannel(entries) {
  return CHANNELS.map((channel) => ({ channel, entries: entries.filter((e) => e.channel === channel.id) })).filter(
    (g) => g.entries.length,
  );
}

// Bloc « Programme TV » de l'accueil : soirée d'une rencontre à venir,
// favoris en priorité, sinon la première rencontre programmée.
export function homeProgramme(day, prefs, session) {
  const candidates = MATCHES.filter((m) => {
    const b = broadcastFor(m, prefs.country, session);
    return b.confirmed && b.schedule.length > 1 && dayKey(m.kickoff, COUNTRY[prefs.country].tz) === day && !isMasked(m, prefs, session);
  });
  const rank = (m) => (isFollowedMatch(m, prefs) ? 0 : 1) + (m.status === 'upcoming' ? 0 : 2);
  candidates.sort((a, b) => rank(a) - rank(b) || a.kickoff.localeCompare(b.kickoff));
  const match = candidates[0];
  if (!match) return null;
  return { match, broadcast: broadcastFor(match, prefs.country, session) };
}
