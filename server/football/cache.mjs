// Cache disque à durée de vie, avec service de la dernière valeur connue
// (signalée « périmée ») quand le fournisseur est indisponible ou le quota atteint.
// Les requêtes identiques simultanées sont regroupées (une seule requête sortante).
import { mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

export function createCache({ dir, now = () => Date.now() }) {
  mkdirSync(dir, { recursive: true });
  const inflight = new Map();
  const fileOf = (key) => join(dir, `${createHash('sha256').update(key).digest('hex').slice(0, 32)}.json`);

  function read(key) {
    try {
      const e = JSON.parse(readFileSync(fileOf(key), 'utf8'));
      return e && e.key === key ? e : null;
    } catch {
      return null;
    }
  }

  function write(key, value) {
    const file = fileOf(key);
    writeFileSync(`${file}.tmp`, JSON.stringify({ key, storedAt: now(), value }));
    renameSync(`${file}.tmp`, file);
  }

  return {
    read,
    // load() n'est appelé que si l'entrée est absente ou expirée.
    async get(key, ttlMs, load) {
      const hit = read(key);
      if (hit && now() - hit.storedAt < ttlMs) return { value: hit.value, source: 'cache', storedAt: hit.storedAt, stale: false };
      if (inflight.has(key)) return inflight.get(key);
      const p = (async () => {
        try {
          const value = await load();
          write(key, value);
          return { value, source: 'fournisseur', storedAt: now(), stale: false };
        } catch (err) {
          if (hit) return { value: hit.value, source: 'cache', storedAt: hit.storedAt, stale: true, error: err };
          throw err;
        } finally {
          inflight.delete(key);
        }
      })();
      inflight.set(key, p);
      return p;
    },
  };
}
