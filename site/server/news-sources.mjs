// Personal, owner-private RSS reading. Feed availability is not an image licence.
export const NEWS_SOURCES=[
 {id:'lemonde-football',name:'Le Monde',url:'https://www.lemonde.fr/football/rss_full.xml',hosts:['www.lemonde.fr'],terms:'https://www.lemonde.fr/le-monde-et-vous/article/2025/07/14/les-flux-rss-du-monde-fr_5498778_3237.html',language:'fr',usage:'personal-private-only',excerpt:true},
 {id:'footmercato',name:'Foot Mercato',url:'https://www.footmercato.net/flux-rss',hosts:['www.footmercato.net'],terms:'https://www.footmercato.net/contact-mentions-legales-flux-rss',language:'fr',usage:'personal-private-only',excerpt:false}
];
export const NEWS_CANDIDATES=[
 {name:'L’Équipe',state:'blocked',reason:'HTTP 403 pendant la vérification ; aucun contournement.'},
 {name:'Maxifoot',state:'blocked',reason:'Intégration proposée par l’éditeur, mais flux indisponible pendant le test.'},
 {name:'Le Parisien',state:'blocked',reason:'URL RSS renvoyant une page HTML et non des articles.'},
 ...['RMC Sport','franceinfo','France Télévisions Sport','Eurosport','Clubs et fédérations'].map(name=>({name,state:'pending',reason:'Accès automatisé et conditions de réutilisation non validés.'}))
];
