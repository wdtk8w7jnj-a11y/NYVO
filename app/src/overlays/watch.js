// Panneau « Où regarder » (planches 04 et 06).
import { h, attr } from '../ui/html.js';
import { icon } from '../ui/icons.js';
import { crest } from '../ui/crest.js';
import { flag } from '../ui/flags.js';
import { segmented } from '../ui/components.js';
import { CHANNELS, COMPETITION, COUNTRIES, COUNTRY, TEAM } from '../data/catalog.js';
import { MATCH } from '../data/matches.js';
import { broadcastFor, matchTitle } from '../domain/matchState.js';
import { KIND_LABEL } from '../domain/tvGuide.js';
import { time, verifiedLabel } from '../domain/time.js';

export function watchMatchId(ctx) {
  return ctx.route.name === 'match' ? ctx.route.id : ctx.route.query.ref;
}

function option(o, i, ctx) {
  const featured = i === 0;
  const expanded = featured || ctx.session.watchExpanded === o.channel;
  return h`<li class="bc-option ${featured ? 'is-featured' : ''}">
    <div class="bc-option-head">
      <span class="bc-logo">${icon('tv', { size: 30 })}</span>
      <div class="bc-option-text"><b>${o.channelName}</b><span>${o.medium} · ${o.access}</span>${o.subscription ? h`<span class="lockline">${icon('lock', { size: 16 })}Abonnement requis</span>` : ''}</div>
      <span class="badge ${featured ? 'badge-ruby' : 'badge-dark'}">${o.format}</span>
    </div>
    ${expanded
      ? h`<button class="btn btn-primary btn-block" data-action="open-broadcaster" data-k="bc-go-${o.channel}">Ouvrir chez le diffuseur${icon('external', { size: 20 })}</button>
         <p class="bc-dest">Destination : ${o.destination}<br><small>Lien illustratif · démo — aucun site n’est ouvert</small></p>`
      : h`<button class="btn btn-ghost btn-sm bc-more" data-action="watch-expand" data-value="${o.channel}" aria-expanded="false" data-k="bc-more-${o.channel}">Voir l’accès${icon('chevron-right', { size: 18 })}</button>`}
  </li>`;
}

export default {
  render(ctx) {
    const match = MATCH[watchMatchId(ctx)];
    if (!match) return { title: 'Où regarder', body: h`<p>Rencontre introuvable.</p>` };
    const country = COUNTRY[ctx.prefs.country];
    const b = broadcastFor(match, ctx.prefs.country, ctx.session);
    const view = ctx.session.watchView || 'toutes';
    const mine = ctx.prefs.services;
    const options = view === 'mes-acces' ? b.options.filter((o) => mine.includes(o.channel)) : b.options;
    const provisional = b.schedule.filter((s) => s.provisional);
    let list;
    if (!b.confirmed) {
      list = h`<div class="state-card in-sheet">${icon('info', { size: 30 })}<h3>Diffusion non confirmée</h3>
        <p>Nous n’avons pas encore de chaîne confirmée pour ce match en ${country.name}.</p>
        <p>Cette absence d’information ne signifie pas que le match ne sera pas diffusé.</p>
        <p class="small">${b.verifiedAt ? `Vérifié le ${verifiedLabel(b.verifiedAt, country.tz)} · Démo` : 'Aucune donnée de diffusion pour ce pays dans la démonstration.'}</p>
        <button class="btn btn-outline btn-block" data-action="refresh-broadcast-sheet" data-k="sheet-refresh">Actualiser</button></div>`;
    } else if (view === 'mes-acces' && (!mine.length || ctx.session.editServices)) {
      list = h`<div class="card access-pick"><p><b>Indiquez vos accès (facultatif)</b></p><p class="small">Sélection locale, sans connexion à un compte diffuseur. Toutes les diffusions restent consultables.</p>
        ${CHANNELS.map((c) => h`<label class="check-line"><input type="checkbox" data-change="toggle-service" data-id="${c.id}"${attr('checked', mine.includes(c.id))} data-k="svc-${c.id}"><span>${c.name} · ${c.access}</span></label>`)}
        ${mine.length ? h`<button class="btn btn-outline btn-sm" data-action="services-done" data-k="svc-done">Terminé</button>` : ''}</div>`;
    } else if (!options.length) {
      list = h`<div class="card"><p>Aucune de vos offres sélectionnées ne diffuse ce match.</p><button class="text-btn ruby" data-action="watch-view" data-value="toutes" data-k="see-all">Voir toutes les diffusions</button></div>`;
    } else {
      list = h`<ul class="bc-options">${options.map((o, i) => option(o, i, ctx))}</ul>`;
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
        ${view === 'mes-acces' && mine.length && b.confirmed && !ctx.session.editServices ? h`<button class="text-btn small" data-action="services-edit" data-k="svc-edit">Modifier mes accès</button>` : ''}
        ${b.confirmed && b.schedule.length
          ? h`<h3>Toute la soirée</h3><ul class="evening">${b.schedule.map(
              (s) => h`<li><span class="ev-time">${time(s.at, country.tz)}</span><span class="ev-text"><b>${KIND_LABEL[s.kind]}</b><span>${s.channelName}${s.medium ? ` · ${s.medium}` : ''}</span></span></li>`,
            )}</ul>
            ${provisional.length ? h`<p class="note">${icon('clock', { size: 20 })}${provisional.map((s) => KIND_LABEL[s.kind]).join(', ')} : horaire prévisionnel.</p>` : ''}`
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
    'watch-expand': (el, ctx) => {
      ctx.session.watchExpanded = el.dataset.value;
      ctx.refresh();
    },
    'toggle-service': (el, ctx) => {
      ctx.save((s) => {
        const i = s.services.indexOf(el.dataset.id);
        if (i >= 0) s.services.splice(i, 1);
        else s.services.push(el.dataset.id);
      });
    },
    'services-edit': (el, ctx) => {
      ctx.session.editServices = true;
      ctx.refresh();
    },
    'services-done': (el, ctx) => {
      ctx.session.editServices = false;
      ctx.refresh();
    },
    'open-broadcaster': (el, ctx) => ctx.toast('Démonstration : aucun site de diffuseur n’est ouvert. Le lien réel sera ajouté après vérification.'),
    'refresh-broadcast-sheet': (el, ctx) => ctx.toast('Démonstration : la diffusion reste non confirmée.'),
  },
};
