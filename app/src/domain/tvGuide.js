// Programme TV : un seul jeu d'entrées filtrées, présenté en trois vues
// (Horaire, Chaîne, Match). Les filtres appliqués vivent dans l'adresse.
import { CHANNELS, COMPETITION, COMPETITIONS, COUNTRY } from '../data/catalog.js';
import { MATCH, MATCHES } from '../data/matches.js';
import { UNCONFIRMED, VERIFIED_AT } from '../data/programmes.js';
import { dayKey } from './time.js';
import { broadcastFor, isMasked, programmesFor } from './matchState.js';
import { isFollowedMatch } from './matchList.js';
import { declared, isChannelIncluded } from './access.js';

export const KIND_LABEL = { pre: 'Avant-match', match: 'Match intégral', post: 'Après-match' };

export const TYPES = [
  ['avant', 'Avant-match'],
  ['integral', 'Match intégral'],
  ['multiplex', 'Multiplex'],
  ['apres', 'Après-match'],
];
export const TYPE_LABEL = Object.fromEntries(TYPES);
const TYPE_ORDER = Object.fromEntries(TYPES.map(([t], i) => [t, i]));
export const VIEWS = [
  ['horaire', 'Horaire'],
  ['chaine', 'Chaîne'],
  ['match', 'Match'],
];

export function typeOf(p) {
  if (p.phase === 'pre') return 'avant';
  if (p.phase === 'post') return 'apres';
  return p.format === 'multiplex' ? 'multiplex' : 'integral';
}

export const DEFAULT_FILTERS = Object.freeze({
  favorites: false,
  competitions: [],
  access: 'tous',
  types: TYPES.map(([t]) => t),
  mine: false,
  unconfirmed: true,
});

const list = (v, allowed) => (v ? v.split(',').filter((x) => allowed.includes(x)) : null);

// Lecture tolérante de l'adresse : toute valeur inconnue revient à la valeur par défaut.
export function parseFilters(q = {}) {
  const types = list(q.types, TYPES.map(([t]) => t));
  return {
    favorites: q.fav === '1',
    competitions: list(q.comp, COMPETITIONS.map((c) => c.id)) || [],
    access: ['gratuit', 'payant'].includes(q.acces) ? q.acces : 'tous',
    types: types && types.length ? types : [...DEFAULT_FILTERS.types],
    mine: q.mes === '1',
    unconfirmed: q.nc !== '0',
  };
}

// Écriture : seules les valeurs différentes du défaut apparaissent dans l'adresse.
export function filtersToQuery(f) {
  const allTypes = f.types.length === TYPES.length;
  return {
    fav: f.favorites ? '1' : undefined,
    comp: f.competitions.length ? f.competitions.join(',') : undefined,
    acces: f.access !== 'tous' ? f.access : undefined,
    types: allTypes ? undefined : f.types.join(','),
    mes: f.mine ? '1' : undefined,
    nc: f.unconfirmed ? undefined : '0',
  };
}

export function isDefault(f) {
  const q = filtersToQuery(f);
  return Object.values(q).every((v) => v === undefined);
}

export function countActive(f) {
  const q = filtersToQuery(f);
  return Object.values(q).filter((v) => v !== undefined).length;
}

// Calcule les trois vues à partir des mêmes entrées.
export function guide({ day, filters = DEFAULT_FILTERS }, prefs, session, { items } = {}) {
  const country = prefs.country;
  const tz = COUNTRY[country].tz;
  const hasData = Boolean(VERIFIED_AT[country]);
  const access = declared(prefs, country);
  const all = (items || programmesFor(country, session)).filter((p) => dayKey(p.at, tz) === day);
  const matchOk = (m) =>
    (!filters.favorites || isFollowedMatch(m, prefs)) &&
    (!filters.competitions.length || filters.competitions.includes(m.competition));
  const entries = all
    .filter((p) => p.matches.some((id) => matchOk(MATCH[id])))
    .filter((p) => filters.access === 'tous' || p.access === (filters.access === 'gratuit' ? 'Gratuit' : 'Payant'))
    .filter((p) => filters.types.includes(typeOf(p)))
    .filter((p) => !filters.mine || isChannelIncluded(p.channel, access))
    .map((p) => ({ ...p, type: typeOf(p), typeLabel: TYPE_LABEL[typeOf(p)], included: isChannelIncluded(p.channel, access) }))
    .sort((a, b) => a.at.localeCompare(b.at) || a.channel.localeCompare(b.channel) || a.id.localeCompare(b.id));

  // Non confirmées : jamais incluses dans Mes accès (aucune chaîne à faire correspondre).
  const unconfirmedAll = hasData
    ? MATCHES.filter((m) => dayKey(m.kickoff, tz) === day)
        .filter((m) => UNCONFIRMED[country]?.includes(m.id) || !broadcastFor(m, country, session).confirmed)
        .filter(matchOk)
        .sort((a, b) => a.kickoff.localeCompare(b.kickoff))
    : [];
  // Sans chaîne connue, ni l'accès (gratuit/payant) ni Mes accès ne peuvent être vérifiés :
  // ces filtres excluent donc les diffusions non confirmées, en le signalant.
  const excludes = filters.mine || filters.access !== 'tous';
  const unconfirmed = filters.unconfirmed && !excludes ? unconfirmedAll : [];

  return {
    hasData,
    verifiedAt: VERIFIED_AT[country] || null,
    access,
    entries,
    unconfirmed,
    hiddenUnconfirmed: excludes && filters.unconfirmed ? unconfirmedAll.length : 0,
    total: entries.length + unconfirmed.length,
  };
}

// Vue Horaire : une seule chronologie, triée sur l'instant réel (fuseau et minuit compris).
export function timeline(g) {
  const rows = [
    ...g.entries.map((e) => ({ kind: 'programme', at: e.at, entry: e })),
    ...g.unconfirmed.map((m) => ({ kind: 'unconfirmed', at: m.kickoff, match: m })),
  ];
  return rows.sort((a, b) => a.at.localeCompare(b.at) || (a.kind === b.kind ? 0 : a.kind === 'programme' ? -1 : 1));
}

// Vue Chaîne : un groupe par chaîne, ordre chronologique interne.
export function byChannel(entries) {
  return CHANNELS.map((channel) => ({ channel, entries: entries.filter((e) => e.channel === channel.id) })).filter((g) => g.entries.length);
}

// Vue Match : chaque rencontre regroupe ses avant-match, match intégral, multiplex et après-match.
export function byMatch(g) {
  const ids = new Set(g.entries.flatMap((e) => e.matches));
  g.unconfirmed.forEach((m) => ids.add(m.id));
  return [...ids]
    .map((id) => MATCH[id])
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff) || a.id.localeCompare(b.id))
    .map((match) => ({
      match,
      competition: COMPETITION[match.competition],
      entries: g.entries.filter((e) => e.matches.includes(match.id)).sort((a, b) => a.at.localeCompare(b.at) || TYPE_ORDER[a.type] - TYPE_ORDER[b.type]),
      unconfirmed: g.unconfirmed.includes(match),
    }));
}

// Bloc « Programme TV » de l'accueil : soirée d'une rencontre à venir,
// favoris en priorité, sinon la première rencontre programmée.
export function homeProgramme(day, prefs, session) {
  const candidates = MATCHES.filter((m) => {
    const b = broadcastFor(m, prefs.country, session);
    return b.confirmed && b.schedule.filter((s) => s.format !== 'multiplex').length > 1 && dayKey(m.kickoff, COUNTRY[prefs.country].tz) === day && !isMasked(m, prefs, session);
  });
  const rank = (m) => (isFollowedMatch(m, prefs) ? 0 : 1) + (m.status === 'upcoming' ? 0 : 2);
  candidates.sort((a, b) => rank(a) - rank(b) || a.kickoff.localeCompare(b.kickoff));
  const match = candidates[0];
  if (!match) return null;
  const broadcast = broadcastFor(match, prefs.country, session);
  // L'accueil montre la soirée de la rencontre elle-même, sans le multiplex partagé.
  return { match, broadcast: { ...broadcast, schedule: broadcast.schedule.filter((s) => s.format !== 'multiplex') } };
}
