// Client API-Football v3 (côté serveur uniquement).
// Chaque requête passe par le garde-fou de quota. La clé n'apparaît jamais
// dans les erreurs, journaux ou réponses renvoyées au navigateur.

export class ProviderError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// API-Football renvoie `errors` sous forme de tableau vide ou d'objet { champ: message }.
export function classifyErrors(errors) {
  if (!errors || (Array.isArray(errors) && !errors.length) || (typeof errors === 'object' && !Object.keys(errors).length)) return null;
  const entries = Array.isArray(errors) ? errors.map((m, i) => [String(i), m]) : Object.entries(errors);
  const [field, message] = entries[0];
  const code = { plan: 'plan', token: 'cle', requests: 'quota-fournisseur', rateLimit: 'quota-minute', access: 'acces' }[field] || 'fournisseur';
  return { code, message: String(message) };
}

export function createClient({ config, quota, fetchImpl = globalThis.fetch }) {
  const scrub = (text) => {
    const key = config.getKey();
    return key ? String(text).split(key).join('[clé masquée]') : String(text);
  };

  return {
    async get(path, params = {}) {
      if (!config.hasKey) throw new ProviderError('Clé API_FOOTBALL_KEY absente côté serveur.', 'cle-absente');
      quota.reserve();
      const url = new URL(config.baseUrl + path);
      for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), config.timeoutMs);
      let res;
      try {
        res = await fetchImpl(url, { headers: { 'x-apisports-key': config.getKey(), accept: 'application/json' }, signal: ctrl.signal });
      } catch (err) {
        throw new ProviderError(`Fournisseur injoignable : ${scrub(err.message)}`, 'reseau');
      } finally {
        clearTimeout(timer);
      }
      quota.syncFromHeaders(res.headers);
      if (!res.ok) throw new ProviderError(`Réponse HTTP ${res.status} du fournisseur.`, res.status === 429 ? 'quota-minute' : 'http', res.status);
      let body;
      try {
        body = await res.json();
      } catch {
        throw new ProviderError('Réponse illisible du fournisseur.', 'format');
      }
      const err = classifyErrors(body.errors);
      if (err) throw new ProviderError(scrub(err.message), err.code, res.status);
      return { response: Array.isArray(body.response) ? body.response : body.response ?? null, results: body.results ?? null, paging: body.paging ?? null };
    },
  };
}
