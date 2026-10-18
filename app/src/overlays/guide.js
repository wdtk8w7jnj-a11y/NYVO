// Panneaux du Programme TV : filtres détaillés (maquette 04) et accès au diffuseur (08, 09).
import { h, attr } from '../ui/html.js';
import { icon } from '../ui/icons.js';
import { switchControl } from '../ui/components.js';
import { COMPETITIONS, COUNTRY, CHANNEL } from '../data/catalog.js';
import { MATCH } from '../data/matches.js';
import { SERVICE } from '../data/access.js';
import { TYPES, DEFAULT_FILTERS, parseFilters, filtersToQuery, typeOf, TYPE_LABEL } from '../domain/tvGuide.js';
import { matchTitle, programmesFor } from '../domain/matchState.js';
import { declared } from '../domain/access.js';
import { dayLabel, time } from '../domain/time.js';

const demo = h`<span class="demo-badge sm">Démo</span>`;

function draftOf(ctx) {
  // Ouverture par lien direct : le brouillon part de l'état appliqué.
  if (!ctx.session.guideDraft) ctx.session.guideDraft = structuredClone(parseFilters(ctx.route.query));
  return ctx.session.guideDraft;
}

export const filters = {
  render(ctx) {
    const d = draftOf(ctx);
    const country = COUNTRY[ctx.prefs.country];
    const section = ctx.session.guideSection;
    const compsOpen = ctx.session.guideCompsOpen;
    const compLabel = d.competitions.length ? COMPETITIONS.filter((c) => d.competitions.includes(c.id)).map((c) => c.name).join(', ') : 'Toutes les compétitions';
    return {
      title: h`Filtres du programme ${demo}`,
      body: h`<div class="filters">
        <p class="filters-context">${icon('calendar', { size: 22 })}<span><b>${country.name} · ${dayLabel(ctx.session.day).replace(' · Démo', '')}</b> <span class="ruby-soft">· ${country.tz}</span><small>Données fictives</small></span></p>
        <section class="f-sec">${icon('star', { size: 24 })}<div class="f-body">
          ${switchControl('Favoris', d.favorites, { action: 'fd-fav', k: 'fd-fav', desc: 'Équipes et compétitions suivies.' })}</div></section>
        <section class="f-sec">${icon('trophy', { size: 24 })}<div class="f-body"><h3 id="fd-comp-h">Compétitions</h3>
          <button class="f-select" aria-expanded="${compsOpen}" aria-controls="fd-comp-list" data-action="fd-comps-toggle" data-k="fd-comps"${attr('autofocus', section === 'comp')}>${icon('trophy', { size: 20 })}<span>${compLabel}</span>${icon(compsOpen ? 'chevron-up' : 'chevron-right', { size: 18 })}</button>
          <fieldset id="fd-comp-list"${compsOpen ? '' : h` hidden`}><legend class="sr-only">Compétitions (plusieurs choix possibles)</legend>
            ${COMPETITIONS.map((c) => h`<label class="check-line"><input type="checkbox" data-change="fd-comp" value="${c.id}"${attr('checked', d.competitions.includes(c.id))} data-k="fd-comp-${c.id}"><span>${c.name}</span></label>`)}
            <p class="small">Aucune case cochée : toutes les compétitions.</p></fieldset></div></section>
        <section class="f-sec">${icon('lock', { size: 22 })}<div class="f-body"><h3 id="fd-acc-h">Accès</h3>
          <div class="f-grid three" role="radiogroup" aria-labelledby="fd-acc-h">${[['tous', 'Tous'], ['gratuit', 'Gratuit'], ['payant', 'Payant']].map(
            ([v, t]) => h`<button role="radio" aria-checked="${d.access === v}" class="f-opt ${d.access === v ? 'is-on' : ''}" data-action="fd-access" data-value="${v}" data-k="fd-acc-${v}"${attr('autofocus', section === 'acces' && d.access === v)}>${d.access === v ? icon('check', { size: 18 }) : ''}${t}</button>`,
          )}</div></div></section>
        <section class="f-sec">${icon('video', { size: 24 })}<div class="f-body"><h3 id="fd-type-h">Type de programme</h3><p class="small">Plusieurs choix possibles.</p>
          <div class="f-grid two" role="group" aria-labelledby="fd-type-h">${TYPES.map(
            ([v, t]) => h`<button role="checkbox" aria-checked="${d.types.includes(v)}" class="f-opt ${d.types.includes(v) ? 'is-on' : ''}" data-action="fd-type" data-value="${v}" data-k="fd-type-${v}">${d.types.includes(v) ? icon('check', { size: 18 }) : ''}${t}</button>`,
          )}</div>${d.types.length ? '' : h`<p class="f-error" role="alert">Choisis au moins un type de programme.</p>`}</div></section>
        <section class="f-sec">${icon('user', { size: 24 })}<div class="f-body">
          ${switchControl('Mes accès', d.mine, { action: 'fd-mine', k: 'fd-mine', desc: 'Afficher uniquement les chaînes incluses dans tes offres déclarées et vérifiées.' })}
          <a class="f-select" href="#/acces" data-k="fd-config">${icon('settings', { size: 20 })}<span>Configurer mes services</span>${icon('chevron-right', { size: 18 })}</a></div></section>
        <section class="f-sec">${icon('info', { size: 24 })}<div class="f-body">
          ${switchControl('Diffusions non confirmées', d.unconfirmed, { action: 'fd-nc', k: 'fd-nc', desc: 'Les conserver dans les résultats.' })}
          ${(d.mine || d.access !== 'tous') && d.unconfirmed ? h`<p class="small">Avec ${d.mine ? 'Mes accès' : 'un filtre Gratuit ou Payant'}, elles restent exclues : aucune chaîne n’est connue, elles ne peuvent pas être vérifiées.</p>` : ''}</div></section>
        <div class="sheet-footer"><button class="btn btn-ghost" data-action="fd-reset" data-k="fd-reset">Réinitialiser</button>
          <button class="btn btn-primary" data-action="fd-apply" data-k="fd-apply"${attr('disabled', !d.types.length)}>Appliquer</button></div>
      </div>`,
    };
  },
  actions: {
    'fd-fav': (el, ctx) => toggle(ctx, (d) => (d.favorites = !d.favorites)),
    'fd-mine': (el, ctx) => toggle(ctx, (d) => (d.mine = !d.mine)),
    'fd-nc': (el, ctx) => toggle(ctx, (d) => (d.unconfirmed = !d.unconfirmed)),
    'fd-access': (el, ctx) => toggle(ctx, (d) => (d.access = el.dataset.value)),
    'fd-type': (el, ctx) =>
      toggle(ctx, (d) => {
        const v = el.dataset.value;
        d.types = d.types.includes(v) ? d.types.filter((t) => t !== v) : TYPES.map(([t]) => t).filter((t) => t === v || d.types.includes(t));
      }),
    'fd-comp': (el, ctx) =>
      toggle(ctx, (d) => {
        d.competitions = el.checked ? [...new Set([...d.competitions, el.value])] : d.competitions.filter((c) => c !== el.value);
      }),
    'fd-comps-toggle': (el, ctx) => {
      ctx.session.guideCompsOpen = !ctx.session.guideCompsOpen;
      ctx.refresh();
    },
    'fd-reset': (el, ctx) => {
      ctx.session.guideDraft = structuredClone({ ...DEFAULT_FILTERS, types: [...DEFAULT_FILTERS.types] });
      ctx.refresh();
      ctx.toast('Filtres remis par défaut. Appuie sur Appliquer pour valider.');
    },
    'fd-apply': (el, ctx) => {
      const d = draftOf(ctx);
      if (!d.types.length) return;
      const q = filtersToQuery(d);
      ctx.closeThen(() => ctx.router.setQuery(q));
    },
  },
};

function toggle(ctx, fn) {
  fn(draftOf(ctx));
  ctx.refresh();
}

// ---------- Accès au diffuseur ----------

const host = (url) => (url ? new URL(url).host : null);

function inclusion(item, ctx) {
  const d = declared(ctx.prefs, ctx.prefs.country);
  const service = SERVICE[item.service];
  const hit = d.verified.get(item.channel);
  if (hit) {
    return h`<div class="incl is-ok">${icon('check', { size: 24 })}<span><b>Chaîne incluse dans ton offre déclarée</b><small>${hit.label} · Correspondance simulée</small></span></div>`;
  }
  const offer = d.offers.find((o) => o.service.id === item.service);
  if (offer) return h`<p class="incl">${icon('info', { size: 20 })}<span>${item.channelName} n’est pas incluse dans ton offre déclarée (${offer.label}).</span></p>`;
  if (d.pending.some((p) => p.service.id === item.service)) {
    return h`<p class="incl">${icon('info', { size: 20 })}<span>${service.name} : offre à préciser. Inclusion non confirmée.</span></p>`;
  }
  return h`<p class="incl">${icon('info', { size: 20 })}<span>Aucune offre ${service ? service.name : ''} renseignée. <a href="#/acces" class="ruby-link" data-k="dif-access">Renseigner mes accès</a></span></p>`;
}

export const broadcaster = {
  render(ctx) {
    const country = COUNTRY[ctx.prefs.country];
    const item = programmesFor(ctx.prefs.country, ctx.session).find((p) => p.id === ctx.route.query.ref);
    if (!item) {
      return { title: h`Accès au diffuseur ${demo}`, body: h`<p>Ce programme n’est pas disponible pour ${country.name} dans la démonstration.</p>` };
    }
    const service = SERVICE[item.service];
    const type = TYPE_LABEL[typeOf(item)];
    const multi = item.matches.length > 1;
    const title = multi ? `Multiplex · ${item.matches.length} rencontres` : matchTitle(MATCH[item.matches[0]]);
    const link = item.link || {};
    const unavailable = !link.matchPage;
    const report = ctx.session.reportStep?.[item.id];
    const head = h`<div class="dif-card">${icon('ball', { size: 30 })}<span><b>${title}</b><small class="ruby-soft">${type} · ${time(item.at, country.tz)} · ${country.name}${item.provisional ? ' · horaire prévisionnel' : ''}</small>
        ${multi ? h`<ul class="dif-matches">${item.matches.map((id) => h`<li>${matchTitle(MATCH[id])}</li>`)}</ul>` : ''}</span></div>
      <div class="dif-card">${icon('tv', { size: 28 })}<span><b>${item.channelName}</b><small class="ruby-soft">Disponible sur ${service.name}</small></span></div>`;
    const accessLines = h`<p class="dif-line">${icon('lock', { size: 20 })}${item.access}${item.access === 'Payant' ? ' · Abonnement requis' : ''}</p>
      <p class="dif-line">${icon('info', { size: 20 })}Connexion et droits d’accès gérés par le diffuseur.</p>`;
    const footer = h`<p class="dif-foot">${icon('info', { size: 20 })}Mode démo : aucune ouverture réelle.</p>`;
    if (unavailable) {
      return {
        title: h`Accès au diffuseur ${demo}`,
        body: h`<div class="dif">${head}
          <div class="dif-broken"><span class="ring">${icon('link-off', { size: 34 })}</span><h3>Lien indisponible</h3>
            <p>Le lien direct vers ce match n’est pas disponible. Cela ne signifie pas que la diffusion est annulée.</p>
            ${link.site ? h`<p class="ruby-soft">Tu peux rechercher la rencontre sur le site du diffuseur.</p>` : ''}</div>
          ${link.site ? h`<div class="dif-card">${icon('globe', { size: 28 })}<span><b>Site de ${service.name}</b><small>${host(link.site)}</small><small class="ruby-soft">Adresse fictive · Démonstration</small></span></div>` : ''}
          ${accessLines}
          ${link.site ? h`<button class="btn btn-primary btn-block" data-action="dif-open" data-value="${link.site}" data-k="dif-site">Ouvrir le site officiel${icon('external', { size: 20 })}</button>` : ''}
          <button class="btn btn-ghost btn-block" data-action="dif-others" data-id="${item.matches[0]}" data-k="dif-others">Voir les autres diffusions</button>
          ${report === 'confirm'
            ? h`<div class="report-box" role="group" aria-label="Signaler le lien"><p>Simuler un signalement ? Rien n’est envoyé : aucun service ne reçoit les signalements dans ce prototype.</p>
                <div class="btn-row two"><button class="btn btn-ghost btn-sm" data-action="dif-report-cancel" data-id="${item.id}" data-k="rep-cancel">Annuler</button><button class="btn btn-outline btn-sm" data-action="dif-report-ok" data-id="${item.id}" data-k="rep-ok" autofocus>Simuler le signalement</button></div></div>`
            : report === 'done'
              ? h`<p class="report-done" role="status">${icon('check', { size: 18 })}Simulation de signalement : rien n’a été envoyé.</p>`
              : h`<button class="text-btn underline center-btn" data-action="dif-report" data-id="${item.id}" data-k="dif-report">Signaler le lien</button>`}
          ${footer}</div>`,
      };
    }
    return {
      title: h`Ouvrir chez le diffuseur ${demo}`,
      body: h`<div class="dif">${head}
        <div class="dif-card col">${icon('link', { size: 28 })}<span><b>Destination</b><small class="ruby-soft">Page du ${multi ? 'multiplex' : 'match'} chez ${service.name}</small></span>
          <div class="dif-sub">${icon('globe', { size: 24 })}<span><b>${host(link.matchPage)}</b><small class="ruby-soft">Adresse fictive · Démonstration</small></span></div></div>
        <div class="dif-card col">${icon('lock', { size: 26 })}<span><b>Accès</b><small class="ruby-soft">${item.access}${item.access === 'Payant' ? ' · Abonnement requis' : ''}</small></span>
          ${inclusion(item, ctx)}
          <p class="dif-line small">${icon('info', { size: 18 })}Le diffuseur peut demander une connexion et vérifier tes droits d’accès.</p></div>
        <div class="dif-card col">${icon('phone', { size: 26 })}<span><b>Informations pratiques</b><small>L’application du diffuseur s’ouvrira si le lien est compatible ; sinon, son site.</small><small>La lecture et l’abonnement sont gérés par le diffuseur.</small></span></div>
        <button class="btn btn-primary btn-block" data-action="dif-open" data-value="${link.matchPage}" data-k="dif-open">Ouvrir chez le diffuseur${icon('external', { size: 20 })}</button>
        ${link.site ? h`<button class="btn btn-ghost btn-block" data-action="dif-open" data-value="${link.site}" data-k="dif-site">Ouvrir le site${icon('external', { size: 20 })}</button>` : ''}
        ${footer}</div>`,
    };
  },
  actions: {
    // Démonstration : aucune navigation, aucun appel réseau, aucune fenêtre.
    'dif-open': (el, ctx) => ctx.toast(`Simulation : ${el.dataset.value.replace(/^https:\/\//, '')} s’ouvrirait ici. Mode démo, aucune ouverture réelle.`),
    'dif-others': (el, ctx) => ctx.router.go(replaceOverlay(ctx, 'diffusion', el.dataset.id), { replace: true }),
    'dif-report': (el, ctx) => setReport(ctx, el.dataset.id, 'confirm'),
    'dif-report-cancel': (el, ctx) => setReport(ctx, el.dataset.id, null),
    'dif-report-ok': (el, ctx) => setReport(ctx, el.dataset.id, 'done'),
  },
};

function setReport(ctx, id, step) {
  ctx.session.reportStep = { ...(ctx.session.reportStep || {}), [id]: step };
  ctx.session.pendingFocus = step === 'confirm' ? 'rep-ok' : step === 'done' ? 'dif-others' : 'dif-report';
  ctx.refresh();
}

function replaceOverlay(ctx, name, ref) {
  const r = ctx.route;
  const qs = new URLSearchParams({ ...r.query, p: name, ref }).toString();
  return `#/${r.path}?${qs}`;
}

export { CHANNEL };
