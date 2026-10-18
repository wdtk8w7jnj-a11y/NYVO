// Recherche globale du catalogue de démonstration : insensible aux accents,
// abréviations courantes, catégories. Ne révèle aucun résultat masqué.
import { CHANNELS, COMPETITION, COMPETITIONS, PLAYERS, TEAM, TEAMS, genderLabel } from '../data/catalog.js';
import { MATCHES } from '../data/matches.js';
import { ARTICLES, VIDEOS } from '../data/content.js';
import { contentMasked, contentTitle } from './matchState.js';

export const CATEGORIES = [
  ['tout', 'Tout'],
  ['match', 'Matchs'],
  ['equipe', 'Équipes'],
  ['competition', 'Compétitions'],
  ['joueur', 'Joueurs'],
  ['chaine', 'Chaînes'],
  ['article', 'Actualités'],
  ['video', 'Vidéos'],
];

export function normalize(s) {
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function entries(prefs, session) {
  const list = [];
  for (const t of TEAMS) {
    list.push({ type: 'equipe', id: t.id, label: t.name, sub: genderLabel(t), href: `#/equipe/${t.id}`, keys: [t.name], aliases: t.aliases });
  }
  for (const c of COMPETITIONS) {
    list.push({ type: 'competition', id: c.id, label: c.name, sub: c.subtitle, href: `#/competition/${c.id}`, keys: [c.name], aliases: c.aliases });
  }
  for (const p of PLAYERS) {
    list.push({ type: 'joueur', id: p.id, label: p.name, sub: `${TEAM[p.team].name} · ${p.position}`, href: `#/joueur/${p.id}`, keys: [p.name, TEAM[p.team].name], aliases: p.aliases });
  }
  for (const m of MATCHES) {
    const h = TEAM[m.home];
    const a = TEAM[m.away];
    list.push({
      type: 'match',
      id: m.id,
      label: `${h.name} – ${a.name}`,
      sub: COMPETITION[m.competition].name,
      href: `#/match/${m.id}`,
      keys: [h.name, a.name],
      aliases: [...h.aliases, ...a.aliases],
    });
  }
  for (const c of CHANNELS) {
    list.push({ type: 'chaine', id: c.id, label: c.name, sub: `Chaîne fictive · ${c.access}`, href: `#/programme?vue=chaine`, keys: [c.name], aliases: c.aliases });
  }
  for (const a of ARTICLES) {
    const masked = contentMasked(a, prefs, session);
    list.push({ type: 'article', id: a.id, label: contentTitle(a, prefs, session), sub: a.source, href: `#/article/${a.id}`, keys: [masked ? a.maskedTitle : a.title], aliases: [] });
  }
  for (const v of VIDEOS) {
    const masked = contentMasked(v, prefs, session);
    list.push({ type: 'video', id: v.id, label: contentTitle(v, prefs, session), sub: v.source, href: `#/video/${v.id}`, keys: [masked ? v.maskedTitle : v.title], aliases: [] });
  }
  return list;
}

export function search(query, category, prefs, session) {
  const tokens = normalize(query).split(' ').filter(Boolean);
  if (!tokens.length) return [];
  const results = [];
  for (const e of entries(prefs, session)) {
    if (category !== 'tout' && e.type !== category) continue;
    const words = e.keys.map(normalize);
    const aliases = e.aliases.map(normalize);
    let score = 0;
    let ok = true;
    for (const t of tokens) {
      if (aliases.includes(t)) score += 3;
      else if (words.some((w) => w.split(' ').some((x) => x.startsWith(t)))) score += 2;
      else if (words.some((w) => w.includes(t))) score += 1;
      else { ok = false; break; }
    }
    if (ok) results.push({ ...e, score });
  }
  const order = CATEGORIES.map((c) => c[0]);
  return results.sort((a, b) => b.score - a.score || order.indexOf(a.type) - order.indexOf(b.type) || a.label.localeCompare(b.label));
}
