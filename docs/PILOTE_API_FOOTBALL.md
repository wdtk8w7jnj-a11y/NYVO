# Pilote NYVO — intégration API-Football côté serveur

**État :** intégration prête et testée contre un fournisseur simulé. **Aucun vrai match n'est activé.**

La clé n'a pas encore été fournie, et l'environnement cloud actuel bloque l'hôte `v3.football.api-sports.io`. Les saisons réellement accessibles n'ont donc pas encore été vérifiées.

## 1. Architecture
```
navigateur ──> serveur pilote NYVO (server/index.mjs) ──> API-Football v3
                │  clé API_FOOTBALL_KEY (serveur uniquement)
                │  garde-fou de quota (budget 90/100 par jour UTC, 10/minute)
                │  cache disque (server/.cache/, ignoré par Git)
                └─ activation : NYVO_REAL_MATCHES=1 ET saisons vérifiées
```
- Le navigateur n'appelle jamais API-Football et ne voit jamais la clé.
- Le serveur n'expose que trois routes, en lecture seule :

| Route | Rôle |
|---|---|
| `GET /api/pilote/etat` | Mode, présence de la clé (jamais sa valeur), quota, dernière vérification, activation par compétition. Aucun appel au fournisseur. |
| `GET /api/pilote/matchs?date=AAAA-MM-JJ` | Matchs réels des compétitions activées. Réponse **423** tant que l'activation n'est pas complète. |
| Fichiers du prototype | Le prototype reste servi en données de démonstration. |

- **Aucun achat automatique.** Le code n'appelle que des routes de lecture (`/status`, `/leagues`, `/fixtures`). Il ne touche ni à l'abonnement ni au compte. Changer d'offre se fait manuellement par le propriétaire, sur le tableau de bord du fournisseur.

## 2. Où saisir la clé de façon sécurisée
Ne collez jamais la clé dans une conversation, un ticket, un commit ou un fichier du dépôt.

- **Session cloud Claude Code** (pour que je lance la vérification) :
  1. Ouvrez le menu de l'environnement cloud, dans la barre de titre de la session, puis **Edit**.
  2. Ajoutez la clé sous **Network secrets** (libellé **API credentials** dans une application pas encore mise à jour) ou, à défaut, comme variable d'environnement, sous le nom exact `API_FOOTBALL_KEY`.
  3. Dans **Network access**, ajoutez le domaine `v3.football.api-sports.io` aux domaines autorisés, en laissant cochée la case des gestionnaires de paquets. Étapes détaillées : https://code.claude.com/docs/en/cloud-environments#network-access
  4. Ouvrez une **nouvelle session** : elle prendra en compte la clé et le réseau.
- **Votre machine personnelle** :
  - Dans le terminal, sans laisser la clé dans l'historique : `read -rs API_FOOTBALL_KEY && export API_FOOTBALL_KEY`, puis collez la clé (rien ne s'affiche).
  - Ou bien, copiez `.env.example` en `.env` (fichier ignoré par Git), renseignez `API_FOOTBALL_KEY=`, puis protégez-le avec `chmod 600 .env`.
- **Hébergement futur** : utilisez le gestionnaire de secrets de l'hébergeur (variables secrètes du service). Si une CI doit l'utiliser, passez par les secrets GitHub Actions. Ne la placez jamais dans le code du navigateur.
- **En cas de fuite** : régénérez la clé depuis le tableau de bord API-Football, puis remplacez-la dans le secret.

## 3. Quota : 100 requêtes par jour
- **Budget NYVO :** 90 requêtes par jour (`API_FOOTBALL_DAILY_BUDGET`). Il reste ainsi une marge de 10 requêtes pour le tableau de bord et les imprévus.
- **Journée comptée en UTC :** API-Football remet son compteur à zéro à 00:00 UTC.
- **Limite par minute :** 10 requêtes (`API_FOOTBALL_PER_MINUTE`). C'est une valeur réglable : vérifiez la limite exacte de votre offre sur le tableau de bord.
- **Compteur persistant** (`server/.cache/quota.json`) : un redémarrage ne le remet pas à zéro. Il se recale sur les en-têtes `x-ratelimit-requests-remaining` et sur `/status`. Si le fournisseur annonce moins de requêtes restantes que prévu, c'est lui qui fait foi.
- **Budget atteint :** plus aucun appel n'est émis. La dernière donnée en cache est servie, marquée `perime: true`. Sans cache, la réponse est **429** avec `Retry-After`.
- **Durées de cache :**

  | Date demandée | Durée |
  |---|---|
  | Jour passé | 7 jours |
  | Jour même | 1 heure |
  | Jour futur | 6 heures |

  Les demandes identiques simultanées sont regroupées en une seule requête.
- **Conséquence :** avec ce quota, le pilote **ne fournit pas de direct en temps réel**. Une compétition coûte au plus 24 requêtes par jour pour le jour même. Commencez avec une seule compétition (`NYVO_PILOT_LEAGUES=61`, Ligue 1).

## 4. Vérifier les saisons accessibles avant d'activer
1. Simulation, sans aucun appel : `npm run api:check`. Elle affiche la présence de la clé et le coût estimé : 1 + 2 par compétition, soit 3 requêtes pour la Ligue 1 seule.
2. Vérification réelle : `npm run api:check -- --confirmer`. Pour tester aussi des saisons précises, ajoutez par exemple `--saisons=2024,2025` (1 requête de plus par saison et par compétition).

   La commande enchaîne `/status` (offre, état, consommation du jour), `/leagues?id=…` (saisons et couverture annoncées), puis un appel `/fixtures` d'essai par saison. Ce dernier révèle les restrictions de l'offre : par exemple, une offre gratuite peut refuser la saison courante.
3. Elle écrit `server/.cache/acces-saisons.json`. Le fichier ne contient ni la clé, ni le nom, ni l'e-mail du compte.

**Conditions d'activation :** les vrais matchs ne s'activent que si les trois conditions sont réunies.
- `NYVO_REAL_MATCHES=1` est défini.
- La **saison courante** de la compétition a été vérifiée **accessible**.
- La vérification date de **moins de 7 jours**.

Si l'offre ne donne pas accès à la saison courante, les vrais matchs restent désactivés et le prototype reste en démonstration. Ouvrir une saison passée ne remplace pas la saison en cours : c'est une décision à prendre par vous.

## 5. Données renvoyées
- **Statuts :** les codes API-Football sont convertis vers le modèle NYVO (à venir, en direct, interrompu, terminé, reporté, annulé, arrêté).
- **Données absentes :** un score ou une minute absents restent `null`, jamais 0. Un score incomplet n'est pas complété.
- **Diffuseurs :** `broadcast` vaut toujours `null`, car API-Football ne fournit pas les chaînes. La diffusion reste « non confirmée » jusqu'à l'ajout d'une source dédiée.
- **Écrans :** le prototype affiché ne consomme pas encore ces données. Leur branchement viendra après la vérification et votre validation.

## 6. Commandes
```bash
npm run api:check                    # simulation, aucun appel
npm run api:check -- --confirmer     # vérification réelle (≈ 3 requêtes pour 1 compétition)
NYVO_REAL_MATCHES=1 npm run pilote   # serveur pilote sur http://127.0.0.1:4180 (local)
npm test                             # inclut 13 tests serveur avec fournisseur simulé
```

## 7. Limites
- Non vérifié avec une vraie clé ni avec le vrai fournisseur. Les tests utilisent un fournisseur simulé et valident le mécanisme, pas vos droits d'accès.
- La forme exacte de certaines réponses et messages d'erreur d'API-Football est à confirmer lors de la première vérification réelle.
- Le compteur est local à un seul serveur : plusieurs instances partageant une clé nécessiteraient un compteur commun.
- Pas de direct en temps réel avec 100 requêtes par jour.
