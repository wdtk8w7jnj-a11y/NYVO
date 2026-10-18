// Drapeaux simplifiés des sept pays cibles.
import { raw } from './html.js';

const F = {
  FR: '<rect width="10" height="20" fill="#1f3fae"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#e5223c"/>',
  BE: '<rect width="10" height="20" fill="#111"/><rect x="10" width="10" height="20" fill="#f7d417"/><rect x="20" width="10" height="20" fill="#e5223c"/>',
  CH: '<rect width="30" height="20" fill="#e5223c"/><path d="M13 4.5h4v3.5h3.5v4H17v3.5h-4V12H9.5V8H13z" fill="#fff"/>',
  GB: '<rect width="30" height="20" fill="#13277a"/><path d="M0 0 30 20M30 0 0 20" stroke="#fff" stroke-width="4"/><path d="M0 0 30 20M30 0 0 20" stroke="#e5223c" stroke-width="1.4"/><path d="M15 0v20M0 10h30" stroke="#fff" stroke-width="6"/><path d="M15 0v20M0 10h30" stroke="#e5223c" stroke-width="3.4"/>',
  ES: '<rect width="30" height="20" fill="#d4122f"/><rect y="5" width="30" height="10" fill="#f7c20f"/>',
  IT: '<rect width="10" height="20" fill="#169b48"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#e5223c"/>',
  DE: '<rect width="30" height="6.7" fill="#111"/><rect y="6.7" width="30" height="6.6" fill="#dd1c2b"/><rect y="13.3" width="30" height="6.7" fill="#f7c20f"/>',
};

let uid = 0;
export function flag(code, { size = 28 } = {}) {
  const id = `fl${++uid}`;
  return raw(
    `<svg class="flag" width="${size}" height="${Math.round((size * 2) / 3)}" viewBox="0 0 30 20" aria-hidden="true" focusable="false"><defs><clipPath id="${id}"><rect width="30" height="20" rx="3.2"/></clipPath></defs><g clip-path="url(#${id})">${F[code] || ''}</g><rect width="30" height="20" rx="3.2" fill="none" stroke="#fff" stroke-opacity=".15"/></svg>`,
  );
}
