// Personal, owner-private RSS reading. Feed availability is not an image licence.
export const NEWS_SOURCES=[
 {id:'lemonde-football',name:'Le Monde',url:'https://www.lemonde.fr/football/rss_full.xml',hosts:['www.lemonde.fr'],terms:'https://www.lemonde.fr/le-monde-et-vous/article/2025/07/14/les-flux-rss-du-monde-fr_5498778_3237.html',language:'fr',usage:'personal-private-only',excerpt:true},
 {id:'footmercato',name:'Foot Mercato',url:'https://www.footmercato.net/flux-rss',hosts:['www.footmercato.net'],terms:'https://www.footmercato.net/contact-mentions-legales-flux-rss',language:'fr',usage:'personal-private-only',excerpt:false}
];

// Registre par source (audit Premium éditorial, 19 octobre 2026). Une source
// candidate n'est jamais une autorisation acquise : seules NEWS_SOURCES sont lues.
// images:'none' = aucune photographie de l'éditeur reprise, quelle que soit la balise RSS/og:image.
export const NEWS_REGISTRY=[
 {name:'Le Monde',state:'active',feed:'RSS officiel football',rights:'Titres, extraits limités, dates et liens ; lecteur personnel privé',images:'none',frequency:'Contrôle horaire, cache 50 min',attribution:'Le Monde + lien vers l’article',checkedAt:'2026-10-19',evidence:'https://www.lemonde.fr/le-monde-et-vous/article/2025/07/14/les-flux-rss-du-monde-fr_5498778_3237.html'},
 {name:'Foot Mercato',state:'active',feed:'RSS proposé par l’éditeur',rights:'Titre, date et lien uniquement',images:'none',frequency:'Contrôle horaire, cache 50 min',attribution:'Foot Mercato + lien',checkedAt:'2026-10-19',evidence:'https://www.footmercato.net/contact-mentions-legales-flux-rss'},
 {name:'L’Équipe',state:'blocked',feed:'Page RSS publique de l’éditeur',rights:'Non établis',images:'none',reason:'HTTP 403 lors de la vérification V24 ; aucun contournement.',checkedAt:'2026-10-19',evidence:'https://www.lequipe.fr/Tous-sports/Actualites/Les-flux-rss-de-l-equipe/1299546'},
 {name:'Le Parisien',state:'blocked',feed:'Page RSS publique de l’éditeur',rights:'Non établis',images:'none',reason:'URL RSS renvoyant une page HTML au lieu d’articles (V24).',checkedAt:'2026-10-19',evidence:'https://www.leparisien.fr/services/rss/'},
 {name:'RMC Sport',state:'pending',feed:'Flux à identifier',rights:'Conditions de réutilisation non trouvées',images:'none',reason:'Accès automatisé et conditions non validés.',checkedAt:'2026-10-19'},
 {name:'Franceinfo Sport',state:'pending',feed:'Flux à identifier',rights:'Conditions de réutilisation non trouvées',images:'none',reason:'Accès automatisé et conditions non validés.',checkedAt:'2026-10-19'},
 {name:'France 24 Sport',state:'pending',feed:'Flux à identifier',rights:'Conditions officielles des flux non trouvées pendant l’audit',images:'none',reason:'Aucune page de conditions de l’éditeur consultée ; un statut de média public n’est pas une licence.',checkedAt:'2026-10-19'},
 {name:'BBC Sport',state:'pending',feed:'RSS football public',rights:'Attribution « BBC Sport » demandée selon une page d’aide historique ; conditions actuelles non relues',images:'none',reason:'Conditions en vigueur à relire directement avant activation ; contenu anglais.',checkedAt:'2026-10-19'},
 {name:'The Guardian Football',state:'pending',feed:'Content API (clé développeur) ou RSS',rights:'API soumise à clé et conditions ; images et vidéos exclues de l’offre gratuite selon des sources secondaires',images:'none',reason:'Aucune clé demandée ni conditions officielles relues ; pas d’activation.',checkedAt:'2026-10-19'},
 {name:'Clubs et ligues officiels',state:'pending',feed:'Sites officiels, au cas par cas',rights:'Par éditeur',images:'none',reason:'Brèves rédigées manuellement à partir des pages officielles (community.mjs) ; aucun flux automatique validé.',checkedAt:'2026-10-19'}
];
export const NEWS_CANDIDATES=NEWS_REGISTRY.filter(s=>s.state!=='active').map(({name,state,reason})=>({name,state,reason}));
// Contrôle planifié : la tâche horaire existante + cache de 50 min garantissent au
// plus 90 min entre deux contrôles tant que l'ordonnanceur fonctionne.
export const NEWS_MAX_INTERVAL_MINUTES=90;
