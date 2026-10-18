// Rencontres de démonstration. Heures en UTC (18/10/2026 : Paris = UTC+2).
// Une valeur `null` signifie « donnée non disponible », jamais zéro.

const VERIFIED = '2026-10-18T16:00:00Z'; // 18/10/2026 à 18:00, heure de Paris

export const MATCHES = [
  {
    id: 'pa-ms',
    home: 'paris-atlas',
    away: 'milan-stella',
    competition: 'coupe-elite',
    round: 'Demi-finale',
    venue: 'Stade des Lumières',
    kickoff: '2026-10-18T19:00:00Z',
    status: 'live',
    minute: 67,
    score: [2, 1],
    coverage: 'full',
    lastUpdate: '2026-10-18T20:24:00Z',
    events: [
      { minute: 63, type: 'goal', team: 'paris-atlas', player: 'Jules Martin', score: [2, 1], moment: true },
      { minute: 51, type: 'sub', team: 'paris-atlas', playerIn: 'L. Morel', playerOut: 'A. Diallo' },
      { minute: 38, type: 'goal', team: 'milan-stella', player: 'R. Conti', score: [1, 1], moment: true },
      { minute: 12, type: 'goal', team: 'paris-atlas', player: 'T. Blanc', score: [1, 0] },
    ],
    lineups: {
      status: 'officielle',
      home: {
        formation: '4-3-3',
        starters: [
          [1, 'N. Garnier', 'G'], [2, 'M. Petit', 'D'], [4, 'S. Roux', 'D'], [5, 'K. Mendy', 'D'], [3, 'E. Faure', 'D'],
          [6, 'A. Diallo', 'M'], [8, 'P. Lambert', 'M'], [10, 'T. Blanc', 'M'],
          [7, 'Y. Chevalier', 'A'], [9, 'Jules Martin', 'A'], [11, 'H. Benali', 'A'],
        ],
        bench: [[14, 'L. Morel', 'M'], [16, 'D. Perrin', 'G'], [18, 'O. Marchand', 'A']],
      },
      away: {
        formation: '4-2-3-1',
        starters: [
          [1, 'F. Russo', 'G'], [2, 'G. Ferri', 'D'], [5, 'L. Bassi', 'D'], [4, 'M. Greco', 'D'], [3, 'A. Fontana', 'D'],
          [6, 'S. Moretti', 'M'], [8, 'E. Galli', 'M'],
          [7, 'C. Longo', 'M'], [10, 'R. Conti', 'M'], [11, 'P. Serra', 'M'],
          [9, 'N. Rizzo', 'A'],
        ],
        bench: [[12, 'V. Gallo', 'G'], [14, 'T. Marino', 'M'], [17, 'F. Leone', 'A']],
      },
    },
    stats: {
      updatedMinute: 67,
      rows: [
        { label: 'Possession', home: 58, away: 42, unit: '%' },
        { label: 'Tirs', home: 12, away: 8 },
        { label: 'Tirs cadrés', home: 5, away: 3 },
        { label: 'Corners', home: 6, away: 2 },
        { label: 'Fautes', home: 9, away: 11 },
        { label: 'Buts attendus (xG)', home: null, away: null, definition: 'Probabilité cumulée que les tirs deviennent des buts.' },
        { label: 'Passes réussies', home: null, away: null },
      ],
    },
    broadcasts: {
      FR: {
        verifiedAt: VERIFIED,
        options: [
          { channel: 'sd1', format: 'Match intégral', medium: 'TV + streaming', access: 'Payant', subscription: true },
          { channel: 'sd2', format: 'Multiplex', medium: 'TV + streaming', access: 'Payant', subscription: true },
        ],
        schedule: [
          { at: '2026-10-18T18:30:00Z', kind: 'pre', channel: 'sd1' },
          { at: '2026-10-18T19:00:00Z', kind: 'match', channel: 'sd1' },
          { at: '2026-10-18T21:00:00Z', kind: 'post', channel: 'sd3', provisional: true },
        ],
      },
    },
  },
  {
    id: 'tr-nr',
    home: 'toulouse-rive',
    away: 'nice-riviera',
    competition: 'coupe-elite',
    round: 'Demi-finale',
    venue: null,
    kickoff: '2026-10-18T19:00:00Z',
    status: 'upcoming',
    coverage: 'full',
    broadcasts: {
      FR: {
        verifiedAt: VERIFIED,
        options: [{ channel: 'sd2', format: 'Match intégral', medium: 'Streaming', access: 'Payant', subscription: true }],
        schedule: [{ at: '2026-10-18T19:00:00Z', kind: 'match', channel: 'sd2', medium: 'Streaming' }],
      },
    },
  },
  {
    id: 'nl-se',
    home: 'nantes-loire',
    away: 'strasbourg-est',
    competition: 'ligue-demo',
    round: '9e journée',
    venue: null,
    kickoff: '2026-10-18T19:00:00Z',
    status: 'upcoming',
    coverage: 'full',
    broadcasts: {
      FR: {
        verifiedAt: VERIFIED,
        options: [{ channel: 'sd2', format: 'Match intégral', medium: 'Streaming', access: 'Payant', subscription: true }],
        schedule: [{ at: '2026-10-18T19:00:00Z', kind: 'match', channel: 'sd2', medium: 'Streaming' }],
      },
    },
  },
  {
    id: 'ln-bu',
    home: 'lyon-nord',
    away: 'berlin-union',
    competition: 'ligue-demo',
    round: '9e journée',
    venue: null,
    kickoff: '2026-10-18T19:00:00Z',
    status: 'upcoming',
    coverage: 'full',
    broadcasts: {
      FR: {
        verifiedAt: VERIFIED,
        options: [{ channel: 'sd2', format: 'Match intégral', medium: 'Streaming', access: 'Payant', subscription: true }],
        schedule: [
          { at: '2026-10-18T18:30:00Z', kind: 'pre', channel: 'sd2', medium: 'Streaming' },
          { at: '2026-10-18T19:00:00Z', kind: 'match', channel: 'sd2', medium: 'Streaming' },
          { at: '2026-10-18T21:00:00Z', kind: 'post', channel: 'sd2', medium: 'Streaming' },
        ],
      },
    },
  },
  {
    id: 'msp-lc',
    home: 'marseille-sport',
    away: 'lille-capitale',
    competition: 'ligue-demo',
    round: '9e journée',
    venue: null,
    kickoff: '2026-10-18T19:00:00Z',
    status: 'upcoming',
    coverage: 'full',
    // Aucune diffusion confirmée : la clé FR existe mais sans option.
    broadcasts: { FR: { verifiedAt: VERIFIED, options: [], schedule: [] } },
  },
  {
    id: 'mso-lci',
    home: 'madrid-sol',
    away: 'londres-city',
    competition: 'ligue-demo',
    round: '9e journée',
    venue: null,
    kickoff: '2026-10-18T16:00:00Z',
    status: 'finished',
    score: [1, 1],
    // Suivi limité : seul le score final est disponible.
    coverage: 'limited',
    broadcasts: {
      FR: {
        verifiedAt: VERIFIED,
        options: [{ channel: 'sd2', format: 'Match intégral', medium: 'TV + streaming', access: 'Payant', subscription: true }],
        schedule: [
          { at: '2026-10-18T15:30:00Z', kind: 'pre', channel: 'sd2' },
          { at: '2026-10-18T16:00:00Z', kind: 'match', channel: 'sd2' },
          { at: '2026-10-18T18:00:00Z', kind: 'post', channel: 'sd2' },
        ],
      },
    },
  },
  {
    id: 'lnf-msf',
    home: 'lyon-nord-f',
    away: 'milan-stella-f',
    competition: 'ligue-feminine-demo',
    round: '5e journée',
    venue: null,
    kickoff: '2026-10-19T17:00:00Z',
    status: 'upcoming',
    coverage: 'full',
    broadcasts: { FR: { verifiedAt: VERIFIED, options: [], schedule: [] } },
  },
];

export const MATCH = Object.fromEntries(MATCHES.map((m) => [m.id, m]));

// Classements et tableaux fictifs.
export const STANDINGS = {
  'ligue-demo': {
    note: 'Classement fictif avant les rencontres du 18 octobre.',
    legend: [
      { range: [1, 2], label: 'Qualification Coupe Élite (démo)' },
      { range: [8, 8], label: 'Barrage (démo)' },
    ],
    rows: [
      ['lyon-nord', 8, 18, 9],
      ['berlin-union', 8, 17, 7],
      ['madrid-sol', 8, 15, 4],
      ['marseille-sport', 8, 13, 2],
      ['londres-city', 8, 12, 1],
      ['nantes-loire', 8, 9, -4],
      ['lille-capitale', 8, 7, -8],
      ['strasbourg-est', 8, 5, -11],
    ],
  },
};

export const BRACKETS = {
  'coupe-elite': {
    note: 'Tableau fictif. Les tours précédents ne sont pas disponibles dans la démonstration.',
    rounds: [
      { name: 'Demi-finales', matches: ['pa-ms', 'tr-nr'] },
      { name: 'Finale', matches: [], placeholder: 'Vainqueur DF1 – Vainqueur DF2 · date non communiquée' },
    ],
  },
};
