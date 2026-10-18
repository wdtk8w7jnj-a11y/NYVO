// État d'affichage d'une rencontre : scénario de démonstration, diffusion,
// protection sans spoilers. Fonctions pures, partagées par tous les écrans
// pour garantir la cohérence accueil / liste / fiche / favoris.
import { CHANNEL, COUNTRY, COMPETITION, TEAM } from '../data/catalog.js';
import { MATCH } from '../data/matches.js';
import { PROGRAMMES, VERIFIED_AT } from '../data/programmes.js';

export const SCENARIOS = {
  normal: 'État normal',
  unconfirmed: 'Diffusion non confirmée',
  interrupted: 'Direct interrompu',
  limited: 'Données limitées',
};

export function scenarioOf(match, session) {
  const s = session.scenarios?.[match.id] || 'normal';
  if (s === 'interrupted' && match.status !== 'live') return 'normal';
  return SCENARIOS[s] ? s : 'normal';
}

export function isLimited(match, session) {
  return match.coverage === 'limited' || scenarioOf(match, session) === 'limited';
}

export const FORMAT_LABEL = { integral: 'Match intégral', multiplex: 'Multiplex', magazine: 'Magazine' };
export const PHASE_LABEL = { pre: 'Avant-match', match: 'Match', post: 'Après-match' };

// Programmes d'un pays, en tenant compte des rencontres passées en « non confirmée »
// par le scénario de démonstration (le multiplex garde ses autres rencontres).
export function programmesFor(countryId, session) {
  const forced = (id) => session.scenarios?.[id] === 'unconfirmed';
  return (PROGRAMMES[countryId] || [])
    .map((p) => ({ ...p, matches: p.matches.filter((id) => !forced(id)) }))
    .filter((p) => p.matches.length)
    .map((p) => ({ ...p, channelName: CHANNEL[p.channel].name, access: CHANNEL[p.channel].access, service: CHANNEL[p.channel].service }));
}

// Diffusion d'une rencontre pour un pays. Ne renvoie jamais de chaîne absente des données.
export function broadcastFor(match, countryId, session) {
  const verifiedAt = VERIFIED_AT[countryId] || null;
  if (!verifiedAt) return { confirmed: false, options: [], schedule: [], verifiedAt: null, noData: true };
  const items = programmesFor(countryId, session).filter((p) => p.matches.includes(match.id));
  const rank = { integral: 0, multiplex: 1, magazine: 2 };
  const options = items
    .filter((p) => p.phase === 'match')
    .sort((a, b) => rank[a.format] - rank[b.format] || a.channel.localeCompare(b.channel))
    .map((p) => ({ ...p, format: FORMAT_LABEL[p.format], formatId: p.format, subscription: p.access === 'Payant' }));
  const schedule = [...items]
    .sort((a, b) => a.at.localeCompare(b.at) || rank[a.format] - rank[b.format])
    .map((p) => ({ ...p, kind: p.phase }));
  if (!options.length) return { confirmed: false, options: [], schedule: [], verifiedAt, noData: false };
  return { confirmed: true, options, schedule, verifiedAt, noData: false };
}

export function primaryChannelName(match, countryId, session) {
  const b = broadcastFor(match, countryId, session);
  return b.confirmed ? b.options[0].channelName : null;
}

export function spoilerProtected(match, prefs) {
  return prefs.spoiler.global || prefs.spoiler.teams.includes(match.home) || prefs.spoiler.teams.includes(match.away);
}

// Score, minute, événements, statistiques masqués ?
export function isMasked(match, prefs, session) {
  return spoilerProtected(match, prefs) && match.status !== 'upcoming' && !session.revealed.has(match.id);
}

// Le classement peut dévoiler des résultats, même avant le coup d'envoi.
export function standingsMasked(match, prefs, session) {
  return spoilerProtected(match, prefs) && !session.revealed.has(match.id);
}

export function contentMasked(item, prefs, session) {
  if (!item.reveals?.length || session.revealedContent.has(item.id)) return false;
  return item.reveals.some((id) => isMasked(MATCH[id], prefs, session));
}

export const contentTitle = (item, prefs, session) => (contentMasked(item, prefs, session) ? item.maskedTitle : item.title);

const pad = (n) => String(n);
export const scoreText = (score) => `${pad(score[0])} – ${pad(score[1])}`;

// Résumé textuel cohérent pour toutes les vues.
export function matchSummary(match, prefs, session) {
  const masked = isMasked(match, prefs, session);
  const scenario = scenarioOf(match, session);
  const tz = COUNTRY[prefs.country].tz;
  const home = TEAM[match.home];
  const away = TEAM[match.away];
  const base = { match, home, away, competition: COMPETITION[match.competition], masked, scenario, tz };
  if (masked) {
    return { ...base, phase: match.status, headline: null, sub: 'Score masqué', live: false, a11yScore: 'Score masqué' };
  }
  if (match.status === 'live') {
    const interrupted = scenario === 'interrupted';
    return {
      ...base,
      phase: 'live',
      headline: scoreText(match.score),
      sub: interrupted ? `${match.minute}′ · Dernière minute reçue` : `${match.minute}′ · Direct simulé`,
      live: !interrupted,
      interrupted,
      a11yScore: `Score ${match.score[0]} à ${match.score[1]}, ${match.minute}e minute${interrupted ? ', dernier score reçu' : ', direct simulé'}`,
    };
  }
  if (match.status === 'finished') {
    return { ...base, phase: 'finished', headline: scoreText(match.score), sub: 'Terminé', live: false, a11yScore: `Score final ${match.score[0]} à ${match.score[1]}` };
  }
  return { ...base, phase: 'upcoming', headline: null, sub: 'À venir', live: false, a11yScore: 'Match à venir' };
}

export function matchTitle(match) {
  return `${TEAM[match.home].name} – ${TEAM[match.away].name}`;
}
