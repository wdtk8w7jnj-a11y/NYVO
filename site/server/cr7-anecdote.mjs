// Récit original NYVO, révisé le 19 octobre 2026 (Premium éditorial).
// Vérification des faits : pages UEFA.com listées dans `sources`, consultées via
// leurs extraits indexés ; l'environnement de rédaction bloquait l'ouverture directe
// d'uefa.com et de Wikimedia Commons. Les détails non recoupés de la version V24
// (minutes, nom des passeurs, buteur adverse) ont été retirés plutôt que conservés
// de mémoire. Aucun texte d'article copié, aucune citation.
const REVISED_AT='2026-10-19T14:00:00.000Z';

// Registre des visuels. Seuls les visuels `status:'verified'` sont affichés.
export const CR7_IMAGES=[
 {id:'cr7-cover',kind:'infographic',status:'verified',src:'/images/editorial/cr7-17-couverture.svg',width:1200,height:675,
  alt:'Infographie NYVO : le nombre 17 et la mention Ligue des champions 2013/14.',
  caption:'Infographie originale NYVO. Ce n’est pas une photographie.',
  author:'Rédaction NYVO',license:'Création originale NYVO',source:'Chiffres : UEFA.com (voir sources)',checkedAt:REVISED_AT,
  evidence:'Total de 17 buts confirmé par le bilan UEFA des buteurs du 24 mai 2014.'},
 {id:'cr7-progression',kind:'infographic',status:'verified',src:'/images/editorial/cr7-17-progression.svg',width:1200,height:760,
  alt:'Graphique NYVO : total cumulé des buts de Cristiano Ronaldo par étape, 9 après la phase de groupes, 13 après les huitièmes, 14 en quart, 16 en demi-finale, 17 en finale.',
  caption:'Progression du total, étape par étape. Infographie originale NYVO à partir des comptes rendus UEFA.',
  author:'Rédaction NYVO',license:'Création originale NYVO',source:'UEFA.com : bilan des buteurs, record de Munich, record de la phase de groupes',checkedAt:REVISED_AT,
  evidence:'9 buts en phase de groupes, deux à chaque match contre Schalke, record égalé contre Dortmund, dépassé à Munich, 17e but en finale.'},
 {id:'cr7-ballon-or',kind:'photo',status:'verified',src:'https://upload.wikimedia.org/wikipedia/commons/3/33/C._Ronaldo_-_Ballon_d%27Or_2014.jpg',width:null,height:null,
  alt:'Cristiano Ronaldo présentant son Ballon d’Or 2014 le 15 janvier 2015. Ce n’est pas une image de la finale de Lisbonne.',
  caption:'Cristiano Ronaldo présente son Ballon d’Or 2014, le 15 janvier 2015. Photographie postérieure à la campagne racontée.',
  author:'Anish Morarji',license:'CC BY 2.0',licenseUrl:'https://creativecommons.org/licenses/by/2.0/',
  sourceUrl:"https://commons.wikimedia.org/wiki/File:C._Ronaldo_-_Ballon_d'Or_2014.jpg",
  attribution:'Anish Morarji, CC BY 2.0, via Wikimedia Commons',crop:'Version déjà recadrée publiée sur Commons ; aucune retouche NYVO, image affichée entière.',
  checkedAt:'2026-10-19T12:50:00.000Z',evidence:'Fiche Commons ouverte lors de la version V24 (date et sujet) ; non rouverte lors de cette révision, accès bloqué depuis l’environnement.'},
 // Candidats fournis par l'audit : non affichés tant que la fiche n'a pas été ouverte et l'image regardée.
 {id:'cr7-finale-ceremonie',kind:'photo',status:'pending',src:'https://upload.wikimedia.org/wikipedia/commons/6/6b/Final_Champions_League_2014_Lesboa.jpg',
  caption:'Cérémonie d’ouverture de la finale, Lisbonne, 24 mai 2014 (photo de contexte, aucun but).',author:'Biser Todorov',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',
  sourceUrl:'https://commons.wikimedia.org/wiki/File:Final_Champions_League_2014_Lesboa.jpg',reason:'Fiche Commons et image non consultables depuis l’environnement de rédaction : vérification visuelle impossible.'},
 {id:'cr7-decima-madrid',kind:'photo',status:'pending',src:null,
  caption:'Célébration de la Décima à Madrid, 25 mai 2014 (célébration collective, pas une action de match).',author:'Presidencia de la Comunidad de Madrid',license:'CC BY 3.0',licenseUrl:'https://creativecommons.org/licenses/by/3.0/',
  sourceUrl:'https://commons.wikimedia.org/wiki/File:Celebración_de_La_Décima_Copa_de_Europa_Real_Madrid.jpg',reason:'Fichier original et licence spécifique non ouverts : vérification visuelle impossible.'},
 {id:'cr7-tribunes-lisbonne',kind:'photo',status:'rejected',src:null,
  caption:'Série « Real Madird 4-1 Atletico 2014 Final Champions Lisboa » (Miguelazo84).',license:'CC BY-SA 4.0',
  sourceUrl:'https://commons.wikimedia.org/wiki/File:Real_Madird_4-1_Atletico_2014_Final_Champions_Lisboa_2.jpg',reason:'Métadonnée du 12 août 2014 contradictoire avec une finale du 24 mai : date à réconcilier.'}
];

const SECTIONS=[
 {paragraphs:[
  'Lisbonne, 24 mai 2014, 120e minute. Le Real Madrid mène déjà 3-1 au terme d’une prolongation qu’il n’aurait jamais dû disputer : l’Atlético a tenu l’avantage jusqu’au temps additionnel, avant l’égalisation de Sergio Ramos. Cristiano Ronaldo place le ballon au point de penalty.',
  'Le tir fait 4-1. Il ne change plus l’issue de la finale. Il fixe en revanche un chiffre : dix-sept buts pour Ronaldo dans une seule édition de la Ligue des champions.'
 ]},
 {heading:'Neuf buts avant l’hiver',paragraphs:[
  'Le compteur démarre fort. Ronaldo inscrit un triplé lors du succès 6-1 face à Galatasaray, puis termine la phase de groupes avec neuf réalisations.',
  'À ce stade, c’est déjà un record. Le précédent, huit buts en phase de groupes, était partagé par Ruud van Nistelrooy (2004/05), Filippo Inzaghi et Hernán Crespo (2002/03). Ce record-là concerne la phase de groupes ; le total de la saison viendra ensuite.'
 ],figure:'cr7-progression'},
 {heading:'Schalke, Dortmund, puis Munich',paragraphs:[
  'En huitièmes de finale, Ronaldo marque deux fois à l’aller et deux fois au retour contre Schalke 04. Lors du match retour, ses 77e et 78e buts dans les compétitions interclubs de l’UEFA lui font dépasser Raúl González au classement de tous les temps. Un autre record, sur l’ensemble d’une carrière cette fois.',
  'Son but en quart de finale aller contre le Borussia Dortmund porte le total à quatorze. Il égale alors José Altafini (1962/63) et Lionel Messi (2011/12), détenteurs du record sur une saison de Coupe d’Europe des clubs champions et de Ligue des champions.',
  'Le dépassement attend la demi-finale. Muet à l’aller contre le Bayern, Ronaldo marque deux fois au retour à Munich. Sergio Ramos inscrit lui aussi un doublé ; Madrid gagne 4-0 et passe avec un score cumulé de 5-0. Ronaldo compte seize buts.'
 ]},
 {heading:'Ce que dit le chiffre',paragraphs:[
  'Dix-sept, c’est un total sur une seule campagne européenne, de septembre à mai. Ce n’est ni un cumul de carrière ni un total toutes compétitions confondues. Il rend Ronaldo meilleur buteur de l’épreuve pour la deuxième saison consécutive.',
  'Il ne résume pas la finale. Le dixième titre européen du Real, la Décima, s’est joué sur l’égalisation de Ramos puis sur les buts de Gareth Bale et de Marcelo en prolongation. Le penalty de Ronaldo est venu ensuite.',
  'Deux chiffres se croisent donc ce soir-là, sans se confondre : dix pour les Coupes d’Europe du club, dix-sept pour les buts de son attaquant.'
 ],figure:'cr7-ballon-or'}
];

export const CR7_ANECDOTE = {
  id: 'anecdote-cr7-dix-sept-2014',
  subject: 'Cristiano Ronaldo • Ligue des champions 2013/14',
  title: 'Dix-sept buts en une saison : la campagne record de Ronaldo en 2013/14',
  summary: 'Neuf buts dès la phase de groupes, le record égalé contre Dortmund, dépassé à Munich, puis un dernier penalty à Lisbonne : comment Cristiano Ronaldo a porté le total d’une seule Ligue des champions à dix-sept.',
  category: 'anecdote',
  status: 'Histoire vérifiée',
  author: 'Rédaction NYVO',
  byline: 'Rédaction NYVO',
  publishedAt: '2026-10-19T12:50:00.000Z',
  checkedAt: REVISED_AT,
  revisedAt: REVISED_AT,
  readingMinutes: 3,
  sections: SECTIONS,
  body: SECTIONS.flatMap(s=>s.paragraphs),
  cover: 'cr7-cover',
  images: CR7_IMAGES,
  record: {
    value: '17 buts',
    label: 'Une seule campagne européenne',
    scope: 'Cristiano Ronaldo, Real Madrid, Ligue des champions 2013/14 : record sur une saison établi à cette date, au-delà des 14 buts de José Altafini (1962/63) et de Lionel Messi (2011/12). Aucun classement actuel extrapolé.'
  },
  sources: [
    { name: 'UEFA — Ronaldo meilleur buteur, record sur une saison (24 mai 2014)', url: 'https://www.uefa.com/uefachampionsleague/news/0252-0cdc68c5ee7f-854c7d82fcc8-1000--record-breaking-ronaldo-takes-scoring-honours/', official: true },
    { name: 'UEFA — Le record de la Coupe d’Europe battu à Munich (29 avril 2014)', url: 'https://www.uefa.com/uefachampionsleague/news/0250-0c51075c534f-0eadb76fa6cf-1000--ronaldo-sets-new-european-cup-goal-record/', official: true },
    { name: 'UEFA — Record de tous les temps des compétitions UEFA face à Schalke', url: 'https://www.uefa.com/uefachampionsleague/news/0254-0d7ff134e6b0-5b70cda523a3-1000--ronaldo-sets-new-all-time-uefa-scoring-record/', official: true },
    { name: 'UEFA — Compte rendu de la finale de Lisbonne (24 mai 2014)', url: 'https://www.uefa.com/uefachampionsleague/news/0250-0c51093bd4a7-41ccc377a75c-1000--madrid-finally-fulfil-decima-dream/', official: true }
  ],
  verification: 'Chiffres et épisodes recoupés sur les pages UEFA.com ci-dessus (extraits indexés, ouverture directe bloquée dans l’environnement de rédaction). Score de Munich (4-0) et doublé de Ramos confirmés par les comptes rendus d’agence du 29 avril 2014.',
  image: CR7_IMAGES.find(i=>i.id==='cr7-ballon-or')&&{
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/33/C._Ronaldo_-_Ballon_d%27Or_2014.jpg',
    alt: 'Cristiano Ronaldo présentant son Ballon d’Or 2014 le 15 janvier 2015, photographié par Anish Morarji. Ce n’est pas la finale de Lisbonne.',
    author: 'Anish Morarji — recadrage publié sur Wikimedia Commons',
    sourceUrl: "https://commons.wikimedia.org/wiki/File:C._Ronaldo_-_Ballon_d'Or_2014.jpg",
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
    checkedAt: '2026-10-19T12:50:00.000Z',
    illustration: true,
    caption: 'Photographie du 15 janvier 2015 : Ronaldo présente son Ballon d’Or 2014. Illustration postérieure à la campagne racontée.',
    modifications: 'Version déjà recadrée sur Wikimedia Commons ; aucune retouche supplémentaire par NYVO. Conserver ses proportions.',
    displayFit: 'contain'
  },
  teamIds: [],
  matchIds: [],
  spoilerSensitive: true,
  video: null,
  videoStatus: 'Aucune photo libre d’un but de 2013/14 n’a été vérifiée : l’article renvoie vers la page d’archive officielle de la finale.',
  archive: {
    url: 'https://www.uefa.com/uefachampionsleague/history/video/0250-0c510929eab1-0845de6a1b44-1000--2014-final-highlights-real-madrid-4-1-atletico/',
    label: 'Revoir la finale 2014 sur UEFA.com',
    official: true,
    checkedAt: '2026-10-19T12:50:00.000Z',
    playbackVerified: false,
    franceVerified: false,
    embeddable: false
  }
};
