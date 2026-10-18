// Programme TV (maquettes V0.4 01, 02, 03 et 07) : vues Horaire / Chaîne / Match,
// réglages rapides et filtres détaillés partageant le même état appliqué (dans l'adresse).
import { h } from '../ui/html.js';
import { icon } from '../ui/icons.js';
import { topBar, pageTitle, emptyState, demoNote } from '../ui/components.js';
import { COMPETITION, COUNTRY } from '../data/catalog.js';
import { MATCH } from '../data/matches.js';
import { matchTitle } from '../domain/matchState.js';
import { VIEWS, guide, timeline, byChannel, byMatch, parseFilters, filtersToQuery, countActive, DEFAULT_FILTERS } from '../domain/tvGuide.js';
import { accessState } from '../domain/access.js';
import { time, longDayLabel, verifiedLabel } from '../domain/time.js';
import { dateNav, dayActions, readMatchesQuery } from './matches.js';
import { build } from '../router.js';

const compName = (c) => (c.name.includes('Démo') ? c.name : `${c.name} · Démo`);

function entryTitle(e) {
  if (e.format === 'multiplex') {
    const comps = [...new Set(e.matches.map((id) => MATCH[id].competition))];
    return `${comps.map((c) => COMPETITION[c].name).join(', ')} · ${e.matches.length} rencontres`;
  }
  return matchTitle(MATCH[e.matches[0]]);
}

function badge(e) {
  return h`<span class="type-badge ${e.type === 'integral' ? 'is-main' : ''}">${e.typeLabel}</span>`;
}

function channelLine(e, { withChannel = true } = {}) {
  return h`<span class="pg-sub">${withChannel ? `${e.channelName} · ` : ''}${e.access}${e.medium === 'Streaming' ? ' · Streaming' : ''}${e.provisional ? h` · <em>horaire prévisionnel</em>` : ''}</span>`;
}


function multiplexList(e, ctx) {
  const open = ctx.session.guideOpen?.has(e.id);
  return h`<button class="pg-more" aria-expanded="${open}" aria-controls="mx-${e.id}" data-action="pg-multiplex" data-id="${e.id}" data-k="mx-${e.id}">${open ? 'Masquer les rencontres' : 'Voir les rencontres'}${icon(open ? 'chevron-up' : 'chevron-down', { size: 18 })}</button>
    <ul class="pg-mx" id="mx-${e.id}"${open ? '' : h` hidden`}>${e.matches.map((id) => h`<li><a href="#/match/${id}" data-k="mx-${e.id}-${id}">${matchTitle(MATCH[id])}${icon('chevron-right', { size: 16 })}</a></li>`)}</ul>`;
}

// Carte d'un programme : le bouton principal ouvre le panneau diffuseur.
function entryCard(e, g, ctx, { withChannel = true, withTitle = true } = {}) {
  const tz = COUNTRY[ctx.prefs.country].tz;
  const title = entryTitle(e);
  return h`<div class="pg-card ${e.type === 'integral' ? 'is-main' : ''}">
    <button class="pg-main" data-action="open" data-overlay="diffuseur" data-ref="${e.id}" data-k="pg-${e.id}" aria-label="${e.typeLabel}, ${title}, ${time(e.at, tz)}, ${e.channelName}, ${e.access}${e.provisional ? ', horaire prévisionnel' : ''}. Accès au diffuseur">
      ${badge(e)}${withTitle ? h`<span class="pg-title">${title}</span>` : ''}${channelLine(e, { withChannel })}
    </button>
    ${e.type === 'integral' && withTitle ? h`<button class="btn btn-primary btn-sm pg-watch" data-action="open" data-overlay="diffusion" data-ref="${e.matches[0]}" data-k="pg-watch-${e.id}">Où regarder${icon('chevron-right', { size: 16 })}</button>` : icon('chevron-right', { size: 20, cls: 'row-chevron pg-chev' })}
    ${e.format === 'multiplex' ? multiplexList(e, ctx) : ''}
  </div>`;
}

function unconfirmedCard(m, ctx, { compact = false } = {}) {
  const tz = COUNTRY[ctx.prefs.country].tz;
  return h`<a class="pg-card is-unconfirmed" href="#/match/${m.id}" data-k="nc-${m.id}">
    ${compact ? '' : icon('ball', { size: 30, cls: 'nc-ball' })}
    <span class="pg-main-text"><span class="pg-title">${matchTitle(m)}</span>
    <span class="pg-sub">${compact ? 'Diffusion non confirmée' : `Coup d’envoi : ${time(m.kickoff, tz)} · Chaîne à confirmer`}</span></span>
    ${icon('chevron-right', { size: 20, cls: 'row-chevron' })}</a>`;
}

function timeRow(at, tz, body, { main = false, dashed = false } = {}) {
  return h`<li class="tl-row"><span class="tl-time">${time(at, tz)}</span><span class="tl-dot ${main ? 'is-main' : ''} ${dashed ? 'is-dashed' : ''}" aria-hidden="true"></span>${body}</li>`;
}

function viewHoraire(g, ctx) {
  const tz = COUNTRY[ctx.prefs.country].tz;
  return h`<ol class="pg-timeline">${timeline(g).map((r) =>
    r.kind === 'programme'
      ? timeRow(r.at, tz, entryCard(r.entry, g, ctx), { main: r.entry.type === 'integral' })
      : timeRow(r.at, tz, unconfirmedCard(r.match, ctx, { compact: true }), { dashed: true }),
  )}</ol>`;
}

function viewChaine(g, ctx) {
  const tz = COUNTRY[ctx.prefs.country].tz;
  const groups = byChannel(g.entries).map(({ channel, entries }) => {
    const single = new Set(entries.flatMap((e) => e.matches)).size === 1 ? entries[0].matches[0] : null;
    return h`<section class="pg-group" aria-labelledby="ch-${channel.id}">
      <h2 class="pg-group-head" id="ch-${channel.id}">${icon('tv', { size: 30 })}<span><b>${channel.name}</b> · ${channel.access}${single ? h`<small>${matchTitle(MATCH[single])}</small>` : ''}</span></h2>
      <ol class="pg-timeline">${entries.map((e) => timeRow(e.at, tz, entryCard(e, g, ctx, { withChannel: false, withTitle: true }), { main: e.type === 'integral' }))}</ol>
      ${single ? h`<button class="btn btn-outline btn-block" data-action="open" data-overlay="diffusion" data-ref="${single}" data-k="ch-watch-${channel.id}">Où regarder${icon('chevron-right', { size: 18 })}</button>` : ''}
    </section>`;
  });
  return h`${groups}${g.unconfirmed.length
    ? h`<section class="pg-nc" aria-labelledby="nc-head"><h2 id="nc-head">Diffusions non confirmées</h2>${g.unconfirmed.map((m) => unconfirmedCard(m, ctx))}</section>`
    : ''}`;
}

function viewMatch(g, ctx) {
  const tz = COUNTRY[ctx.prefs.country].tz;
  const country = COUNTRY[ctx.prefs.country];
  return byMatch(g).map(({ match, competition, entries, unconfirmed }) => {
    const saved = ctx.prefs.saved.matches.includes(match.id);
    const included = g.filtersMine && entries.length && entries.every((e) => e.included);
    return h`<section class="pg-group" aria-labelledby="m-${match.id}">
      <div class="pg-group-head">${icon('ball', { size: 30 })}
        <span><a href="#/match/${match.id}" id="m-${match.id}" class="pg-match-title" data-k="pm-${match.id}">${matchTitle(match)}</a>
        <small>${compName(competition)}</small><small class="ruby-soft">Coup d’envoi : ${time(match.kickoff, tz)}</small></span>
        <button class="icon-btn star-btn ${saved ? 'is-on' : ''}" data-action="toggle-save" data-kind="matches" data-id="${match.id}" aria-pressed="${saved}" aria-label="${saved ? 'Retirer' : 'Enregistrer'} ${matchTitle(match)}" data-k="pm-star-${match.id}">${icon('star', { fill: saved })}</button>
      </div>
      ${unconfirmed
        ? h`<div class="pg-nc-note">${icon('info', { size: 26 })}<span><b>Diffusion non confirmée</b><small>Aucun diffuseur confirmé pour ${country.name === 'Royaume-Uni' ? 'le Royaume-Uni' : `la ${country.name}`} dans la démonstration.</small></span></div>`
        : h`<ol class="pg-timeline">${entries.map((e) => timeRow(e.at, tz, entryCard(e, g, ctx, { withTitle: false }), { main: e.type === 'integral' }))}</ol>
          ${included ? h`<div class="pg-ok-note">${icon('check', { size: 22 })}<span><b>Chaînes incluses dans ton offre déclarée</b><small>Correspondance vérifiée · Démo</small></span></div>` : ''}
          <button class="btn btn-outline btn-block" data-action="open" data-overlay="diffusion" data-ref="${match.id}" data-k="pm-watch-${match.id}">Où regarder${icon('chevron-right', { size: 18 })}</button>`}
    </section>`;
  });
}

function accessBanner(g) {
  const state = accessState(g.access);
  if (state === 'verifiee') {
    const label = g.access.offers.map((o) => `${o.service.name} · ${o.label}`).join(' ; ');
    return h`<div class="access-banner">${icon('check', { size: 26 })}<span><b>Mes accès activé</b><small>${label}</small></span>
      <a class="text-btn underline" href="#/acces" data-k="manage-access">Gérer mes services</a></div>`;
  }
  return h`<div class="access-banner is-warn">${icon('info', { size: 26 })}<span><b>Mes accès activé</b><small>${state === 'aucune-preference' ? 'Aucun service renseigné.' : 'Aucune offre vérifiée parmi tes services.'}</small></span>
    <a class="text-btn underline" href="#/acces" data-k="manage-access">Gérer mes services</a></div>`;
}

function emptyContent(g, f, ctx, day) {
  const country = COUNTRY[ctx.prefs.country];
  if (!g.hasData) {
    return emptyState({
      ic: 'tv',
      title: `Programme non disponible pour ${country.name} dans la démonstration.`,
      text: 'Seul un programme fictif pour la France est fourni. Cela ne signifie pas que les matchs ne sont pas diffusés.',
      action: h`<button class="btn btn-outline" data-action="open" data-overlay="pays" data-k="guide-country">Changer de pays</button>`,
    });
  }
  if (f.mine) {
    const state = accessState(g.access);
    const pend = g.access.pending.map((p) => p.service.name).join(', ');
    const title = {
      'aucune-preference': 'Aucun service renseigné.',
      'non-verifiee': 'Aucune correspondance vérifiée pour tes services.',
      verifiee: 'Aucune diffusion confirmée ne correspond à tes offres renseignées.',
    }[state];
    const text = {
      'aucune-preference': 'Renseigne tes services et ton offre pour utiliser ce filtre. C’est facultatif.',
      'non-verifiee': `${pend || 'Tes services'} : offre à préciser. Ces services ne sont pas utilisés par le filtre Mes accès.`,
      verifiee: `Recherche limitée aux chaînes incluses dans ton offre déclarée, avec les autres filtres actifs.`,
    }[state];
    return emptyState({
      ic: 'user',
      title,
      text,
      action: h`<div class="btn-row center-row"><a class="btn btn-outline" href="#/acces" data-k="empty-access">${state === 'aucune-preference' ? 'Configurer mes services' : 'Gérer mes services'}</a>
        <button class="btn btn-ghost" data-action="guide-all" data-k="empty-all">Voir tout le programme</button></div>`,
    });
  }
  return emptyState({
    ic: 'tv',
    title: `Aucun programme ne correspond à ces filtres pour ${country.name}, ${longDayLabel(day).toLowerCase()}.`,
    text: 'Le programme de démonstration couvre surtout le dimanche 18 octobre 2026.',
    action: h`<div class="btn-row center-row"><button class="btn btn-outline" data-action="open-filters" data-k="empty-filters">Modifier les filtres</button>
      <button class="btn btn-ghost" data-action="guide-reset" data-k="empty-reset">Voir tout le programme</button></div>`,
  });
}

export default {
  render(ctx) {
    const q = readMatchesQuery(ctx);
    const country = COUNTRY[ctx.prefs.country];
    const view = VIEWS.some(([v]) => v === ctx.route.query.vue) ? ctx.route.query.vue : 'horaire';
    const f = parseFilters(ctx.route.query);
    const g = guide({ day: q.day, filters: f }, ctx.prefs, ctx.session);
    g.filtersMine = f.mine;
    if (ctx.route.query.p !== 'filtres') ctx.session.guideDraft = null;
    const nComp = f.competitions.length;
    const compLabel = nComp === 0 ? 'Compétition' : nComp === 1 ? COMPETITION[f.competitions[0]].name : `${nComp} compétitions`;
    const accLabel = { tous: 'Gratuit / Payant', gratuit: 'Gratuit', payant: 'Payant' }[f.access];
    const active = countActive(f);
    const content = !g.total ? emptyContent(g, f, ctx, q.day) : view === 'horaire' ? viewHoraire(g, ctx) : view === 'chaine' ? viewChaine(g, ctx) : viewMatch(g, ctx);
    return {
      title: 'Programme TV',
      nav: 'matchs',
      body: h`${topBar(ctx)}
      ${pageTitle('Programme TV')}
      ${dateNav(q.day, 'guide', `Horaires ${country.tz}`)}
      <div class="filter-row three" role="group" aria-label="Vue du programme">${VIEWS.map(
        ([v, t]) => h`<button class="filter-btn ${view === v ? 'is-on' : ''}" aria-pressed="${view === v}" data-action="guide-view" data-value="${v}" data-k="view-${v}">${t}</button>`,
      )}</div>
      <div class="quick-filters" role="group" aria-label="Réglages rapides">
        <button class="qf ${f.favorites ? 'is-on' : ''}" aria-pressed="${f.favorites}" data-action="qf-fav" data-k="qf-fav">${icon('star', { size: 20, fill: f.favorites })}Favoris</button>
        <button class="qf ${nComp ? 'is-on' : ''}" data-action="open-filters" data-section="comp" aria-haspopup="dialog" data-k="qf-comp">${icon('trophy', { size: 20 })}<span>${compLabel}</span>${icon('chevron-down', { size: 16 })}</button>
        <button class="qf ${f.access !== 'tous' ? 'is-on' : ''}" data-action="open-filters" data-section="acces" aria-haspopup="dialog" data-k="qf-acces">${icon('lock', { size: 18 })}<span>${accLabel}</span>${icon('chevron-down', { size: 16 })}</button>
        <button class="qf ${f.mine ? 'is-on' : ''}" aria-pressed="${f.mine}" data-action="qf-mine" data-k="qf-mine">${icon('user', { size: 20 })}Mes accès${f.mine ? icon('check', { size: 16 }) : ''}</button>
      </div>
      ${f.mine ? accessBanner(g) : ''}
      <div class="pg-info-row"><p class="pg-info">${icon('info', { size: 18 })}<span>Données fictives${g.verifiedAt ? ` · Vérif. simulée le ${verifiedLabel(g.verifiedAt, country.tz).replace(/\/\d{4}/, '')}` : ''}</span></p>
        <button class="text-btn filters-link" data-action="open-filters" aria-haspopup="dialog" data-k="all-filters">${icon('sliders', { size: 18 })}Filtres détaillés${active ? ` (${active} actif${active > 1 ? 's' : ''})` : ''}</button>
      </div>
      <p class="sr-only" role="status">${g.entries.length} programme${g.entries.length > 1 ? 's' : ''}${g.unconfirmed.length ? `, ${g.unconfirmed.length} diffusion${g.unconfirmed.length > 1 ? 's' : ''} non confirmée${g.unconfirmed.length > 1 ? 's' : ''}` : ''}.</p>
      <div class="pg-content">${content}</div>
      ${g.hiddenUnconfirmed ? h`<p class="hint">${g.hiddenUnconfirmed} diffusion${g.hiddenUnconfirmed > 1 ? 's' : ''} non confirmée${g.hiddenUnconfirmed > 1 ? 's' : ''} exclue${g.hiddenUnconfirmed > 1 ? 's' : ''} par ${f.mine ? 'Mes accès' : 'le filtre d’accès'} : aucune chaîne n’est connue, ${f.mine ? 'elles ne peuvent pas correspondre à tes offres' : 'gratuit ou payant ne peut pas être vérifié'}.</p>` : ''}
      ${f.mine && g.total ? h`<div class="card pg-all">${icon('info', { size: 26 })}<div><b>Les autres diffusions restent consultables</b><small>Les offres non vérifiées sont exclues de ce filtre.</small></div>
        <button class="btn btn-ghost btn-block" data-action="guide-all" data-k="guide-all">Voir tout le programme${icon('chevron-right', { size: 18 })}</button></div>` : ''}
      ${demoNote('Programme fictif · Aucune diffusion réelle · Horaires prévisionnels signalés')}`,
    };
  },
  actions: {
    ...dayActions,
    'guide-view': (el, ctx) => ctx.router.setQuery({ vue: el.dataset.value === 'horaire' ? undefined : el.dataset.value }),
    'qf-fav': (el, ctx) => ctx.router.setQuery({ fav: ctx.route.query.fav === '1' ? undefined : '1' }),
    'qf-mine': (el, ctx) => ctx.router.setQuery({ mes: ctx.route.query.mes === '1' ? undefined : '1' }),
    // « Voir tout le programme » depuis Mes accès : retire seulement ce filtre.
    'guide-all': (el, ctx) => ctx.router.setQuery({ mes: undefined }),
    'guide-reset': (el, ctx) => ctx.router.setQuery(filtersToQuery(DEFAULT_FILTERS)),
    'open-filters': (el, ctx) => {
      ctx.session.guideDraft = structuredClone(parseFilters(ctx.route.query));
      ctx.session.guideSection = el.dataset.section || null;
      ctx.session.guideCompsOpen = el.dataset.section === 'comp';
      ctx.open(el, 'filtres');
    },
    'pg-multiplex': (el, ctx) => {
      const s = (ctx.session.guideOpen ||= new Set());
      if (s.has(el.dataset.id)) s.delete(el.dataset.id);
      else s.add(el.dataset.id);
      ctx.refresh();
    },
  },
};

export { build };
