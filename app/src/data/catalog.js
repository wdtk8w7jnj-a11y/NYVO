// Catalogue de démonstration NYVO. Toutes les entités sont fictives.
// Les noms et visuels reprennent les maquettes validées (01_MAQUETTES_VALIDEES).

export const DEMO_DATE = '2026-10-18';
// Horloge figée de la démonstration (67e minute de Paris Atlas – Milan Stella).
export const DEMO_NOW = '2026-10-18T20:22:00Z';

export const COUNTRIES = [
  { id: 'FR', name: 'France', tz: 'Europe/Paris', city: 'Paris' },
  { id: 'BE', name: 'Belgique', tz: 'Europe/Brussels', city: 'Bruxelles' },
  { id: 'CH', name: 'Suisse', tz: 'Europe/Zurich', city: 'Zurich' },
  { id: 'GB', name: 'Royaume-Uni', tz: 'Europe/London', city: 'Londres' },
  { id: 'ES', name: 'Espagne', tz: 'Europe/Madrid', city: 'Madrid' },
  { id: 'IT', name: 'Italie', tz: 'Europe/Rome', city: 'Rome' },
  { id: 'DE', name: 'Allemagne', tz: 'Europe/Berlin', city: 'Berlin' },
];

// Les équipes masculines et féminines ont des identifiants distincts
// (planche 07 : Milan Stella « Équipe féminine » ; planche 08 : Milan Stella
// « Équipe masculine » et Lyon Nord « Équipe féminine »).
export const TEAMS = [
  { id: 'paris-atlas', name: 'Paris Atlas', gender: 'M', aliases: ['PA', 'Atlas'], crest: { field: '#1f3f95', rim: '#e9772d', emblem: 'fleur', ink: '#ffffff' } },
  { id: 'milan-stella', name: 'Milan Stella', gender: 'M', aliases: ['MS', 'Stella'], crest: { field: '#d4122f', rim: '#ffffff', emblem: 'stripes-star', ink: '#ffffff' } },
  { id: 'milan-stella-f', name: 'Milan Stella', gender: 'F', aliases: ['MSF', 'Stella'], crest: { field: '#d4122f', rim: '#ffffff', emblem: 'stripes-star', ink: '#ffffff' } },
  { id: 'lyon-nord-f', name: 'Lyon Nord', gender: 'F', aliases: ['LNF'], crest: { field: '#4b2380', rim: '#ffffff', emblem: 'crown', ink: '#ffffff' } },
  { id: 'lyon-nord', name: 'Lyon Nord', gender: 'M', aliases: ['LN'], crest: { field: '#1f3f95', rim: '#ffffff', emblem: 'cross-band', ink: '#e01a3c' } },
  { id: 'berlin-union', name: 'Berlin Union', gender: 'M', aliases: ['BU', 'Union'], crest: { field: '#f2c230', rim: '#141414', emblem: 'bear', ink: '#141414' } },
  { id: 'toulouse-rive', name: 'Toulouse Rive', gender: 'M', aliases: ['TR'], crest: { field: '#6b2bb8', rim: '#ffffff', emblem: 'cross', ink: '#ffffff' } },
  { id: 'nice-riviera', name: 'Nice Riviera', gender: 'M', aliases: ['NR'], crest: { field: '#f07a1a', rim: '#ffffff', emblem: 'stripes', ink: '#ffffff' } },
  { id: 'nantes-loire', name: 'Nantes Loire', gender: 'M', aliases: ['NL'], crest: { field: '#f4d21c', rim: '#1d7a3a', emblem: 'stripes', ink: '#1d7a3a' } },
  { id: 'strasbourg-est', name: 'Strasbourg Est', gender: 'M', aliases: ['SE'], crest: { field: '#ffffff', rim: '#d4122f', emblem: 'ring', ink: '#1f6fd1' } },
  { id: 'marseille-sport', name: 'Marseille Sport', gender: 'M', aliases: ['MSP'], crest: { field: '#ffffff', rim: '#1f8de0', emblem: 'saltire', ink: '#1f8de0' } },
  { id: 'lille-capitale', name: 'Lille Capitale', gender: 'M', aliases: ['LC'], crest: { field: '#d4122f', rim: '#ffffff', emblem: 'stripes-star', ink: '#ffffff' } },
  { id: 'madrid-sol', name: 'Madrid Sol', gender: 'M', aliases: ['MSO'], crest: { field: '#f5f5f5', rim: '#7a1f3d', emblem: 'sun', ink: '#7a1f3d' } },
  { id: 'londres-city', name: 'Londres City', gender: 'M', aliases: ['LCI'], crest: { field: '#13254d', rim: '#9fb4d9', emblem: 'tower', ink: '#9fb4d9' } },
];

export const COMPETITIONS = [
  { id: 'coupe-elite', name: 'Coupe Élite', kind: 'cup', subtitle: 'Compétition de démonstration', aliases: ['CE'] },
  { id: 'ligue-demo', name: 'Ligue Démo', kind: 'league', subtitle: 'Championnat', aliases: ['LD'] },
  { id: 'ligue-feminine-demo', name: 'Ligue Féminine Démo', kind: 'league', subtitle: 'Championnat féminin', aliases: ['LFD'] },
];

export const PLAYERS = [
  { id: 'jules-martin', name: 'Jules Martin', team: 'paris-atlas', position: 'Attaquant', aliases: ['JM'] },
  { id: 't-blanc', name: 'T. Blanc', team: 'paris-atlas', position: 'Milieu', aliases: [] },
  { id: 'r-conti', name: 'R. Conti', team: 'milan-stella', position: 'Milieu offensif', aliases: [] },
  { id: 'l-morel', name: 'L. Morel', team: 'paris-atlas', position: 'Milieu', aliases: [] },
];

// Chaînes fictives. Les accès (gratuit/payant) sont des valeurs de démonstration.
export const CHANNELS = [
  { id: 'sd1', name: 'Sport Démo 1', access: 'Payant', destination: 'site de Sport Démo', aliases: ['SD1'] },
  { id: 'sd2', name: 'Sport Démo 2', access: 'Payant', destination: 'site de Sport Démo', aliases: ['SD2'] },
  { id: 'sd3', name: 'Sport Démo 3', access: 'Gratuit', destination: 'site de Sport Démo', aliases: ['SD3'] },
];

const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
export const TEAM = byId(TEAMS);
export const COMPETITION = byId(COMPETITIONS);
export const PLAYER = byId(PLAYERS);
export const CHANNEL = byId(CHANNELS);
export const COUNTRY = byId(COUNTRIES);

export const genderLabel = (team) => (team.gender === 'F' ? 'Équipe féminine' : 'Équipe masculine');

// Ordre des exemples proposés au premier lancement (planche 08).
export const ONBOARDING_TEAMS = ['paris-atlas', 'milan-stella', 'lyon-nord-f', 'berlin-union'];
