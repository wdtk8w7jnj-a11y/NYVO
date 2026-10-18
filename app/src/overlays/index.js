// Registre des panneaux ouverts via le paramètre ?p= de l'adresse.
import { h, attr } from '../ui/html.js';
import { icon } from '../ui/icons.js';
import { flag } from '../ui/flags.js';
import { crest } from '../ui/crest.js';
import { segmented, switchControl } from '../ui/components.js';
import { CHANNELS, COMPETITIONS, COUNTRIES, COUNTRY, DEMO_DATE, PLAYERS, TEAM, TEAMS, genderLabel } from '../data/catalog.js';
import { MATCH } from '../data/matches.js';
import { matchTitle, scoreText, isMasked } from '../domain/matchState.js';
import { matchesOn } from '../domain/matchList.js';
import { addDays, longDayLabel, isValidDayKey } from '../domain/time.js';
import { normalize } from '../domain/search.js';
import { pitchSchema } from '../screens/match.js';
import watch from './watch.js';
import searchOverlay from './search.js';
import { filters, broadcaster } from './guide.js';

const country = {
  render(ctx) {
    return {
      title: 'Pays de diffusion',
      body: h`<p class="hint">Les chaînes affichées dépendent du pays. Vos favoris sont conservés. Toutes les diffusions de ce prototype sont fictives.</p>
      <fieldset class="radio-list"><legend class="sr-only">Pays de diffusion</legend>${COUNTRIES.map(
        (c) => h`<label class="radio-row ${ctx.prefs.country === c.id ? 'is-on' : ''}">${flag(c.id, { size: 34 })}<span class="radio-name">${c.name}</span>
          <input type="radio" name="sheet-country" value="${c.id}"${attr('checked', ctx.prefs.country === c.id)} data-change="pick-country" data-k="pc-${c.id}"><span class="radio-dot" aria-hidden="true"></span></label>`,
      )}</fieldset>`,
    };
  },
  actions: {
    'pick-country': (el, ctx) => {
      ctx.save((s) => {
        s.country = el.value;
      });
      ctx.closeThen(() => ctx.toast(`Pays de diffusion : ${COUNTRY[el.value].name}.`));
    },
  },
};

const settings = {
  render(ctx) {
    const p = ctx.prefs;
    const status = ctx.store.storageStatus();
    const followedTeams = p.follows.teams;
    return {
      title: 'Réglages',
      body: h`<div class="settings">
      <section><h3>Pays de diffusion</h3>
        <div class="select-flag">${flag(p.country, { size: 30 })}<select aria-label="Pays de diffusion" data-change="set-country" data-k="set-country">${COUNTRIES.map((c) => h`<option value="${c.id}"${attr('selected', c.id === p.country)}>${c.name}</option>`)}</select>${icon('chevron-down', { size: 20 })}</div>
        <p class="small">Fuseau : ${COUNTRY[p.country].tz}</p></section>
      <section><h3>Langue</h3>
        ${segmented([['fr', 'Français'], ['en', 'English · bientôt']], 'fr', { action: 'noop-lang', label: 'Langue de l’application' })}
        <p class="small">L’interface anglaise n’est pas encore disponible.</p></section>
      <section id="sans-spoilers"><h3>Sans spoilers</h3>
        ${switchControl('Masquer les résultats partout', p.spoiler.global, { action: 'toggle-spoiler', k: 'set-spoiler', desc: 'Scores, événements, statistiques, classements et contenus associés. Horaires et chaînes restent visibles.' })}
        <p class="small">Par équipe suivie :</p>
        ${followedTeams.length
          ? followedTeams.map((id) => switchControl(`${TEAM[id].name} · ${TEAM[id].gender === 'F' ? 'féminine' : 'masculine'}`, p.spoiler.teams.includes(id), { action: 'toggle-team-spoiler', k: `ts-${id}`, id }))
          : h`<p class="small">Suivez une équipe pour la protéger individuellement.</p>`}
        <p class="small">Une rencontre révélée le reste jusqu’à la fermeture de l’application.</p></section>
      <section><h3>Mes accès</h3><p class="small">Facultatif. Services et offres déclarés pour ${COUNTRY[p.country].name}, sans identifiant ni abonnement.</p>
        <a class="btn btn-ghost btn-sm" href="#/acces" data-k="set-access">Gérer mes services</a></section>
      <section><h3>Alertes</h3><p class="small">Non disponibles dans ce prototype : aucune notification n’est envoyée.</p>
        <button class="btn btn-ghost btn-sm" data-action="open-sub" data-overlay="alertes" data-k="set-alerts">En savoir plus</button></section>
      <section><h3>Compte</h3><p class="small">Facultatif. Non disponible dans ce prototype : vos préférences restent sur cet appareil.</p></section>
      <section><h3>Données de l’appareil</h3>
        <p class="small">${status === 'ok' ? 'Préférences enregistrées dans ce navigateur.' : 'Stockage local indisponible : vos choix seront perdus à la fermeture.'}</p>
        <div class="btn-row"><button class="btn btn-ghost btn-sm" data-action="restart-onboarding" data-k="set-restart">Revoir le premier lancement</button>
        <button class="btn btn-ghost btn-sm danger" data-action="open-sub" data-overlay="effacer" data-k="set-reset">Effacer mes préférences</button></div></section>
      <section><h3>À propos</h3><p class="small">NYVO · Prototype V0.4. Données, chaînes, programmes, offres, actualités et vidéos fictives. Aucune API, aucun direct réel, aucune lecture vidéo ni notification.</p></section>
      </div>`,
    };
  },
  actions: {
    'noop-lang': (el, ctx) => {
      if (el.dataset.value === 'en') ctx.toast('L’interface anglaise n’est pas encore disponible.');
    },
    'open-sub': (el, ctx) => ctx.router.go(replaceOverlay(ctx, el.dataset.overlay), { replace: true }),
    'restart-onboarding': (el, ctx) => {
      ctx.session.onboard.query = '';
      ctx.closeThen(() => ctx.router.go('#/bienvenue'));
    },
  },
};

function replaceOverlay(ctx, name) {
  const r = ctx.route;
  const qs = new URLSearchParams({ ...r.query, p: name }).toString();
  return `#/${r.path}?${qs}`;
}

const resetConfirm = {
  render() {
    return {
      title: 'Effacer mes préférences ?',
      body: h`<p>Pays, favoris, éléments enregistrés, accès déclarés et historique de recherche seront supprimés de cet appareil.</p>
        <div class="btn-row"><button class="btn btn-ghost" data-action="close" data-k="reset-cancel" autofocus>Annuler</button><button class="btn btn-primary" data-action="confirm-reset" data-k="reset-ok">Effacer</button></div>`,
    };
  },
  actions: {
    'confirm-reset': (el, ctx) => {
      const ok = ctx.store.reset();
      ctx.session.revealed.clear();
      ctx.closeThen(() => {
        ctx.router.go('#/bienvenue', { replace: true });
        ctx.toast(ok ? 'Préférences effacées.' : 'Effacement impossible : stockage indisponible.');
      });
    },
  },
};

const date = {
  render(ctx) {
    const days = [-2, -1, 0, 1, 2, 3, 4].map((n) => addDays(DEMO_DATE, n));
    return {
      title: 'Choisir une date',
      body: h`<ul class="day-list">${days.map((d) => {
        const n = matchesOn(d, ctx.prefs.country).length;
        return h`<li><button class="day-item ${d === ctx.session.day ? 'is-on' : ''}" aria-pressed="${d === ctx.session.day}" data-action="pick-day" data-value="${d}" data-k="day-${d}">
          <span>${longDayLabel(d)}${d === DEMO_DATE ? ' · Aujourd’hui (démo)' : ''}</span><small>${n ? `${n} rencontre${n > 1 ? 's' : ''}` : 'Aucune rencontre'}</small></button></li>`;
      })}</ul>
      <label class="field-label" for="date-input">Autre date</label>
      <input id="date-input" class="input" type="date" value="${ctx.session.day}" data-change="pick-day-input" data-k="date-input">`,
    };
  },
  actions: {
    'pick-day': (el, ctx) => pickDay(el.dataset.value, ctx),
    'pick-day-input': (el, ctx) => isValidDayKey(el.value) && pickDay(el.value, ctx),
  },
};

function pickDay(day, ctx) {
  ctx.session.day = day;
  ctx.closeThen(() => ctx.router.setQuery({ date: day }));
}

const addFavorite = {
  render(ctx) {
    const st = (ctx.session.addFav ||= { tab: 'teams', query: '' });
    const q = normalize(st.query);
    const ok = (name, aliases = []) => !q || normalize(name).includes(q) || aliases.some((a) => normalize(a) === q);
    const lists = {
      teams: TEAMS.filter((t) => ok(t.name, t.aliases)).map((t) => ({ id: t.id, name: t.name, sub: genderLabel(t), lead: crest(t.id, { size: 36 }) })),
      competitions: COMPETITIONS.filter((c) => ok(c.name, c.aliases)).map((c) => ({ id: c.id, name: c.name, sub: c.subtitle, lead: h`<span class="pick-icon">${icon('trophy', { size: 26 })}</span>` })),
      players: PLAYERS.filter((p) => ok(p.name, p.aliases)).map((p) => ({ id: p.id, name: p.name, sub: `${TEAM[p.team].name} · ${p.position}`, lead: h`<span class="pick-icon">${icon('user', { size: 26 })}</span>` })),
    };
    const list = lists[st.tab];
    return {
      title: 'Ajouter des favoris',
      body: h`<label class="search-field">${icon('search')}<span class="sr-only">Rechercher</span><input type="search" autocomplete="off" placeholder="Rechercher" value="${st.query}" data-input="add-search" data-k="add-search"></label>
      ${segmented([['teams', 'Équipes'], ['competitions', 'Compétitions'], ['players', 'Joueurs']], st.tab, { action: 'add-tab', label: 'Type de favori' })}
      <ul class="pick-list">${list.length
        ? list.map((it) => {
            const on = ctx.prefs.follows[st.tab].includes(it.id);
            return h`<li><button class="pick-row ${on ? 'is-on' : ''}" aria-pressed="${on}" data-action="toggle-follow" data-quiet data-kind="${st.tab}" data-id="${it.id}" data-k="add-${it.id}">${it.lead}<span class="pick-text"><b>${it.name}</b><small>${it.sub}</small></span><span class="check" aria-hidden="true">${on ? icon('check', { size: 18 }) : ''}</span></button></li>`;
          })
        : h`<li class="empty-inline">Aucun résultat dans le catalogue de démonstration.</li>`}</ul>`,
    };
  },
  actions: {
    'add-tab': (el, ctx) => {
      ctx.session.addFav.tab = el.dataset.value;
      ctx.refresh();
    },
    'add-search': (el, ctx) => {
      ctx.session.addFav.query = el.value;
      ctx.refresh();
    },
  },
};

const alerts = {
  render(ctx) {
    const m = ctx.route.name === 'match' ? MATCH[ctx.route.id] : null;
    const target = ctx.route.query.ref ? (TEAM[ctx.route.query.ref]?.name || ctx.route.query.ref) : m ? matchTitle(m) : null;
    return {
      title: target ? `Alertes · ${target}` : 'Alertes',
      body: h`<div class="state-card in-sheet">${icon('bell', { size: 30 })}<h3>Alertes non disponibles dans ce prototype</h3>
        <p>Aucune notification n’est envoyée et aucune autorisation n’est demandée.</p>
        <p class="small">Dans l’application, l’autorisation sera demandée au moment de votre première alerte, pas au démarrage.</p></div>
        <h3>Prévu ensuite</h3>
        <ul class="plain-list"><li>Rappels avant le coup d’envoi</li><li>Événements du match</li><li>Changements de chaîne ou d’horaire</li><li>Informations importantes de vos favoris</li><li>Profils discrets et horaires silencieux</li><li>Mode sans spoilers jusque dans les notifications</li></ul>`,
    };
  },
};

const account = {
  render() {
    return {
      title: 'Compte facultatif',
      body: h`<div class="state-card in-sheet">${icon('cloud', { size: 30 })}<h3>Synchronisation non disponible</h3>
        <p>Le compte n’est pas encore proposé dans ce prototype. Vos favoris et réglages restent enregistrés sur cet appareil, sans inscription.</p>
        <p class="small">Plus tard, un compte facultatif permettra de les retrouver sur vos autres appareils sans perdre vos préférences actuelles.</p></div>`,
    };
  },
};

const why = {
  render(ctx) {
    const n = ctx.prefs.follows.teams.length + ctx.prefs.follows.competitions.length;
    return {
      title: 'Pourquoi ces actualités ?',
      body: h`<p>« Pour vous » privilégie les contenus liés à vos équipes et compétitions suivies (${n} favori${n > 1 ? 's' : ''}). Sans favori, le fil général est affiché.</p>
        <p>La sélection est calculée sur cet appareil, à partir du catalogue de démonstration. Aucune donnée n’est envoyée.</p>
        <p class="small">Chaque contenu indique sa source et sa nature : officiel, information rapportée ou rumeur.</p>`,
    };
  },
};

const moment = {
  render(ctx) {
    const m = MATCH[ctx.route.id];
    const minute = Number(ctx.route.query.ref);
    const e = m?.events?.find((x) => x.minute === minute && x.type === 'goal');
    if (!m || !e) return { title: 'Moment fort', body: h`<p>Moment introuvable.</p>` };
    if (isMasked(m, ctx.prefs, ctx.session)) {
      return { title: 'Moment fort', body: h`<p>Ce contenu est masqué par le mode sans spoilers.</p><button class="btn btn-primary" data-action="reveal-match" data-id="${m.id}" data-k="mom-reveal">Révéler ce match</button>` };
    }
    return {
      title: `But à ${e.minute}′`,
      body: h`<div class="moment-detail">
        ${pitchSchema(e.team === m.home ? 'right' : 'left', { label: `Schéma : surface de réparation où le but a été marqué, côté ${e.team === m.home ? 'droit' : 'gauche'}` })}
        <p class="legend-line"><span class="swatch"></span>Surface concernée (schéma, sans positions de joueurs)</p>
        <h3>Récit</h3>
        <p>${e.minute}′ · But de ${e.player} pour ${TEAM[e.team].name}. Score : ${scoreText(e.score)}.</p>
        <ul class="plain-list"><li>Passeur : non communiqué</li><li>Position du tir : non disponible</li><li>Vidéo autorisée : aucune dans la démonstration</li></ul>
        <p class="small">Nature : schéma de démonstration. Aucun déplacement n’est reconstitué ; une animation ne sera proposée qu’avec des données de position vérifiées. Source : données fictives.</p>
      </div>`,
    };
  },
};

export const OVERLAYS = {
  diffusion: watch,
  recherche: searchOverlay,
  pays: country,
  reglages: settings,
  effacer: resetConfirm,
  date,
  ajouter: addFavorite,
  alertes: alerts,
  compte: account,
  pourquoi: why,
  moment,
  filtres: filters,
  diffuseur: broadcaster,
};
