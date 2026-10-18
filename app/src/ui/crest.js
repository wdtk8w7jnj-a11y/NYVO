// Écussons fictifs dessinés en SVG (aucun logo réel).
import { raw } from './html.js';
import { TEAM } from '../data/catalog.js';

const SHIELD = 'M24 2.5 44 8.2V26c0 13.6-8.7 22.7-20 27.5C12.7 48.7 4 39.6 4 26V8.2z';

const EMBLEM = {
  fleur: (c) => `<g fill="${c}">
    <path d="M24 12.5c-3.4 4.1-3.8 8.9 0 15 3.8-6.1 3.4-10.9 0-15z"/>
    <path d="M22.4 27.4c-4.8 1-9.4-1.6-9-5.8.3-2.3 2.6-3.2 4.1-1.9-1.7.5-1.9 2.4-.4 3.4 1.6 1 3.7.7 5.3 1.7z"/>
    <path d="M25.6 27.4c4.8 1 9.4-1.6 9-5.8-.3-2.3-2.6-3.2-4.1-1.9 1.7.5 1.9 2.4.4 3.4-1.6 1-3.7.7-5.3 1.7z"/>
    <rect x="16.5" y="27.6" width="15" height="2.8" rx="1.2"/>
    <path d="M21.6 30.8h4.8l-1.1 6.4h-2.6z"/>
    <path d="M18.4 38.4c2.2-.2 3.6-1.3 4.2-2.6h2.8c.6 1.3 2 2.4 4.2 2.6-2 1.2-4.2 1.4-5.6.4-1.4 1-3.6.8-5.6-.4z"/></g>`,
  'stripes-star': (c) => `<g fill="${c}"><rect x="13.5" y="21" width="4.2" height="28"/><rect x="21.9" y="21" width="4.2" height="31"/><rect x="30.3" y="21" width="4.2" height="28"/>
    <rect x="9" y="18.6" width="30" height="1.6"/>
    <path d="m24 9.2 1.5 3.2 3.5.4-2.6 2.4.7 3.4-3.1-1.8-3.1 1.8.7-3.4-2.6-2.4 3.5-.4z"/></g>`,
  crown: (c) => `<g fill="${c}"><path d="m13.5 31.5 1.6-12 5.2 5.6L24 16.5l3.7 8.6 5.2-5.6 1.6 12z"/><rect x="13.5" y="33" width="21" height="3.2" rx="1"/><circle cx="24" cy="40.5" r="2.2"/></g>`,
  'cross-band': (c) => `<g fill="${c}"><rect x="20.8" y="10" width="6.4" height="40"/><rect x="8" y="22.5" width="32" height="6.4"/></g>`,
  bear: (c) => `<g fill="${c}"><ellipse cx="24" cy="33" rx="7.2" ry="6.4"/><circle cx="15.6" cy="24.6" r="2.8"/><circle cx="20.6" cy="20.6" r="2.8"/><circle cx="27.4" cy="20.6" r="2.8"/><circle cx="32.4" cy="24.6" r="2.8"/></g>`,
  cross: (c) => `<g fill="${c}"><path d="M21.2 12h5.6v11.2H38v5.6H26.8V44h-5.6V28.8H10v-5.6h11.2z"/><circle cx="24" cy="11.5" r="2.4"/><circle cx="24" cy="44.5" r="2.4"/><circle cx="9.5" cy="26" r="2.4"/><circle cx="38.5" cy="26" r="2.4"/></g>`,
  stripes: (c) => `<g fill="${c}"><rect x="12" y="6" width="4.6" height="46"/><rect x="21.7" y="3" width="4.6" height="51"/><rect x="31.4" y="6" width="4.6" height="46"/></g>`,
  ring: (c) => `<g><circle cx="24" cy="27" r="9.5" fill="none" stroke="${c}" stroke-width="4"/><circle cx="24" cy="27" r="3" fill="${c}"/></g>`,
  saltire: (c) => `<g stroke="${c}" stroke-width="6" stroke-linecap="round"><path d="M12 14 36 40M36 14 12 40"/></g>`,
  sun: (c) => `<g fill="${c}" stroke="${c}" stroke-width="2.2" stroke-linecap="round"><circle cx="24" cy="27" r="5.6" stroke="none"/><path d="M24 14.5v4M24 35.5v4M11.5 27h4m17 0h4M15.2 18.2l2.8 2.8m12 12 2.8 2.8m0-17.6L30 21M18 33l-2.8 2.8"/></g>`,
  tower: (c) => `<g fill="${c}"><path d="M16.5 44V21h3v-4h3v4h3v-4h3v4h3v23z"/><rect x="22" y="36" width="4" height="8" rx="2" fill="#0b1630"/></g>`,
};

let uid = 0;

export function crest(teamId, { size = 48 } = {}) {
  const t = TEAM[teamId];
  if (!t) return raw('');
  const { field, rim, emblem, ink } = t.crest;
  const id = `cg${++uid}`;
  const h = Math.round(size * 1.16);
  return raw(`<svg class="crest" width="${size}" height="${h}" viewBox="0 0 48 56" aria-hidden="true" focusable="false">
    <defs><clipPath id="${id}c"><path d="${SHIELD}"/></clipPath>
    <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient></defs>
    <path d="${SHIELD}" fill="${field}"/>
    <g clip-path="url(#${id}c)">${EMBLEM[emblem](ink)}<rect width="48" height="56" fill="url(#${id}g)"/></g>
    <path d="${SHIELD}" fill="none" stroke="${rim}" stroke-width="2.6"/>
    <path d="${SHIELD}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width=".6"/>
  </svg>`);
}
