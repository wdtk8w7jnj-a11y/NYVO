# NYVO V0.5 — Pilote API-Football

Base vérifiée : `claude/nyvo-v0.4`, commit `acc67193fc5d7b5eae8283457e10140b60f89905`.
Branche de travail : `codex/nyvo-api-pilot`. Ni fusion dans main, ni publication du site.

## Ce qui est réalisé

Depuis Accueil, Matchs ou Favoris, ouvrir **Découvrir le pilote · Matchs réels** (`#/reels`). La démo continue de fonctionner sans clé et les préférences V0.4 sont conservées.

Le pilote propose trois compétitions candidates : Ligue 1 (61), Ligue 2 (62), Ligue des champions (2). Leur catalogue de saisons est chargé explicitement chez le fournisseur, puis les matchs d'une date choisie. Les années correspondent au début de saison. L'accès effectif d'une saison n'est confirmé qu'après une réponse réussie à la demande de matchs. Une liste vide n'est pas une garantie de couverture exhaustive.

Fiche : équipes, horaire Europe/Paris, score reçu, statut (y compris reporté/suspendu/interrompu), tirs au but séparés, stade et événements lorsqu'ils sont présents dans la réponse de détail. Les événements restent libellés comme chez le fournisseur. Valeur absente = tiret/message, jamais zéro inventé. Monogrammes neutres à la place des logos, aucun droit d'utilisation des images supposé.

Mode sans spoilers global partagé avec la démo, et réglages par match/équipe dans le pilote ; révélation limitée à la session. Scores, statut révélateur, événements et tirs au but sont retirés du HTML lorsqu'ils sont masqués. Enregistrements réels séparés des identifiants fictifs ; filtre des matchs enregistrés **à la date actuellement chargée**. Un catalogue de favoris réels couvrant toutes les dates reste à réaliser.

La fiche affiche **Diffusion non confirmée** : aucun rapprochement avec les chaînes fictives. Les compositions, statistiques avancées, classements, actualités, vidéos et programme TV réels sont hors de ce premier pilote.

## Activation locale sécurisée

1. Utiliser Node 20.6 minimum, de préférence Node 22/24. Récupérer cette branche puis lancer `npm ci`.
2. Copier `.env.example` vers `.env`. Éditer ce fichier **localement** et renseigner `API_FOOTBALL_KEY` avec la clé du compte API-Sports. Ne pas l'envoyer dans un chat, une capture, une issue ou un commit. Aucun préfixe public/VITE n'est utilisé.
3. Lancer `npm run start:pilot`. Le serveur lit `.env` ; il ne sert que `app/`. La clé reste dans le processus serveur, jamais dans le bundle ou les réponses navigateur.
4. Ouvrir `http://localhost:4173/#/reels`, puis **Vérifier la connexion**. Ce bouton vérifie la présence d'une configuration locale, pas encore la validité de la clé chez le fournisseur ; il ne consomme aucun appel fournisseur.
5. **Charger les saisons**, choisir une saison/date, puis **Afficher les matchs**. Si l'offre refuse la saison, essayer une saison d'archives après la pause éventuelle. Aucun abonnement n'est acheté automatiquement. Vérifier ensuite le compteur dans le dashboard fournisseur.
6. Ouvrir une fiche puis **Actualiser la fiche** pour demander les éventuels événements. Les résultats sont de vraies données seulement après une réponse fournisseur validée ; ils peuvent être historiques.

Sur iPhone/Android : serveur lancé sur l'ordinateur et téléphone sur le même Wi-Fi, utiliser l'adresse locale affichée par le serveur. `localhost` sur le téléphone désigne le téléphone lui-même. Sur Chromebook, exécuter le serveur dans un environnement Node disponible ou utiliser le même accès réseau. Le fichier autonome `dist/nyvo.html` ouvert par double-clic garde la démo mais ne peut pas contacter un serveur distant automatiquement. Le serveur peut aussi servir `dist/` avec la clé fournie dans son environnement.

## Quota, cache et limites opérationnelles

- Offre Free affichée au compte : 100 requêtes/jour ; saisons accessibles à vérifier. Plafond conservateur du pilote : **90 tentatives/jour UTC**, commun à tous les visiteurs du même serveur. Les autres usages de cette clé consomment aussi le quota fournisseur, indépendamment de ce compteur.
- Aucun polling automatique. Cache calendrier/fiche de 5 minutes ; catalogue des saisons de 24 heures. Une demande manuelle dans ce délai réutilise la réponse, sans forcer un appel. Ce pilote n'est pas un live seconde par seconde.
- Réservation persistée **avant** la requête fournisseur ; erreurs et timeouts comptent. File de requêtes partagée, cache commun et intervalle minimal de 1,2 seconde entre appels distincts. Les doublons simultanés réussis réutilisent le cache.
- Erreurs de plan, authentification, limite, réponse invalide et panne sont distinguées. Pause globale de 2 minutes après une erreur fournisseur pour éviter de brûler le quota ; pendant cette pause, même une autre sélection peut devoir attendre. Aucun retry automatique.
- Une réponse ancienne peut être rendue en cas d'erreur avec sa date d'origine, sans prétendre que le direct fonctionne. Aucun stockage navigateur de résultats réels entre rechargements ; le cache partagé est côté serveur.
- `.nyvo-data/pilot.json` contient les données normalisées et le compteur, sans clé. Dossier privé hors racine publique, conservé entre redémarrages. Ne pas le supprimer pour relancer le quota. Écritures atomiques par renommage ; un fichier corrompu bloque le démarrage plutôt que remettre le compteur à zéro.
- **Une seule instance** utilise ce dossier, avec verrou exclusif. Après un arrêt brutal, confirmer que le processus est arrêté avant de supprimer uniquement `pilot.lock`. Conserver `pilot.json`. Pas de déploiement serverless éphémère ni multi-instance avec ce stockage ; cela exige un stockage partagé transactionnel.
- Routes API limitées aux trois compétitions, saisons présentes au catalogue et identifiants de matchs déjà reçus. Pas de proxy vers une URL arbitraire. Les requêtes navigateur cross-site et méthodes autres que GET sont refusées. Ce serveur local n'inclut pas d'authentification publique ; avant un pilote exposé sur Internet, ajouter authentification, contrôle d'abus et HTTPS.

## État de validation et suite

Les tests fournisseur utilisent des réponses contrôlées, jamais une vraie clé. **Aucun appel authentifié au fournisseur n'a été effectué pendant ce développement.** Restent à vérifier avec le compte : validité de la clé, compétitions/saisons autorisées, échantillon réel, exactitude des événements, disponibilité et délai des scores. Les compteurs locaux ne prouvent pas le quota restant du compte.

L'accès aux données ne remplace pas les droits nécessaires aux logos, photos, vidéos ou à certains usages commerciaux. Les chaînes TV et médias demanderont leurs propres sources vérifiées.

Sources officielles consultées le 18 octobre 2026 :
- https://www.api-football.com/news/post/how-to-get-started-with-api-football-the-complete-beginners-guide — origine v3, en-tête x-apisports-key, saisons, fixtures et événements.
- https://www.api-football.com/pricing — Free 100/jour et saisons limitées.
- https://www.api-football.com/terms — conditions d'utilisation et droits.
- https://api-sports.io/documentation/football/v3 — référence officielle.

Commandes de contrôle : `npm test`, `npm run build`, `npm run test:e2e`. Tests navigateur sur Chromium aux formats 390 et 1366 pixels, pas sur un iPhone physique ni Safari.

Résultats du 18 octobre 2026 :
- 37 tests unitaires/HTTP réussis ; build réussi (environ 308 Ko).
- Sur serveur : 59 tests de la démo réussis, 1 cas volontairement ignoré ; les 8 tests du pilote réussissent après correction du libellé accessible du sélecteur de saison. Les deux échecs initiaux de ce sélecteur ont été corrigés et les 8 tests du pilote relancés.
- Fichier autonome reconstruit : 59 réussis, 9 ignorés (6 nécessitent l'API serveur, 2 vérifient une persistance non garantie en file://, 1 est le cas desktop volontairement ignoré).
- Trois captures dans `docs/captures/pilote-v05/` : elles utilisent des équipes et réponses de test, **pas des données authentifiées**. Liste et fiche examinées visuellement.
