# Médias & Découvertes — 19 octobre 2026

Retour : c1a421506385b04e76360030454727154910498a (version 22).

## Sources et cadence

`media-sources.mjs` épingle cinq nouvelles chaînes vérifiées par lien officiel et identifiant stable. L’association de chaque vidéo, son intégration et ses restrictions sont contrôlées séparément. DAZN et CANAL+ Sport restent candidats : lien réciproque exact non confirmé. Aucune vidéo téléchargée.

Coûts vérifiés : channels.list, playlistItems.list, videos.list = 1 unité chacun, https://developers.google.com/youtube/data/determine_quota_cost . Seules ces trois méthodes sont autorisées. Budget local 1000 unités/jour UTC et 24/passage, distinct du quota Google (jour Pacifique). Aucun search.list. Sources sans match à contrôler ignorées ; ordre en rotation horaire. Calendriers football : deux compétitions maximum par passage, rotation quatre heures, complétée par le cache et les chargements utilisateur existants.

La tâche existante reste horaire. Le seuil interne de 30 minutes ne garantit PAS un passage toutes les 30 minutes. Contrôle horaire au mieux, sous réserve des pauses, budgets et sources. Writers vidéo et news indépendants.

## Blocages des actualités

Le Monde reste un flux personnel privé, non collectif et non commercial. L’Équipe a répondu HTTP 403 ; le flux officiel sports du Parisien a renvoyé du HTML « Site Unavailable ». Aucun contournement ni activation annoncée. Références : https://www.lequipe.fr/Tous-sports/Actualites/Les-flux-rss-de-l-equipe/1299546 et https://www.leparisien.fr/services/rss/ . RMC, Franceinfo, Eurosport, Foot Mercato : accès et droits de syndication à établir.

Articles sans photo autorisée : illustration originale NYVO étiquetée. Anecdote Fontaine : image Commons individuelle, André Cros / Archives municipales de Toulouse, CC BY-SA 4.0, portrait de 1971 distinct du tournoi 1958. URL, licence, crédit et faits FFF/FIFA dans `anecdotes.mjs`. Pas de vidéo déclarée vérifiée. Sélection éditoriale seulement, aucune génération factuelle automatique.

## Inventaire candidat (pas de licence globale)

- Commons : https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia ; fichier par fichier.
- Pexels : https://www.pexels.com/license/ ; illustrations génériques.
- Unsplash : https://unsplash.com/license ; collection gratuite, pas Plus.
- Pixabay : https://pixabay.com/service/license-summary/ ; droits additionnels.
- Europeana : https://www.europeana.eu/fr/rights/public-domain-usage-guidelines ; droits de l’objet.
- Getty : https://www.gettyimages.co.uk/resources/embed ; intégration éligible uniquement, aucune licence acquise ni image extraite.
- BnF : https://www.bnf.fr/fr/faire-une-utilisation-commerciale-dune-reproduction ; conditions par document et usage.
- FIFA, UEFA.tv, PL The Archive, INA, British Pathé : archives à examiner individuellement ; accès ne vaut pas autorisation d’intégration.

## TV

Droits généraux vérifiés : https://www.dazn.com/fr-FR/help/articles/20576942203421-quels-sports-puis-je-regarder-sur-dazn-en-france (Serie A et LaLiga), https://www.laliga.com/en-GB/news/disney-and-dazn-become-the-new-home-of-laliga-ea-sports-in-france (Disney+ et DAZN). Aucune confirmation officielle française par rencontre ni source automatisable autorisée obtenue : catalogue manuel conservé, zéro nouvelle diffusion affirmée. Ne pas déduire une chaîne exacte du contrat global.

## Lecteur

YouTube officiel à la demande, pas d’autoplay, origin/referrer explicites, détruit à la navigation. Erreur 153 distinguée, sortie YouTube toujours disponible. Titres et images protégés ne chargent pas avant révélation. Favoris et préférences conservés. Métadonnées ne prouvent pas une lecture sur iPhone ou en France.
