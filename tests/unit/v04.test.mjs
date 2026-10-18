// Règles V0.4 : Programme TV, filtres, Mes accès, accès au diffuseur, serveur.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MATCH } from '../../app/src/data/matches.js';
import { PROGRAMMES } from '../../app/src/data/programmes.js';
import { guide, timeline, byChannel, byMatch, parseFilters, filtersToQuery, DEFAULT_FILTERS, typeOf, isDefault } from '../../app/src/domain/tvGuide.js';
import { broadcastFor, programmesFor } from '../../app/src/domain/matchState.js';
import { declared, accessState } from '../../app/src/domain/access.js';
import { createStore, defaults, migrateV3, sanitizeAccess, V3_KEY } from '../../app/src/state/store.js';
import { localAddresses } from '../../scripts/lib/addresses.mjs';

const DAY = '2026-10-18';
const prefs = (over = {}) => ({ ...defaults(), onboarded: true, ...over });
const session = (over = {}) => ({ revealed: new Set(), revealedContent: new Set(), scenarios: {}, ...over });
const F = (over = {}) => ({ ...DEFAULT_FILTERS, types: [...DEFAULT_FILTERS.types], ...over });
const football = (extra = {}) => ({ FR: { services: { 'vision-sport': { offer: 'football', options: [] }, ...extra }, legacy: [] } });

test('multiplex : un seul programme, format distinct du moment de la soirée', () => {
  const multi = PROGRAMMES.FR.filter((p) => p.format === 'multiplex');
  assert.equal(multi.length, 1);
  assert.deepEqual(multi[0].matches, ['pa-ms', 'tr-nr']);
  assert.equal(typeOf(multi[0]), 'multiplex');
  assert.equal(typeOf({ phase: 'match', format: 'integral' }), 'integral');
  assert.equal(typeOf({ phase: 'pre', format: 'magazine' }), 'avant');
  const g = guide({ day: DAY }, prefs(), session());
  assert.equal(g.entries.filter((e) => e.format === 'multiplex').length, 1, 'pas de doublon en vue Horaire');
  const sd2 = byChannel(g.entries).find((c) => c.channel.id === 'sd2');
  assert.equal(sd2.entries.filter((e) => e.format === 'multiplex').length, 1, 'pas de doublon en vue Chaîne');
  // Vue Match : le multiplex apparaît sous chacune de ses rencontres, distinct du match intégral.
  const pams = byMatch(g).find((x) => x.match.id === 'pa-ms');
  assert.deepEqual(pams.entries.map((e) => e.type), ['avant', 'integral', 'multiplex', 'apres']);
  // À heure égale, le match intégral précède le multiplex, quelle que soit la chaîne.
  assert.deepEqual(byMatch(g).find((x) => x.match.id === 'tr-nr').entries.map((e) => e.type), ['integral', 'multiplex']);
  // Où regarder : match intégral avant multiplex.
  assert.deepEqual(broadcastFor(MATCH['pa-ms'], 'FR', session()).options.map((o) => o.format), ['Match intégral', 'Multiplex']);
});

test('les trois vues reposent sur les mêmes entrées et les mêmes filtres', () => {
  for (const filters of [F(), F({ types: ['integral'] }), F({ competitions: ['ligue-demo'] }), F({ favorites: true })]) {
    const p = prefs({ follows: { teams: ['paris-atlas'], competitions: [], players: [] } });
    const g = guide({ day: DAY, filters }, p, session());
    const ids = (list) => [...new Set(list.map((e) => e.id))].sort();
    const tl = timeline(g).filter((r) => r.kind === 'programme').map((r) => r.entry);
    assert.deepEqual(ids(tl), ids(g.entries));
    assert.deepEqual(ids(byChannel(g.entries).flatMap((c) => c.entries)), ids(g.entries));
    assert.deepEqual(ids(byMatch(g).flatMap((m) => m.entries)), ids(g.entries));
  }
});

test('Horaire : ordre sur l’instant réel, non confirmées à leur heure (correction maquette 01)', () => {
  const g = guide({ day: DAY }, prefs(), session());
  const rows = timeline(g);
  const at = rows.map((r) => r.at);
  assert.deepEqual(at, [...at].sort());
  const nc = rows.findIndex((r) => r.kind === 'unconfirmed');
  const post = rows.findIndex((r) => r.entry?.id === 'fr-pams-post');
  assert.ok(nc >= 0 && nc < post, 'la rencontre de 21:00 précède les programmes de 23:00');
});

test('fuseau et passage de minuit : le jour dépend du pays', () => {
  const items = [
    { id: 'late', at: '2026-10-18T22:30:00Z', channel: 'sd1', phase: 'post', format: 'magazine', matches: ['pa-ms'], access: 'Payant', channelName: 'Sport Démo 1' },
    { id: 'early', at: '2026-10-18T21:30:00Z', channel: 'sd1', phase: 'post', format: 'magazine', matches: ['pa-ms'], access: 'Payant', channelName: 'Sport Démo 1' },
  ];
  // 22:30 UTC = 00:30 le 19 à Paris, mais 23:30 le 18 à Londres.
  const fr = guide({ day: DAY }, prefs({ country: 'FR' }), session(), { items });
  assert.deepEqual(fr.entries.map((e) => e.id), ['early']);
  const fr19 = guide({ day: '2026-10-19' }, prefs({ country: 'FR' }), session(), { items });
  assert.deepEqual(fr19.entries.map((e) => e.id), ['late']);
  const gb = guide({ day: DAY }, prefs({ country: 'GB' }), session(), { items });
  assert.deepEqual(gb.entries.map((e) => e.id), ['early', 'late']);
});

test('filtres : adresse ↔ état, multi-sélections, combinaisons et défauts', () => {
  assert.ok(isDefault(parseFilters({})));
  const f = F({ favorites: true, competitions: ['coupe-elite', 'ligue-demo'], access: 'payant', types: ['avant', 'apres'], mine: true, unconfirmed: false });
  assert.deepEqual(parseFilters(filtersToQuery(f)), f);
  assert.deepEqual(parseFilters({ types: 'inconnu', acces: 'x', comp: 'zzz' }), parseFilters({}), 'valeurs invalides ignorées');
  const g = guide({ day: DAY, filters: F({ competitions: ['coupe-elite'], types: ['avant', 'apres'] }) }, prefs(), session());
  assert.ok(g.entries.length > 0);
  assert.ok(g.entries.every((e) => ['avant', 'apres'].includes(e.type) && e.matches.some((id) => MATCH[id].competition === 'coupe-elite')));
  assert.equal(guide({ day: DAY, filters: F({ access: 'gratuit' }) }, prefs(), session()).entries.length, 0, 'aucune chaîne gratuite dans la démo');
  assert.equal(guide({ day: DAY, filters: F({ unconfirmed: false }) }, prefs(), session()).unconfirmed.length, 0);
});

test('Mes accès : uniquement l’offre et les options déclarées et vérifiées', () => {
  const p = prefs({ access: football() });
  const d = declared(p, 'FR');
  assert.equal(accessState(d), 'verifiee');
  assert.deepEqual([...d.verified.keys()].sort(), ['sd1', 'sd2']);
  const g = guide({ day: DAY, filters: F({ mine: true }) }, p, session());
  assert.ok(g.entries.every((e) => ['sd1', 'sd2'].includes(e.channel)));
  assert.ok(!g.entries.some((e) => e.id === 'fr-pams-post'), 'Sport Démo 3 exclue sans l’option');
  assert.equal(g.unconfirmed.length, 0, 'non confirmées jamais présentées comme incluses');
  assert.ok(g.hiddenUnconfirmed > 0);
  // Option non sélectionnée : rien d'ajouté ; sélectionnée : Sport Démo 3 ajoutée.
  const withOpt = prefs({ access: { FR: { services: { 'vision-sport': { offer: 'essentiel', options: ['sport-plus'] } }, legacy: [] } } });
  assert.deepEqual([...declared(withOpt, 'FR').verified.keys()].sort(), ['sd1', 'sd3']);
});

test('Mes accès : offre à préciser, accès historiques, aucune préférence', () => {
  const pending = prefs({ access: { FR: { services: { arena: { offer: null, options: [] } }, legacy: ['sd1'] } } });
  const d = declared(pending, 'FR');
  assert.equal(accessState(d), 'non-verifiee');
  assert.equal(d.verified.size, 0, 'un accès historique n’est pas une offre vérifiée');
  assert.equal(guide({ day: DAY, filters: F({ mine: true }) }, pending, session()).entries.length, 0);
  assert.equal(accessState(declared(prefs(), 'FR')), 'aucune-preference');
});

test('changement de pays : une offre française n’est pas reprise ailleurs', () => {
  const p = prefs({ country: 'BE', access: football() });
  assert.equal(accessState(declared(p, 'BE')), 'aucune-preference');
  const g = guide({ day: DAY, filters: F({ mine: true }) }, p, session());
  assert.equal(g.hasData, false);
  assert.equal(g.entries.length, 0);
  assert.deepEqual(sanitizeAccess({ BE: { services: { 'vision-sport': { offer: 'football' } } } }), {}, 'service non référencé en Belgique');
});

test('validation des accès stockés : rien n’est inventé', () => {
  const out = sanitizeAccess({ FR: { services: { 'vision-sport': { offer: 'premium', options: ['sport-plus', 'x'] }, inconnu: { offer: 'a' } }, legacy: ['sd2', 'zz'] }, XX: {} });
  assert.deepEqual(out, { FR: { services: { 'vision-sport': { offer: null, options: [] } }, legacy: ['sd2'] } });
});

test('migration V0.3 → V0.4 : chaînes cochées conservées comme accès historiques', () => {
  const v3 = { version: 3, onboarded: true, country: 'FR', services: ['sd1', 'sd2', 'inconnue'], follows: { teams: ['paris-atlas'], competitions: [], players: [] }, saved: { matches: ['pa-ms'], articles: [], videos: [] }, spoiler: { global: true, teams: [] }, searchHistory: ['PA'] };
  const m = migrateV3(v3);
  assert.deepEqual(m.access, { FR: { services: {}, legacy: ['sd1', 'sd2'] } });
  assert.equal(m.services, undefined);
  assert.deepEqual(m.follows.teams, ['paris-atlas']);
  assert.deepEqual(m.saved.matches, ['pa-ms']);
  assert.equal(m.spoiler.global, true);
  assert.deepEqual(m.searchHistory, ['PA']);
  assert.equal(accessState(declared(m, 'FR')), 'non-verifiee');
  // Par le stockage : la clé V0.3 est lue puis conservée.
  const data = new Map([[V3_KEY, JSON.stringify(v3)]]);
  const store = createStore({ getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: (k) => data.delete(k) });
  assert.deepEqual(store.get().access.FR.legacy, ['sd1', 'sd2']);
  store.update((s) => (s.country = 'IT'));
  assert.ok(data.has('nyvo-v4') && data.has(V3_KEY));
});

test('scénario « non confirmée » : chaîne retirée partout, multiplex conservé pour les autres', () => {
  const s = session({ scenarios: { 'ln-bu': 'unconfirmed', 'pa-ms': 'unconfirmed' } });
  const g = guide({ day: DAY }, prefs(), s);
  assert.ok(!g.entries.some((e) => e.matches.includes('ln-bu') || e.matches.includes('pa-ms')));
  assert.ok(g.unconfirmed.some((m) => m.id === 'ln-bu'));
  const mx = programmesFor('FR', s).find((p) => p.id === 'fr-ce-multiplex');
  assert.deepEqual(mx.matches, ['tr-nr']);
});

test('accès au diffuseur : lien direct ou indisponible, domaines réservés uniquement', () => {
  const links = PROGRAMMES.FR.map((p) => p.link);
  for (const l of links) {
    for (const u of [l.matchPage, l.site].filter(Boolean)) assert.match(new URL(u).host, /\.example$/);
  }
  assert.equal(PROGRAMMES.FR.find((p) => p.id === 'fr-trnr-sd2').link.matchPage, null);
  assert.ok(PROGRAMMES.FR.find((p) => p.id === 'fr-pams-sd1').link.matchPage);
});

test('serveur : l’énumération des interfaces est facultative', () => {
  assert.equal(localAddresses(() => { throw new Error('uv_interface_addresses'); }), null);
  assert.deepEqual(localAddresses(() => ({ lo: [{ family: 'IPv4', internal: true, address: '127.0.0.1' }], en0: [{ family: 'IPv4', internal: false, address: '192.0.2.10' }, { family: 'IPv6', internal: false, address: '::1' }] })), ['192.0.2.10']);
});
