// Matchs (planche 02) : date, filtres, diffusés dans mon pays, tri, favoris épinglés.
import { h, attr } from '../ui/html.js';
import { icon } from '../ui/icons.js';
import { topBar, pageTitle, linkMore, matchHero, matchRow, emptyState, demoNote } from '../ui/components.js';
import { COUNTRY, DEMO_DATE } from '../data/catalog.js';
import { FILTERS, selectMatches, groupByCompetition, isPinnedMatch, byStatusThenKickoff, matchesOn } from '../domain/matchList.js';
import { addDays, dayLabel, isValidDayKey, longDayLabel } from '../domain/time.js';

export function readMatchesQuery(ctx) {
  const q = ctx.route.query;
  const day = isValidDayKey(q.date) ? q.date : ctx.session.day;
  ctx.session.day = day;
  return {
    day,
    filter: FILTERS.some(([v]) => v === q.filtre) ? q.filtre : 'tous',
    broadcastOnly: q.diff === '1',
    sort: q.tri === 'heure' ? 'heure' : 'competition',
  };
}

export function dateNav(day, k = 'matches', sub = '') {
  return h`<div class="date-nav">
    <button class="icon-btn" data-action="day-shift" data-value="-1" aria-label="Jour précédent" data-k="${k}-prev">${icon('chevron-left')}</button>
    <button class="date-center" data-action="open" data-overlay="date" data-k="${k}-date" aria-label="Choisir la date, actuellement ${longDayLabel(day)}${sub ? `. ${sub}` : ''}">${icon('calendar')}<span class="date-text"><span>${dayLabel(day)}</span>${sub ? h`<small>${sub}</small>` : ''}</span></button>
    <button class="icon-btn" data-action="day-shift" data-value="1" aria-label="Jour suivant" data-k="${k}-next">${icon('chevron-right')}</button>
  </div>`;
}

export const dayActions = {
  'day-shift': (el, ctx) => {
    const day = addDays(ctx.session.day, Number(el.dataset.value));
    ctx.session.day = day;
    ctx.router.setQuery({ date: day });
  },
};

export default {
  render(ctx) {
    const q = readMatchesQuery(ctx);
    const country = COUNTRY[ctx.prefs.country];
    const list = selectMatches(q, ctx.prefs, ctx.session);
    const dayHasMatches = matchesOn(q.day, ctx.prefs.country).length > 0;
    const pinned = list.filter((m) => isPinnedMatch(m, ctx.prefs)).sort(byStatusThenKickoff);
    const rest = list.filter((m) => !pinned.includes(m));
    const collapsed = ctx.session.matches.collapsed;
    let content;
    if (!dayHasMatches) {
      content = emptyState({
        ic: 'calendar',
        title: `Aucune rencontre de démonstration le ${longDayLabel(q.day).toLowerCase()}.`,
        text: 'Le jeu de données couvre surtout le dimanche 18 octobre 2026.',
        action: q.day !== DEMO_DATE ? h`<button class="btn btn-outline" data-action="day-reset" data-k="day-reset">Revenir au 18 octobre</button>` : '',
      });
    } else if (!list.length) {
      content = emptyState({
        ic: 'ball',
        title: 'Aucune rencontre ne correspond à ces filtres.',
        text: q.broadcastOnly ? `Aucune diffusion confirmée en ${country.name} pour cette sélection. Cela ne veut pas dire que ces matchs ne seront pas diffusés.` : 'Essayez un autre filtre.',
        action: h`<button class="btn btn-outline" data-action="filters-reset" data-k="filters-reset">Afficher tous les matchs</button>`,
      });
    } else {
      const groups =
        q.sort === 'heure'
          ? h`<ul class="match-list card-list">${rest.map((m) => matchRow(m, ctx))}</ul>`
          : groupByCompetition(rest).map(({ competition, matches }) => {
              const open = !collapsed.has(competition.id);
              const name = competition.name.includes('Démo') ? competition.name : `${competition.name} · Démo`;
              return h`<section class="comp-group">
                <h2 class="comp-head"><button class="comp-toggle" aria-expanded="${open}" aria-controls="grp-${competition.id}" data-action="toggle-group" data-id="${competition.id}" data-k="grp-${competition.id}">
                  ${icon('trophy')}<span>${name}</span>${icon(open ? 'chevron-up' : 'chevron-down', { cls: 'grp-chevron' })}</button></h2>
                <ul class="match-list" id="grp-${competition.id}"${attr('hidden', !open)}>${matches.map((m) => matchRow(m, ctx))}</ul>
              </section>`;
            });
      content = h`${pinned.map((m) => matchHero(m, ctx, { pinned: true }))}${groups}`;
    }
    return {
      title: 'Matchs',
      nav: 'matchs',
      body: h`${topBar(ctx)}
      ${pageTitle('Matchs', linkMore('#/programme', 'Programme TV', 'matches-tv'))}
      ${dateNav(q.day)}
      <div class="filter-row" role="group" aria-label="Filtrer par statut">${FILTERS.map(
        ([v, t]) => h`<button class="filter-btn ${q.filter === v ? 'is-on' : ''}" aria-pressed="${q.filter === v}" data-action="set-filter" data-value="${v}" data-k="filter-${v}">${t}</button>`,
      )}</div>
      <div class="options-row">
        <button class="toggle-pill" role="switch" aria-checked="${q.broadcastOnly}" data-action="toggle-broadcast" data-k="toggle-broadcast">
          <span>Diffusés en ${country.name}</span><span class="switch ${q.broadcastOnly ? 'is-on' : ''}" aria-hidden="true"><i></i></span></button>
        <label class="select-pill"><span class="sr-only">Regrouper les matchs</span>
          <select data-change="set-sort" data-k="sort">
            <option value="competition"${attr('selected', q.sort === 'competition')}>Par compétition</option>
            <option value="heure"${attr('selected', q.sort === 'heure')}>Par horaire</option>
          </select>${icon('chevron-down', { size: 20 })}</label>
      </div>
      <p class="sr-only" role="status">${list.length} rencontre${list.length > 1 ? 's' : ''} affichée${list.length > 1 ? 's' : ''}.</p>
      <div class="matches-content">${content}</div>
      ${demoNote(`Rencontres fictives · Horaires ${country.tz}`)}`,
    };
  },
  actions: {
    ...dayActions,
    'day-reset': (el, ctx) => {
      ctx.session.day = DEMO_DATE;
      ctx.router.setQuery({ date: DEMO_DATE });
    },
    'set-filter': (el, ctx) => ctx.router.setQuery({ filtre: el.dataset.value === 'tous' ? undefined : el.dataset.value }),
    'filters-reset': (el, ctx) => ctx.router.setQuery({ filtre: undefined, diff: undefined }),
    'toggle-broadcast': (el, ctx) => ctx.router.setQuery({ diff: ctx.route.query.diff === '1' ? undefined : '1' }),
    'set-sort': (el, ctx) => ctx.router.setQuery({ tri: el.value === 'heure' ? 'heure' : undefined }),
    'toggle-group': (el, ctx) => {
      const c = ctx.session.matches.collapsed;
      const id = el.dataset.id;
      if (c.has(id)) c.delete(id);
      else c.add(id);
      ctx.refresh();
    },
  },
};
