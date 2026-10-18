// Recherche globale : catégories, abréviations, historique effaçable.
import { h } from '../ui/html.js';
import { icon } from '../ui/icons.js';
import { chips } from '../ui/components.js';
import { crest } from '../ui/crest.js';
import { CATEGORIES, search } from '../domain/search.js';
import { MATCH } from '../data/matches.js';
import { COUNTRY } from '../data/catalog.js';
import { time } from '../domain/time.js';

const TYPE_ICON = { match: 'ball', equipe: 'shirt', competition: 'trophy', joueur: 'user', chaine: 'tv', article: 'news', video: 'video' };
const TYPE_LABEL = Object.fromEntries(CATEGORIES);

function resultItem(r, ctx) {
  const lead = r.type === 'equipe' ? crest(r.id, { size: 30 }) : h`<span class="res-icon">${icon(TYPE_ICON[r.type], { size: 22 })}</span>`;
  const sub = r.type === 'match' ? `${r.sub} · ${time(MATCH[r.id].kickoff, COUNTRY[ctx.prefs.country].tz)}` : r.sub;
  return h`<li><a class="result" href="${r.href}" data-action="search-pick" data-k="res-${r.type}-${r.id}">${lead}<span><b>${r.label}</b><small>${sub}</small></span>${icon('chevron-right', { size: 18 })}</a></li>`;
}

export default {
  render(ctx) {
    const st = ctx.session.search;
    const results = search(st.query, st.category, ctx.prefs, ctx.session);
    const history = ctx.prefs.searchHistory;
    let body;
    if (!st.query.trim()) {
      body = history.length
        ? h`<div class="history"><div class="section-head"><h3>Recherches récentes</h3><button class="text-btn ruby" data-action="search-clear" data-k="search-clear">Effacer</button></div>
            <ul>${history.map((q) => h`<li><button class="history-item" data-action="search-reuse" data-value="${q}" data-k="hist-${q}">${icon('clock', { size: 18 })}${q}</button></li>`)}</ul></div>`
        : h`<p class="hint">Matchs, clubs, compétitions, joueurs, chaînes, actualités et vidéos du catalogue de démonstration. Abréviations acceptées (ex. « PA », « SD1 »).</p>`;
    } else if (!results.length) {
      body = h`<p class="empty-inline" role="status">Aucun résultat pour « ${st.query} » dans la démonstration.</p>`;
    } else {
      const groups = CATEGORIES.slice(1)
        .map(([type]) => [type, results.filter((r) => r.type === type)])
        .filter(([, list]) => list.length);
      body = h`<p class="sr-only" role="status">${results.length} résultat${results.length > 1 ? 's' : ''}.</p>${groups.map(
        ([type, list]) => h`<section class="res-group"><h3>${TYPE_LABEL[type]}</h3><ul>${list.map((r) => resultItem(r, ctx))}</ul></section>`,
      )}`;
    }
    return {
      title: 'Recherche',
      variant: 'full',
      body: h`<form class="search-form" role="search" data-submit="search-submit">
        <label class="search-field">${icon('search')}<span class="sr-only">Rechercher</span>
          <input type="search" name="q" autofocus autocomplete="off" placeholder="Club, match, joueur, chaîne…" value="${st.query}" data-input="search-input" data-k="search-input"></label>
      </form>
      ${chips(CATEGORIES, st.category, { action: 'search-cat', label: 'Catégorie de recherche' })}
      <div class="search-results">${body}</div>`,
    };
  },
  actions: {
    'search-input': (el, ctx) => {
      ctx.session.search.query = el.value;
      ctx.refresh();
    },
    'search-cat': (el, ctx) => {
      ctx.session.search.category = el.dataset.value;
      ctx.refresh();
    },
    'search-submit': (form, ctx) => remember(ctx),
    'search-reuse': (el, ctx) => {
      ctx.session.search.query = el.dataset.value;
      ctx.refresh();
    },
    'search-clear': (el, ctx) => {
      ctx.save((s) => {
        s.searchHistory = [];
      }, 'Historique de recherche effacé.');
    },
    'search-pick': (el, ctx) => {
      remember(ctx);
      ctx.session.search.query = '';
      ctx.navigate(el.getAttribute('href'));
    },
  },
};

function remember(ctx) {
  const q = ctx.session.search.query.trim();
  if (!q) return;
  ctx.store.update((s) => {
    s.searchHistory = [q, ...s.searchHistory.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 8);
  });
}
