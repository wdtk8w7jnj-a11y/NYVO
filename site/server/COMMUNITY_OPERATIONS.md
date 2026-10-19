# NYVO — contenu et compétitions, 19 octobre 2026

Publication conservée strictement propriétaire uniquement. Aucun secret nouveau.

## Couverture
Douze compétitions football-data.org proposées. FL1 et CL restent la sélection initiale ; les autres sont activables dans Matchs → Mes compétitions. La sélection est enregistrée sur l'appareil. Le catalogue détermine la saison actuelle puis l'accès à ses rencontres est réellement contrôlé. Le refus d'une compétition ne bloque pas les autres. Une limite de quota interrompt la séquence, sans nouvelle tentative en boucle.

`POST /api/content/coverage?league=<id autorisé>` contrôle une compétition à la fois, avec le même cache et les mêmes protections que les visiteurs. Endpoint de service dépendant de la frontière Sites strictement propriétaire uniquement ; ne pas déplacer sur un site public. Aucun token fournisseur dans les résultats. Une réponse vide valide peut correspondre à un tournoi sans rencontres disponibles.

## Actualités
Trois brèves originales NYVO sur des faits vérifiés en ouvrant les sources le 19 octobre : UEFA (avant J3), Bundesliga (départ des fonctions sportives de Krösche) et Ligue 1 (programme J8). Pas de reprise d'article ni de photographie. Une carte par sujet, sources multiples prises en charge par le modèle. Le choix Pour toi favorise les équipes suivies et conserve les grandes nouvelles. Mercato peut rester vide.

`server/community.mjs` contient la sélection manuelle. `GET /api/content/news` requiert une session ; POST est la lecture de service owner-private. Le bouton Actualiser relit ce catalogue et n'affirme pas vérifier les sites sources. Les nouveautés sont stockées en attente puis appliquées explicitement, sans déplacement de lecture. Aucun flux de nouvelles automatique autorisé n'est connecté : ne pas présenter cette sélection comme du direct.

## Vidéos
Les résumés automatiques Ligue 1/UEFA, leur writer et l'automatisation existante sont conservés. Miniatures API existantes en entier au format 16:9, durée seulement si connue, titre dessous. Résumés groupés par rencontre ; contenus associés distincts. Maximum deux cartes sur l'accueil.

Les catégories Autour du match et Joueurs sont implémentées mais sans contenu accepté. `MEDIA` reste vide tant que source, auteur, association et autorisation ne sont pas vérifiés. Le validateur refuse l'absence de droits/contextes et les URL non autorisées. Aucun accès gratuit à une API de découverte X n'est configuré. Ne pas utiliser de fausses vidéos pour remplir ces vues.

Pour un ajout éditorial, vérifier le lien exact et les droits puis renseigner category/id/title/publisher/checkedAt/rightsVerified, authorVerified/context/matchId pour X, ou player/format et matchVerified+matchId (performance) ou period (compilation) pour YouTube. Toute miniature ajoutée doit avoir un droit d'affichage ; ne jamais extraire une capture X automatiquement.

## Confidentialité et cache
FOOTBALL_DATA_TOKEN / YOUTUBE_API_KEY restent exclusivement serveur. Cache matchs 5 min, saisons 24 h, classements 1 h. Les filtres locaux, les lectures de brèves et les lectures du catalogue vidéo ne dépensent pas les quotas des fournisseurs. La lecture YouTube utilise Internet. Mode sans spoilers vérifié avant chargement d'une image ou exposition d'un titre sensible. Pas de lecteur X intégré.
