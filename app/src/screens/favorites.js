// Favoris (planche 07) : Mon espace et Enregistrés.
import { h, attr } from '../ui/html.js';
import { icon } from '../ui/icons.js';
import { crest } from '../ui/crest.js';
import { art } from '../ui/art.js';
import { topBar, pageTitle, segmented, chips, emptyState, demoNote } from '../ui/components.js';
import { COMPETITION, COUNTRY, PLAYER, TEAM, genderLabel } from '../data/catalog.js';
import { MATCH } from '../data/matches.js';
import { ARTICLE, VIDEO } from '../data/content.js';
import { contentMasked, contentTitle, matchTitle, primaryChannelName, isMasked } from '../domain/matchState.js';
import { relative, time, dayLabel, dayKey } from '../domain/time.js';

// « 02:18 » → « 2 min », « 00:48 » → « 48 s »
function durationLabel(d) {
  const [m, sec] = d.split(':').map(Number);
  return m ? `${m} min` : `${sec} s`;
}

const SPACE_CATS = [['tous', 'Tous'], ['equipes', 'Équipes'], ['competitions', 'Compétitions'], ['joueurs', 'Joueurs']];
const SAVED_CATS = [['tous', 'Tous'], ['matchs', 'Matchs'], ['articles', 'Articles'], ['videos', 'Vidéos']];

function group(id, title, ic, rows, ctx) {
  const open = !ctx.session.favorites.collapsed.has(id);
  return h`<section class="fav-group">
    <h2 class="comp-head"><button class="comp-toggle" aria-expanded="${open}" aria-controls="fg-${id}" data-action="fav-collapse" data-id="${id}" data-k="fg-${id}">${icon(ic)}<span>${title}</span>${icon(open ? 'chevron-up' : 'chevron-down', { cls: 'grp-chevron' })}</button></h2>
    <ul id="fg-${id}" class="fav-rows"${attr('hidden', !open)}>${rows}</ul></section>`;
}

function entityRow({ href, lead, name, sub, kind, id }) {
  return h`<li class="fav-row"><a href="${href}" data-k="fav-${id}">${lead}<span class="pick-text"><b>${name}</b><small>${sub}</small></span></a>
    <button class="icon-btn" data-action="open" data-overlay="alertes" data-ref="${id}" aria-label="Alertes : ${name}" data-k="fav-bell-${id}">${icon('bell')}</button>
    <button class="icon-btn unfollow" data-action="toggle-follow" data-kind="${kind}" data-id="${id}" aria-label="Ne plus suivre ${name}" data-k="fav-x-${id}">${icon('star', { fill: true })}</button>
    <a class="icon-btn" href="${href}" tabindex="-1" aria-hidden="true">${icon('chevron-right')}</a></li>`;
}

function mySpace(ctx) {
  const f = ctx.prefs.follows;
  const cat = ctx.session.favorites.cat;
  const groups = [];
  if ((cat === 'tous' || cat === 'equipes') && f.teams.length) {
    groups.push(group('equipes', 'Équipes', 'shirt', f.teams.map((id) => entityRow({ href: `#/equipe/${id}`, lead: crest(id, { size: 44 }), name: TEAM[id].name, sub: genderLabel(TEAM[id]), kind: 'teams', id })), ctx));
  }
  if ((cat === 'tous' || cat === 'competitions') && f.competitions.length) {
    groups.push(group('competitions', 'Compétitions', 'trophy', f.competitions.map((id) => entityRow({ href: `#/competition/${id}`, lead: h`<span class="pick-icon">${icon('trophy', { size: 30 })}</span>`, name: COMPETITION[id].name, sub: COMPETITION[id].subtitle, kind: 'competitions', id })), ctx));
  }
  if ((cat === 'tous' || cat === 'joueurs') && f.players.length) {
    groups.push(group('joueurs', 'Joueurs', 'user', f.players.map((id) => entityRow({ href: `#/joueur/${id}`, lead: h`<span class="avatar lg">${icon('user', { size: 26 })}</span>`, name: PLAYER[id].name, sub: `${TEAM[PLAYER[id].team].name} · ${PLAYER[id].position}`, kind: 'players', id })), ctx));
  }
  return h`<div class="btn-row two">
      <button class="btn btn-ghost" data-action="open" data-overlay="ajouter" data-k="fav-add">${icon('plus')}Ajouter</button>
      <button class="btn btn-ghost" data-action="open" data-overlay="alertes" data-k="fav-alerts">${icon('bell')}Gérer les alertes</button></div>
    ${groups.length ? groups : emptyState({ ic: 'star', title: cat === 'tous' ? 'Votre espace attend ses premiers favoris.' : 'Aucun favori dans cette catégorie.', text: 'Suivez des équipes, compétitions ou joueurs, sans compte.' })}
    ${ctx.prefs.accountCardDismissed ? '' : h`<div class="account-card">${icon('cloud', { size: 30 })}<div><b>Sauvegarder mes favoris</b><small>Compte facultatif pour les synchroniser.</small></div>
      <button class="btn btn-outline btn-sm" data-action="open" data-overlay="compte" data-k="account">Se connecter</button>
      <button class="icon-btn sm" data-action="dismiss-account" aria-label="Masquer cette suggestion" data-k="account-x">${icon('close', { size: 18 })}</button></div>`}`;
}

function savedItems(ctx) {
  const s = ctx.prefs.saved;
  const at = ctx.prefs.savedAt;
  const items = [
    ...s.matches.map((id) => ({ kind: 'matches', id, t: at[`matches:${id}`] || 0 })),
    ...s.articles.map((id) => ({ kind: 'articles', id, t: at[`articles:${id}`] || 0 })),
    ...s.videos.map((id) => ({ kind: 'videos', id, t: at[`videos:${id}`] || 0 })),
  ].sort((a, b) => b.t - a.t);
  const cat = ctx.session.favorites.savedCat;
  const map = { matchs: 'matches', articles: 'articles', videos: 'videos' };
  return cat === 'tous' ? items : items.filter((i) => i.kind === map[cat]);
}

function savedCard(item, ctx) {
  const tz = COUNTRY[ctx.prefs.country].tz;
  const editing = ctx.session.favorites.editing;
  let href, media, badge, title, meta;
  if (item.kind === 'matches') {
    const m = MATCH[item.id];
    const ch = primaryChannelName(m, ctx.prefs.country, ctx.session);
    href = `#/match/${m.id}`;
    badge = 'Match';
    media = h`<span class="vs-media">${crest(m.home, { size: 40 })}<small>vs</small>${crest(m.away, { size: 40 })}</span>`;
    title = matchTitle(m);
    const masked = isMasked(m, ctx.prefs, ctx.session);
    const state = m.status === 'live' && !masked ? `${m.minute}′ · Direct simulé` : `${dayLabel(dayKey(m.kickoff, tz)).replace(' · Démo', '')} · ${time(m.kickoff, tz)}`;
    meta = h`<span>${state}</span><span class="meta">${icon('tv', { size: 18 })}${ch ? `${ch} · Démo` : 'Diffusion non confirmée'}</span>`;
  } else {
    const c = item.kind === 'articles' ? ARTICLE[item.id] : VIDEO[item.id];
    href = `#/${item.kind === 'articles' ? 'article' : 'video'}/${c.id}`;
    badge = item.kind === 'articles' ? 'Article' : 'Vidéo';
    const masked = contentMasked(c, ctx.prefs, ctx.session);
    media = masked ? h`<span class="masked-thumb">${icon('eye-off', { size: 28 })}</span>` : h`${art(c.art)}${item.kind === 'videos' ? h`<span class="play-ring sm" aria-hidden="true">${icon('play', { size: 18 })}</span>` : ''}`;
    title = contentTitle(c, ctx.prefs, ctx.session);
    meta = h`<span class="meta">${c.source} · ${item.kind === 'videos' ? durationLabel(c.duration) : relative(c.publishedAt, tz)}</span>`;
  }
  return h`<li class="saved-card">
    <a href="${href}" data-k="saved-${item.id}"><span class="saved-media">${media}<span class="badge badge-dark media-badge">${badge}</span></span>
      <span class="saved-body"><b>${title}</b>${meta}</span>${icon('chevron-right', { size: 20, cls: 'row-chevron' })}</a>
    <button class="icon-btn bookmark-btn is-on ${editing ? 'is-edit' : ''}" data-action="toggle-save" data-kind="${item.kind}" data-id="${item.id}" aria-pressed="true" aria-label="Retirer des enregistrés : ${title}" data-k="unsave-${item.id}">${icon(editing ? 'trash' : 'bookmark', { fill: !editing })}</button>
  </li>`;
}

export default {
  render(ctx) {
    const fav = ctx.session.favorites;
    const q = ctx.route.query;
    fav.view = q.vue === 'enregistres' ? 'enregistres' : 'mon-espace';
    const items = fav.view === 'enregistres' ? savedItems(ctx) : [];
    return {
      title: 'Favoris',
      nav: 'favoris',
      body: h`${topBar(ctx)}${pageTitle('Favoris')}
      ${segmented([['mon-espace', 'Mon espace'], ['enregistres', 'Enregistrés']], fav.view, { action: 'fav-view', label: 'Section des favoris', cls: 'seg-lg' })}
      ${fav.view === 'mon-espace'
        ? h`${chips(SPACE_CATS, fav.cat, { action: 'fav-cat', label: 'Catégorie' })}${mySpace(ctx)}`
        : h`${chips(SAVED_CATS, fav.savedCat, { action: 'saved-cat', label: 'Type de contenu' })}
          <section class="card saved-section"><div class="section-head"><h2>Ajouts récents</h2>${items.length ? h`<button class="text-btn ruby" data-action="saved-edit" aria-pressed="${fav.editing}" data-k="saved-edit">${fav.editing ? 'Terminé' : 'Modifier'}</button>` : ''}</div>
          ${items.length ? h`<ul class="saved-list">${items.map((i) => savedCard(i, ctx))}</ul>` : emptyState({ ic: 'bookmark', title: 'Rien d’enregistré pour l’instant.', text: 'Enregistrez un match, un article ou une vidéo pour le retrouver ici.' })}</section>
          <p class="hint center">Enregistrer permet de retrouver un contenu. Enregistré ne veut pas dire téléchargé : la consultation hors connexion n’est pas disponible dans ce prototype.</p>`}
      ${demoNote(ctx.store.storageStatus() === 'ok' ? 'Données fictives · Préférences conservées sur ce navigateur, sans compte' : 'Données fictives · Stockage indisponible : préférences non conservées')}`,
    };
  },
  actions: {
    'fav-view': (el, ctx) => ctx.router.setQuery({ vue: el.dataset.value === 'enregistres' ? 'enregistres' : undefined }),
    'fav-cat': (el, ctx) => {
      ctx.session.favorites.cat = el.dataset.value;
      ctx.refresh();
    },
    'saved-cat': (el, ctx) => {
      ctx.session.favorites.savedCat = el.dataset.value;
      ctx.refresh();
    },
    'saved-edit': (el, ctx) => {
      ctx.session.favorites.editing = !ctx.session.favorites.editing;
      ctx.refresh();
    },
    'fav-collapse': (el, ctx) => {
      const c = ctx.session.favorites.collapsed;
      if (c.has(el.dataset.id)) c.delete(el.dataset.id);
      else c.add(el.dataset.id);
      ctx.refresh();
    },
    'dismiss-account': (el, ctx) => ctx.save((s) => {
      s.accountCardDismissed = true;
    }),
  },
};
