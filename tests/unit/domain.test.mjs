// Tests de la logique pure (node --test). Aucun navigateur requis.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MATCH, MATCHES } from '../../app/src/data/matches.js';
import { TEAM, TEAMS, CHANNEL } from '../../app/src/data/catalog.js';
import { ARTICLES, VIDEOS } from '../../app/src/data/content.js';
import { broadcastFor, isMasked, contentMasked, matchSummary, scenarioOf, standingsMasked } from '../../app/src/domain/matchState.js';
import { selectMatches, groupByCompetition, homeHighlights, isPinnedMatch } from '../../app/src/domain/matchList.js';
import { guideEntries, homeProgramme } from '../../app/src/domain/tvGuide.js';
import { search, normalize } from '../../app/src/domain/search.js';
import { newsFeed, videoFeed } from '../../app/src/domain/feeds.js';
import { time, dayKey, addDays } from '../../app/src/domain/time.js';
import { createStore, defaults, sanitize, migrateLegacy, KEY } from '../../app/src/state/store.js';

const prefs = (over = {}) => ({ ...defaults(), onboarded: true, ...over });
const session = (over = {}) => ({ revealed: new Set(), revealedContent: new Set(), scenarios: {}, ...over });

test('jeu de données : références cohérentes et équipes masculines/féminines distinctes', () => {
  for (const m of MATCHES) {
    assert.ok(TEAM[m.home] && TEAM[m.away], m.id);
    assert.equal(TEAM[m.home].gender, TEAM[m.away].gender, `${m.id} oppose deux équipes de même catégorie`);
    for (const b of Object.values(m.broadcasts || {})) {
      for (const o of b.options) assert.ok(CHANNEL[o.channel], `chaîne inconnue ${o.channel}`);
      for (const s of b.schedule) assert.ok(CHANNEL[s.channel], `chaîne inconnue ${s.channel}`);
    }
  }
  const ids = new Set(TEAMS.map((t) => t.id));
  assert.equal(ids.size, TEAMS.length);
  assert.equal(TEAM['milan-stella'].gender, 'M');
  assert.equal(TEAM['milan-stella-f'].gender, 'F');
  assert.equal(TEAM['lyon-nord-f'].gender, 'F');
});

test('horaires convertis selon le pays de diffusion', () => {
  const m = MATCH['pa-ms'];
  assert.equal(time(m.kickoff, 'Europe/Paris'), '21:00');
  assert.equal(time(m.kickoff, 'Europe/London'), '20:00');
  assert.equal(dayKey(m.kickoff, 'Europe/Paris'), '2026-10-18');
  assert.equal(addDays('2026-10-18', 1), '2026-10-19');
});

test('diffusion : chaîne propre à chaque rencontre, jamais inventée', () => {
  const s = session();
  assert.equal(broadcastFor(MATCH['pa-ms'], 'FR', s).options[0].channelName, 'Sport Démo 1');
  assert.equal(broadcastFor(MATCH['ln-bu'], 'FR', s).options[0].channelName, 'Sport Démo 2');
  const mso = broadcastFor(MATCH['mso-lci'], 'FR', s);
  assert.deepEqual(mso.schedule.map((x) => x.channelName), ['Sport Démo 2', 'Sport Démo 2', 'Sport Démo 2']);
  // Non confirmée : aucune option, aucun programme.
  const unconf = broadcastFor(MATCH['msp-lc'], 'FR', s);
  assert.equal(unconf.confirmed, false);
  assert.equal(unconf.options.length, 0);
  // Autre pays sans données : non confirmé, sans date de vérification inventée.
  const be = broadcastFor(MATCH['pa-ms'], 'BE', s);
  assert.equal(be.confirmed, false);
  assert.equal(be.verifiedAt, null);
  // Scénario non confirmé : la chaîne disparaît.
  assert.equal(broadcastFor(MATCH['pa-ms'], 'FR', session({ scenarios: { 'pa-ms': 'unconfirmed' } })).confirmed, false);
});

test('direct interrompu réservé aux rencontres en direct', () => {
  assert.equal(scenarioOf(MATCH['pa-ms'], session({ scenarios: { 'pa-ms': 'interrupted' } })), 'interrupted');
  assert.equal(scenarioOf(MATCH['ln-bu'], session({ scenarios: { 'ln-bu': 'interrupted' } })), 'normal');
  const sum = matchSummary(MATCH['pa-ms'], prefs(), session({ scenarios: { 'pa-ms': 'interrupted' } }));
  assert.match(sum.sub, /Dernière minute reçue/);
});

test('sans spoilers : global, par équipe, révélation par match et contenus liés', () => {
  const global = prefs({ spoiler: { global: true, teams: [] } });
  const s = session();
  assert.equal(isMasked(MATCH['pa-ms'], global, s), true);
  assert.equal(isMasked(MATCH['ln-bu'], global, s), false, 'un match à venir n’a rien à masquer');
  assert.equal(standingsMasked(MATCH['ln-bu'], global, s), true, 'le classement peut révéler des résultats');
  const sum = matchSummary(MATCH['pa-ms'], global, s);
  assert.equal(sum.headline, null);
  assert.ok(!JSON.stringify(sum.a11yScore).includes('2'));
  assert.equal(contentMasked(VIDEOS.find((v) => v.id === 'v3'), global, s), true);
  s.revealed.add('pa-ms');
  assert.equal(isMasked(MATCH['pa-ms'], global, s), false);
  assert.equal(contentMasked(VIDEOS.find((v) => v.id === 'v3'), global, s), false);
  assert.equal(isMasked(MATCH['mso-lci'], global, s), true, 'la révélation est propre à la rencontre');
  const team = prefs({ spoiler: { global: false, teams: ['madrid-sol'] } });
  assert.equal(isMasked(MATCH['mso-lci'], team, session()), true);
  assert.equal(isMasked(MATCH['pa-ms'], team, session()), false);
});

test('liste Matchs : filtres, diffusion dans mon pays, dates hors démo, regroupement', () => {
  const p = prefs();
  const s = session();
  assert.equal(selectMatches({ day: '2026-10-18' }, p, s).length, 6);
  assert.deepEqual(selectMatches({ day: '2026-10-18', filter: 'direct' }, p, s).map((m) => m.id), ['pa-ms']);
  assert.deepEqual(selectMatches({ day: '2026-10-18', filter: 'termines' }, p, s).map((m) => m.id), ['mso-lci']);
  assert.ok(!selectMatches({ day: '2026-10-18', broadcastOnly: true }, p, s).some((m) => m.id === 'msp-lc'));
  assert.equal(selectMatches({ day: '2026-10-25' }, p, s).length, 0);
  assert.deepEqual(selectMatches({ day: '2026-10-19' }, p, s).map((m) => m.id), ['lnf-msf']);
  const groups = groupByCompetition(selectMatches({ day: '2026-10-18' }, p, s));
  assert.deepEqual(groups.map((g) => g.competition.id), ['coupe-elite', 'ligue-demo']);
  // Belgique : aucune diffusion confirmée dans la démo.
  assert.equal(selectMatches({ day: '2026-10-18', broadcastOnly: true }, prefs({ country: 'BE' }), s).length, 0);
});

test('accueil : favoris épinglés et programme du jour', () => {
  const p = prefs({ follows: { teams: ['paris-atlas'], competitions: [], players: [] } });
  assert.equal(homeHighlights('2026-10-18', p).featured.id, 'pa-ms');
  assert.equal(isPinnedMatch(MATCH['pa-ms'], p), true);
  assert.equal(isPinnedMatch(MATCH['ln-bu'], p), false);
  const prog = homeProgramme('2026-10-18', prefs(), session());
  assert.equal(prog.match.id, 'ln-bu');
  assert.equal(homeProgramme('2026-10-18', prefs({ country: 'IT' }), session()), null);
});

test('programme TV : chronologique, filtres gratuit/payant et Mes accès', () => {
  const p = prefs();
  const all = guideEntries({ day: '2026-10-18' }, p, session());
  const times = all.map((e) => e.at);
  assert.deepEqual(times, [...times].sort());
  assert.ok(guideEntries({ day: '2026-10-18', filter: 'gratuit' }, p, session()).every((e) => e.access === 'Gratuit'));
  assert.equal(guideEntries({ day: '2026-10-18', myAccess: true }, p, session()).length, 0);
  assert.ok(guideEntries({ day: '2026-10-18', myAccess: true }, prefs({ services: ['sd1'] }), session()).every((e) => e.channel === 'sd1'));
});

test('recherche : accents, abréviations, catégories, aucun spoiler', () => {
  const p = prefs();
  assert.equal(normalize('Élite'), 'elite');
  assert.equal(search('coupe elite', 'tout', p, session())[0].id, 'coupe-elite');
  assert.equal(search('PA', 'equipe', p, session())[0].id, 'paris-atlas');
  assert.ok(search('SD1', 'tout', p, session()).some((r) => r.type === 'chaine'));
  assert.ok(search('berlin', 'match', p, session()).some((r) => r.id === 'ln-bu'));
  const masked = search('jules', 'tout', prefs({ spoiler: { global: true, teams: [] } }), session());
  assert.ok(!masked.some((r) => /63e minute/.test(r.label)), 'titre révélateur exclu');
  assert.equal(search('zzz', 'tout', p, session()).length, 0);
});

test('actualités et vidéos : fil personnalisé, mercato, officielles/amateurs', () => {
  const p = prefs({ follows: { teams: ['paris-atlas'], competitions: [], players: [] } });
  assert.ok(newsFeed({ feed: 'pour-vous' }, p).every((a) => a.teams.includes('paris-atlas')));
  assert.deepEqual(newsFeed({ feed: 'general', filter: 'mercato' }, p).map((a) => a.id), ['a3']);
  assert.equal(newsFeed({ feed: 'pour-vous' }, prefs()).length, ARTICLES.length, 'sans favori : fil général');
  assert.ok(videoFeed('amateurs', p).every((v) => v.kind === 'amateur'));
});

function memoryStorage() {
  const data = new Map();
  return { getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, String(v)), removeItem: (k) => data.delete(k), data };
}

test('stockage : persistance, validation, migration V0.2', () => {
  const st = memoryStorage();
  const a = createStore(st);
  assert.equal(a.update((s) => s.follows.teams.push('paris-atlas')), true);
  const b = createStore(st);
  assert.deepEqual(b.get().follows.teams, ['paris-atlas']);
  assert.deepEqual(sanitize({ country: 'XX', follows: { teams: ['inconnue', 'paris-atlas'] } }).follows.teams, ['paris-atlas']);
  assert.equal(sanitize({ country: 'XX' }).country, 'FR');
  const legacy = memoryStorage();
  legacy.setItem('nyvo-v1', JSON.stringify({ country: 'Belgique', onboard: 0, follows: ['Paris Atlas', 'Coupe Élite'], saved: ['m0', 'video'], spoiler: true }));
  const c = createStore(legacy).get();
  assert.equal(c.country, 'BE');
  assert.equal(c.onboarded, true);
  assert.deepEqual(c.follows.teams, ['paris-atlas']);
  assert.deepEqual(c.follows.competitions, ['coupe-elite']);
  assert.deepEqual(c.saved.matches, ['pa-ms']);
  assert.deepEqual(c.saved.videos, ['v1']);
  assert.equal(c.spoiler.global, true);
  assert.deepEqual(migrateLegacy(null), defaults());
});

test('stockage indisponible ou plein : jamais de fausse confirmation', () => {
  const blocked = { getItem() { throw new Error('bloqué'); }, setItem() { throw new Error('bloqué'); }, removeItem() {} };
  const a = createStore(blocked);
  assert.equal(a.storageStatus(), 'indisponible');
  assert.equal(a.update((s) => { s.country = 'BE'; }), false);
  assert.equal(a.get().country, 'BE', 'la préférence reste appliquée pour la session');
  const st = memoryStorage();
  const full = createStore({ ...st, setItem(k, v) { if (k === KEY) throw new Error('QuotaExceededError'); st.setItem(k, v); } });
  assert.equal(full.update((s) => { s.country = 'IT'; }), false);
  assert.equal(full.storageStatus(), 'erreur');
});
