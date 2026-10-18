// Gabarits HTML échappés par défaut. `raw()` marque un fragment déjà sûr.
class Raw {
  constructor(s) {
    this.s = s;
  }
  toString() {
    return this.s;
  }
}

export const raw = (s) => new Raw(String(s));

const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => MAP[c]);

// Les booléens s'écrivent « true »/« false » (attributs ARIA) ; null/undefined sont omis.
function toHtml(v) {
  if (v === null || v === undefined) return '';
  if (v === true || v === false) return String(v);
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(toHtml).join('');
  return esc(v);
}

export function h(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += toHtml(values[i]) + strings[i + 1];
  return new Raw(out);
}

// Attribut booléen ou valué : attr('aria-pressed', true) → aria-pressed="true"
export const attr = (name, value) => (value === undefined || value === null || value === false ? '' : raw(` ${name}="${esc(value === true ? 'true' : value)}"`));
