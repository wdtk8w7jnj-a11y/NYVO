// Préférences invité conservées dans le navigateur (localStorage).
// Ne prétend jamais avoir sauvegardé si l'écriture échoue.
import { COMPETITION, COUNTRY, PLAYER, TEAM, CHANNEL, COUNTRIES } from '../data/catalog.js';
import { MATCH } from '../data/matches.js';
import { SERVICE } from '../data/access.js';
import { ARTICLE, VIDEO } from '../data/content.js';

export const KEY = 'nyvo-v4';
export const V3_KEY = 'nyvo-v3';
export const LEGACY_KEY = 'nyvo-v1';

export function defaults() {
  return {
    version: 4,
    onboarded: false,
    country: 'FR',
    lang: 'fr',
    follows: { teams: [], competitions: [], players: [] },
    saved: { matches: [], articles: [], videos: [] },
    savedAt: {},
    spoiler: { global: false, teams: [] },
    pilot: { saved: [], spoilerMatches: [], spoilerTeams: [] },
    // Mes accès, par pays : { FR: { services: { id: { offer, options } }, legacy: [chaînes] } }
    access: {},
    searchHistory: [],
    accountCardDismissed: false,
  };
}

const keep = (list, table) => (Array.isArray(list) ? [...new Set(list.filter((id) => typeof id === 'string' && table[id]))] : []);
const realIds = list => Array.isArray(list) ? [...new Set(list.filter(n => Number.isSafeInteger(n) && n > 0))].slice(0, 1000) : [];

// Accès déclarés : seuls les services, offres et options du catalogue du pays sont gardés.
// Une offre inconnue redevient « à préciser » (null) ; rien n'est inventé.
export function sanitizeAccess(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [country, a] of Object.entries(raw)) {
    if (!COUNTRY[country] || !a || typeof a !== 'object') continue;
    const services = {};
    for (const [id, sel] of Object.entries(a.services || {})) {
      const entry = SERVICE[id]?.countries[country];
      if (!entry || !sel || typeof sel !== 'object') continue;
      const offer = entry.offers.some((o) => o.id === sel.offer) ? sel.offer : null;
      const options = Array.isArray(sel.options) ? [...new Set(sel.options.filter((o) => entry.options.some((x) => x.id === o)))] : [];
      services[id] = { offer, options: offer ? options : [] };
    }
    const legacy = keep(a.legacy, CHANNEL);
    if (Object.keys(services).length || legacy.length) out[country] = { services, legacy };
  }
  return out;
}

// Reprise des préférences V0.3 (clé nyvo-v3) : les chaînes cochées deviennent des
// « accès historiques à préciser » pour le pays alors choisi, jamais une offre vérifiée.
export function migrateV3(old) {
  if (!old || typeof old !== 'object') return defaults();
  const country = COUNTRY[old.country] ? old.country : 'FR';
  const legacy = keep(old.services, CHANNEL);
  const { services, ...rest } = old;
  return sanitize({ ...rest, access: legacy.length ? { [country]: { services: {}, legacy } } : {} });
}

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
    pilot: { saved: realIds(raw.pilot?.saved), spoilerMatches: realIds(raw.pilot?.spoilerMatches), spoilerTeams: realIds(raw.pilot?.spoilerTeams) },
    access: sanitizeAccess(raw.access),
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
      const v3 = storage.getItem(V3_KEY);
      if (v3) return migrateV3(JSON.parse(v3));
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
          storage.removeItem(V3_KEY);
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
