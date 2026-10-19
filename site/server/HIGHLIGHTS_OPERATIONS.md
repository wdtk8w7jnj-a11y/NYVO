# Résumés officiels — exploitation

## Activation

1. Ajouter un secret serveur `YOUTUBE_API_KEY` pour un projet Google dont YouTube Data API v3 est activée. Ne jamais mettre la clé dans le navigateur ni dans une URL de vérification. Les appels utilisent `X-Goog-Api-Key` vers `https://youtube.googleapis.com/youtube/v3/` avec `redirect: manual` et refus explicite des réponses 3xx, compatibles Cloudflare Workers : le secret ne suit jamais une autre destination.
2. Republier avec cette configuration. Vérifier `POST /api/highlights/update` avec l’accès service Sites du même projet ; lire ensuite le catalogue via un navigateur authentifié.
3. Après réussite réelle du contrôle des chaînes, publier un programme Sites toutes les 30 minutes. Aucune tâche n’est créée si la clé manque ou n’est pas validée.
4. La tâche récupère l’accès service depuis `get_site`, appelle le writer puis vérifie sa réponse. Elle n’a pas besoin de clé YouTube, ni de republier le site. Ne pas inclure de secret dans son prompt.

Le writer de catalogue partagé repose sur la frontière d’accès du Site confirmé propriétaire uniquement. Garder NYVO privé. Avant tout élargissement d’audience, ajouter une autorisation explicite au writer.

## Traitement

Chaînes épinglées après examen de leurs pages YouTube le 19 octobre 2026 : Ligue1 `UCQsH5XtIc9hONE1BQjucM0g` et UEFA `UCyGa1YEx9ST66rYrJTGIKOw`. Une chaîne homonyme n’est pas acceptée. Le moteur n’utilise pas `search.list` : lectures groupées des publications officielles et `videos.list`.

Rythme par match : 30 min jusqu’à 6 h après première observation d’un statut terminé, 3 h jusqu’à 72 h, puis 24 h jusqu’à 7 jours. Les contrôles de publications sont mutualisés par source. Les résultats football sont actualisés par le transport/cache existant pour que les nouveaux matchs terminés soient détectés même sans visite.

Budget YouTube local : 1000 requêtes/jour UTC, maximum 24 par passage. Une erreur quota, accès ou réseau provoque une pause explicite. Les appels YouTube ont un délai maximal de 25 secondes. Une erreur réseau ou un dépassement de délai permet une nouvelle tentative après au moins une minute ; aucun appel en boucle. Les pauses quota et accès restent intégralement respectées. La limite locale n’est pas le quota garanti du compte Google. La pagination est bornée à 150 publications par source et signale un contrôle partiel lorsqu’elle est tronquée.

Vidéos recontrôlées quotidiennement ; métadonnées non renouvelées retirées au bout de 29 jours. Les vidéos supprimées/privées sont conservées comme indisponibles jusqu’à expiration. Aucune vidéo téléchargée ni réhébergée.

Associations douteuses : file de contrôle `GET /api/highlights/review`. Approbation ou rejet via `POST` sur le même chemin ; l’approbation est limitée aux matchs candidats de la compétition de la source. Les compilations multi-matchs ne sont jamais des résumés d’une seule rencontre sans contrôle. Les interviews et réactions restent des contenus associés.

## Vérification de l’automatisation

La présence d’une clé seule ne garantit pas l’accès. Il faut un passage réel réussi, puis une tâche enregistrée et un appel du writer via l’accès prévu. Le catalogue donne la dernière réussite, la dernière tentative, les pauses et les contrôles par match. Ne pas afficher « recherche automatique en cours » lorsque la configuration ou la planification est absente.

Après création de la tâche, ses passages appellent `POST /api/highlights/update?scheduled=1`. Un passage réussi renseigne la preuve de planification dans D1. Sans passage planifié réussi depuis deux heures, l’interface ne prétend pas que l’automatisation est active.
