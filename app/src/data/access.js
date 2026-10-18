// Catalogue fictif des services, offres et options, par pays.
// Une « correspondance vérifiée » relie une offre à des chaînes dans ce catalogue :
// elle n'authentifie jamais l'abonnement de l'utilisateur (offre déclarée).

export const SERVICES = [
  {
    id: 'vision-sport',
    name: 'Vision Sport Démo',
    desc: 'Chaînes et compétitions sportives.',
    site: 'https://vision-sport.example',
    countries: {
      FR: {
        verifiedAt: '2026-10-18T16:00:00Z',
        offers: [
          { id: 'essentiel', name: 'Pack Essentiel', channels: ['sd1'] },
          { id: 'football', name: 'Pack Football', channels: ['sd1', 'sd2'] },
        ],
        options: [{ id: 'sport-plus', name: 'Option Sport Plus', channels: ['sd3'], verified: true }],
      },
    },
  },
  {
    id: 'arena',
    name: 'Arena Démo',
    desc: 'Divertissement, documentaires et chaînes thématiques.',
    site: null,
    // Offres non référencées : la sélection reste « à préciser ».
    countries: { FR: { verifiedAt: null, offers: [], options: [] } },
  },
  {
    id: 'horizon',
    name: 'Horizon TV Démo',
    desc: 'Chaînes généralistes, séries et contenus à la demande.',
    site: null,
    countries: { FR: { verifiedAt: null, offers: [], options: [] } },
  },
];

export const SERVICE = Object.fromEntries(SERVICES.map((s) => [s.id, s]));

export const servicesIn = (country) => SERVICES.filter((s) => s.countries[country]);
