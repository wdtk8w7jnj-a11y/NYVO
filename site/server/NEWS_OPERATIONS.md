# NYVO — actualités automatiques, 19 octobre 2026

## Révision Journal v24 — prioritaire sur les notes historiques ci-dessous

Deux sources actives dans `news-sources.mjs` : Le Monde football et Foot Mercato (`https://www.footmercato.net/flux-rss`). La page éditeur `https://www.footmercato.net/contact-mentions-legales-flux-rss` propose ce flux pour suivre les nouvelles. Usage limité au lecteur personnel strictement propriétaire, sans usage commercial ou public. Foot Mercato : titre, date et lien uniquement ; aucune description, image ou page complète reprise. Le Monde : extrait limité du RSS, pas de photographie.

GET /api/content/news relit désormais uniquement la persistance, sans appel externe. POST /api/content/news-update actualise les deux sources indépendamment ; POST news-status vérifie les résultats. Chaque source dispose d’un verrou et d’une pause propres. Cache de 50 minutes (marge pour le contrôle horaire), requêtes conditionnelles, Retry-After numérique/date respecté, aucune nouvelle tentative dans une même exécution. Le bouton utilisateur actualise le catalogue local depuis le serveur, pas les éditeurs. Une seule tâche horaire existante est conservée, sans duplication.

Le statut expose par source le nombre d’articles, dernière tentative, dernière réception réussie, pause et prochaine échéance. L’heure globale est la plus ancienne réception disponible, pas une promesse de fraîcheur pour toutes les sources. État partiel si une source échoue et l’autre fonctionne.

Sources testées mais non actives le 19 octobre : L’Équipe (403), Maxifoot (503/connexion), Le Parisien (HTML au lieu de RSS). BBC football techniquement accessible, conditions actuelles à revoir ; pas activé. RMC Sport, franceinfo, France Télévisions, Eurosport et flux des clubs : droits/accès non validés. Ne pas annoncer une couverture exhaustive ni contourner ces blocages.

Les associations club/article sont locales et conservatrices : nom complet ou alias contrôlé dans le titre. « Paris », « Milan », « United » seuls ne suffisent pas. Les rumeurs restent étiquetées ; aucune annonce de transfert n’est confirmée automatiquement. Regroupement uniquement des titres identiques normalisés du même jour, pas de fusion sémantique approximative.

Nouvelle anecdote CR7 documentée dans `cr7-anecdote.mjs`, conservée avec Just Fontaine. Image CC BY 2.0 et archive UEFA externe, sans prétendre que la lecture de cette archive a été testée.

Lecteur : attributs référent et permissions posés avant src, API IFrame officielle, délai limité, génération anti-course, erreurs 2/5/100/101/150/153 distinguées. Références : https://developers.google.com/youtube/iframe_api_reference et https://developers.google.com/youtube/terms/required-minimum-functionality . L’intégrabilité déclarée ne garantit pas la lecture dans tous les environnements. Aucun proxy ni extraction de flux.

Tests : `node --test tests/*.test.mjs`. Version de retour avant cette mise à jour : commit d8111bc98242060aa0b9fce6d688f66f9e57545c (version 23). Aucun schéma de stockage supprimé ou préférence réinitialisée.

## Notes historiques de la version précédente

## Usage et source
Le Site reste strictement réservé à son propriétaire. Son lecteur RSS est un usage personnel, privé, non collectif et non commercial. Le flux utilisé est https://www.lemonde.fr/football/rss_full.xml.

Les conditions du Monde et leur page RSS ont été vérifiées le 19 octobre 2026 : https://www.lemonde.fr/le-monde-et-vous/article/2025/07/14/les-flux-rss-du-monde-fr_5498778_3237.html et https://www.lemonde.fr/mentions-legales/ . Les titres, extraits, dates et liens proviennent du RSS ; aucune page d'article, photographie, contenu abonné ou texte intégral n'est récupéré. Attribution visible Le Monde et accès à la source. Aucun usage professionnel, public, collectif ou commercial n'est autorisé par cette configuration : réévaluer les licences avant une telle évolution. Ne pas présenter le flux comme un partenariat.

## Actualisation et persistance
`server/news.mjs` utilise les tables partagées existantes pilot_cache et pilot_control, avec clés news:lemonde-football. Verrou atomique trente secondes, cache dix minutes, ETag/Last-Modified, une requête simultanée maximum. Erreur : ancien contenu conservé et pause trente minutes. Aucun appel football-data.org ou YouTube par ce module.

- GET /api/content/news : session visiteur authentifiée requise. Sert le cache et le rafraîchit seulement si la cadence l'autorise.
- POST /api/content/news-update : writer de service owner-private ; même cadence et mêmes protections.
- POST /api/content/news-status : relit la persistance sans appel externe.

Le jeton fourni par get_site passe seulement dans OAI-Sites-Authorization vers ce Site. Ne jamais enregistrer ce jeton ni une clé fournisseur dans les instructions, fichiers ou journaux. L'accès owner-private de Sites est la frontière du writer de service.

Une seule tâche horaire existante fait les contrôles YouTube ET news, sans republier. Après le writer news, lire news-status pour vérifier count, checkedAt et état. En cas de pause/erreur : aucun nouvel essai pendant la même exécution, conserver l'erreur et les anciens articles.

Dans NYVO ouvert, contrôle toutes les dix minutes sur Accueil/Actualités seulement ; arrêt quand le document est masqué et contrôle d'expiration au retour. Les titres nouveaux sont proposés via un bandeau, jamais injectés en déplaçant la lecture. En dehors de l'application, le contrôle horaire ne garantit pas une publication instantanée. Les brèves manuelles précédentes sont conservées avec leur source et leur date.

## Championnats
Les douze compétitions gratuites déjà vérifiées sont désormais sélectionnées par défaut. Migration unique competitionsVersion=2 des anciennes préférences limitées à deux compétitions ; favoris et spoilers intacts. Après migration, les réglages ultérieurs sont respectés. GET/POST /api/content/matches renvoie uniquement les caches des saisons actuelles, sans appels fournisseur. Le client affiche immédiatement les caches puis actualise progressivement par le proxy existant ; aucune fausse rencontre. Les données anciennes restent datées, les erreurs et les limites restent visibles. Coupe du monde 2026 et Euro 2024 sont des archives ; ne pas fabriquer une saison plus récente.
