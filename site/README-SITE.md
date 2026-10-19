# NYVO — serveur hébergé du pilote

Site privé conservé : NYVO Rubis. Interface issue du commit GitHub 44cf2d0df2e183691ba4cc01d833b7cace5dbda5, avec métadonnées et icônes iPhone.

## Architecture

Worker Vinext avec route HTML / et routes /api/pilot/status, leagues, fixtures, fixture. Assets publics d’installation conservés. La démo et ses préférences restent identiques.

Base Cloudflare D1 via binding DB. Migration Drizzle 0000_low_tana_nile : pilot_control (budget et verrou), pilot_cache (réponses normalisées), pilot_fixtures (IDs déjà reçus). Aucun secret dans la base.

Réservation atomique conditionnelle avant chaque appel, partagée entre instances. Plafond 90 tentatives/jour UTC, intervalle 1,2 s, verrou 30 s pour éviter les doublons concurrents. Les demandes concurrentes reçoivent le cache disponible ou slow_down, sans consommer un nouvel appel. Timeout fournisseur 10 s ; pause 2 minutes après erreur. Une réponse reçue après expiration du verrou ne peut écraser un résultat plus récent.

Cache saisons 24 h, matchs 5 minutes, 200 réponses conservées. Aucun rafraîchissement automatique. Les autres usages de la même clé peuvent consommer du quota fournisseur en dehors de ce serveur.

L’identité visiteur fournie par Sites est exigée sur les routes API ; refus des origines étrangères. Le site reste limité à son propriétaire. Le statut indique seulement la présence de la clé et de la liaison DB, sans valider le compte fournisseur. Le contenu et les saisons réellement disponibles restent à vérifier après activation.

## Activer plus tard

Configurer API_FOOTBALL_KEY comme secret de runtime avec les outils natifs Sites, puis redéployer une version sauvegardée pour appliquer la nouvelle révision d’environnement. Ne pas mettre la clé dans le chat, Git, public/ ou le manifeste. Aucun champ de saisie de clé dans l’application ; aucune clé réelle configurée pendant cette préparation.

Dans NYVO : Matchs réels → Vérifier la connexion → Charger les saisons → choisir une date → Afficher les matchs. La fiche demande ses événements séparément. Les chaînes, actualités et vidéos réelles restent non connectées.

## Validation

node --test tests/hosted-api.test.mjs : 8 tests réussis, SQL exécuté sur SQLite avec adaptateur du contrat D1. Tests de concurrence, quota journalier, nouvel appel sans mémoire locale, erreurs, cache ancien, confidentialité et expiration du verrou.
Build Sites réussi avec routes / et /api/pilot/:operation. Migration générée depuis db/schema.ts et incluse dans l’artefact. Pas de test authentifié API-Football, ni de nouvelle recette sur iPhone physique.

Le serveur local Node et le dépôt GitHub restent distincts de ce runtime hébergé. Le code de cette adaptation est sauvegardé dans le dépôt source du Site.

Référence D1 : https://developers.cloudflare.com/d1/worker-api/d1-database/ ; le journal de migration appliqué ne doit jamais être réécrit.
