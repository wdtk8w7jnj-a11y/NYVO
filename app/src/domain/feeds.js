// Fils Actualités et Vidéos selon les favoris (fil personnalisé local).
import { ARTICLES, VIDEOS } from '../data/content.js';

const byDate = (a, b) => b.publishedAt.localeCompare(a.publishedAt);

export function hasFavorites(prefs) {
  return prefs.follows.teams.length + prefs.follows.competitions.length + prefs.follows.players.length > 0;
}

function relatesToFavorites(item, prefs) {
  const f = prefs.follows;
  return (item.teams || []).some((t) => f.teams.includes(t)) || (item.competitions || []).some((c) => f.competitions.includes(c));
}

export const NEWS_FILTERS = [
  ['tous', 'Tous'],
  ['mes-clubs', 'Mes clubs'],
  ['europe', 'Europe'],
  ['mercato', 'Mercato'],
];

// feed : 'pour-vous' | 'general'
export function newsFeed({ feed = 'pour-vous', filter = 'tous' }, prefs) {
  let list = [...ARTICLES].sort(byDate);
  if (feed === 'pour-vous' && hasFavorites(prefs)) list = list.filter((a) => relatesToFavorites(a, prefs));
  if (filter === 'mes-clubs') list = list.filter((a) => a.teams.some((t) => prefs.follows.teams.includes(t)));
  if (filter === 'europe') list = list.filter((a) => a.tags.includes('europe'));
  if (filter === 'mercato') list = list.filter((a) => a.tags.includes('mercato'));
  return list;
}

export const VIDEO_FEEDS = [
  ['pour-vous', 'Pour vous'],
  ['officielles', 'Officielles'],
  ['amateurs', 'Amateurs'],
];

export function videoFeed(feed, prefs) {
  let list = [...VIDEOS].sort(byDate);
  if (feed === 'officielles') return list.filter((v) => v.kind === 'officielle');
  if (feed === 'amateurs') return list.filter((v) => v.kind === 'amateur');
  if (hasFavorites(prefs)) {
    const fav = list.filter((v) => relatesToFavorites(v, prefs));
    const rest = list.filter((v) => !relatesToFavorites(v, prefs));
    list = [...fav, ...rest];
  }
  return list;
}
