// Formatage des dates et heures dans le fuseau du pays de diffusion.
import { DEMO_DATE, DEMO_NOW } from '../data/catalog.js';

const cache = new Map();
function fmt(tz, opts) {
  const key = tz + JSON.stringify(opts);
  if (!cache.has(key)) cache.set(key, new Intl.DateTimeFormat('fr-FR', { timeZone: tz, ...opts }));
  return cache.get(key);
}

export function time(iso, tz) {
  return fmt(tz, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
}

// Clé AAAA-MM-JJ du jour local dans le fuseau donné.
export function dayKey(iso, tz) {
  const parts = Object.fromEntries(
    fmt(tz, { year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function addDays(key, n) {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function isValidDayKey(key) {
  return typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key) && !Number.isNaN(Date.parse(`${key}T12:00:00Z`));
}

const longDay = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const shortDay = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

export function dayLabel(key) {
  const diff = Math.round((Date.parse(`${key}T12:00:00Z`) - Date.parse(`${DEMO_DATE}T12:00:00Z`)) / 864e5);
  if (diff === 0) return 'Aujourd’hui · Démo';
  if (diff === 1) return 'Demain · Démo';
  if (diff === -1) return 'Hier · Démo';
  return shortDay.format(new Date(`${key}T12:00:00Z`));
}

export function longDayLabel(key) {
  const s = longDay.format(new Date(`${key}T12:00:00Z`));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// « 18 oct., 16:30 »
export function shortDateTime(iso, tz) {
  const d = fmt(tz, { day: 'numeric', month: 'short' }).format(new Date(iso));
  return `${d}, ${time(iso, tz)}`;
}

export function shortDate(iso, tz) {
  return fmt(tz, { day: 'numeric', month: 'short' }).format(new Date(iso));
}

// « 18/10/2026 à 18:00 »
export function verifiedLabel(iso, tz) {
  const d = fmt(tz, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
  return `${d} à ${time(iso, tz)}`;
}

// « Il y a 2 h » par rapport à l'horloge de démonstration.
export function relative(iso, tz) {
  const min = Math.round((Date.parse(DEMO_NOW) - Date.parse(iso)) / 6e4);
  if (min >= 0 && min < 60) return `Il y a ${Math.max(1, min)} min`;
  if (min >= 60 && min < 24 * 60) return `Il y a ${Math.round(min / 60)} h`;
  return shortDateTime(iso, tz);
}
