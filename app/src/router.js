// Routeur à base de fragments (#/…) compatible fichier local et serveur statique.
// Chaque navigation « push » crée une entrée d'historique : le bouton Retour
// du navigateur ferme les panneaux et revient à l'écran précédent.

const ROUTES = [
  ['bienvenue', /^bienvenue$/],
  ['accueil', /^accueil$/],
  ['matchs', /^matchs$/],
  ['match', /^match\/([\w-]+)$/],
  ['programme', /^programme$/],
  ['actualites', /^actualites$/],
  ['article', /^article\/([\w-]+)$/],
  ['videos', /^videos$/],
  ['video', /^video\/([\w-]+)$/],
  ['favoris', /^favoris$/],
  ['equipe', /^equipe\/([\w-]+)$/],
  ['competition', /^competition\/([\w-]+)$/],
  ['joueur', /^joueur\/([\w-]+)$/],
];

export function parse(hash) {
  const raw = (hash || '').replace(/^#\/?/, '');
  const [path, qs = ''] = raw.split('?');
  const query = Object.fromEntries(new URLSearchParams(qs));
  for (const [name, re] of ROUTES) {
    const m = path.match(re);
    if (m) return { name, id: m[1] || null, query, path };
  }
  return { name: path ? 'introuvable' : 'racine', id: null, query, path };
}

export function build(path, query = {}) {
  const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString();
  return `#/${path}${qs ? `?${qs}` : ''}`;
}

export function createRouter(onChange) {
  let idx = history.state?.idx ?? 0;
  if (history.state?.idx === undefined) history.replaceState({ idx: 0 }, '', location.href);

  window.addEventListener('popstate', (e) => {
    idx = e.state?.idx ?? 0;
    onChange('pop');
  });

  const api = {
    current: () => parse(location.hash),
    go(url, { replace = false, overlay = false } = {}) {
      if (url === location.hash && !replace) return;
      if (replace) history.replaceState({ ...history.state, idx, overlay: history.state?.overlay && overlay }, '', url);
      else history.pushState({ idx: ++idx, overlay }, '', url);
      onChange(replace ? 'replace' : 'push');
    },
    // Modifie la requête de l'écran courant sans créer d'entrée d'historique.
    setQuery(patch) {
      const r = parse(location.hash);
      api.go(build(r.path, { ...r.query, ...patch }), { replace: true });
    },
    openOverlay(name, extra = {}) {
      const r = parse(location.hash);
      api.go(build(r.path, { ...r.query, p: name, ...extra }), { overlay: true });
    },
    closeOverlay() {
      const r = parse(location.hash);
      if (!r.query.p) return;
      if (history.state?.overlay && idx > 0) history.back();
      else {
        const { p, ...rest } = r.query;
        delete rest.ref;
        api.go(build(r.path, rest), { replace: true });
      }
    },
    back(fallback) {
      if (idx > 0) history.back();
      else api.go(fallback, { replace: true });
    },
  };
  return api;
}
