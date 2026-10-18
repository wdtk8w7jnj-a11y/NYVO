// Visuels d'illustration vectoriels pour les contenus fictifs.
// Ils remplacent les photographies des maquettes : aucune image réelle n'est utilisée.
import { raw } from './html.js';
import { TEAM } from '../data/catalog.js';

let uid = 0;

function shirt(x, y, s, color, stroke) {
  return `<path transform="translate(${x} ${y}) scale(${s})" d="M-14-20-26-13l-5 12 9 4V22h44V3l9-4-5-12-12-7c-2 5-7 8-14 8s-12-3-14-8z" fill="${color}" stroke="${stroke}" stroke-width="1.5"/>`;
}

const SCENES = {
  training: (t) => `${cones()}${shirt(110, 92, 1.25, t.field, '#0008')}${shirt(205, 100, 1, t.field, '#0008')}`,
  squad: (t) => `${shirt(80, 100, 1, t.field, '#0008')}${shirt(160, 92, 1.3, t.field, '#0008')}${shirt(240, 100, 1, t.field, '#0008')}`,
  trophy: () => `<g transform="translate(160 86)"><path d="M-24-44h48v26c0 16-10 26-24 28-14-2-24-12-24-28z" fill="url(#silver)"/><path d="M-24-36h-12c0 14 6 22 14 22M24-36h12c0 14-6 22-14 22" fill="none" stroke="#cfd3dc" stroke-width="4"/><rect x="-6" y="10" width="12" height="18" fill="#b8bcc6"/><rect x="-22" y="28" width="44" height="10" rx="2" fill="#8e919b"/></g>`,
  tactics: () => `<g transform="translate(160 84) rotate(-4)"><rect x="-70" y="-50" width="140" height="96" rx="4" fill="#e9ebef"/><path d="M0-50v96M-70-2h140" stroke="#9aa" stroke-width="1.2"/><circle r="12" fill="none" stroke="#9aa" stroke-width="1.2"/>
    <g stroke="#d4122f" stroke-width="3" stroke-linecap="round"><path d="m-48-28 8 8m0-8-8 8M-30 14l8 8m0-8-8 8M18-30l8 8m0-8-8 8"/></g>
    <g fill="none" stroke="#1f3f95" stroke-width="3"><circle cx="40" cy="-6" r="5"/><circle cx="-12" cy="28" r="5"/><circle cx="50" cy="26" r="5"/></g>
    <path d="M-30 18c20-10 40-30 60-24" fill="none" stroke="#1f3f95" stroke-width="2" stroke-dasharray="4 4"/></g>`,
  stadium: () => `<g fill="none" stroke="#ffffff" stroke-opacity=".14" stroke-width="10">${[0, 1, 2, 3].map((i) => `<path d="M-20 ${70 - i * 14}C80 ${40 - i * 14} 240 ${40 - i * 14} 340 ${70 - i * 14}"/>`).join('')}</g>`,
  sunset: () => `<circle cx="250" cy="76" r="26" fill="#ffb36b" opacity=".85"/><g fill="#06080a">${[40, 80, 120, 300].map((x) => `<path d="M${x} 104c-4-20-2-40 8-56 10 16 12 36 8 56z"/>`).join('')}</g>`,
  goal: () => `<g transform="translate(160 80)"><path d="M-80-30h160v62" fill="none" stroke="#f5f5f7" stroke-width="5"/><path d="M-80-30v62" stroke="#f5f5f7" stroke-width="5"/><g stroke="#ffffff" stroke-opacity=".25">${Array.from({ length: 15 }, (_, i) => `<path d="M${-78 + i * 11}-28v58"/>`).join('')}${Array.from({ length: 6 }, (_, i) => `<path d="M-78 ${-28 + i * 11}h156"/>`).join('')}</g>${ball(40, 18, 9)}</g>`,
  ball: () => `${ball(262, 132, 18)}${cones()}`,
};

function cones() {
  return [70, 130, 250, 290].map((x, i) => `<path d="M${x} ${120 + (i % 2) * 6}l7-16 7 16z" fill="#f2c230"/>`).join('');
}

function ball(cx, cy, r) {
  return `<g transform="translate(${cx} ${cy})"><circle r="${r}" fill="#f7f7f8" stroke="#222" stroke-width="1"/><path d="m0 ${-r * 0.42} ${r * 0.4} ${r * 0.29}-${r * 0.15} ${r * 0.47}h-${r * 0.5}l-${r * 0.15}-${r * 0.47}z" fill="#1a1a1a"/></g>`;
}

export function art(spec = {}, { label } = {}) {
  const id = `ar${++uid}`;
  const team = spec.team ? TEAM[spec.team].crest : { field: '#1f3f95' };
  const sky = spec.scene === 'sunset' ? ['#3a1420', '#a8452e'] : ['#0d1626', '#1c2a3d'];
  const scene = (SCENES[spec.scene] || SCENES.stadium)(team);
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return raw(`<svg class="art" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" ${a11y} focusable="false">
  <defs>
    <linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient>
    <linearGradient id="${id}p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f6a37"/><stop offset="1" stop-color="#143a1d"/></linearGradient>
    <radialGradient id="${id}l" cx=".85" cy="0" r=".7"><stop offset="0" stop-color="#ff2d55" stop-opacity=".35"/><stop offset="1" stop-color="#ff2d55" stop-opacity="0"/></radialGradient>
    <linearGradient id="silver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f5f8"/><stop offset="1" stop-color="#8f939e"/></linearGradient>
  </defs>
  <rect width="320" height="180" fill="url(#${id}s)"/>
  <path d="M0 104h320v76H0z" fill="url(#${id}p)"/>
  <g stroke="#fff" stroke-opacity=".16" stroke-width="1.4" fill="none"><path d="M-40 180 110 104M360 180 210 104M0 140h320"/><ellipse cx="160" cy="140" rx="60" ry="14"/></g>
  ${scene}
  <rect width="320" height="180" fill="url(#${id}l)"/>
  </svg>`);
}
