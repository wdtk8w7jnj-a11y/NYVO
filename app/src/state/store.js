// Préférences invité conservées dans le navigateur (localStorage).
// Ne prétend jamais avoir sauvegardé si l'écriture échoue.
import { COMPETITION, COUNTRY, PLAYER, TEAM, CHANNEL, COUNTRIES } from '../data/catalog.js';
import { MATCH } from '../data/matches.js';
import { ARTICLE, VIDEO } from '../data/content.js';

export const KEY = 'nyvo-v3';
export const LEGACY_KEY = 'nyvo-v1';

export function defaults() {
  return {
    version: 3,
    onboarded: false,
    country: 'FR',
    lang: 'fr',
    follows: { teams: [], competitions: [], players: [] },
    saved: { matches: [], articles: [], videos: [] },
    savedAt: {},
    spoiler: { global: false, teams: [] },
    services: [],
    searchHistory: [],
    accountCardDismissed: false,
  };
}

const keep = (list, table) => (Array.isArray(list) ? [...new Set(list.filter((id) => typeof id === 'string' && table[id]))] : []);

// Valide une valeur chargée : tout champ inconnu ou invalide revient à sa valeur par défaut.
export function sanitize(raw) {
  const d = defaults();
  if (!raw || typeof raw !== 'object') return d;
  const f = raw.follows || {};
  const s = raw.saved || {};
  const sp = raw.spoiler || {};
  return {
    ...d,
    onboarded: raw.onboarded === true,
    country: COUNTRY[raw.country] ? raw.country : d.country,
    lang: 'fr',
    follows: { teams: keep(f.teams, TEAM), competitions: keep(f.competitions, COMPETITION), players: keep(f.players, PLAYER) },
    saved: { matches: keep(s.matches, MATCH), articles: keep(s.articles, ARTICLE), videos: keep(s.videos, VIDEO) },
    savedAt: raw.savedAt && typeof raw.savedAt === 'object' ? Object.fromEntries(Object.entries(raw.savedAt).filter(([, v]) => typeof v === 'number')) : {},
    spoiler: { global: sp.global === true, teams: keep(sp.teams, TEAM) },
    services: keep(raw.services, CHANNEL),
    searchHistory: Array.isArray(raw.searchHistory) ? raw.searchHistory.filter((q) => typeof q === 'string' && q.length <= 60).slice(0, 8) : [],
    accountCardDismissed: raw.accountCardDismissed === true,
  };
}

// Reprise des préférences du prototype V0.2 (clé nyvo-v1).
export function migrateLegacy(old) {
  const d = defaults();
  if (!old || typeof old !== 'object') return d;
  const country = COUNTRIES.find((c) => c.name === old.country);
  const nameToTeam = { 'Paris Atlas': 'paris-atlas', 'Milan Stella': 'milan-stella', 'Lyon Nord': 'lyon-nord', 'Berlin Union': 'berlin-union' };
  const nameToComp = { 'Coupe Élite': 'coupe-elite', 'Ligue Démo': 'ligue-demo' };
  const follows = Array.isArray(old.follows) ? old.follows : [];
  const saved = Array.isArray(old.saved) ? old.saved : [];
  const legacyMatch = { m0: 'pa-ms', m1: 'ln-bu', m2: 'mso-lci' };
  return sanitize({
    onboarded: old.onboard === 0,
    country: country ? country.id : 'FR',
    follows: {
      teams: follows.map((n) => nameToTeam[n]).filter(Boolean),
      competitions: follows.map((n) => nameToComp[n]).filter(Boolean),
    },
    saved: {
      matches: saved.map((x) => legacyMatch[x]).filter(Boolean),
      articles: saved.includes('article') ? ['a1'] : [],
      videos: saved.includes('video') ? ['v1'] : [],
    },
    spoiler: { global: old.spoiler === true, teams: [] },
  });
}

export function createStore(storage) {
  let available = probe(storage);
  let lastWriteOk = available;
  let state = load();
  const listeners = new Set();

  function load() {
    if (!available) return defaults();
    try {
      const raw = storage.getItem(KEY);
      if (raw) return sanitize(JSON.parse(raw));
      const legacy = storage.getItem(LEGACY_KEY);
      if (legacy) return migrateLegacy(JSON.parse(legacy));
    } catch {
      // Donnée illisible : on repart des valeurs par défaut sans effacer l'ancienne.
    }
    return defaults();
  }

  function persist() {
    if (!available) return (lastWriteOk = false);
    try {
      storage.setItem(KEY, JSON.stringify(state));
      return (lastWriteOk = true);
    } catch {
      return (lastWriteOk = false);
    }
  }

  return {
    get: () => state,
    // Renvoie true si la modification a bien été enregistrée sur l'appareil.
    update(fn) {
      const next = structuredClone(state);
      fn(next);
      state = sanitize(next);
      const ok = persist();
      listeners.forEach((l) => l(state));
      return ok;
    },
    reset() {
      state = defaults();
      let ok = false;
      if (available) {
        try {
          storage.removeItem(KEY);
          storage.removeItem(LEGACY_KEY);
          ok = true;
        } catch {
          ok = false;
        }
      }
      lastWriteOk = ok;
      listeners.forEach((l) => l(state));
      return ok;
    },
    storageStatus: () => (!available ? 'indisponible' : lastWriteOk ? 'ok' : 'erreur'),
    subscribe: (l) => (listeners.add(l), () => listeners.delete(l)),
  };
}

function probe(storage) {
  try {
    if (!storage) return false;
    storage.setItem('nyvo-probe', '1');
    storage.removeItem('nyvo-probe');
    return true;
  } catch {
    return false;
  }
}

// Actions utilitaires.
export function toggleIn(list, id) {
  const i = list.indexOf(id);
  if (i >= 0) list.splice(i, 1);
  else list.push(id);
  return i < 0;
}
