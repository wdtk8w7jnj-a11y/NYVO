// Programmes TV fictifs par pays de diffusion (heures en UTC ; 18/10/2026 : Paris = UTC+2).
// Chaque programme distingue le moment de la soirée (`phase`) de son format :
//   phase  : pre (avant-match) | match | post (après-match)
//   format : magazine | integral (match intégral) | multiplex
// Un multiplex est un seul programme qui couvre plusieurs rencontres (`matches`).
// `link` prépare l'accès au diffuseur : page du match (lien universel ouvrant l'application
// si elle est installée), puis site officiel en secours. Domaines réservés `.example`.

const SITE = 'https://vision-sport.example';

export const VERIFIED_AT = { FR: '2026-10-18T16:00:00Z' }; // 18:00, heure de Paris

export const PROGRAMMES = {
  FR: [
    { id: 'fr-pams-pre', at: '2026-10-18T18:30:00Z', channel: 'sd1', phase: 'pre', format: 'magazine', medium: 'TV + streaming', matches: ['pa-ms'], link: { matchPage: null, site: SITE } },
    { id: 'fr-pams-sd1', at: '2026-10-18T19:00:00Z', channel: 'sd1', phase: 'match', format: 'integral', medium: 'TV + streaming', matches: ['pa-ms'], link: { matchPage: `${SITE}/match/pa-ms`, site: SITE } },
    { id: 'fr-ce-multiplex', at: '2026-10-18T19:00:00Z', channel: 'sd2', phase: 'match', format: 'multiplex', medium: 'TV + streaming', matches: ['pa-ms', 'tr-nr'], link: { matchPage: `${SITE}/multiplex/coupe-elite`, site: SITE } },
    { id: 'fr-pams-post', at: '2026-10-18T21:00:00Z', channel: 'sd3', phase: 'post', format: 'magazine', medium: 'TV + streaming', provisional: true, matches: ['pa-ms'], link: { matchPage: null, site: SITE } },
    // Lien direct volontairement absent : démonstration de « Lien indisponible ».
    { id: 'fr-trnr-sd2', at: '2026-10-18T19:00:00Z', channel: 'sd2', phase: 'match', format: 'integral', medium: 'Streaming', matches: ['tr-nr'], link: { matchPage: null, site: SITE } },
    { id: 'fr-nlse-sd2', at: '2026-10-18T19:00:00Z', channel: 'sd2', phase: 'match', format: 'integral', medium: 'Streaming', matches: ['nl-se'], link: { matchPage: `${SITE}/match/nl-se`, site: SITE } },
    { id: 'fr-lnbu-pre', at: '2026-10-18T18:30:00Z', channel: 'sd2', phase: 'pre', format: 'magazine', medium: 'Streaming', matches: ['ln-bu'], link: { matchPage: null, site: SITE } },
    { id: 'fr-lnbu-sd2', at: '2026-10-18T19:00:00Z', channel: 'sd2', phase: 'match', format: 'integral', medium: 'Streaming', matches: ['ln-bu'], link: { matchPage: `${SITE}/match/ln-bu`, site: SITE } },
    { id: 'fr-lnbu-post', at: '2026-10-18T21:00:00Z', channel: 'sd2', phase: 'post', format: 'magazine', medium: 'Streaming', matches: ['ln-bu'], link: { matchPage: null, site: SITE } },
    { id: 'fr-msolci-pre', at: '2026-10-18T15:30:00Z', channel: 'sd2', phase: 'pre', format: 'magazine', medium: 'TV + streaming', matches: ['mso-lci'], link: { matchPage: null, site: SITE } },
    { id: 'fr-msolci-sd2', at: '2026-10-18T16:00:00Z', channel: 'sd2', phase: 'match', format: 'integral', medium: 'TV + streaming', matches: ['mso-lci'], link: { matchPage: `${SITE}/match/mso-lci`, site: SITE } },
    { id: 'fr-msolci-post', at: '2026-10-18T18:00:00Z', channel: 'sd2', phase: 'post', format: 'magazine', medium: 'TV + streaming', matches: ['mso-lci'], link: { matchPage: null, site: SITE } },
  ],
};

// Rencontres suivies dans le pays sans diffuseur confirmé (≠ non diffusées).
export const UNCONFIRMED = { FR: ['msp-lc', 'lnf-msf'] };

export const PROGRAMME = Object.fromEntries(Object.values(PROGRAMMES).flat().map((p) => [p.id, p]));
