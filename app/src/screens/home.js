// Accueil (planche 01) : Mes matchs, Programme TV, Actualités, Vidéos.
import { h } from '../ui/html.js';
import { icon } from '../ui/icons.js';
import { topBar, sectionHead, linkMore, matchHero, demoNote } from '../ui/components.js';
import { articleHome, videoCard } from '../ui/contentCards.js';
import { COUNTRY } from '../data/catalog.js';
import { homeHighlights } from '../domain/matchList.js';
import { homeProgramme, KIND_LABEL } from '../domain/tvGuide.js';
import { matchTitle } from '../domain/matchState.js';
import { newsFeed, videoFeed, hasFavorites } from '../domain/feeds.js';
import { time } from '../domain/time.js';

const KIND_ICON = { pre: 'play', match: 'tv', post: 'clock' };

function programmeCard(ctx) {
  const prog = homeProgramme(ctx.session.day, ctx.prefs, ctx.session);
  const country = COUNTRY[ctx.prefs.country];
  if (!prog) {
    return h`<div class="card programme-card is-empty">${icon('tv', { size: 26 })}<p>Aucun programme confirmé pour ${country.name} ce jour-là dans la démonstration.</p></div>`;
  }
  const { match, broadcast } = prog;
  const provisional = broadcast.schedule.some((s) => s.provisional);
  return h`<div class="card programme-card">
    <a class="programme-head" href="#/match/${match.id}" data-k="prog-${match.id}"><b>${matchTitle(match)}</b><span>${broadcast.options[0].channelName}</span></a>
    <ul class="programme-list">${broadcast.schedule.map(
      (s) => h`<li><span class="p-time">${time(s.at, country.tz)}</span><span class="p-icon ${s.kind}">${icon(KIND_ICON[s.kind], { size: s.kind === 'pre' ? 16 : 24 })}</span><span class="p-label">${KIND_LABEL[s.kind]}${s.provisional ? h`<small> · prévisionnel</small>` : ''}</span><span class="p-channel">${s.channelName}</span></li>`,
    )}</ul>
    ${provisional ? h`<p class="hint">Horaire prévisionnel signalé.</p>` : ''}
  </div>`;
}

export default {
  render(ctx) {
    const { followed, featured } = homeHighlights(ctx.session.day, ctx.prefs);
    const favs = hasFavorites(ctx.prefs) || ctx.prefs.saved.matches.length > 0;
    const others = followed.filter((m) => m !== featured);
    const article = newsFeed({ feed: 'pour-vous' }, ctx.prefs)[0];
    const video = videoFeed('pour-vous', ctx.prefs)[0];
    return {
      title: 'Accueil',
      nav: 'accueil',
      body: h`${topBar(ctx)}
      <div class="page-title"><span class="demo-badge">Démo</span><h1 tabindex="-1" class="sr-only">Accueil</h1></div>
      <div class="home-grid">
        <div class="home-col">
          <section aria-labelledby="h-mes-matchs">
            ${sectionHead(h`<span id="h-mes-matchs">${followed.length ? 'Mes matchs' : 'À la une'}</span>`, linkMore('#/matchs', 'Tous les matchs', 'home-all-matches'))}
            ${featured ? matchHero(featured, ctx) : h`<div class="card">Aucune rencontre de démonstration aujourd’hui.</div>`}
            ${others.length ? h`<a class="more-followed" href="#/matchs" data-k="home-more">${followed.length - 1} autre${followed.length > 2 ? 's' : ''} rencontre${followed.length > 2 ? 's' : ''} suivie${followed.length > 2 ? 's' : ''} aujourd’hui${icon('chevron-right', { size: 16 })}</a>` : ''}
            ${!favs ? h`<button class="invite" data-action="open" data-overlay="ajouter" data-k="home-add-fav">${icon('star', { size: 22 })}<span><b>Composez « Mes matchs »</b><small>Suivez des équipes ou des compétitions, sans compte.</small></span>${icon('chevron-right', { size: 20 })}</button>` : ''}
          </section>
          <section aria-labelledby="h-programme">
            ${sectionHead(h`<span id="h-programme">Programme TV</span>`, linkMore('#/programme', 'Voir tout', 'home-tv'))}
            ${programmeCard(ctx)}
          </section>
        </div>
        <div class="home-col">
          <section aria-labelledby="h-actu">
            ${sectionHead(h`<span id="h-actu">Actualités</span>`, linkMore('#/actualites', 'Voir tout', 'home-news'))}
            ${article ? articleHome(article, ctx) : ''}
          </section>
          <section aria-labelledby="h-videos">
            ${sectionHead(h`<span id="h-videos">Vidéos</span>`, linkMore('#/videos', 'Voir tout', 'home-videos'))}
            ${video ? h`<ul class="video-list">${videoCard(video, ctx)}</ul>` : ''}
          </section>
        </div>
      </div>
      ${demoNote('Données fictives · Direct simulé · Contenus de démonstration')}`,
    };
  },
};
