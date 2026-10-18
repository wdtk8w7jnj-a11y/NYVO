// Conversion d'un match API-Football vers le modèle NYVO.
// Règles : une donnée absente reste null (jamais 0) ; aucun diffuseur n'est déduit,
// API-Football ne fournissant pas les chaînes de diffusion.

const STATUS = {
  TBD: 'a-confirmer',
  NS: 'upcoming',
  '1H': 'live',
  HT: 'live',
  '2H': 'live',
  ET: 'live',
  BT: 'live',
  P: 'live',
  LIVE: 'live',
  SUSP: 'interrupted',
  INT: 'interrupted',
  FT: 'finished',
  AET: 'finished',
  PEN: 'finished',
  AWD: 'finished',
  WO: 'finished',
  PST: 'postponed',
  CANC: 'cancelled',
  ABD: 'abandoned',
};

const num = (v) => (Number.isInteger(v) ? v : null);

export function normalizeFixture(f) {
  const short = f?.fixture?.status?.short ?? null;
  const status = STATUS[short] || 'inconnu';
  const started = ['live', 'interrupted', 'finished', 'abandoned'].includes(status);
  const home = num(f?.goals?.home);
  const away = num(f?.goals?.away);
  const kickoff = f?.fixture?.date ? new Date(f.fixture.date).toISOString() : null;
  return {
    id: `af-${f?.fixture?.id}`,
    source: 'api-football',
    kickoff,
    status,
    providerStatus: short,
    statusLabel: f?.fixture?.status?.long ?? null,
    minute: status === 'live' || status === 'interrupted' ? num(f?.fixture?.status?.elapsed) : null,
    home: { id: f?.teams?.home?.id ?? null, name: f?.teams?.home?.name ?? null },
    away: { id: f?.teams?.away?.id ?? null, name: f?.teams?.away?.name ?? null },
    competition: { id: f?.league?.id ?? null, name: f?.league?.name ?? null, season: f?.league?.season ?? null, round: f?.league?.round ?? null },
    venue: f?.fixture?.venue?.name ?? null,
    // Score seulement si la rencontre a commencé et que les deux valeurs sont fournies.
    score: started && home !== null && away !== null ? [home, away] : null,
    broadcast: null,
  };
}
