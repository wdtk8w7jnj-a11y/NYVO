// Fiche match (planches 03, 05, 06).
import { h, attr } from '../ui/html.js';
import { icon } from '../ui/icons.js';
import { crest } from '../ui/crest.js';
import { detailBar, scoreCenter, spoilerBadge, segmented, demoNote, emptyState } from '../ui/components.js';
import { COMPETITION, COUNTRY, TEAM } from '../data/catalog.js';
import { MATCH, STANDINGS, BRACKETS } from '../data/matches.js';
import {
  SCENARIOS, broadcastFor, isLimited, isMasked, matchSummary, matchTitle, scenarioOf, spoilerProtected, standingsMasked, scoreText,
} from '../domain/matchState.js';
import { time, verifiedLabel } from '../domain/time.js';

const TABS = [
  ['direct', 'Direct'],
  ['compositions', 'Compositions'],
  ['statistiques', 'Statistiques'],
  ['classement', 'Classement'],
];

function broadcastBox(match, ctx, scenario) {
  const country = COUNTRY[ctx.prefs.country];
  const b = broadcastFor(match, ctx.prefs.country, ctx.session);
  if (!b.confirmed) {
    return h`<div class="bc-box">${icon('globe', { size: 30 })}<div class="bc-text"><b>Pays de diffusion : ${country.name}</b><small>Diffusion non confirmée</small></div>
      <button class="btn btn-ghost btn-sm" data-action="open" data-overlay="diffusion" data-k="bc-open">Détails</button></div>`;
  }
  return h`<div class="bc-box">${icon('tv', { size: 30 })}<div class="bc-text"><b>${country.name} · ${b.options[0].channelName}</b><small>${scenario === 'interrupted' ? 'Information enregistrée · Démo' : 'Diffusion de démonstration'}</small></div>
    <button class="btn btn-primary btn-sm" data-action="open" data-overlay="diffusion" data-k="bc-open">Où regarder${icon('chevron-right', { size: 18 })}</button></div>`;
}

function stateCard(match, ctx, scenario) {
  const tz = COUNTRY[ctx.prefs.country].tz;
  const b = broadcastFor(match, ctx.prefs.country, ctx.session);
  const cards = [];
  if (!b.confirmed && match.status !== 'finished') {
    cards.push(h`<section class="state-card" aria-labelledby="st-unconf">${icon('info', { size: 34 })}
      <h2 id="st-unconf">Diffusion non confirmée</h2>
      <p>Nous n’avons pas encore de chaîne confirmée pour ce match en ${COUNTRY[ctx.prefs.country].name}.</p>
      <p>Cette absence d’information ne signifie pas que le match ne sera pas diffusé.</p>
      <p class="small">${b.verifiedAt ? `Vérifié le ${verifiedLabel(b.verifiedAt, tz).replace(/\/2026/, '')} · Démo` : 'Aucune donnée de diffusion pour ce pays dans la démonstration.'}</p>
      <button class="btn btn-outline btn-block" data-action="refresh-broadcast" data-k="refresh-bc">Actualiser</button></section>`);
  }
  if (scenario === 'interrupted') {
    cards.push(h`<section class="state-card" aria-labelledby="st-int">${icon('wifi-off', { size: 34 })}
      <h2 id="st-int">Direct interrompu</h2>
      <p>Les données ne sont plus actualisées.</p>
      <p class="small">Dernière mise à jour : ${time(match.lastUpdate, tz)} · Démo</p>
      <p>Le match peut se poursuivre.</p>
      <button class="btn btn-outline btn-block" data-action="retry-live" data-k="retry-live">Réessayer</button></section>`);
  }
  if (isLimited(match, ctx.session) && !isMasked(match, ctx.prefs, ctx.session)) {
    cards.push(h`<section class="state-card is-compact" aria-labelledby="st-lim">${icon('info', { size: 28 })}
      <h2 id="st-lim">Suivi limité</h2>
      <p>Seuls l’horaire${match.status !== 'upcoming' ? ' et le score' : ''} sont disponibles pour cette rencontre. Les données manquantes ne sont pas affichées comme zéro.</p></section>`);
  }
  return cards;
}

function maskedPanel(match, { title = 'Le match reste masqué', text = 'Scores, événements, statistiques et contenus révélateurs sont cachés.' } = {}) {
  return h`<div class="masked-panel">
    <span class="ring">${icon('eye-off', { size: 34 })}</span>
    <h2>${title}</h2><p>${text}</p>
    <button class="btn btn-primary btn-block" data-action="reveal-match" data-id="${match.id}" data-k="reveal-match">Révéler ce match</button>
    <p class="small">Affiche le résultat et les contenus de cette rencontre.</p>
    <button class="text-btn underline" data-action="open" data-overlay="reglages" data-k="manage-spoilers">Gérer le mode sans spoilers</button>
  </div>`;
}

function eventRow(match, e, ctx) {
  const team = TEAM[e.team].name;
  if (e.type === 'goal') {
    return h`<li class="tl-item"><span class="tl-min">${e.minute}′</span><span class="tl-node goal">${icon('ball', { size: 22 })}</span>
      <div class="tl-body"><b>But · ${team} ${scoreText(e.score)}</b><span class="tl-sub"><span>${e.player}</span>
      ${e.moment ? h`<button class="link-more sm" data-action="open" data-overlay="moment" data-ref="${e.minute}" data-k="moment-${e.minute}">Voir le moment${icon('chevron-right', { size: 16 })}</button>` : ''}</span></div></li>`;
  }
  return h`<li class="tl-item"><span class="tl-min">${e.minute}′</span><span class="tl-node sub"><span class="in">${icon('swap-in', { size: 22 })}</span><span class="out">${icon('swap-out', { size: 22 })}</span></span>
    <div class="tl-body"><b>Remplacement · ${team}</b><span>Entrée : ${e.playerIn}</span><span>Sortie : ${e.playerOut}</span></div></li>`;
}

export function pitchSchema(highlight = 'right', { label } = {}) {
  return h`<svg class="pitch-svg" viewBox="0 0 160 100" ${label ? h`role="img" aria-label="${label}"` : h`aria-hidden="true"`} focusable="false">
    <defs><linearGradient id="pg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2f6b38"/><stop offset="1" stop-color="#1f4c27"/></linearGradient></defs>
    <rect width="160" height="100" rx="5" fill="url(#pg)"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => h`<rect x="${i * 20}" width="10" height="100" fill="#fff" opacity=".03"/>`)}
    <g fill="none" stroke="#fff" stroke-opacity=".7" stroke-width=".8"><rect x="6" y="6" width="148" height="88"/><path d="M80 6v88"/><circle cx="80" cy="50" r="11"/><rect x="6" y="28" width="20" height="44"/><rect x="134" y="28" width="20" height="44"/><rect x="6" y="40" width="7" height="20"/><rect x="147" y="40" width="7" height="20"/></g>
    ${highlight === 'right' ? h`<rect x="134" y="28" width="20" height="44" fill="#ff2d55" opacity=".22"/>` : h`<rect x="6" y="28" width="20" height="44" fill="#ff2d55" opacity=".22"/>`}
  </svg>`;
}

function moments(match, ctx) {
  const list = (match.events || []).filter((e) => e.moment);
  if (!list.length || isLimited(match, ctx.session)) return '';
  if (isMasked(match, ctx.prefs, ctx.session)) {
    return h`<section class="moments"><h2>Moments forts</h2><div class="locked-card"><span class="lock">${icon('lock', { size: 26 })}</span><b>Contenus masqués</b><span>Titres et miniatures protégés</span></div></section>`;
  }
  return h`<section class="moments"><div class="section-head"><h2>Moments forts</h2></div>
    <ul class="moment-list">${list.map(
      (e) => h`<li><button class="moment-card" data-action="open" data-overlay="moment" data-ref="${e.minute}" data-k="mcard-${e.minute}">
        <span class="moment-media">${pitchSchema(e.team === match.home ? 'right' : 'left')}<span class="moment-open">${icon('expand', { size: 24 })}</span></span>
        <b>But à ${e.minute}′</b><span>Schéma de démonstration</span></button></li>`,
    )}</ul></section>`;
}

function directPanel(match, ctx, scenario) {
  if (match.status === 'upcoming') {
    return h`<div class="pre-match"><h2>Avant le match</h2>${icon('ball', { size: 40 })}<p>Le suivi débutera lorsque des données seront disponibles.</p></div>`;
  }
  if (isLimited(match, ctx.session) || !match.events) {
    return emptyState({ ic: 'list', title: 'Fil du match non disponible', text: 'Les événements de cette rencontre ne sont pas fournis dans la démonstration.' });
  }
  const events = [...match.events].sort((a, b) => b.minute - a.minute);
  return h`${scenario === 'interrupted' ? h`<h2 class="panel-title">Derniers événements reçus</h2>` : ''}
    <ol class="timeline">${events.map((e) => eventRow(match, e, ctx))}</ol>${moments(match, ctx)}`;
}

const FORMATION_ROWS = (f) => f.split('-').map(Number);

function lineupPitch(side, data, match) {
  const rows = FORMATION_ROWS(data.formation);
  const players = data.starters.slice(1);
  const spots = [{ p: data.starters[0], x: 50, y: 92 }];
  let i = 0;
  rows.forEach((n, r) => {
    const y = 76 - (r * 62) / Math.max(1, rows.length - 1);
    for (let k = 0; k < n; k++) spots.push({ p: players[i++], x: ((k + 1) * 100) / (n + 1), y });
  });
  return h`<svg class="lineup-svg" viewBox="0 0 100 104" aria-hidden="true" focusable="false">
    <rect width="100" height="104" rx="4" fill="#1f4c27"/>
    <g fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".5"><rect x="4" y="4" width="92" height="96"/><path d="M4 52h92"/><circle cx="50" cy="52" r="9"/><rect x="28" y="84" width="44" height="16"/><rect x="28" y="4" width="44" height="16"/></g>
    ${spots.map(
      (s) => h`<g transform="translate(${s.x} ${s.y})"><circle r="4.4" fill="${side === 'home' ? TEAM[match.home].crest.field : TEAM[match.away].crest.field}" stroke="#fff" stroke-width=".6"/>
        <text y="1.4" text-anchor="middle" font-size="3.6" font-weight="700" fill="#fff">${s.p[0]}</text>
        <text y="8.6" text-anchor="middle" font-size="3.1" fill="#fff">${s.p[1]}</text></g>`,
    )}
  </svg>`;
}

function playerMarks(name, match) {
  const marks = [];
  for (const e of match.events || []) {
    if (e.type === 'goal' && e.player === name) marks.push(h`<span class="mark goal" title="But">${icon('ball', { size: 14 })}<span class="sr-only">But</span> ${e.minute}′</span>`);
    if (e.type === 'sub' && e.playerOut === name) marks.push(h`<span class="mark out">${icon('swap-out', { size: 14 })}<span class="sr-only">Sorti à la</span> ${e.minute}′</span>`);
    if (e.type === 'sub' && e.playerIn === name) marks.push(h`<span class="mark in">${icon('swap-in', { size: 14 })}<span class="sr-only">Entré à la</span> ${e.minute}′</span>`);
  }
  return marks;
}

function lineupsPanel(match, ctx) {
  if (isLimited(match, ctx.session) || !match.lineups) {
    return emptyState({
      ic: 'shirt',
      title: 'Compositions non communiquées',
      text: match.status === 'upcoming' ? 'Elles apparaîtront lorsqu’elles seront confirmées.' : 'Les compositions de cette rencontre ne sont pas disponibles dans la démonstration.',
    });
  }
  const side = ctx.route.query.equipe === 'away' ? 'away' : 'home';
  const data = match.lineups[side];
  const teamId = match[side];
  return h`<div class="lineups">
    ${segmented([['home', TEAM[match.home].name], ['away', TEAM[match.away].name]], side, { action: 'lineup-side', label: 'Équipe affichée' })}
    <p class="lineup-meta"><span class="badge badge-outline">Composition ${match.lineups.status} · Démo</span><span>Formation ${data.formation}</span></p>
    ${lineupPitch(side, data, match)}
    <h3>Titulaires · ${TEAM[teamId].name}</h3>
    <ul class="player-list">${data.starters.map((p) => h`<li><span class="num">${p[0]}</span><span class="pname">${p[1]}</span><span class="pos">${p[2]}</span>${playerMarks(p[1], match)}</li>`)}</ul>
    <h3>Remplaçants</h3>
    <ul class="player-list">${data.bench.map((p) => h`<li><span class="num">${p[0]}</span><span class="pname">${p[1]}</span><span class="pos">${p[2]}</span>${playerMarks(p[1], match)}</li>`)}</ul>
    <p class="hint">Composition fictive. G : gardien · D : défenseur · M : milieu · A : attaquant.</p>
  </div>`;
}

function statsPanel(match, ctx, scenario) {
  if (match.status === 'upcoming') return emptyState({ ic: 'sliders', title: 'Statistiques disponibles après le coup d’envoi' });
  if (isLimited(match, ctx.session) || !match.stats) {
    return emptyState({ ic: 'sliders', title: 'Statistiques non disponibles', text: 'Aucune statistique n’est fournie pour cette rencontre. Elles ne sont pas affichées comme zéro.' });
  }
  return h`<div class="stats">
    <div class="stats-head"><span>${TEAM[match.home].name}</span><span>${TEAM[match.away].name}</span></div>
    <ul>${match.stats.rows.map((r) => {
      if (r.home === null || r.away === null) {
        return h`<li class="stat is-na"><div class="stat-line"><span>—</span><span class="stat-label">${r.label}</span><span>—</span></div><p class="small">Non disponible${r.definition ? ` · ${r.definition}` : ''}</p></li>`;
      }
      const total = r.home + r.away || 1;
      const u = r.unit ? ` ${r.unit}` : '';
      return h`<li class="stat"><div class="stat-line"><b>${r.home}${u}</b><span class="stat-label">${r.label}</span><b>${r.away}${u}</b></div>
        <div class="stat-bars" aria-hidden="true"><span style="--w:${(r.home / total) * 100}%"></span><span style="--w:${(r.away / total) * 100}%"></span></div></li>`;
    })}</ul>
    <p class="hint">Source fictive · ${scenario === 'interrupted' ? 'Dernières données reçues' : 'Mise à jour'} à la ${match.stats.updatedMinute}e minute.</p>
  </div>`;
}

function standingsPanel(match, ctx) {
  const comp = COMPETITION[match.competition];
  const table = STANDINGS[comp.id];
  const bracket = BRACKETS[comp.id];
  if (table) {
    return h`<div class="standings"><table>
      <caption>${comp.name} · ${table.note}</caption>
      <thead><tr><th scope="col">#</th><th scope="col">Équipe</th><th scope="col"><abbr title="Matchs joués">J</abbr></th><th scope="col"><abbr title="Différence de buts">Diff.</abbr></th><th scope="col"><abbr title="Points">Pts</abbr></th></tr></thead>
      <tbody>${table.rows.map(([id, j, pts, diff], i) => {
        const zone = table.legend.find((l) => i + 1 >= l.range[0] && i + 1 <= l.range[1]);
        return h`<tr class="${[match.home, match.away].includes(id) ? 'is-me' : ''} ${zone ? 'zone' : ''}"><td>${i + 1}</td><th scope="row">${crest(id, { size: 18 })}${TEAM[id].name}</th><td>${j}</td><td>${diff > 0 ? `+${diff}` : diff}</td><td><b>${pts}</b></td></tr>`;
      })}</tbody></table>
      <ul class="legend">${table.legend.map((l) => h`<li><span class="dot"></span>${l.range[0] === l.range[1] ? l.range[0] : `${l.range[0]}–${l.range[1]}`} : ${l.label}</li>`)}</ul></div>`;
  }
  if (bracket) {
    return h`<div class="bracket">${bracket.rounds.map(
      (r) => h`<section><h3>${r.name}</h3>${r.matches.length
        ? h`<ul>${r.matches.map((id) => {
            const m = MATCH[id];
            const s = matchSummary(m, ctx.prefs, ctx.session);
            const state = s.masked ? 'Score masqué' : s.headline ? `${s.headline} · ${m.status === 'live' ? 'en cours' : 'terminé'}` : `${time(m.kickoff, s.tz)} · à venir`;
            return h`<li class="${id === match.id ? 'is-me' : ''}"><a href="#/match/${id}">${crest(m.home, { size: 20 })}<span>${matchTitle(m)}</span><small>${state}</small></a></li>`;
          })}</ul>`
        : h`<p class="small">${r.placeholder}</p>`}</section>`,
    )}<p class="hint">${bracket.note}</p></div>`;
  }
  return emptyState({ ic: 'trophy', title: 'Classement non disponible', text: 'Aucun classement n’est fourni pour cette compétition dans la démonstration.' });
}

function demoPanel(match, ctx, scenario) {
  return h`<details class="demo-panel"${attr('open', ctx.session.demoPanelOpen)}>
    <summary data-action="demo-panel" data-k="demo-summary">${icon('sliders', { size: 20 })}Simuler un état (démonstration)</summary>
    <fieldset><legend class="sr-only">État simulé de la rencontre</legend>
    ${Object.entries(SCENARIOS).map(([v, label]) => {
      const disabled = v === 'interrupted' && match.status !== 'live';
      return h`<label class="radio-line ${disabled ? 'is-disabled' : ''}"><input type="radio" name="scenario" value="${v}"${attr('checked', scenario === v)}${attr('disabled', disabled)} data-change="set-scenario" data-k="sc-${v}"><span>${label}${disabled ? ' (rencontre en direct uniquement)' : ''}</span></label>`;
    })}</fieldset>
    <button type="button" class="switch-row" role="switch" aria-checked="${ctx.prefs.spoiler.global}" data-action="toggle-spoiler" data-k="demo-spoiler"><span class="switch-label">Mode sans spoilers (global)</span><span class="switch ${ctx.prefs.spoiler.global ? 'is-on' : ''}" aria-hidden="true"><i></i></span></button>
  </details>`;
}

export default {
  render(ctx) {
    const match = MATCH[ctx.route.id];
    if (!match) {
      return { title: 'Match introuvable', nav: 'matchs', body: h`${detailBar(ctx, { back: '#/matchs' })}${emptyState({ ic: 'ball', title: 'Rencontre introuvable', text: 'Cette rencontre n’existe pas dans la démonstration.', action: h`<a class="btn btn-outline" href="#/matchs">Voir les matchs</a>` })}` };
    }
    // L'état simulé peut être fixé par l'adresse (?etat=interrupted) pour les tests.
    if (ctx.route.query.etat && SCENARIOS[ctx.route.query.etat]) ctx.session.scenarios[match.id] = ctx.route.query.etat;
    const scenario = scenarioOf(match, ctx.session);
    const comp = COMPETITION[match.competition];
    const saved = ctx.prefs.saved.matches.includes(match.id);
    const masked = isMasked(match, ctx.prefs, ctx.session);
    const tab = TABS.some(([v]) => v === ctx.route.query.onglet) ? ctx.route.query.onglet : 'direct';
    const tabMasked = tab === 'classement' ? standingsMasked(match, ctx.prefs, ctx.session) : masked;
    let panel;
    if (tabMasked) panel = maskedPanel(match, tab === 'classement' && !masked ? { title: 'Le classement reste masqué', text: 'Le classement peut révéler des résultats.' } : {});
    else if (tab === 'direct') panel = directPanel(match, ctx, scenario);
    else if (tab === 'compositions') panel = lineupsPanel(match, ctx);
    else if (tab === 'statistiques') panel = statsPanel(match, ctx, scenario);
    else panel = standingsPanel(match, ctx);
    const tz = COUNTRY[ctx.prefs.country].tz;
    const sub = [match.round, match.venue].filter(Boolean).join(' · ') || 'Données de démonstration';
    const footer = scenario === 'interrupted' ? 'Données conservées · Elles peuvent être dépassées' : match.status === 'live' ? 'Données fictives · Direct simulé' : 'Données fictives · Démonstration';
    return {
      title: matchTitle(match),
      nav: 'matchs',
      body: h`${detailBar(ctx, {
        back: '#/matchs',
        label: 'Retour',
        actions: h`<button class="icon-btn" data-action="open" data-overlay="alertes" data-k="match-bell" aria-label="Alertes pour ce match">${icon('bell')}</button>
          <button class="icon-btn star-btn ${saved ? 'is-on' : ''}" data-action="toggle-save" data-kind="matches" data-id="${match.id}" aria-pressed="${saved}" aria-label="${saved ? 'Retirer le match des enregistrés' : 'Enregistrer le match'}" data-k="match-star">${icon('star', { fill: saved })}</button>`,
      })}
      <header class="match-head">
        <a class="comp-line" href="#/competition/${comp.id}">${icon('trophy', { size: 26 })}<span>${comp.name}${comp.name.includes('Démo') ? '' : ' · Démo'}</span></a>
        <p class="match-sub">${sub}</p>
        ${spoilerBadge(match, ctx)}
        <h1 tabindex="-1" class="sr-only">${matchTitle(match)}</h1>
        <div class="match-teams">
          <a class="team-block" href="#/equipe/${match.home}">${crest(match.home, { size: 74 })}<span>${TEAM[match.home].name}</span></a>
          ${scoreCenter(match, ctx, { big: true })}
          <a class="team-block" href="#/equipe/${match.away}">${crest(match.away, { size: 74 })}<span>${TEAM[match.away].name}</span></a>
        </div>
        ${masked ? h`<p class="tz-line">Heure de ${COUNTRY[ctx.prefs.country].city} · Démo</p>` : ''}
      </header>
      ${broadcastBox(match, ctx, scenario)}
      ${stateCard(match, ctx, scenario)}
      <div class="tabs" role="tablist" aria-label="Sections de la fiche match">${TABS.map(
        ([v, label]) => h`<button role="tab" id="tab-${v}" aria-selected="${tab === v}" aria-controls="panel" tabindex="${tab === v ? 0 : -1}" class="tab-btn ${tab === v ? 'is-on' : ''}" data-action="match-tab" data-value="${v}" data-k="tab-${v}">${label}</button>`,
      )}</div>
      <section class="tab-panel" id="panel" role="tabpanel" aria-labelledby="tab-${tab}" tabindex="0">${panel}</section>
      ${demoPanel(match, ctx, scenario)}
      ${demoNote(footer)}
      <p class="sr-only">Coup d’envoi ${time(match.kickoff, tz)}.</p>`,
    };
  },
  actions: {
    'match-tab': (el, ctx) => ctx.router.setQuery({ onglet: el.dataset.value === 'direct' ? undefined : el.dataset.value }),
    'lineup-side': (el, ctx) => ctx.router.setQuery({ equipe: el.dataset.value === 'away' ? 'away' : undefined }),
    'set-scenario': (el, ctx) => {
      ctx.session.scenarios[ctx.route.id] = el.value;
      ctx.session.demoPanelOpen = true;
      ctx.router.setQuery({ etat: el.value === 'normal' ? undefined : el.value });
    },
    'demo-panel': (el, ctx) => {
      // Laisser <details> s'ouvrir nativement, mémoriser l'état pour le rendu suivant.
      ctx.session.demoPanelOpen = !el.parentElement.open;
      el.parentElement.open = ctx.session.demoPanelOpen;
    },
    'refresh-broadcast': (el, ctx) => ctx.toast('Démonstration : la diffusion reste non confirmée. Aucune source réelle n’est interrogée.'),
    'retry-live': (el, ctx) => {
      ctx.session.scenarios[ctx.route.id] = 'normal';
      ctx.router.setQuery({ etat: undefined });
      ctx.toast('Simulation : le suivi a repris.');
    },
  },
};
