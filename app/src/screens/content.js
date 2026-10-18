// Actualités et Vidéos (planche 09), lecture d'article et aperçu vidéo.
import { h } from '../ui/html.js';
import { icon } from '../ui/icons.js';
import { art } from '../ui/art.js';
import { topBar, pageTitle, segmented, chips, emptyState, demoNote, detailBar, bookmarkBtn } from '../ui/components.js';
import { articleFeature, articleRow, videoCard, natureBadge, maskedCard } from '../ui/contentCards.js';
import { ARTICLE, VIDEO } from '../data/content.js';
import { COUNTRY } from '../data/catalog.js';
import { NEWS_FILTERS, VIDEO_FEEDS, newsFeed, videoFeed, hasFavorites } from '../domain/feeds.js';
import { contentMasked } from '../domain/matchState.js';
import { shortDateTime } from '../domain/time.js';

export const news = {
  render(ctx) {
    const q = ctx.route.query;
    const feed = q.fil === 'general' ? 'general' : 'pour-vous';
    const filter = NEWS_FILTERS.some(([v]) => v === q.cat) ? q.cat : 'tous';
    const list = newsFeed({ feed, filter }, ctx.prefs);
    const [first, ...rest] = list;
    let content;
    if (!list.length) {
      content = emptyState({
        ic: 'news',
        title: filter === 'mes-clubs' && !ctx.prefs.follows.teams.length ? 'Vous ne suivez encore aucun club.' : 'Aucune actualité de démonstration pour ce filtre.',
        action: filter === 'mes-clubs' && !ctx.prefs.follows.teams.length ? h`<button class="btn btn-outline" data-action="open" data-overlay="ajouter" data-k="news-add">Ajouter des favoris</button>` : h`<button class="btn btn-outline" data-action="news-cat" data-value="tous" data-k="news-all">Voir toutes les actualités</button>`,
      });
    } else {
      content = h`${articleFeature(first, ctx)}<ul class="news-list">${rest.map((a) => articleRow(a, ctx))}</ul>`;
    }
    return {
      title: 'Actualités',
      nav: 'actualites',
      body: h`${topBar(ctx)}${pageTitle('Actualités')}
      ${segmented([['pour-vous', 'Pour vous'], ['general', 'Fil général']], feed, { action: 'news-feed', label: 'Fil d’actualités', cls: 'seg-lg' })}
      ${chips(NEWS_FILTERS, filter, { action: 'news-cat', label: 'Catégorie' })}
      ${feed === 'pour-vous' && !hasFavorites(ctx.prefs) ? h`<p class="hint">Aucun favori : le fil général est affiché.</p>` : ''}
      ${content}
      <button class="why" data-action="open" data-overlay="pourquoi" data-k="why">${icon('help', { size: 22 })}Pourquoi ces actualités ?${icon('chevron-right', { size: 16 })}</button>
      ${demoNote('Contenus fictifs · Aperçu du prototype · Visuels d’illustration')}`,
    };
  },
  actions: {
    'news-feed': (el, ctx) => ctx.router.setQuery({ fil: el.dataset.value === 'general' ? 'general' : undefined }),
    'news-cat': (el, ctx) => ctx.router.setQuery({ cat: el.dataset.value === 'tous' ? undefined : el.dataset.value }),
  },
};

export const videos = {
  render(ctx) {
    const feed = VIDEO_FEEDS.some(([v]) => v === ctx.route.query.fil) ? ctx.route.query.fil : 'pour-vous';
    const list = videoFeed(feed, ctx.prefs);
    return {
      title: 'Vidéos',
      nav: 'videos',
      body: h`${topBar(ctx)}${pageTitle('Vidéos')}
      ${segmented(VIDEO_FEEDS, feed, { action: 'video-feed', label: 'Type de vidéos', cls: 'seg-lg seg-3' })}
      <ul class="video-list">${list.map((v) => videoCard(v, ctx))}</ul>
      <p class="hint center">Lecture à la demande · aucune lecture automatique</p>
      ${demoNote('Contenus fictifs · Aperçu du prototype · Visuels d’illustration')}`,
    };
  },
  actions: {
    'video-feed': (el, ctx) => ctx.router.setQuery({ fil: el.dataset.value === 'pour-vous' ? undefined : el.dataset.value }),
  },
};

export const article = {
  render(ctx) {
    const a = ARTICLE[ctx.route.id];
    if (!a) return { title: 'Article introuvable', nav: 'actualites', body: h`${detailBar(ctx, { back: '#/actualites' })}${emptyState({ ic: 'news', title: 'Article introuvable' })}` };
    const masked = contentMasked(a, ctx.prefs, ctx.session);
    return {
      title: masked ? a.maskedTitle : a.title,
      nav: 'actualites',
      body: h`${detailBar(ctx, { back: '#/actualites', actions: bookmarkBtn('articles', a.id, ctx, masked ? a.maskedTitle : a.title) })}
      ${masked
        ? h`<h1 tabindex="-1" class="article-title">${a.maskedTitle}</h1>${maskedCard(a, ctx)}`
        : h`<article class="article">
          <span class="media media-wide">${art(a.art)}</span>
          ${natureBadge(a)}${a.unconfirmed ? h` <span class="unconfirmed">Non confirmé</span>` : ''}
          <h1 tabindex="-1" class="article-title">${a.title}</h1>
          <p class="meta">${a.source} · ${shortDateTime(a.publishedAt, COUNTRY[ctx.prefs.country].tz)}</p>
          ${a.body.map((p) => h`<p>${p}</p>`)}
        </article>`}
      ${demoNote('Article fictif · Source de démonstration · Visuel d’illustration')}`,
    };
  },
};

export const video = {
  render(ctx) {
    const v = VIDEO[ctx.route.id];
    if (!v) return { title: 'Vidéo introuvable', nav: 'videos', body: h`${detailBar(ctx, { back: '#/videos' })}${emptyState({ ic: 'video', title: 'Vidéo introuvable' })}` };
    const masked = contentMasked(v, ctx.prefs, ctx.session);
    return {
      title: masked ? v.maskedTitle : v.title,
      nav: 'videos',
      body: h`${detailBar(ctx, { back: '#/videos', actions: bookmarkBtn('videos', v.id, ctx, masked ? v.maskedTitle : v.title) })}
      ${masked
        ? h`<h1 tabindex="-1" class="article-title">${v.maskedTitle}</h1>${maskedCard(v, ctx)}`
        : h`<div class="player" role="region" aria-label="Lecteur vidéo de démonstration">
            <span class="media media-video">${art(v.art)}</span>
            <div class="player-overlay"><button class="play-ring big" data-action="video-play" data-k="video-play" aria-label="Lire la vidéo">${icon('play', { size: 40 })}</button>
            <span class="duration">${v.duration}</span></div>
          </div>
          <p class="player-note" role="note">${icon('info', { size: 18 })}Lecteur de démonstration : aucune vidéo réelle n’est intégrée.</p>
          <span class="badge badge-dark">${v.kind === 'officielle' ? 'Officiel · Démo' : 'Amateur · Démo'}</span>
          <h1 tabindex="-1" class="article-title">${v.title}</h1>
          <p class="meta">${v.source} · ${shortDateTime(v.publishedAt, COUNTRY[ctx.prefs.country].tz)} · ${v.duration}</p>`}
      ${demoNote('Vidéo fictive · Les médias seront intégrés uniquement avec des droits établis')}`,
    };
  },
  actions: {
    'video-play': (el, ctx) => ctx.toast('Démonstration : la lecture vidéo n’est pas disponible dans ce prototype.'),
  },
};
