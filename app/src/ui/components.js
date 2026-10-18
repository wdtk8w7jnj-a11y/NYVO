// Composants partagés entre les écrans.
import { h, attr, raw } from './html.js';
import { icon } from './icons.js';
import { crest } from './crest.js';
import { flag } from './flags.js';
import { COUNTRY, TEAM } from '../data/catalog.js';
import { broadcastFor, matchSummary, matchTitle, primaryChannelName, spoilerProtected } from '../domain/matchState.js';
import { time } from '../domain/time.js';
import { build } from '../router.js';

export const NAV = [
  ['accueil', 'Accueil', 'home'],
  ['matchs', 'Matchs', 'ball'],
  ['actualites', 'Actualités', 'news'],
  ['videos', 'Vidéos', 'video'],
  ['favoris', 'Favoris', 'star'],
];

export function bottomNav(active, hrefs) {
  return h`<nav class="tabbar" aria-label="Navigation principale"><ul>${NAV.map(
    ([id, label, ic]) => h`<li><a href="${hrefs[id] || `#/${id}`}" class="tab ${active === id ? 'is-active' : ''}"${attr('aria-current', active === id ? 'page' : null)} data-k="nav-${id}">${icon(ic, { fill: active === id && (ic === 'home' || ic === 'star') })}<span>${label}</span></a></li>`,
  )}</ul></nav>`;
}

export function topBar(ctx) {
  const c = COUNTRY[ctx.prefs.country];
  return h`<div class="topbar">
    <a class="logo" href="#/accueil" aria-label="NYVO, accueil">NYVO</a>
    <button class="country-pill" data-action="open" data-overlay="pays" data-k="country-pill" aria-label="Pays de diffusion : ${c.name}. Modifier">${flag(c.id)}<span>${c.name}</span>${icon('chevron-down', { size: 18, cls: 'ruby' })}</button>
    <div class="topbar-actions">
      <button class="icon-btn" data-action="open" data-overlay="recherche" data-k="search-btn" aria-label="Rechercher">${icon('search')}</button>
      <button class="icon-btn" data-action="open" data-overlay="reglages" data-k="settings-btn" aria-label="Réglages">${icon('settings')}</button>
    </div>
  </div>`;
}

export function pageTitle(title, right = '') {
  return h`<div class="page-title"><span class="demo-badge">Démo</span><h1 tabindex="-1">${title}</h1>${right ? h`<div class="page-title-right">${right}</div>` : ''}</div>`;
}

export function detailBar(ctx, { back, actions = '', label = 'Retour' }) {
  return h`<div class="detailbar">
    <button class="icon-btn" data-action="back" data-fallback="${back}" aria-label="${label}" data-k="back">${icon('chevron-left')}</button>
    <span class="logo logo-center" aria-hidden="true">NYVO</span>
    <div class="detailbar-actions">${actions}</div>
  </div>`;
}

export function linkMore(href, label, k) {
  return h`<a class="link-more" href="${href}" data-k="${k || href}">${label}${icon('chevron-right', { size: 18 })}</a>`;
}

export function sectionHead(title, more) {
  return h`<div class="section-head"><h2>${title}</h2>${more || ''}</div>`;
}

// Groupe de boutons exclusifs (aria-pressed). `action` reçoit data-value.
export function segmented(options, current, { action, label, cls = '', k = action } = {}) {
  return h`<div class="segmented ${cls}" role="group" aria-label="${label}">${options.map(
    ([value, text]) =>
      h`<button type="button" class="seg ${value === current ? 'is-on' : ''}" aria-pressed="${value === current}" data-action="${action}" data-value="${value}" data-k="${k}-${value}">${text}</button>`,
  )}</div>`;
}

export function chips(options, current, { action, label, k = action } = {}) {
  return h`<div class="chips" role="group" aria-label="${label}">${options.map(
    ([value, text]) =>
      h`<button type="button" class="chip ${value === current ? 'is-on' : ''}" aria-pressed="${value === current}" data-action="${action}" data-value="${value}" data-k="${k}-${value}">${text}</button>`,
  )}</div>`;
}

export function switchControl(label, checked, { action, k = action, desc, id } = {}) {
  return h`<button type="button" class="switch-row" role="switch" aria-checked="${checked}" data-action="${action}"${attr('data-id', id)} data-k="${k}">
    <span class="switch-label">${label}${desc ? h`<small>${desc}</small>` : ''}</span><span class="switch ${checked ? 'is-on' : ''}" aria-hidden="true"><i></i></span></button>`;
}

export function emptyState({ ic = 'info', title, text, action }) {
  return h`<div class="empty">${icon(ic, { size: 30 })}<p class="empty-title">${title}</p>${text ? h`<p>${text}</p>` : ''}${action || ''}</div>`;
}

export function demoNote(text) {
  return h`<p class="demo-note">${text}</p>`;
}

export function teamBlock(teamId, ctx, size = 64) {
  return h`<a class="team-block" href="#/equipe/${teamId}">${crest(teamId, { size })}<span>${teamNameOf(teamId)}</span></a>`;
}

const teamNameOf = (id) => TEAM[id].name;

// Centre du bloc score : score, ou horaire, ou masque sans spoilers.
export function scoreCenter(match, ctx, { big = false } = {}) {
  const s = matchSummary(match, ctx.prefs, ctx.session);
  const tz = s.tz;
  if (s.masked) {
    return h`<div class="score-center is-masked" aria-label="Score masqué">
      ${icon('eye-off', { size: big ? 34 : 26 })}<span class="score-masked">Score masqué</span>
      <span class="score-sub">Coup d’envoi prévu à ${time(match.kickoff, tz)}</span></div>`;
  }
  if (s.headline) {
    return h`<div class="score-center"><span class="score" aria-label="${s.a11yScore}">${s.headline}</span>
      <span class="score-sub ${s.live || s.interrupted ? 'is-live' : ''}">${s.interrupted ? h`<span class="muted-line">Dernier score reçu</span>` : ''}${s.sub}</span></div>`;
  }
  return h`<div class="score-center"><span class="score score-time">${time(match.kickoff, tz)}</span><span class="score-sub">Coup d’envoi prévu · Heure de ${COUNTRY[ctx.prefs.country].city}</span></div>`;
}

export function channelLine(match, ctx) {
  const name = primaryChannelName(match, ctx.prefs.country, ctx.session);
  return name
    ? h`<span class="channel-line">${icon('tv', { size: 20 })}<span>${name}</span></span>`
    : h`<span class="channel-line is-unconfirmed">${icon('info', { size: 18 })}<span>Diffusion non confirmée</span></span>`;
}

// Grande carte de rencontre (accueil, épinglé dans Matchs).
export function matchHero(match, ctx, { pinned = false } = {}) {
  const s = matchSummary(match, ctx.prefs, ctx.session);
  const saved = ctx.prefs.saved.matches.includes(match.id);
  return h`<article class="match-hero ${s.live ? 'is-live' : ''}" aria-label="${matchTitle(match)}">
    ${pinned || s.live ? h`<div class="hero-top">${pinned ? h`<span class="pin">${icon('star', { size: 18, fill: true, cls: 'ruby' })}Match suivi</span>` : h`<span></span>`}${s.live && !s.masked ? h`<span class="live-pill">En direct</span>` : s.interrupted ? h`<span class="live-pill is-off">Interrompu</span>` : ''}</div>` : ''}
    <a class="hero-link" href="#/match/${match.id}" data-k="hero-${match.id}">
      <span class="sr-only">${matchTitle(match)}, ${s.a11yScore}. Ouvrir la fiche.</span>
      <span class="hero-team" aria-hidden="true">${crest(match.home, { size: 62 })}<span>${s.home.name}</span></span>
      <span aria-hidden="true">${scoreCenter(match, ctx, { big: true })}</span>
      <span class="hero-team" aria-hidden="true">${crest(match.away, { size: 62 })}<span>${s.away.name}</span></span>
    </a>
    <div class="hero-foot">${channelLine(match, ctx)}${saved ? h`<span class="sr-only">Match enregistré</span>` : ''}</div>
  </article>`;
}

// Ligne de rencontre (liste Matchs, Programme, favoris).
export function matchRow(match, ctx, { showStar = true } = {}) {
  const s = matchSummary(match, ctx.prefs, ctx.session);
  const saved = ctx.prefs.saved.matches.includes(match.id);
  const tz = s.tz;
  const b = broadcastFor(match, ctx.prefs.country, ctx.session);
  const timeCol = s.masked
    ? h`<span class="row-time">${time(match.kickoff, tz)}</span>`
    : s.phase === 'live'
      ? h`<span class="row-time is-live">${match.minute}′</span>`
      : s.phase === 'finished'
        ? h`<span class="row-time is-done">Terminé</span>`
        : h`<span class="row-time">${time(match.kickoff, tz)}</span>`;
  const scores = s.masked
    ? h`<span class="row-scores is-masked" aria-hidden="true">${icon('eye-off', { size: 18 })}</span>`
    : s.headline
      ? h`<span class="row-scores ${s.live ? 'is-live' : ''}" aria-hidden="true"><b>${match.score[0]}</b><b>${match.score[1]}</b></span>`
      : h`<span class="row-scores" aria-hidden="true"></span>`;
  return h`<li class="match-row">
    <a href="#/match/${match.id}" class="row-link" data-k="row-${match.id}" aria-label="${matchTitle(match)}, ${s.masked || s.phase === 'upcoming' ? time(match.kickoff, tz) : s.sub}, ${b.confirmed ? b.options[0].channelName : 'diffusion non confirmée'}. ${s.a11yScore}.">
      ${timeCol}
      <span class="row-crests" aria-hidden="true">${crest(match.home, { size: 24 })}${crest(match.away, { size: 24 })}</span>
      <span class="row-teams"><span>${s.home.name}</span><span>${s.away.name}</span></span>
      ${scores}
      <span class="row-channel ${b.confirmed ? '' : 'is-unconfirmed'}">${b.confirmed ? b.options[0].channelName : 'Diffusion non confirmée'}</span>
      ${icon('chevron-right', { size: 20, cls: 'row-chevron' })}
    </a>
    ${showStar ? h`<button class="icon-btn star-btn ${saved ? 'is-on' : ''}" data-action="toggle-save" data-kind="matches" data-id="${match.id}" aria-pressed="${saved}" aria-label="${saved ? 'Retirer' : 'Enregistrer'} ${s.home.name} – ${s.away.name}" data-k="star-${match.id}">${icon('star', { fill: saved })}</button>` : ''}
  </li>`;
}

export function spoilerBadge(match, ctx) {
  return spoilerProtected(match, ctx.prefs) && !ctx.session.revealed.has(match.id)
    ? h`<span class="spoiler-pill">${icon('eye-off', { size: 18 })}Sans spoilers activé</span>`
    : '';
}

export function bookmarkBtn(kind, id, ctx, title) {
  const on = ctx.prefs.saved[kind].includes(id);
  return h`<button class="icon-btn bookmark-btn ${on ? 'is-on' : ''}" data-action="toggle-save" data-kind="${kind}" data-id="${id}" aria-pressed="${on}" aria-label="${on ? 'Retirer des enregistrés' : 'Enregistrer'} : ${title}" data-k="bm-${kind}-${id}">${icon('bookmark', { fill: on })}</button>`;
}

export function matchesHref(query) {
  return build('matchs', query);
}

export { raw };
