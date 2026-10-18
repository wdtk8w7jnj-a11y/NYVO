// Fiches équipe, compétition et joueur (aperçu de démonstration).
import { h } from '../ui/html.js';
import { icon } from '../ui/icons.js';
import { crest } from '../ui/crest.js';
import { detailBar, emptyState, demoNote, matchRow, switchControl } from '../ui/components.js';
import { COMPETITION, PLAYER, TEAM, genderLabel } from '../data/catalog.js';
import { MATCHES } from '../data/matches.js';
import { byKickoff } from '../domain/matchList.js';

function followBtn(kind, id, ctx, name) {
  const on = ctx.prefs.follows[kind].includes(id);
  return h`<button class="btn ${on ? 'btn-outline' : 'btn-primary'}" data-action="toggle-follow" data-kind="${kind}" data-id="${id}" aria-pressed="${on}" data-k="follow-${id}">${icon('star', { size: 20, fill: on })}${on ? 'Suivi' : `Suivre ${name}`}</button>`;
}

function unavailable(sections) {
  return h`<section class="card"><h2>Bientôt dans la fiche</h2><ul class="plain-list">${sections.map((s) => h`<li>${s} : données non disponibles dans la démonstration</li>`)}</ul></section>`;
}

export const team = {
  render(ctx) {
    const t = TEAM[ctx.route.id];
    if (!t) return { title: 'Équipe introuvable', nav: 'favoris', body: h`${detailBar(ctx, { back: '#/favoris' })}${emptyState({ ic: 'shirt', title: 'Équipe introuvable' })}` };
    const matches = MATCHES.filter((m) => m.home === t.id || m.away === t.id).sort(byKickoff);
    const protectedTeam = ctx.prefs.spoiler.teams.includes(t.id);
    return {
      title: t.name,
      nav: 'favoris',
      body: h`${detailBar(ctx, { back: '#/favoris' })}
      <header class="entity-head">${crest(t.id, { size: 84 })}<h1 tabindex="-1">${t.name}</h1><p>${genderLabel(t)} · Démo</p>${followBtn('teams', t.id, ctx, t.name)}</header>
      <section><h2>Matchs</h2>${matches.length ? h`<ul class="match-list card-list">${matches.map((m) => matchRow(m, ctx))}</ul>` : h`<p class="hint">Aucune rencontre de démonstration pour cette équipe.</p>`}</section>
      <section class="card">${switchControl('Sans spoilers pour cette équipe', protectedTeam, { action: 'toggle-team-spoiler', id: t.id, k: 'team-spoiler', desc: 'Masque les scores de ses matchs, même si le mode global est désactivé.' })}</section>
      ${unavailable(['Effectif', 'Statistiques', 'Actualités dédiées', 'Saison'])}
      ${demoNote('Équipe fictive · Données de démonstration')}`,
    };
  },
};

export const competition = {
  render(ctx) {
    const c = COMPETITION[ctx.route.id];
    if (!c) return { title: 'Compétition introuvable', nav: 'favoris', body: h`${detailBar(ctx, { back: '#/favoris' })}${emptyState({ ic: 'trophy', title: 'Compétition introuvable' })}` };
    const matches = MATCHES.filter((m) => m.competition === c.id).sort(byKickoff);
    return {
      title: c.name,
      nav: 'favoris',
      body: h`${detailBar(ctx, { back: '#/favoris' })}
      <header class="entity-head"><span class="pick-icon xl">${icon('trophy', { size: 48 })}</span><h1 tabindex="-1">${c.name}</h1><p>${c.subtitle} · Démo</p>${followBtn('competitions', c.id, ctx, c.name)}</header>
      <section><h2>Matchs</h2>${matches.length ? h`<ul class="match-list card-list">${matches.map((m) => matchRow(m, ctx))}</ul>` : h`<p class="hint">Aucune rencontre de démonstration.</p>`}</section>
      <p class="hint">Le ${c.kind === 'cup' ? 'tableau' : 'classement'} est consultable depuis l’onglet Classement d’une fiche match.</p>
      ${unavailable(['Statistiques', 'Actualités dédiées', 'Saisons précédentes'])}
      ${demoNote('Compétition fictive · Données de démonstration')}`,
    };
  },
};

export const player = {
  render(ctx) {
    const p = PLAYER[ctx.route.id];
    if (!p) return { title: 'Joueur introuvable', nav: 'favoris', body: h`${detailBar(ctx, { back: '#/favoris' })}${emptyState({ ic: 'user', title: 'Joueur introuvable' })}` };
    return {
      title: p.name,
      nav: 'favoris',
      body: h`${detailBar(ctx, { back: '#/favoris' })}
      <header class="entity-head"><span class="avatar xl">${icon('user', { size: 48 })}</span><h1 tabindex="-1">${p.name}</h1><p><a href="#/equipe/${p.team}">${TEAM[p.team].name}</a> · ${p.position} · Démo</p>${followBtn('players', p.id, ctx, p.name)}</header>
      ${unavailable(['Performances', 'Matchs', 'Parcours', 'Actualités'])}
      ${demoNote('Joueur fictif · Données de démonstration')}`,
    };
  },
};
