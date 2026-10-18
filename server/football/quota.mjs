// Garde-fou de quota API-Football.
// - Journée comptée en UTC (le fournisseur réinitialise le quota à 00:00 UTC).
// - Budget NYVO inférieur au quota du plan, pour garder une marge.
// - Fenêtre glissante d'une minute pour la limite par minute.
// - Compteur persistant sur disque : un redémarrage ne remet pas le compteur à zéro.
// - Recalage sur les en-têtes du fournisseur quand ils sont présents.
import { mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { dirname } from 'node:path';

export class QuotaError extends Error {
  constructor(message, code, retryAfterSec) {
    super(message);
    this.code = code;
    this.retryAfterSec = retryAfterSec;
  }
}

export const utcDay = (now) => new Date(now).toISOString().slice(0, 10);

export function createQuota({ file, dailyLimit, dailyBudget, perMinute, now = () => Date.now() }) {
  let state = load();
  const minute = [];

  function load() {
    try {
      const s = JSON.parse(readFileSync(file, 'utf8'));
      if (s && typeof s.day === 'string' && Number.isInteger(s.used)) return s;
    } catch {
      /* premier démarrage ou fichier illisible */
    }
    return { day: utcDay(now()), used: 0, providerRemaining: null, providerLimit: null };
  }

  function save() {
    mkdirSync(dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    writeFileSync(tmp, JSON.stringify(state));
    renameSync(tmp, file);
  }

  function roll() {
    const today = utcDay(now());
    if (state.day !== today) state = { day: today, used: 0, providerRemaining: null, providerLimit: null };
  }

  const remaining = () => {
    roll();
    const local = dailyBudget - state.used;
    // Le fournisseur fait foi s'il annonce moins que notre estimation (marge comprise).
    const provider = state.providerRemaining === null ? Infinity : state.providerRemaining - (dailyLimit - dailyBudget);
    return Math.max(0, Math.min(local, provider));
  };

  return {
    // Réserve une requête ; lève QuotaError si le budget ou la limite par minute est atteint.
    reserve() {
      roll();
      const t = now();
      while (minute.length && t - minute[0] >= 60_000) minute.shift();
      if (remaining() <= 0) {
        const reset = Date.parse(`${state.day}T00:00:00Z`) + 86_400_000;
        throw new QuotaError('Budget quotidien NYVO atteint : aucune nouvelle requête avant 00:00 UTC.', 'quota-jour', Math.ceil((reset - t) / 1000));
      }
      if (minute.length >= perMinute) {
        throw new QuotaError('Limite par minute atteinte : nouvelle tentative plus tard.', 'quota-minute', Math.ceil((60_000 - (t - minute[0])) / 1000));
      }
      minute.push(t);
      state.used += 1;
      save();
    },
    // En-têtes API-Football : x-ratelimit-requests-limit / x-ratelimit-requests-remaining.
    syncFromHeaders(headers) {
      roll();
      const rem = Number.parseInt(headers.get?.('x-ratelimit-requests-remaining') ?? '', 10);
      const lim = Number.parseInt(headers.get?.('x-ratelimit-requests-limit') ?? '', 10);
      if (Number.isFinite(rem)) state.providerRemaining = rem;
      if (Number.isFinite(lim)) state.providerLimit = lim;
      if (Number.isFinite(rem) || Number.isFinite(lim)) save();
    },
    // Réponse de /status : requests.current fait foi pour la consommation du jour.
    syncFromStatus(current, limitDay) {
      roll();
      if (Number.isInteger(current)) {
        state.used = Math.max(state.used, current);
        if (Number.isInteger(limitDay)) state.providerRemaining = Math.max(0, limitDay - current);
        save();
      }
    },
    snapshot() {
      roll();
      return {
        jourUtc: state.day,
        utiliseesParNyvo: state.used,
        budgetNyvo: dailyBudget,
        restantesPourNyvo: remaining(),
        quotaFournisseur: state.providerLimit ?? dailyLimit,
        restantesSelonFournisseur: state.providerRemaining,
        requetesDerniereMinute: minute.filter((x) => now() - x < 60_000).length,
        limiteParMinute: perMinute,
      };
    },
  };
}
