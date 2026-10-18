// Icônes vectorielles au trait (24×24), dessinées pour NYVO.
import { raw } from './html.js';

const P = {
  home: '<path d="M3.5 10.6 12 3.5l8.5 7.1V20a1 1 0 0 1-1 1H15v-6.2H9V21H4.5a1 1 0 0 1-1-1z"/>',
  ball: '<circle cx="12" cy="12" r="9"/><path d="m12 8.3 3.3 2.4-1.3 3.9h-4l-1.3-3.9z"/><path d="M12 8.3V3.2m3.3 7.5 4.6-1.6M14 14.6l2.8 3.9M10 14.6l-2.8 3.9m1.5-7.8L4.1 9.1"/>',
  news: '<rect x="4" y="3" width="16" height="18" rx="2.2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  video: '<rect x="2.8" y="4.8" width="18.4" height="14.4" rx="2.6"/><path d="M10 9.1v5.8l4.9-2.9z" fill="currentColor"/>',
  star: '<path d="m12 3.4 2.65 5.4 5.95.86-4.3 4.2 1.02 5.92L12 17l-5.32 2.8 1.02-5.93-4.3-4.2 5.95-.86z"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.6"/><path d="m15.7 15.7 4.8 4.8"/>',
  settings: '<circle cx="12" cy="12" r="3.1"/><path d="M12 2.8 13.7 5l2.7-.5.9 2.6 2.6.9-.5 2.7 2.2 1.7-2.2 1.7.5 2.7-2.6.9-.9 2.6-2.7-.5L12 21.2 10.3 19l-2.7.5-.9-2.6-2.6-.9.5-2.7L2.4 12l2.2-1.7-.5-2.7 2.6-.9.9-2.6 2.7.5z"/>',
  'chevron-right': '<path d="m9 5 7 7-7 7"/>',
  'chevron-left': '<path d="m15 5-7 7 7 7"/>',
  'chevron-down': '<path d="m5 9 7 7 7-7"/>',
  'chevron-up': '<path d="m5 15 7-7 7 7"/>',
  'arrow-left': '<path d="M19.5 12h-15m6-6-6 6 6 6"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.2"/><path d="M3.5 10h17M8 3v4m8-4v4"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" stroke-width="2.4"/>',
  tv: '<rect x="2.8" y="4.3" width="18.4" height="12.4" rx="2"/><path d="M9 20.5h6m-3-3.8v3.8"/>',
  trophy: '<path d="M7.2 3.8h9.6v5.4a4.8 4.8 0 0 1-9.6 0z"/><path d="M7.2 5.6H4v1.6a3.6 3.6 0 0 0 3.6 3.6m9.2-5.2H20v1.6a3.6 3.6 0 0 1-3.6 3.6M12 14v3.4m-3.6 3.4h7.2m-5.9-3.4h4.6"/>',
  bell: '<path d="M6 16.2V11a6 6 0 0 1 12 0v5.2l1.6 2H4.4z"/><path d="M10 20.6a2 2 0 0 0 4 0"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  'eye-off': '<path d="m3 3 18 18"/><path d="M10.6 6.1A10 10 0 0 1 12 6c5 0 8.6 4 9.5 6-.5 1-1.5 2.4-3 3.7M6.5 7.6C4.6 8.9 3.2 10.7 2.5 12c1 2 4.5 6 9.5 6 1.6 0 3-.4 4.3-1"/><path d="M9.9 10a3 3 0 0 0 4.1 4.1"/>',
  eye: '<path d="M2.5 12c1-2 4.5-6 9.5-6s8.5 4 9.5 6c-1 2-4.5 6-9.5 6s-8.5-4-9.5-6z"/><circle cx="12" cy="12" r="3"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
  'wifi-off': '<path d="m3 3 18 18"/><path d="M8.6 16.4a5 5 0 0 1 6.8 0M5 12.9a10 10 0 0 1 4.9-2.6m4.4.1A10 10 0 0 1 19 12.9M1.9 9.4a15 15 0 0 1 4.3-2.6m4.3-1.2A15 15 0 0 1 22.1 9.4"/><circle cx="12" cy="19.6" r=".9" fill="currentColor"/>',
  external: '<path d="M14 4h6v6m0-6-8.5 8.5"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.4 2"/>',
  bookmark: '<path d="M6.5 3.5h11v17l-5.5-4-5.5 4z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  cloud: '<path d="M7 18.5h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9.1 4.75 4.75 0 0 0 7 18.5z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  shirt: '<path d="M8.2 3.5 4 6 2.6 10.2l3 1.3v9h12.8v-9l3-1.3L20 6l-4.2-2.5c-.5 1.6-2 2.5-3.8 2.5s-3.3-.9-3.8-2.5z"/>',
  swap: '<path d="M4 8.5h14m-3.5-3.5L18 8.5 14.5 12M20 15.5H6m3.5-3.5L6 15.5 9.5 19"/>',
  'swap-in': '<path d="M4 8.5h14m-3.5-3.5L18 8.5 14.5 12"/>',
  'swap-out': '<path d="M20 15.5H6m3.5-3.5L6 15.5 9.5 19"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6M12 16.8v.3"/>',
  refresh: '<path d="M20 11.5a8 8 0 1 1-2.4-5.7L20 8"/><path d="M20 3.5V8h-4.5"/>',
  expand: '<path d="M4 9V4h5m11 5V4h-5M4 15v5h5m11-5v5h-5"/>',
  trash: '<path d="M4 7h16M9.5 7V4.5h5V7m-8 0 1 13h9l1-13"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
  whistle: '<circle cx="9" cy="14" r="5"/><path d="M12.5 10.5 21 6v4.5l-6 1.5"/>',
  card: '<rect x="7" y="3.5" width="10" height="17" rx="1.6"/>',
  pitch: '<rect x="2.5" y="5" width="19" height="14" rx="1.5"/><path d="M12 5v14"/><circle cx="12" cy="12" r="2.6"/><path d="M2.5 9h3v6h-3m19-6h-3v6h3"/>',
  list: '<path d="M8.5 6.5h12m-12 5.5h12m-12 5.5h12"/><path d="M4 6.5h.01M4 12h.01M4 17.5h.01" stroke-width="2.6"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3.6-3.6a4 4 0 0 0-5.7-5.7l-1.1 1.1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3.6 3.6a4 4 0 0 0 5.7 5.7l1.1-1.1"/>',
  'link-off': '<path d="M15.5 13.3 19.3 9.5a4 4 0 0 0-5.7-5.7l-1.6 1.6M8.5 10.7 4.7 14.5a4 4 0 0 0 5.7 5.7l1.6-1.6"/><path d="m3 3 18 18"/>',
  phone: '<rect x="7" y="2.8" width="10" height="18.4" rx="2.2"/><path d="M11 18h2"/>',
  flag: '<path d="M5 21V4h11l-1.5 4L16 12H5"/>',
  sliders: '<path d="M4 7h10m4 0h2M4 17h4m4 0h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
};

export function icon(name, { size = 24, label, cls = '', fill = false } = {}) {
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
  return raw(
    `<svg class="icon ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ${a11y}>${P[name] || ''}</svg>`,
  );
}

export const ICON_NAMES = Object.keys(P);
