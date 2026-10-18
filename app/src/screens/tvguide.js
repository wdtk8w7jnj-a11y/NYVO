// Programme TV : ordre chronologique, vue par chaîne, filtres et Mes accès.
import { h, attr } from '../ui/html.js';
import { icon } from '../ui/icons.js';
import { crest } from '../ui/crest.js';
import { detailBar, segmented, chips, emptyState, demoNote, switchControl } from '../ui/components.js';
import { COMPETITIONS, COUNTRY } from '../data/catalog.js';
import { guideEntries, byChannel } from '../domain/tvGuide.js';
import { matchTitle } from '../domain/matchState.js';
import { time } from '../domain/time.js';
import { dateNav, dayActions, readMatchesQuery } from './matches.js';

const FILTERS = [['tous', 'Tous'], ['favoris', 'Mes favoris'], ['gratuit', 'Gratuit'], ['payant', 'Payant']];
const KIND_ICON = { pre: 'play', match: 'tv', post: 'clock' };

function entry(e, ctx, { showChannel = true } = {}) {
  const tz = COUNTRY[ctx.prefs.country].tz;
  return h`<li class="guide-row"><a href="#/match/${e.match.id}" data-k="g-${e.match.id}-${e.kind}">
    <span class="p-time">${time(e.at, tz)}</span>
    <span class="p-icon ${e.kind}">${icon(KIND_ICON[e.kind], { size: e.kind === 'pre' ? 16 : 22 })}</span>
    <span class="guide-text"><b>${e.label}${e.provisional ? h`<small> · prévisionnel</small>` : ''}</b><span>${crest(e.match.home, { size: 16 })}${matchTitle(e.match)}</span></span>
    <span class="guide-ch">${showChannel ? h`<b>${e.channelName}</b>` : ''}<small>${e.medium || 'TV + streaming'} · ${e.access}</small></span>
  </a></li>`;
}

export default {
  render(ctx) {
    const q = readMatchesQuery(ctx);
    const country = COUNTRY[ctx.prefs.country];
    const view = ctx.route.query.vue === 'chaine' ? 'chaine' : 'horaire';
    const filter = FILTERS.some(([v]) => v === ctx.route.query.filtre) ? ctx.route.query.filtre : 'tous';
    const competition = COMPETITIONS.some((c) => c.id === ctx.route.query.comp) ? ctx.route.query.comp : 'toutes';
    const myAccess = ctx.route.query.acces === '1';
    const entries = guideEntries({ day: q.day, filter, competition, myAccess }, ctx.prefs, ctx.session);
    let content;
    if (!entries.length) {
      const anyForDay = guideEntries({ day: q.day }, ctx.prefs, ctx.session).length > 0;
      content = emptyState({
        ic: 'tv',
        title: anyForDay ? 'Aucun programme ne correspond à ces filtres.' : `Aucun programme confirmé en ${country.name} pour cette date dans la démonstration.`,
        text: myAccess && !ctx.prefs.services.length ? 'Indiquez vos accès dans les réglages pour utiliser ce filtre.' : 'Une diffusion absente n’est pas une diffusion annulée.',
      });
    } else if (view === 'chaine') {
      content = byChannel(entries).map(
        (g) => h`<section class="card guide-group"><h2>${icon('tv', { size: 22 })}${g.channel.name}<small>${g.channel.access}</small></h2><ul>${g.entries.map((e) => entry(e, ctx, { showChannel: false }))}</ul></section>`,
      );
    } else {
      content = h`<ul class="card guide-list">${entries.map((e) => entry(e, ctx))}</ul>`;
    }
    return {
      title: 'Programme TV',
      nav: 'matchs',
      body: h`${detailBar(ctx, { back: '#/matchs' })}
      <div class="page-title"><span class="demo-badge">Démo</span><h1 tabindex="-1">Programme TV</h1></div>
      <p class="hint">${country.name} · Horaires ${country.tz} · Programme fictif</p>
      ${dateNav(q.day, 'guide')}
      ${segmented([['horaire', 'Par horaire'], ['chaine', 'Par chaîne']], view, { action: 'guide-view', label: 'Présentation du programme', cls: 'seg-lg' })}
      ${chips(FILTERS, filter, { action: 'guide-filter', label: 'Filtrer le programme' })}
      <div class="options-row">
        <label class="select-pill"><span class="sr-only">Compétition</span><select data-change="guide-comp" data-k="guide-comp">
          <option value="toutes">Toutes les compétitions</option>${COMPETITIONS.map((c) => h`<option value="${c.id}"${attr('selected', c.id === competition)}>${c.name}</option>`)}</select>${icon('chevron-down', { size: 20 })}</label>
        ${switchControl('Mes accès', myAccess, { action: 'guide-access', k: 'guide-access' })}
      </div>
      ${content}
      ${demoNote('Source : programme fictif · Dernière vérification 18/10/2026 à 18:00 · Démo')}`,
    };
  },
  actions: {
    ...dayActions,
    'guide-view': (el, ctx) => ctx.router.setQuery({ vue: el.dataset.value === 'chaine' ? 'chaine' : undefined }),
    'guide-filter': (el, ctx) => ctx.router.setQuery({ filtre: el.dataset.value === 'tous' ? undefined : el.dataset.value }),
    'guide-comp': (el, ctx) => ctx.router.setQuery({ comp: el.value === 'toutes' ? undefined : el.value }),
    'guide-access': (el, ctx) => ctx.router.setQuery({ acces: ctx.route.query.acces === '1' ? undefined : '1' }),
  },
};
