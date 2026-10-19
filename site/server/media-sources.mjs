// Editorial identity checks, 19 October 2026. Identity does not establish
// per-video match association, embed permission or availability in France.
const verifiedAt = '2026-10-19';

export const VERIFIED_CHANNELS = [
  {
    id: 'premier-league', channelId: 'UCG5qGWdu8nIRZqJ_GgDwQ-w',
    name: 'Premier League', league: 2021, language: 'en', verifiedAt,
    proofUrl: 'https://www.premierleague.com/en/news/2168405',
    identityVerified: true,
  },
  {
    id: 'laliga', channelId: 'UCTv-XvfzLX3i4IGWAm4sbmA',
    name: 'LALIGA', league: 2014, language: 'es', verifiedAt,
    proofUrl: 'https://www.laliga.com/en-US/news/la-liga-channel-surpasses-100-million-youtube-views',
    identityVerified: true,
  },
  {
    id: 'serie-a', channelId: 'UCBJeMCIeLQos7wacox4hmLQ',
    name: 'Serie A', league: 2019, language: 'it', verifiedAt,
    proofUrl: 'https://www.legaseriea.it/serie-a/videos/youtube/a-tu-per-tu-con-emil-holm',
    identityVerified: true,
  },
  {
    id: 'ge-globo', channelId: 'UCgCKagVhzGnZcuP9bSMgMCg',
    name: 'ge tv', league: 2013, language: 'pt', verifiedAt,
    proofUrl: 'https://ge.globo.com/google/amp/futebol/noticia/ge-chega-ao-you-tube-com-melhores-momentos-das-partidas-e-videos-exclusivos.ghtml',
    identityVerified: true,
    channelUrl: 'https://www.youtube.com/geglobo',
    note: 'Utiliser le lien geglobo : youtube.com/ge appartient désormais à un autre éditeur.',
  },
  {
    id: 'bundesliga', channelId: 'UC6UL29enLNe4mqwTfAyeNuw',
    name: 'Bundesliga', league: 2002, language: 'en', verifiedAt,
    proofUrl: 'https://www.bundesliga.com/en/bundesliga',
    identityVerified: true,
  },
];

// These publisher channels have confirmed YouTube metadata, but no reciprocal
// publisher-to-channel link was established in this audit. Do not activate
// automatically on the strength of a display name or a TV-rights agreement.
export const SOURCE_CANDIDATES = [
  {
    id: 'dazn-france', channelId: 'UC3ABnxyYGryqn2bSLyQKkYQ',
    name: 'DAZN France', league: 2019, language: 'fr', verifiedAt,
    status: 'identity-review', identityVerified: false,
    proofUrl: 'https://www.youtube.com/channel/UC3ABnxyYGryqn2bSLyQKkYQ',
    evidenceUrls: ['https://www.youtube.com/@daznfrance', 'https://www.dazn.com/fr-FR/help/articles/20576942203421-quels-sports-puis-je-regarder-sur-dazn-en-france'],
    note: 'Métadonnées et badge YouTube vérifiés ; lien réciproque éditeur à confirmer. Droits TV distincts des droits vidéo.',
  },
  {
    id: 'dazn-italia', channelId: 'UC7N8IuYFhU8Hs1ruCTsXTbg',
    name: 'DAZN Italia', league: 2019, language: 'it', verifiedAt,
    status: 'identity-review', identityVerified: false,
    proofUrl: 'https://www.youtube.com/@daznit',
    evidenceUrls: ['https://www.youtube.com/@daznit', 'https://www.dazn.com/it-IT/home'],
    note: 'Métadonnées et lien vers DAZN confirmés ; lien réciproque éditeur et disponibilité territoriale à vérifier.',
  },
  {
    id: 'canal-plus-sport', channelId: 'UC8ggH3zU61XO0nMskSQwZdA',
    name: 'CANAL+ Sport', league: 2021, language: 'fr', verifiedAt,
    status: 'identity-review', identityVerified: false,
    proofUrl: 'https://www.youtube.com/@canalplussport',
    evidenceUrls: ['https://www.youtube.com/@canalplussport', 'https://www.canalplus.com/articles/sports/une-nouvelle-saison-padel-debute-sur-les-chaines-canal-des-le-jeudi-23-fevrier'],
    note: 'Métadonnées, badge YouTube et existence de la chaîne confirmés ; lien réciproque exact à établir avant activation automatique.',
  },
];
