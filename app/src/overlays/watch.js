// Panneau « Où regarder » (planches V0.2 04 et 06, complété en V0.4 par Mes accès).
import { h, attr } from '../ui/html.js';
import { icon } from '../ui/icons.js';
import { crest } from '../ui/crest.js';
import { flag } from '../ui/flags.js';
import { segmented } from '../ui/components.js';
import { COMPETITION, COUNTRIES, COUNTRY, TEAM } from '../data/catalog.js';
import { SERVICE } from '../data/access.js';
import { MATCH } from '../data/matches.js';
import { broadcastFor, matchTitle } from '../domain/matchState.js';
import { TYPE_LABEL, typeOf } from '../domain/tvGuide.js';
import { declared, accessState } from '../domain/access.js';
import { time, verifiedLabel } from '../domain/time.js';

export function watchMatchId(ctx) {
  return ctx.route.name === 'match' ? ctx.route.id : ctx.route.query.ref;
}

function option(o, i, ctx, d) {
  const featured = i === 0;
  const hit = d.verified.get(o.channel);
  return h`<li class="bc-option ${featured ? 'is-featured' : ''}">
    <div class="bc-option-head">
      <span class="bc-logo">${icon('tv', { size: 30 })}</span>
      <div class="bc-option-text"><b>${o.channelName}</b><span>${o.medium} · ${o.access}</span>${o.subscription ? h`<span class="lockline">${icon('lock', { size: 16 })}Abonnement requis</span>` : ''}
        ${o.format === 'Multiplex' ? h`<span class="small">Multiplex : ${o.matches.length} rencontres en alternance</span>` : ''}
        ${hit ? h`<span class="pg-included">${icon('check', { size: 16 })}Incluse dans ton offre déclarée (${hit.label})</span>` : ''}</div>
      <span class="badge ${featured ? 'badge-ruby' : 'badge-dark'}">${o.format}</span>
    </div>
    <button class="btn ${featured ? 'btn-primary' : 'btn-ghost'} btn-block" data-action="open" data-overlay="diffuseur" data-ref="${o.id}" data-k="bc-go-${o.id}">Ouvrir chez le diffuseur${icon('external', { size: 20 })}</button>
    <p class="bc-dest">Disponible sur ${SERVICE[o.service]?.name || 'service non précisé'} · lien fictif · démo</p>
  </li>`;
}

function mineContent(b, ctx, d) {
  const state = accessState(d);
  if (state === 'aucune-preference') {
    return h`<div class="card access-pick"><p><b>Renseigne tes services (facultatif)</b></p><p class="small">Sélection locale, sans identifiant ni connexion à un compte diffuseur. Toutes les diffusions restent consultables.</p>
      <a class="btn btn-outline btn-sm" href="#/acces" data-k="watch-config">Configurer mes services</a></div>`;
  }
  if (state === 'non-verifiee') {
    return h`<div class="card access-pick"><p><b>Correspondance non vérifiée</b></p><p class="small">${d.pending.map((p) => p.service.name).join(', ') || 'Tes accès historiques'} : offre à préciser. Ces accès ne sont pas utilisés pour filtrer les diffusions.</p>
      <div class="btn-row"><a class="btn btn-outline btn-sm" href="#/acces" data-k="watch-manage">Gérer mes services</a><button class="btn btn-ghost btn-sm" data-action="watch-view" data-value="toutes" data-k="see-all">Voir toutes les diffusions</button></div></div>`;
  }
  const options = b.options.filter((o) => d.verified.has(o.channel));
  if (!options.length) {
    return h`<div class="card access-pick"><p><b>Aucune diffusion confirmée ne correspond à tes offres renseignées.</b></p><p class="small">Offres déclarées : ${d.offers.map((o) => `${o.service.name} · ${o.label}`).join(' ; ')}.</p>
      <div class="btn-row"><button class="btn btn-ghost btn-sm" data-action="watch-view" data-value="toutes" data-k="see-all">Voir toutes les diffusions</button><a class="btn btn-ghost btn-sm" href="#/acces" data-k="watch-manage">Gérer mes services</a></div></div>`;
  }
  return h`<ul class="bc-options">${options.map((o, i) => option(o, i, ctx, d))}</ul>`;
}

export default {
  render(ctx) {
    const match = MATCH[watchMatchId(ctx)];
    if (!match) return { title: 'Où regarder', body: h`<p>Rencontre introuvable.</p>` };
    const country = COUNTRY[ctx.prefs.country];
    const b = broadcastFor(match, ctx.prefs.country, ctx.session);
    const d = declared(ctx.prefs, ctx.prefs.country);
    const view = ctx.session.watchView || 'toutes';
    const provisional = b.schedule.filter((s) => s.provisional);
    let list;
    if (!b.confirmed) {
      list = h`<div class="state-card in-sheet">${icon('info', { size: 30 })}<h3>Diffusion non confirmée</h3>
        <p>Nous n’avons pas encore de chaîne confirmée pour ce match en ${country.name}.</p>
        <p>Cette absence d’information ne signifie pas que le match ne sera pas diffusé.</p>
        <p class="small">${b.verifiedAt ? `Vérifié le ${verifiedLabel(b.verifiedAt, country.tz)} · Démo` : 'Aucune donnée de diffusion pour ce pays dans la démonstration.'}</p>
        <button class="btn btn-outline btn-block" data-action="refresh-broadcast-sheet" data-k="sheet-refresh">Actualiser</button></div>`;
    } else if (view === 'mes-acces') {
      list = mineContent(b, ctx, d);
    } else {
      list = h`<ul class="bc-options">${b.options.map((o, i) => option(o, i, ctx, d))}</ul>`;
    }
    return {
      title: 'Où regarder',
      body: h`<div class="watch">
        <div class="watch-teams">
          <span class="team-mini">${crest(match.home, { size: 54 })}<span>${TEAM[match.home].name}</span></span>
          <div class="watch-title"><b>${matchTitle(match)}</b><span>${COMPETITION[match.competition].name}${COMPETITION[match.competition].name.includes('Démo') ? '' : ' · Démo'}</span></div>
          <span class="team-mini">${crest(match.away, { size: 54 })}<span>${TEAM[match.away].name}</span></span>
        </div>
        <label class="field-label" for="watch-country">Pays de diffusion</label>
        <div class="select-flag">${flag(country.id, { size: 30 })}
          <select id="watch-country" data-change="set-country" data-k="watch-country">${COUNTRIES.map((c) => h`<option value="${c.id}"${attr('selected', c.id === country.id)}>${c.name}</option>`)}</select>${icon('chevron-down', { size: 20 })}</div>
        <p class="small">Horaires : ${country.tz}</p>
        ${b.confirmed ? segmented([['toutes', 'Toutes les diffusions'], ['mes-acces', 'Mes accès']], view, { action: 'watch-view', label: 'Diffusions affichées', cls: 'seg-lg' }) : ''}
        ${b.confirmed ? h`<h3 class="watch-time">Match à ${time(match.kickoff, country.tz)}</h3>` : ''}
        ${list}
        ${b.confirmed && b.schedule.length
          ? h`<h3>Toute la soirée</h3><ul class="evening">${b.schedule.map(
              (s) => h`<li><span class="ev-time">${time(s.at, country.tz)}</span><span class="ev-text"><b>${TYPE_LABEL[typeOf(s)]}</b><span>${s.channelName}${s.medium ? ` · ${s.medium}` : ''}</span></span></li>`,
            )}</ul>
            ${provisional.length ? h`<p class="note">${icon('clock', { size: 20 })}${provisional.map((s) => TYPE_LABEL[typeOf(s)]).join(', ')} : horaire prévisionnel.</p>` : ''}`
          : ''}
        ${b.confirmed ? h`<div class="sources"><p>Source : programme fictif</p><p>Dernière vérification : ${verifiedLabel(b.verifiedAt, country.tz)} · Démo</p></div>` : ''}
        <p class="note">${icon('info', { size: 20 })}L’accès et l’abonnement sont gérés par le diffuseur.</p>
      </div>`,
    };
  },
  actions: {
    'watch-view': (el, ctx) => {
      ctx.session.watchView = el.dataset.value;
      ctx.refresh();
    },
    'refresh-broadcast-sheet': (el, ctx) => ctx.toast('Démonstration : la diffusion reste non confirmée.'),
  },
};
