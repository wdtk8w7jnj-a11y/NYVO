// Cartes d'actualités et de vidéos (planches 01, 07, 09).
import { h } from './html.js';
import { icon } from './icons.js';
import { crest } from './crest.js';
import { art } from './art.js';
import { bookmarkBtn } from './components.js';
import { NATURE_LABEL } from '../data/content.js';
import { COUNTRY } from '../data/catalog.js';
import { contentMasked } from '../domain/matchState.js';
import { relative, shortDate, shortDateTime } from '../domain/time.js';

const tzOf = (ctx) => COUNTRY[ctx.prefs.country].tz;

export function natureBadge(a) {
  const cls = { officiel: 'badge-dark', rapporte: 'badge-outline', rumeur: 'badge-rumor' }[a.nature];
  return h`<span class="badge ${cls}">${NATURE_LABEL[a.nature]}</span>`;
}

export function maskedCard(item, ctx) {
  return h`<div class="masked-card">
    ${icon('eye-off', { size: 30 })}
    <div><b>Sans spoilers : contenu masqué</b><small>Affichez ce contenu à votre demande.</small></div>
    <button class="btn btn-outline btn-sm" data-action="reveal-content" data-id="${item.id}" data-k="reveal-${item.id}">Révéler</button>
  </div>`;
}

export function articleFeature(a, ctx, { relativeTime = false } = {}) {
  if (contentMasked(a, ctx.prefs, ctx.session)) return maskedCard(a, ctx);
  const when = relativeTime ? relative(a.publishedAt, tzOf(ctx)) : shortDateTime(a.publishedAt, tzOf(ctx));
  return h`<article class="news-feature">
    <a href="#/article/${a.id}" class="news-feature-link" data-k="art-${a.id}">
      <span class="media">${art(a.art)}</span>
      <span class="news-feature-body">
        <span class="news-feature-badge">${natureBadge(a)}</span>
        <span class="news-feature-title">${a.title}</span>
        <span class="meta">${a.teams[0] && a.nature === 'officiel' ? crest(a.teams[0], { size: 22 }) : ''}${a.source} · ${when}</span>
      </span>
    </a>
    ${bookmarkBtn('articles', a.id, ctx, a.title)}
  </article>`;
}

// Variante accueil : image puis titre sous l'image (planche 01).
export function articleHome(a, ctx) {
  if (contentMasked(a, ctx.prefs, ctx.session)) return maskedCard(a, ctx);
  return h`<article class="news-home"><a href="#/article/${a.id}" data-k="home-art-${a.id}">
    <span class="media media-wide">${art(a.art)}</span>
    <span class="news-home-title">${a.title}</span>
    <span class="meta">${a.source} · ${relative(a.publishedAt, tzOf(ctx))}</span></a></article>`;
}

export function articleRow(a, ctx) {
  if (contentMasked(a, ctx.prefs, ctx.session)) return h`<li>${maskedCard(a, ctx)}</li>`;
  return h`<li class="news-row">
    <a href="#/article/${a.id}" data-k="art-${a.id}">
      <span class="media media-thumb">${art(a.art)}</span>
      <span class="news-row-body">
        ${natureBadge(a)}
        <span class="news-row-title">${a.title}</span>
        ${a.unconfirmed ? h`<span class="unconfirmed">Non confirmé</span>` : ''}
        <span class="meta">${a.source} · ${shortDateTime(a.publishedAt, tzOf(ctx))}</span>
      </span>
      ${icon('chevron-right', { size: 20, cls: 'row-chevron' })}
    </a>
    ${bookmarkBtn('articles', a.id, ctx, a.title)}
  </li>`;
}

export function videoCard(v, ctx) {
  if (contentMasked(v, ctx.prefs, ctx.session)) return h`<li>${maskedCard(v, ctx)}</li>`;
  const label = v.kind === 'officielle' ? 'Officiel · Démo' : 'Amateur · Démo';
  return h`<li class="video-card">
    <a href="#/video/${v.id}" data-k="vid-${v.id}">
      <span class="media media-video">${art(v.art)}
        <span class="badge badge-dark media-badge">${label}</span>
        <span class="play-ring" aria-hidden="true">${icon('play', { size: 30 })}</span>
        <span class="duration"><span class="sr-only">Durée </span>${v.duration}</span>
      </span>
      <span class="video-body">
        <span class="video-title">${v.title}</span>
        <span class="meta">${v.sourceTeam ? crest(v.sourceTeam, { size: 22 }) : h`<span class="avatar">${icon('user', { size: 16 })}</span>`}${v.source} · ${shortDate(v.publishedAt, tzOf(ctx))}</span>
      </span>
    </a>
    <div class="video-actions">${bookmarkBtn('videos', v.id, ctx, v.title)}${icon('chevron-right', { size: 20, cls: 'row-chevron' })}</div>
  </li>`;
}
