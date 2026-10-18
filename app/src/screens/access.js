// Mes accès (maquette V0.4 05) et Choisir mon offre (06).
// Sélection facultative et locale : aucun identifiant, aucun prix, aucun abonnement souscrit.
import { h, attr } from '../ui/html.js';
import { icon } from '../ui/icons.js';
import { flag } from '../ui/flags.js';
import { emptyState, demoNote } from '../ui/components.js';
import { CHANNEL, COUNTRY } from '../data/catalog.js';
import { SERVICE, servicesIn } from '../data/access.js';
import { accessFor } from '../domain/access.js';
import { normalize } from '../domain/search.js';
import { verifiedLabel } from '../domain/time.js';

const channelsText = (ids) => ids.map((c) => CHANNEL[c].name).join(' et ').replace(/ et (?=.* et )/g, ', ');

function draftOf(ctx) {
  const c = ctx.prefs.country;
  const d = ctx.session.accessDraft;
  if (!d || d.country !== c) {
    const saved = accessFor(ctx.prefs, c);
    ctx.session.accessDraft = { country: c, ...structuredClone(saved) };
  }
  return ctx.session.accessDraft;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function isDirty(ctx) {
  const d = draftOf(ctx);
  const saved = accessFor(ctx.prefs, ctx.prefs.country);
  return !same({ services: d.services, legacy: d.legacy }, { services: saved.services, legacy: saved.legacy });
}

function header(ctx, title, back) {
  const c = COUNTRY[ctx.prefs.country];
  return h`<div class="acc-bar">
    <button class="icon-btn" data-action="back" data-fallback="${back}" aria-label="Retour" data-k="back">${icon('chevron-left')}</button>
    <h1 tabindex="-1">${title}</h1><span class="demo-badge sm">Démo</span>
    <button class="country-pill" data-action="open" data-overlay="pays" data-k="country-pill" aria-label="Pays de diffusion : ${c.name}. Modifier">${flag(c.id)}<span>${c.name}</span>${icon('chevron-down', { size: 18, cls: 'ruby' })}</button>
  </div>`;
}

const noSub = h`<div class="card note-card">${icon('info', { size: 26 })}<div><b>Cette sélection ne souscrit aucun abonnement.</b><small>Le filtre Mes accès utilise uniquement les correspondances vérifiées, à partir de l’offre déclarée.</small></div></div>`;

function serviceCard(service, ctx) {
  const country = ctx.prefs.country;
  const entry = service.countries[country];
  const d = draftOf(ctx);
  const sel = d.services[service.id];
  const selected = Boolean(sel);
  // Déplié par défaut (maquette 05), repliable par l'utilisateur.
  const open = !ctx.session.accessClosed?.has(service.id);
  const offer = entry.offers.find((o) => o.id === sel?.offer);
  const opts = entry.options.filter((o) => sel?.options?.includes(o.id));
  let status = '';
  if (selected && offer && entry.verifiedAt) {
    status = h`<p class="acc-status">${icon('news', { size: 22 })}<span><b>Inclusion vérifiée · Démo</b><small>Vérification simulée le ${verifiedLabel(entry.verifiedAt, COUNTRY[country].tz)}. Offre déclarée, abonnement non vérifié.</small></span></p>`;
  } else if (selected) {
    status = h`<p class="acc-status">${icon('info', { size: 22 })}<span><b>Inclusion des chaînes non confirmée.</b><small>Non utilisé par le filtre Mes accès.</small></span></p>`;
  }
  return h`<li class="acc-card ${selected ? 'is-on' : ''}">
    <div class="acc-head">
      <label class="acc-check"><input type="checkbox" data-change="acc-select" data-id="${service.id}"${attr('checked', selected)} data-k="acc-${service.id}"><span class="box" aria-hidden="true">${selected ? icon('check', { size: 20 }) : ''}</span>
        <span class="acc-name"><b>${service.name}</b><small>${service.desc}</small></span></label>
      <button class="icon-btn" aria-expanded="${open}" aria-controls="acc-body-${service.id}" aria-label="${open ? 'Replier' : 'Déplier'} ${service.name}" data-action="acc-toggle" data-id="${service.id}" data-k="acc-tg-${service.id}">${icon(open ? 'chevron-up' : 'chevron-down')}</button>
    </div>
    <div class="acc-body" id="acc-body-${service.id}"${open ? '' : h` hidden`}>
      <label class="field-label" for="offer-${service.id}">${selected ? 'Mon offre' : 'Choisir une offre'}</label>
      <div class="select-flag no-flag"><select id="offer-${service.id}" data-change="acc-offer" data-id="${service.id}" data-k="offer-${service.id}">
        ${selected ? '' : h`<option value="" selected>Sélectionner une offre</option>`}
        <option value="a-preciser"${attr('selected', selected && !offer)}>Offre à préciser</option>
        ${entry.offers.map((o) => h`<option value="${o.id}"${attr('selected', offer?.id === o.id)}>${o.name}</option>`)}
      </select>${icon('chevron-down', { size: 20 })}</div>
      ${offer ? h`<p class="acc-channels">${channelsText([...offer.channels, ...opts.flatMap((o) => o.channels)])}${opts.length ? ` (avec ${opts.map((o) => o.name).join(', ')})` : ''}</p>` : ''}
      ${!entry.offers.length ? h`<p class="small">Offres non référencées dans la démonstration : le service peut rester sélectionné « à préciser ».</p>` : ''}
      ${entry.offers.length ? h`<a class="f-select" href="#/acces/${service.id}" data-k="acc-detail-${service.id}">${icon('settings', { size: 20 })}<span>Offre et options</span>${icon('chevron-right', { size: 18 })}</a>` : ''}
      ${status}
    </div>
  </li>`;
}

export const access = {
  render(ctx) {
    const country = COUNTRY[ctx.prefs.country];
    const d = draftOf(ctx);
    const q = normalize(ctx.session.accessQuery || '');
    const list = servicesIn(ctx.prefs.country).filter((s) => !q || normalize(s.name).includes(q));
    const count = Object.keys(d.services).length;
    const dirty = isDirty(ctx);
    return {
      title: 'Mes accès',
      nav: 'matchs',
      body: h`${header(ctx, 'Mes accès', '#/programme')}
      <div class="acc-intro"><div><p class="acc-lead">Choisis tes services et tes offres.</p><p class="ruby-soft">Aucun identifiant demandé. Facultatif.</p></div>
        <p class="demo-aside">${icon('info', { size: 18 })}<span><b>Démo</b> Services et offres fictifs.</span></p></div>
      ${servicesIn(ctx.prefs.country).length
        ? h`<label class="search-field">${icon('search')}<span class="sr-only">Rechercher un service</span><input type="search" placeholder="Rechercher un service" value="${ctx.session.accessQuery || ''}" data-input="acc-search" data-k="acc-search" autocomplete="off"></label>
          <ul class="acc-list">${list.length ? list.map((s) => serviceCard(s, ctx)) : h`<li class="empty-inline">Aucun service de démonstration ne correspond.</li>`}</ul>`
        : emptyState({ ic: 'tv', title: `Aucun service de démonstration référencé pour ${country.name}.`, text: 'Les accès sont propres à chaque pays : une offre française n’est pas reprise ailleurs. Toutes les diffusions restent consultables.', action: h`<a class="btn btn-outline" href="#/programme" data-k="acc-all">Voir le programme</a>` })}
      ${d.legacy.length
        ? h`<section class="card legacy"><h2>Accès historiques à préciser</h2><p class="small">Chaînes cochées dans une version précédente du prototype. Elles ne correspondent à aucune offre vérifiée et ne sont pas utilisées par le filtre Mes accès.</p>
            <ul>${d.legacy.map((c) => h`<li>${icon('tv', { size: 20 })}<span>${CHANNEL[c].name}</span><button class="text-btn ruby" data-action="acc-legacy-remove" data-id="${c}" data-k="leg-${c}">Retirer</button></li>`)}</ul></section>`
        : ''}
      ${noSub}
      <div class="acc-footer"><p><span class="acc-count"><b class="ruby-num">${count}</b> service${count > 1 ? 's' : ''} sélectionné${count > 1 ? 's' : ''}</span>${dirty ? h`<small>Modifications non enregistrées</small>` : ''}</p>
        <button class="btn btn-primary" data-action="acc-save" data-k="acc-save">Enregistrer</button></div>
      ${demoNote('Services, offres et vérifications fictifs · Aucune connexion à un diffuseur')}`,
    };
  },
  actions: {
    'acc-search': (el, ctx) => {
      ctx.session.accessQuery = el.value;
      ctx.refresh();
    },
    'acc-toggle': (el, ctx) => {
      const s = (ctx.session.accessClosed ||= new Set());
      if (s.has(el.dataset.id)) s.delete(el.dataset.id);
      else s.add(el.dataset.id);
      ctx.refresh();
    },
    'acc-select': (el, ctx) => {
      const d = draftOf(ctx);
      if (el.checked) d.services[el.dataset.id] = d.services[el.dataset.id] || { offer: null, options: [] };
      else delete d.services[el.dataset.id];
      ctx.refresh();
    },
    'acc-offer': (el, ctx) => {
      const d = draftOf(ctx);
      if (!el.value) delete d.services[el.dataset.id];
      else d.services[el.dataset.id] = { offer: el.value === 'a-preciser' ? null : el.value, options: el.value === 'a-preciser' ? [] : d.services[el.dataset.id]?.options || [] };
      ctx.refresh();
    },
    'acc-legacy-remove': (el, ctx) => {
      const d = draftOf(ctx);
      d.legacy = d.legacy.filter((c) => c !== el.dataset.id);
      ctx.refresh();
    },
    'acc-save': (el, ctx) => {
      const d = draftOf(ctx);
      const ok = ctx.store.update((s) => {
        s.access[d.country] = { services: structuredClone(d.services), legacy: [...d.legacy] };
      });
      ctx.session.accessDraft = null;
      ctx.toast(ok ? 'Préférences enregistrées sur cet appareil. Aucun abonnement n’a été souscrit.' : 'Non sauvegardé sur cet appareil : stockage indisponible. Sélection gardée pour cette session.');
    },
  },
};

export const offer = {
  render(ctx) {
    const service = SERVICE[ctx.route.id];
    const country = COUNTRY[ctx.prefs.country];
    const entry = service?.countries[ctx.prefs.country];
    if (!service || !entry) {
      return {
        title: 'Choisir mon offre',
        nav: 'matchs',
        body: h`${header(ctx, 'Choisir mon offre', '#/acces')}${emptyState({ ic: 'tv', title: `Ce service n’est pas référencé pour ${country.name} dans la démonstration.`, text: 'Une offre d’un autre pays n’est pas reprise ici.', action: h`<a class="btn btn-outline" href="#/acces" data-k="offer-back">Retour à Mes accès</a>` })}`,
      };
    }
    const d = draftOf(ctx);
    let od = ctx.session.offerDraft;
    if (!od || od.service !== service.id || od.country !== ctx.prefs.country) {
      const cur = d.services[service.id];
      od = ctx.session.offerDraft = { service: service.id, country: ctx.prefs.country, offer: cur?.offer ?? null, options: [...(cur?.options || [])] };
    }
    const chosen = entry.offers.find((o) => o.id === od.offer);
    return {
      title: 'Choisir mon offre',
      nav: 'matchs',
      body: h`${header(ctx, 'Choisir mon offre', '#/acces')}
      <div><p class="acc-lead">${service.name} · ${country.name}</p><p class="ruby-soft">Services et offres fictifs.</p></div>
      <fieldset class="radio-list"><legend class="acc-legend">Sélectionne l’offre que tu possèdes.</legend>
        ${[...entry.offers, { id: '', name: 'Offre à préciser', channels: null }].map(
          (o) => h`<label class="radio-row offer-row ${od.offer === (o.id || null) ? 'is-on' : ''}">
            <input type="radio" name="offer" value="${o.id}"${attr('checked', od.offer === (o.id || null))} data-change="of-pick" data-k="of-${o.id || 'none'}"><span class="radio-dot" aria-hidden="true"></span>
            <span class="radio-name"><b>${o.name}</b><small>${o.channels ? channelsText(o.channels) : 'Non utilisée par le filtre Mes accès'}</small></span></label>`,
        )}</fieldset>
      ${chosen
        ? h`<h2 class="acc-h2">Chaînes de l’offre sélectionnée.</h2>
          <ul class="card ch-list">${chosen.channels.map((c) => h`<li>${icon('tv', { size: 28 })}<span><b>${CHANNEL[c].name}</b><small>Inclus dans ${chosen.name}</small></span>${icon('check', { size: 22, cls: 'ok-ring' })}</li>`)}
            <li class="ch-verif">${icon('info', { size: 24 })}<span><b>Correspondance vérifiée · Démo</b><small>Vérification simulée le ${verifiedLabel(entry.verifiedAt, country.tz)}. Elle relie l’offre à ses chaînes ; elle ne vérifie pas ton abonnement.</small></span></li></ul>
          ${entry.options.length
            ? h`<fieldset><legend class="acc-h2">Options supplémentaires.</legend>${entry.options.map(
                (o) => h`<label class="acc-card opt ${od.options.includes(o.id) ? 'is-on' : ''}"><span class="acc-check"><input type="checkbox" value="${o.id}" data-change="of-option"${attr('checked', od.options.includes(o.id))} data-k="opt-${o.id}"><span class="box" aria-hidden="true">${od.options.includes(o.id) ? icon('check', { size: 20 }) : ''}</span>
                  <span class="acc-name"><b>${o.name}</b><small>Ajoute ${channelsText(o.channels)}${o.verified ? '' : ' (correspondance non vérifiée)'}</small><small>À cocher uniquement si tu possèdes cette option.</small></span></span></label>`,
              )}</fieldset>`
            : ''}`
        : h`<p class="card small">Offre à préciser : le service reste dans ta sélection, mais ses chaînes ne sont pas utilisées par le filtre Mes accès.</p>`}
      <details class="lost"${attr('open', ctx.session.offerLostOpen)}><summary data-action="of-lost" data-k="of-lost">Ton offre est introuvable ?</summary>
        <p>Garde le service avec « Offre à préciser » : il ne sera pas utilisé par le filtre Mes accès, et toutes les diffusions restent consultables.</p>
        <div class="btn-row two"><button class="btn btn-ghost btn-sm" data-action="of-keep-unknown" data-k="of-keep">Garder à préciser</button><a class="btn btn-ghost btn-sm" href="#/programme" data-k="of-all">Voir toutes les diffusions</a></div></details>
      ${noSub}
      <button class="btn btn-primary btn-block" data-action="of-confirm" data-k="of-confirm">Confirmer mon offre</button>
      ${demoNote('Confirmer garde ce choix dans ta sélection ; « Enregistrer » sur Mes accès le conserve sur cet appareil.')}`,
    };
  },
  actions: {
    'of-pick': (el, ctx) => {
      const od = ctx.session.offerDraft;
      od.offer = el.value || null;
      if (!od.offer) od.options = [];
      ctx.refresh();
    },
    'of-option': (el, ctx) => {
      const od = ctx.session.offerDraft;
      od.options = el.checked ? [...new Set([...od.options, el.value])] : od.options.filter((o) => o !== el.value);
      ctx.refresh();
    },
    'of-lost': (el, ctx) => {
      ctx.session.offerLostOpen = !el.parentElement.open;
      el.parentElement.open = ctx.session.offerLostOpen;
    },
    'of-keep-unknown': (el, ctx) => confirm(ctx, true),
    'of-confirm': (el, ctx) => confirm(ctx, false),
  },
};

function confirm(ctx, unknown) {
  const od = ctx.session.offerDraft;
  const d = draftOf(ctx);
  d.services[od.service] = unknown || !od.offer ? { offer: null, options: [] } : { offer: od.offer, options: [...od.options] };
  ctx.session.offerDraft = null;
  ctx.router.back('#/acces');
  ctx.toast('Ajouté à ta sélection. Appuie sur Enregistrer pour le conserver sur cet appareil.');
}
