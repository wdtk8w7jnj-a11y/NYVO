// Mes accès : correspondances entre les offres déclarées et les chaînes.
// Règle : seules l'offre et les options déclarées, vérifiées dans le catalogue du pays,
// produisent des chaînes incluses. Rien n'est ajouté automatiquement.
import { SERVICE, servicesIn } from '../data/access.js';
import { CHANNEL } from '../data/catalog.js';

export const emptyAccess = () => ({ services: {}, legacy: [] });

export function accessFor(prefs, country) {
  return prefs.access?.[country] || emptyAccess();
}

// Résumé des déclarations pour un pays.
//   verified : Map chaîne → { service, label } (correspondances vérifiées)
//   pending  : services sélectionnés sans correspondance vérifiable (offre à préciser…)
//   legacy   : chaînes cochées en V0.3, conservées comme accès historiques à préciser
export function declared(prefs, country, access = accessFor(prefs, country)) {
  const verified = new Map();
  const pending = [];
  const offers = [];
  for (const [serviceId, sel] of Object.entries(access.services)) {
    const service = SERVICE[serviceId];
    const entry = service?.countries[country];
    if (!entry) continue;
    const offer = entry.offers.find((o) => o.id === sel.offer);
    if (!offer || !entry.verifiedAt) {
      pending.push({ service, reason: offer ? 'non-verifiee' : 'offre-a-preciser' });
      continue;
    }
    const opts = entry.options.filter((o) => sel.options?.includes(o.id) && o.verified);
    const label = [offer.name, ...opts.map((o) => o.name)].join(' + ');
    offers.push({ service, offer, options: opts, label, verifiedAt: entry.verifiedAt });
    for (const ch of [...offer.channels, ...opts.flatMap((o) => o.channels)]) {
      if (!verified.has(ch)) verified.set(ch, { service, label });
    }
  }
  const legacy = access.legacy.filter((c) => CHANNEL[c]);
  return {
    verified,
    offers,
    pending,
    legacy,
    hasAny: Object.keys(access.services).length > 0 || legacy.length > 0,
    hasVerified: offers.length > 0,
  };
}

// État du filtre Mes accès, pour des messages précis.
export function accessState(d) {
  if (!d.hasAny) return 'aucune-preference';
  if (!d.hasVerified) return 'non-verifiee';
  return 'verifiee';
}

export function isChannelIncluded(channelId, d) {
  return d.verified.has(channelId);
}

export { servicesIn };
