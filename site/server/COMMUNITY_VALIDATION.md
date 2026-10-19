# Validation — 19 octobre 2026

## Fournisseur réel sur le déploiement privé
Les douze requêtes de contrôle (catalogue puis saison actuelle, via cache partagé et limite commune) ont répondu HTTP 200, accessible=true, stale=false. Aucun secret n'a été retourné.

| Compétition | Saison déterminée par le fournisseur | Rencontres reçues | Équipes |
|---|---|---:|---:|
| Ligue 1 | 2026 | 306 | 18 |
| Ligue des champions | 2026 | 144 | 36 |
| Premier League | 2026 | 380 | 20 |
| Bundesliga | 2026 | 306 | 18 |
| La Liga | 2026 | 380 | 20 |
| Serie A | 2026 | 380 | 20 |
| Eredivisie | 2026 | 306 | 18 |
| Primeira Liga | 2026 | 306 | 18 |
| Championship | 2026 | 552 | 24 |
| Série A brésilienne | 2026 | 380 | 20 |
| Coupe du monde | 2026 | 104 | 48 |
| Euro | 2024 | 51 | 24 |

Le total est 3 595 rencontres disponibles. Les tournois terminés ne sont pas du direct : l'Euro renvoie encore 2024 comme saison actuelle de son catalogue, et la Coupe du monde 2026 est passée. La CL reçue couvre la phase actuellement fournie, pas une garantie d'un tableau complet futur. Aucun calendrier futur n'est inventé.

## Contenus et quotas
- Catalogue réel partagé : 34 vidéos, dont 15 classées Résumé ; 34 miniatures présentes. Automatisation existante : ready, automatic=true, error=null. Pas de nouvelle recherche YouTube déclenchée pour cette validation.
- Actualités : 3 brèves factuelles manuelles ; aucun flux automatique connecté.
- Vidéos supporters et joueurs : zéro contenu accepté ; catégories et fiches disponibles, validation obligatoire avant ajout.
- Aucune nouvelle information de chaîne ajoutée : les 27 diffusions vérifiées antérieurement restent intactes.

## Contrôles
57 tests automatisés réussis : normalisation et accès aux saisons, cache/quota/concurrence, sécurité des sources, absence de scores inventés, associations vidéo, spoilers, filtres, lecture différée de nouveautés, favoris d'articles, JS intégral et limite de deux cartes vidéo sur l'accueil.

Contrôles dans Chrome avec viewport 390×844 : accueil réel et écussons, cartes vidéo avec miniatures effectivement chargées, filtres des catégories, état supporter vide, détail vidéo et lecteur à la demande, navigation Actualités et fiche avec URL officielle, enregistrement/retrait d'une brève. Mode sans spoilers : zéro image vidéo dans la page, quinze cartes protégées. Journée vide explicite, sélection des compétitions.

Limites : pas d'iPhone physique ; pas de lecture vidéo YouTube ni de contrôle géographique effectué ; aucun test d'une publication X ou focus joueur réel, faute de contenu autorisé validé. Aucun flux d'actualité en continu activé.
