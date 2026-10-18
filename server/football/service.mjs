// Service du pilote : regroupe quota, cache, client et règles d'activation.
import { createQuota, QuotaError } from './quota.mjs';
import { createCache } from './cache.mjs';
import { createClient } from './client.mjs';
import { normalizeFixture } from './normalize.mjs';
import { activation, loadReport } from './seasons.mjs';
import { join } from 'node:path';

// Durées de cache choisies pour tenir dans ~90 requêtes par jour.
// Une journée passée ne change plus ; le jour même est rafraîchi au plus une fois par heure :
// le pilote n'offre donc pas de direct en temps réel.
export const TTL = {
  past: 7 * 86_400_000,
  today: 60 * 60_000,
  future: 6 * 3_600_000,
};

export function ttlFor(date, today) {
  if (date < today) return TTL.past;
  if (date === today) return TTL.today;
  return TTL.future;
}

export function createPilot({ config, fetchImpl, now = () => Date.now() }) {
  const quota = createQuota({ file: join(config.cacheDir, 'quota.json'), dailyLimit: config.dailyLimit, dailyBudget: config.dailyBudget, perMinute: config.perMinute, now });
  const cache = createCache({ dir: join(config.cacheDir, 'reponses'), now });
  const client = createClient({ config, quota, fetchImpl });

  return {
    quota,
    client,
    state() {
      return activation(config, loadReport(config.accessReport), now());
    },
    // Matchs réels d'une date (AAAA-MM-JJ, jour UTC) pour les compétitions activées.
    async fixtures(date) {
      const act = this.state();
      const today = new Date(now()).toISOString().slice(0, 10);
      const results = [];
      for (const league of act.competitions.filter((l) => l.active)) {
        const key = `fixtures:${league.id}:${league.saison}:${date}`;
        try {
          const r = await cache.get(key, ttlFor(date, today), async () => {
            const res = await client.get('/fixtures', { league: league.id, season: league.saison, date, timezone: 'UTC' });
            return (res.response || []).map(normalizeFixture);
          });
          results.push({ competition: league.id, saison: league.saison, matchs: r.value, source: r.source, misAJour: new Date(r.storedAt).toISOString(), perime: r.stale, motif: r.error?.message ?? null });
        } catch (err) {
          results.push({ competition: league.id, saison: league.saison, matchs: null, erreur: err.message, code: err.code, reessayerDansSec: err instanceof QuotaError ? err.retryAfterSec : null });
        }
      }
      return { date, activation: act, resultats: results };
    },
  };
}
