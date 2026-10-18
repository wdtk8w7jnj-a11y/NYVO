import { h } from '../ui/html.js';
import { topBar, emptyState } from '../ui/components.js';
import onboarding from './onboarding.js';
import home from './home.js';
import matches from './matches.js';
import match from './match.js';
import tvguide from './tvguide.js';
import favorites from './favorites.js';
import { news, videos, article, video } from './content.js';
import { team, competition, player } from './entity.js';

const notFound = {
  render(ctx) {
    return {
      title: 'Page introuvable',
      nav: 'accueil',
      body: h`${topBar(ctx)}<h1 tabindex="-1" class="sr-only">Page introuvable</h1>${emptyState({ ic: 'info', title: 'Cette page n’existe pas.', action: h`<a class="btn btn-outline" href="#/accueil">Revenir à l’accueil</a>` })}`,
    };
  },
};

export const SCREENS = {
  bienvenue: onboarding,
  accueil: home,
  matchs: matches,
  match,
  programme: tvguide,
  actualites: news,
  article,
  videos,
  video,
  favoris: favorites,
  equipe: team,
  competition,
  joueur: player,
  introuvable: notFound,
  racine: home,
};
