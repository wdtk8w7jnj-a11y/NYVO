// Editorial facts rewritten for NYVO; linked originals remain with their publishers.
// No publisher photograph, article body or RSS content is copied.
export const CHECKED_AT='2026-10-19T10:30:00Z';
export const ARTICLES=[
 {id:'uefa-j3-20261019',subject:'cl-j3-preview',title:'Ligue des champions : la troisième journée approche',summary:'Les rencontres de la troisième journée sont programmées les 20 et 21 octobre. L’UEFA présente les affiches et leurs principaux enjeux.',status:'Officiel',category:'compétition',league:2001,teamIds:[],matchIds:[],spoilerSensitive:true,publishedAt:'2026-10-19',checkedAt:CHECKED_AT,sources:[{name:'UEFA',url:'https://www.uefa.com/uefachampionsleague/news/02aa-21db6a0e214d-c25e7a88d531-1000--champions-league-matchday-3-key-stats-and-what-to-look-o/',official:true}],image:null},
 {id:'frankfurt-20261018',subject:'frankfurt-krosche-departure',title:'Francfort : Markus Krösche quitte ses fonctions sportives',summary:'Le conseil de surveillance a accepté sa demande de quitter ses fonctions avec effet immédiat. Son contrat se poursuit sous une forme adaptée.',status:'Officiel',category:'club',league:2002,teamIds:[1000000019],matchIds:[],spoilerSensitive:false,publishedAt:'2026-10-18',checkedAt:CHECKED_AT,sources:[{name:'Bundesliga',url:'https://www.bundesliga.com/en/bundesliga/news/eintracht-frankfurt-board-member-for-sport-markus-krosche-leaves-role-39635',official:true}],image:null},
 {id:'l1-j8-programme',subject:'l1-j8-tv',title:'Ligue 1 : le programme de la huitième journée est publié',summary:'La journée se déroulera du 23 au 25 octobre. Le programme officiel annonce les rencontres sur Ligue 1+ ; la chaîne détaillée de chaque affiche doit être vérifiée séparément.',status:'Officiel',category:'programmation',league:2015,teamIds:[],matchIds:[],spoilerSensitive:true,publishedAt:'2026-10-11T22:00:00+02:00',checkedAt:CHECKED_AT,sources:[{name:'Ligue 1',url:'https://ligue1.com/fr/articles/l1_article_5797-',official:true}],image:null}
];
// No authorized supporter or player video has been accepted yet. Never fill
// these collections with guessed links or reuse summary metadata as player data.
export const MEDIA=[];
export function validateMedia(item){
 if(!item||!['supporter','player','stands'].includes(item.category)||!item.id||!item.title||!item.publisher||!item.checkedAt||!item.rightsVerified)return false;
 // Depuis les tribunes : publication YouTube canonique d'un créateur vérifié, rencontre confirmée.
 if(item.category==='stands')return /^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/.test(item.url||'')&&Number.isSafeInteger(item.matchId)&&Boolean(item.matchVerified&&item.authorVerified&&item.context);
 if(item.category==='supporter')return /^https:\/\/(?:www\.)?x\.com\/[A-Za-z0-9_]+\/status\/\d+$/.test(item.url||'')&&Number.isSafeInteger(item.matchId)&&Boolean(item.authorVerified&&item.context);
 return /^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/.test(item.url||'')&&Boolean(item.player)&&['performance','compilation'].includes(item.format)&&(item.format==='performance'?Number.isSafeInteger(item.matchId)&&Boolean(item.matchVerified):Boolean(item.period));
}
export function newsCatalogue(){return{articles:ARTICLES,checkedAt:CHECKED_AT,automatic:false,sourceMode:'editorial',notice:'Sélection éditoriale vérifiée manuellement. Aucun flux d’actualité automatique connecté.'};}
export function mediaCatalogue(){return{items:MEDIA.filter(validateMedia),checkedAt:CHECKED_AT,automatic:false,blockers:{supporter:'Aucune vidéo de supporter avec auteur, match et autorisation vérifiés.',player:'Aucun focus joueur dont la source et la rencontre ou la période sont vérifiés.',stands:'Aucune vidéo « Depuis les tribunes » validée : six créateurs candidats restent en examen (identité, publications récentes, rencontre, droits).'}};}
