// Point d'entrée : rendu des écrans, panneaux, événements délégués,
// conservation du focus et du défilement.
import { createStore, toggleIn } from './state/store.js';
import { createRouter, parse, build } from './router.js';
import { h } from './ui/html.js';
import { bottomNav } from './ui/components.js';
import { SCREENS } from './screens/index.js';
import { OVERLAYS } from './overlays/index.js';
import { MATCH } from './data/matches.js';
import { DEMO_DATE } from './data/catalog.js';
import { matchTitle } from './domain/matchState.js';

let storage = null;
try {
  storage = window.localStorage;
} catch {
  storage = null;
}

const store = createStore(storage);
const session = {
  revealed: new Set(), // rencontres révélées (mémoire de session, volontairement non persistée)
  revealedContent: new Set(),
  scenarios: {},
  day: DEMO_DATE,
  lastQuery: {},
  onboard: { tab: 'equipes', query: '' },
  favorites: { view: 'mon-espace', cat: 'tous', savedCat: 'tous', editing: false, collapsed: new Set() },
  matches: { collapsed: new Set() },
  search: { query: '', category: 'tout' },
  scroll: new Map(),
};

const appEl = document.getElementById('app');
const sheet = document.getElementById('sheet');
const live = document.getElementById('live');
let lastScreenKey = null;
let overlayOpener = null;

const router = createRouter((nav) => render(nav));
store.subscribe(() => render('update'));

const ctx = {
  store,
  router,
  session,
  get prefs() {
    return store.get();
  },
  get route() {
    return parse(location.hash);
  },
  toast,
  refresh: () => render('update'),
  // Ouvre un panneau en mémorisant l'élément d'origine pour lui rendre le focus.
  open(el, name, extra = {}) {
    overlayOpener = el;
    router.openOverlay(name, extra);
  },
  navigate: (href) => navigateFromAnywhere(href),
  // Ferme le panneau puis applique `fn` sur l'écran d'origine.
  closeThen(fn) {
    if (sheet.open && history.state?.overlay) {
      window.addEventListener('popstate', () => fn(), { once: true });
      history.back();
    } else {
      router.closeOverlay();
      fn();
    }
  },
  // Enregistre une préférence et prévient si l'appareil ne l'a pas conservée.
  save(fn, message) {
    const ok = store.update(fn);
    if (!ok) toast(`${message ? `${message} ` : ''}Non sauvegardé sur cet appareil : stockage indisponible.`);
    else if (message) toast(message);
    return ok;
  },
};

function screenKey(route) {
  return `${route.name}/${route.id || ''}`;
}

function resolveRoute(route) {
  const prefs = store.get();
  // Le premier lancement n'est proposé qu'à l'ouverture de l'application :
  // un lien direct vers un match reste accessible sans passer par lui.
  if (route.name === 'racine') return build(prefs.onboarded ? 'accueil' : 'bienvenue');
  return null;
}

function render(nav = 'update') {
  let route = parse(location.hash);
  const redirect = resolveRoute(route);
  if (redirect) {
    history.replaceState({ ...history.state }, '', redirect);
    route = parse(redirect);
  }
  // Les brouillons de Mes accès ne survivent pas à la sortie du parcours.
  if (route.name !== 'acces' && route.name !== 'offre') session.accessDraft = session.offerDraft = null;
  const key = screenKey(route);
  const screen = SCREENS[route.name] || SCREENS.introuvable;

  // Mémoriser la position de l'écran que l'on quitte.
  if (lastScreenKey && nav !== 'update') session.scroll.set(lastScreenKey + '|' + (history.state?.idx ?? 0), window.scrollY);

  const active = document.activeElement;
  const focusKey = session.pendingFocus || active?.dataset?.k;
  session.pendingFocus = null;
  const caret = active && 'selectionStart' in active ? [active.selectionStart, active.selectionEnd] : null;

  const out = screen.render(ctx);
  session.lastQuery[route.name] = route.query;
  const hrefs = {
    accueil: '#/accueil',
    matchs: build('matchs', strip(session.lastQuery.matchs)),
    actualites: build('actualites', strip(session.lastQuery.actualites)),
    videos: build('videos', strip(session.lastQuery.videos)),
    favoris: build('favoris', strip(session.lastQuery.favoris)),
  };
  const banner = store.storageStatus() !== 'ok' && route.name !== 'bienvenue'
    ? h`<div class="storage-banner" role="note">Stockage local indisponible : vos choix ne seront pas conservés après fermeture.</div>`
    : '';
  appEl.className = `shell screen-${route.name} ${out.nav ? 'has-nav' : ''}`;
  const pilotLink = ['accueil', 'matchs', 'favoris'].includes(route.name) ? h`<a class="pilot-entry" href="#/reels">Découvrir le pilote · Matchs réels <span aria-hidden="true">↗</span></a>` : '';
  appEl.innerHTML = String(h`${banner}<main id="main" class="main">${pilotLink}${out.body}</main>${out.nav ? bottomNav(out.nav, hrefs) : ''}`);
  document.title = out.title ? `${out.title} · NYVO` : 'NYVO';

  const changed = key !== lastScreenKey;
  if (changed && nav !== 'update') appEl.querySelector('.main')?.classList.add('enter');

  renderOverlay(route);

  // Défilement : haut de page sur nouvel écran, restauration au retour.
  if (nav === 'pop') {
    const y = session.scroll.get(key + '|' + (history.state?.idx ?? 0));
    window.scrollTo(0, y ?? 0);
  } else if (nav === 'push' && changed) window.scrollTo(0, 0);
  lastScreenKey = key;

  // Focus : titre de l'écran sur changement d'écran, sinon élément précédent.
  if (!sheet.open) {
    if (changed && nav !== 'update') appEl.querySelector('h1')?.focus({ preventScroll: true });
    else if (focusKey) restoreFocus(appEl, focusKey, caret);
  } else if (focusKey) restoreFocus(sheet, focusKey, caret);
}

function strip(q = {}) {
  const { p, ref, ...rest } = q;
  return rest;
}

function restoreFocus(root, key, caret) {
  const el = root.querySelector(`[data-k="${CSS.escape(key)}"]`);
  if (!el) return;
  el.focus({ preventScroll: true });
  if (caret && 'setSelectionRange' in el) {
    try {
      el.setSelectionRange(caret[0], caret[1]);
    } catch {
      /* type sans sélection */
    }
  }
}

function renderOverlay(route) {
  const name = route.query.p;
  const overlay = name && OVERLAYS[name];
  if (!overlay) {
    if (sheet.open) {
      sheet.close();
      sheet.innerHTML = '';
      overlayOpener?.isConnected && overlayOpener.focus({ preventScroll: true });
      const k = overlayOpener?.dataset?.k;
      if (k && !overlayOpener.isConnected) appEl.querySelector(`[data-k="${CSS.escape(k)}"]`)?.focus({ preventScroll: true });
    }
    return;
  }
  const out = overlay.render(ctx);
  const titleId = 'sheet-title';
  sheet.className = `sheet sheet-${out.variant || 'bottom'}`;
  sheet.setAttribute('aria-labelledby', titleId);
  const scroller = sheet.querySelector('.sheet-body');
  const y = scroller?.scrollTop || 0;
  sheet.innerHTML = String(h`<div class="sheet-inner">
    <div class="sheet-handle" aria-hidden="true"></div>
    <div class="sheet-head"><h2 id="${titleId}" tabindex="-1">${out.title}</h2>
      <button class="icon-btn" data-action="close" aria-label="Fermer" data-k="sheet-close">${closeIcon}</button></div>
    <div class="sheet-body">${out.body}</div><div class="sheet-status" role="status" aria-live="polite"></div></div>`);
  if (!sheet.open) {
    sheet.showModal();
    const first = sheet.querySelector('[autofocus]') || sheet.querySelector('h2');
    first?.focus({ preventScroll: true });
  } else {
    const body = sheet.querySelector('.sheet-body');
    if (body) body.scrollTop = y;
  }
}

const closeIcon = h`<svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>`;

let toastTimer;
function toast(message) {
  const target = sheet.open ? sheet.querySelector('.sheet-status') : live;
  if (!target) return;
  target.textContent = '';
  target.classList.add('is-visible');
  // Laisser le temps aux lecteurs d'écran de détecter le changement.
  requestAnimationFrame(() => (target.textContent = message));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    target.classList.remove('is-visible');
    target.textContent = '';
  }, 4200);
}

// ---------- Actions communes ----------
const COMMON = {
  open: (el) => ctx.open(el, el.dataset.overlay, el.dataset.ref ? { ref: el.dataset.ref } : {}),
  close: () => router.closeOverlay(),
  back: (el) => router.back(el.dataset.fallback || '#/accueil'),
  go: (el) => navigateFromAnywhere(el.dataset.href),
  'toggle-save': (el) => {
    const { kind, id } = el.dataset;
    let added;
    ctx.save((s) => {
      added = toggleIn(s.saved[kind], id);
      if (added) s.savedAt[`${kind}:${id}`] = Date.now();
      else delete s.savedAt[`${kind}:${id}`];
    });
    const label = { matches: 'Match', articles: 'Article', videos: 'Vidéo' }[kind];
    if (store.storageStatus() === 'ok') toast(added ? `${label} enregistré dans Favoris.` : `${label} retiré des enregistrés.`);
  },
  'toggle-follow': (el) => {
    const { kind, id } = el.dataset;
    let added;
    ctx.save((s) => {
      added = toggleIn(s.follows[kind], id);
    });
    if (store.storageStatus() === 'ok' && el.dataset.quiet === undefined) toast(added ? 'Ajouté à Mon espace.' : 'Retiré de Mon espace.');
  },
  'toggle-spoiler': () => {
    let on;
    ctx.save((s) => {
      on = s.spoiler.global = !s.spoiler.global;
    });
    session.revealed.clear();
    session.revealedContent.clear();
    session.pilot?.revealed.clear();
    if (store.storageStatus() === 'ok') toast(on ? 'Mode sans spoilers activé.' : 'Mode sans spoilers désactivé.');
  },
  'toggle-team-spoiler': (el) => {
    const id = el.dataset.id;
    ctx.save((s) => {
      toggleIn(s.spoiler.teams, id);
    });
  },
  'reveal-match': (el) => {
    session.revealed.add(el.dataset.id);
    render('update');
    toast(`${matchTitle(MATCH[el.dataset.id])} : contenus révélés pour cette session.`);
  },
  'reveal-content': (el) => {
    session.revealedContent.add(el.dataset.id);
    render('update');
  },
  'set-country': (el) => setCountry(el.dataset.value || el.value),
};

function setCountry(id) {
  ctx.save((s) => {
    s.country = id;
  });
}

function navigateFromAnywhere(href) {
  // Depuis un panneau : remplacer l'entrée du panneau pour que Retour revienne à l'écran d'origine.
  if (sheet.open && history.state?.overlay) ctx.closeThen(() => router.go(href));
  else router.go(href);
}

function findAction(name) {
  const route = parse(location.hash);
  const screen = SCREENS[route.name];
  const overlay = OVERLAYS[route.query.p];
  return overlay?.actions?.[name] || screen?.actions?.[name] || COMMON[name];
}

document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest('a[href^="#/"]');
  const el = e.target.closest('[data-action]');
  if (el && !el.matches('input, select') && (!a || a === el || a.contains(el))) {
    const fn = findAction(el.dataset.action);
    if (fn) {
      e.preventDefault();
      fn(el, ctx, e);
      return;
    }
  }
  if (a) {
    e.preventDefault();
    navigateFromAnywhere(a.getAttribute('href'));
  }
});

document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-change]');
  if (!el) return;
  const fn = findAction(el.dataset.change);
  if (fn) fn(el, ctx, e);
});

document.addEventListener('input', (e) => {
  const el = e.target.closest('[data-input]');
  if (!el) return;
  const fn = findAction(el.dataset.input);
  if (fn) fn(el, ctx, e);
});

document.addEventListener('submit', (e) => {
  const form = e.target.closest('form[data-submit]');
  if (!form) return;
  e.preventDefault();
  const fn = findAction(form.dataset.submit);
  if (fn) fn(form, ctx, e);
});

// Onglets au clavier (flèches gauche/droite, Début, Fin).
document.addEventListener('keydown', (e) => {
  const tab = e.target.closest('[role="tab"]');
  if (!tab) return;
  const tabs = [...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')];
  const i = tabs.indexOf(tab);
  const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
  if (next === undefined) return;
  e.preventDefault();
  const target = tabs[(next + tabs.length) % tabs.length];
  session.pendingFocus = target.dataset.k;
  target.click();
});

sheet.addEventListener('cancel', (e) => {
  e.preventDefault();
  router.closeOverlay();
});
sheet.addEventListener('click', (e) => {
  if (e.target === sheet) router.closeOverlay();
});

render('replace');

// Accès de test (non utilisé par l'interface).
window.__nyvo = { store, session, render };
