// Premier lancement facultatif : pays et langue (1/2), favoris (2/2). Planche 08.
import { h, attr } from '../ui/html.js';
import { icon } from '../ui/icons.js';
import { flag } from '../ui/flags.js';
import { crest } from '../ui/crest.js';
import { segmented } from '../ui/components.js';
import { COMPETITION, COMPETITIONS, COUNTRIES, ONBOARDING_TEAMS, TEAM, TEAMS, genderLabel } from '../data/catalog.js';
import { normalize } from '../domain/search.js';
import { build } from '../router.js';

function header(step, { back } = {}) {
  return h`<div class="ob-bar">
    ${back ? h`<button class="icon-btn" data-action="ob-back" aria-label="Revenir au choix du pays" data-k="ob-back">${icon('arrow-left')}</button>` : ''}
    <span class="logo">NYVO</span>
    <span class="ob-step" aria-label="Étape ${step} sur 2">${step} / 2</span>
    <button class="text-btn ruby" data-action="ob-later" data-k="ob-later">Plus tard</button>
  </div>`;
}

function stepCountry(ctx) {
  const p = ctx.prefs;
  return h`${header(1)}
  <div class="ob-content">
    <h1 tabindex="-1" class="ob-title">Bienvenue sur NYVO</h1>
    <p class="ob-lead">Choisis ton pays de diffusion.</p>
    <p class="ob-text">Les chaînes proposées dépendent du pays où tu regardes les matchs.</p>
    <fieldset class="radio-list">
      <legend class="sr-only">Pays de diffusion</legend>
      ${COUNTRIES.map(
        (c) => h`<label class="radio-row ${p.country === c.id ? 'is-on' : ''}">
          ${flag(c.id, { size: 34 })}<span class="radio-name">${c.name}</span>
          <input type="radio" name="country" value="${c.id}"${attr('checked', p.country === c.id)} data-change="set-country" data-k="ob-country-${c.id}"><span class="radio-dot" aria-hidden="true"></span>
        </label>`,
      )}
    </fieldset>
    <fieldset class="lang-box">
      <legend>${icon('globe', { size: 22 })}<span>Langue de l’application</span></legend>
      <div class="segmented">
        <label class="seg is-on"><input type="radio" name="lang" value="fr" checked class="sr-only" data-k="ob-lang-fr">Français</label>
        <label class="seg is-disabled"><input type="radio" name="lang" value="en" disabled class="sr-only">English<small>bientôt</small></label>
      </div>
      <p class="hint">L’interface anglaise n’est pas encore disponible dans ce prototype.</p>
    </fieldset>
    <p class="hint center">Ces choix restent modifiables dans les réglages.</p>
    <button class="btn btn-primary btn-block" data-action="ob-next" data-k="ob-next">Continuer</button>
    <p class="hint center">Sans inscription obligatoire.</p>
  </div>`;
}

function stepFavorites(ctx) {
  const p = ctx.prefs;
  const ob = ctx.session.onboard;
  const q = normalize(ob.query);
  const match = (name, aliases = []) => !q || normalize(name).includes(q) || aliases.some((a) => normalize(a) === q);
  const teams = (q ? TEAMS : ONBOARDING_TEAMS.map((id) => TEAM[id])).filter((t) => match(t.name, t.aliases));
  const comps = COMPETITIONS.filter((c) => match(c.name, c.aliases));
  const isTeams = ob.tab === 'equipes';
  const list = isTeams ? teams : comps;
  const count = p.follows.teams.length + p.follows.competitions.length;
  const otherSelected = isTeams
    ? p.follows.competitions.map((id) => ({ kind: 'competitions', id, name: COMPETITION[id].name, ic: 'trophy' }))
    : p.follows.teams.map((id) => ({ kind: 'teams', id, name: `${TEAM[id].name} · ${TEAM[id].gender === 'F' ? 'F' : 'M'}`, ic: 'shirt' }));
  return h`${header(2, { back: true })}
  <div class="ob-content">
    <h1 tabindex="-1" class="ob-title">Ton football, tes favoris</h1>
    <p class="ob-lead">Choisis des équipes et des compétitions.</p>
    <label class="search-field">${icon('search')}<span class="sr-only">Rechercher une équipe ou une compétition</span>
      <input type="search" placeholder="Équipe ou compétition" value="${ob.query}" data-input="ob-search" data-k="ob-search" autocomplete="off"></label>
    ${segmented([['equipes', 'Équipes'], ['competitions', 'Compétitions']], ob.tab, { action: 'ob-tab', label: 'Type de favori', cls: 'seg-lg' })}
    <p class="hint" id="ob-list-label">${q ? `Résultats pour « ${ob.query} »` : 'Exemples de démonstration'}</p>
    <ul class="pick-list" aria-labelledby="ob-list-label">
      ${list.length
        ? list.map((item) => {
            const kind = isTeams ? 'teams' : 'competitions';
            const on = p.follows[kind].includes(item.id);
            return h`<li><label class="pick-row ${on ? 'is-on' : ''}">
              ${isTeams ? crest(item.id, { size: 44 }) : h`<span class="pick-icon">${icon('trophy', { size: 30 })}</span>`}
              <span class="pick-text"><b>${item.name}</b><small>${isTeams ? genderLabel(item) : item.subtitle}</small></span>
              <input type="checkbox" class="sr-only"${attr('checked', on)} data-change="ob-follow" data-kind="${kind}" data-id="${item.id}" data-k="ob-pick-${item.id}">
              <span class="check" aria-hidden="true">${on ? icon('check', { size: 18 }) : ''}</span></label></li>`;
          })
        : h`<li class="empty-inline">Aucun résultat dans le catalogue de démonstration.</li>`}
    </ul>
    ${otherSelected.length
      ? h`<p class="hint">${isTeams ? 'Compétition sélectionnée' : 'Équipe sélectionnée'}${otherSelected.length > 1 ? 's' : ''}</p>
        <div class="tag-list">${otherSelected.map(
          (o) => h`<button class="tag" data-action="toggle-follow" data-quiet data-kind="${o.kind}" data-id="${o.id}" aria-label="Retirer ${o.name}" data-k="ob-tag-${o.id}">${icon(o.ic, { size: 18 })}${o.name}${icon('close', { size: 16 })}</button>`,
        )}</div>`
      : ''}
    <div class="ob-count">${icon('star', { size: 24 })}<div><b>${count} favori${count > 1 ? 's' : ''} sélectionné${count > 1 ? 's' : ''}</b><small>Tu pourras les modifier dans Mon espace.</small></div></div>
    <button class="btn btn-primary btn-block" data-action="ob-done" data-k="ob-done">Accéder à l’accueil</button>
    <p class="hint center">Les alertes se règlent séparément.</p>
  </div>`;
}

export default {
  render(ctx) {
    const step = ctx.route.query.etape === '2' ? 2 : 1;
    return { title: 'Bienvenue', nav: null, body: h`<div class="onboarding">${step === 1 ? stepCountry(ctx) : stepFavorites(ctx)}</div>` };
  },
  actions: {
    'ob-next': (el, ctx) => ctx.router.go(build('bienvenue', { etape: 2 })),
    'ob-back': (el, ctx) => ctx.router.back(build('bienvenue')),
    'ob-later': (el, ctx) => finish(ctx),
    'ob-done': (el, ctx) => finish(ctx),
    'ob-tab': (el, ctx) => {
      ctx.session.onboard.tab = el.dataset.value;
      ctx.refresh();
    },
    'ob-search': (el, ctx) => {
      ctx.session.onboard.query = el.value;
      ctx.refresh();
    },
    'ob-follow': (el, ctx) => {
      const { kind, id } = el.dataset;
      ctx.save((s) => {
        const list = s.follows[kind];
        const i = list.indexOf(id);
        if (i >= 0) list.splice(i, 1);
        else list.push(id);
      });
    },
  },
};

function finish(ctx) {
  ctx.save((s) => {
    s.onboarded = true;
  });
  ctx.session.onboard.query = '';
  ctx.router.go('#/accueil', { replace: true });
}
