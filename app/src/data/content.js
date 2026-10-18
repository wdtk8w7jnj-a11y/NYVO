// Actualités et vidéos fictives. Aucun contenu réel, aucune source externe.
// `nature` : officiel | rapporte | rumeur. `reveals` : rencontres dont le contenu
// dévoile le résultat ou des événements (masqué en mode sans spoilers).

export const NATURE_LABEL = {
  officiel: 'Officiel · Démo',
  rapporte: 'Information rapportée',
  rumeur: 'Rumeur',
};

export const ARTICLES = [
  {
    id: 'a1',
    title: 'Paris Atlas prépare son prochain rendez-vous',
    source: 'Club Démo',
    publishedAt: '2026-10-18T14:30:00Z',
    nature: 'officiel',
    teams: ['paris-atlas'],
    competitions: ['coupe-elite'],
    tags: ['europe'],
    art: { scene: 'training', team: 'paris-atlas' },
    body: [
      'Le groupe a retrouvé le terrain pour une séance consacrée aux automatismes collectifs avant la demi-finale de Coupe Élite.',
      'Ce texte est inventé pour tester la lecture d’un article, l’affichage de sa source et son enregistrement.',
    ],
  },
  {
    id: 'a4',
    title: 'La préparation de Paris Atlas',
    source: 'Rédaction Démo',
    publishedAt: '2026-10-18T18:20:00Z',
    nature: 'rapporte',
    teams: ['paris-atlas'],
    competitions: [],
    tags: [],
    art: { scene: 'squad', team: 'paris-atlas' },
    body: [
      'Récit fictif de la semaine de préparation, rédigé pour la démonstration.',
      'Aucune information de ce texte ne provient d’une source réelle.',
    ],
  },
  {
    id: 'a2',
    title: 'Le point sur la Coupe Élite',
    source: 'Rédaction Démo',
    publishedAt: '2026-10-18T13:00:00Z',
    nature: 'rapporte',
    teams: [],
    competitions: ['coupe-elite'],
    tags: ['europe'],
    art: { scene: 'trophy' },
    body: [
      'Les deux demi-finales de la Coupe Élite se jouent ce soir à 21:00 (heure de Paris).',
      'Article fictif : les horaires correspondent au jeu de données de démonstration.',
    ],
  },
  {
    id: 'a3',
    title: 'Milan Stella : une piste au milieu',
    source: 'Mercato Démo',
    publishedAt: '2026-10-18T12:20:00Z',
    nature: 'rumeur',
    unconfirmed: true,
    teams: ['milan-stella'],
    competitions: [],
    tags: ['mercato'],
    art: { scene: 'tactics' },
    body: [
      'Exemple fictif destiné à distinguer une rumeur d’une annonce officielle.',
      'Cette information n’est pas confirmée.',
    ],
  },
  {
    id: 'a5',
    title: 'Madrid Sol et Londres City se quittent dos à dos (1 – 1)',
    maskedTitle: 'Compte rendu : Madrid Sol – Londres City',
    source: 'Rédaction Démo',
    publishedAt: '2026-10-18T18:05:00Z',
    nature: 'rapporte',
    teams: ['madrid-sol', 'londres-city'],
    competitions: ['ligue-demo'],
    tags: [],
    reveals: ['mso-lci'],
    art: { scene: 'stadium' },
    body: [
      'Compte rendu fictif : les deux équipes se sont neutralisées (1 – 1).',
      'Le suivi détaillé de cette rencontre est limité dans la démonstration.',
    ],
  },
];

export const VIDEOS = [
  {
    id: 'v1',
    title: 'Dans les coulisses de Paris Atlas',
    source: 'Club Démo',
    sourceTeam: 'paris-atlas',
    publishedAt: '2026-10-18T10:00:00Z',
    duration: '02:18',
    kind: 'officielle',
    teams: ['paris-atlas'],
    art: { scene: 'training', team: 'paris-atlas' },
  },
  {
    id: 'v2',
    title: 'Le football au bord du terrain',
    source: 'Créateur Démo',
    publishedAt: '2026-10-18T09:00:00Z',
    duration: '01:42',
    kind: 'amateur',
    teams: [],
    art: { scene: 'sunset' },
  },
  {
    id: 'v3',
    title: 'But de Jules Martin à la 63e minute',
    maskedTitle: 'Moment fort : Paris Atlas – Milan Stella',
    source: 'Club Démo',
    sourceTeam: 'paris-atlas',
    publishedAt: '2026-10-18T20:15:00Z',
    duration: '00:48',
    kind: 'officielle',
    teams: ['paris-atlas', 'milan-stella'],
    reveals: ['pa-ms'],
    art: { scene: 'goal', team: 'paris-atlas' },
  },
  {
    id: 'v4',
    title: 'Dans les coulisses de l’entraînement',
    source: 'Créateur Démo',
    publishedAt: '2026-10-18T08:00:00Z',
    duration: '02:00',
    kind: 'amateur',
    teams: [],
    art: { scene: 'ball' },
  },
];

export const ARTICLE = Object.fromEntries(ARTICLES.map((a) => [a.id, a]));
export const VIDEO = Object.fromEntries(VIDEOS.map((v) => [v.id, v]));
