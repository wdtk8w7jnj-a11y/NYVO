# NYVO Premium éditorial — rapport de livraison (19 octobre 2026)

Branche : `feat/nyvo-premium-editorial`, issue de `chore/nyvo-premium-editorial-handoff` (elle-même issue de `claude/youthful-euler-lgq3fj`, f606a63). Rien n'est fusionné dans `main`. **Rien n'est publié sur le site** : voir « Blocages ».

## 1. Audit et choix de base

| | Prototype GitHub (`app/`) | SITE_V24 (snapshot 9f47b5f) |
|---|---|---|
| Interface | Sources ES modules V0.4, données fictives | `public/nyvo.html` : bundle V0.4 minifié + couches réelles écrites à la main (`real*`, `sig*`, `hv*`, `community*`, `md*`, `journal*`) |
| Données réelles | Pilote API-Football inactif | football-data.org (12 compétitions), résumés YouTube officiels, RSS Le Monde/Foot Mercato, D1 |
| Tests | 38 node + Playwright | 82 node |

**Choix :** la base est SITE_V24, importée telle quelle dans `site/` (commit 2dfd548) pour que les commits suivants montrent seulement les changements. Le prototype `app/` et ses tests sont conservés intacts (toujours 38/38). Les sources de la couche V24 n'existent que dans le bundle : la nouvelle couche est écrite en clair dans `site/src/premium.{js,css}` et injectée par `site/scripts/assemble-premium.mjs` ; un test vérifie que `nyvo.html` correspond aux sources.

## 2. Réalisé

**Vidéo (lecteur supprimé).** Retrait de `loadYoutube`, des trois `mountVideo`, de `mdPlayer`, des gardes de génération, de la surcharge de rendu, de l'action `video-load-real` et des styles `.youtube-frame`. Fiche vidéo : miniature 16:9, titre, éditeur, durée, match, dates, autres versions, bouton « Voir sur YouTube » (`target=_blank`, `noopener noreferrer`) vers `https://www.youtube.com/watch?v=<id>` construit uniquement depuis un identifiant à 11 caractères validé (`ytWatchUrl`). Vidéo absente : aucun match substitué. Sans spoilers : titre et miniature masqués avant révélation explicite.

**Design.** Accueil : une éditoriale unique (photo seulement si autorisée, sinon composition typographique assumée), « Vos matchs », rail Résumés (2 cartes max + « Toutes les vidéos »), « Autour de vos équipes », bloc Actualités, rail « Histoires du football ». Matchs : barre de dates (Hier/Aujourd'hui/Demain, 7 jours, calendrier), liste chronologique unique, compétition + logo par ligne, match vedette unique (équipe suivie) retiré de la liste, panneau Filtres (compétition, statut, équipe, favoris, diffusion confirmée) avec compteur. Score absent : tiret « Score indisponible », jamais 0. Journée vide : message + vraies dates proches, date inchangée. Desktop ≥ 1100 px : grilles 2–3 colonnes. Cibles ≥ 44 px, `prefers-reduced-motion`, pas d'autoplay ni de hero tournant.

**Actualités.** Libellé « Information rapportée » supprimé partout (RSS, caches D1 existants via `retireReportedLabel`, démo) ; provenance conservée en interne (`provenance:'press-rss'`) ; « Rumeur » et « Officiel » restent. L'illustration de stade répétée est remplacée par des vignettes typographiques (source + catégorie). Bandeau de nouveautés flottant (ne décale pas la lecture). Date de publication et dernière collecte distinctes. Registre `NEWS_REGISTRY` par source (flux, droits, images, fréquence, attribution, état, raison). Cadence : tâche horaire existante + cache 50 min → ≤ 90 min tant que l'ordonnanceur fonctionne ; aucune nouvelle tâche créée.

**Article CR7.** Réécrit (≈ 2 min 30) : titre précis, chapô, scène d'ouverture, 3 intertitres, encadré record daté, signature « Rédaction NYVO », date de révision, 4 sources UEFA. Les détails V24 non recoupés (minutes, passeurs, nom du buteur adverse) ont été retirés. Visuels : couverture et graphique de progression **originaux** (SVG NYVO), photo Ballon d'Or 2015 conservée avec légende « postérieure à la campagne ». Fontaine : signature et intertitres ajoutés sans nouveau fait.

**Depuis les tribunes.** Type distinct dans Vidéos ; validateur `stands` (URL YouTube canonique, auteur, rencontre vérifiée, contexte, droits) ; six créateurs candidats (AwayDays, Thogden, Footy Adventures, StuntPegg, Smiv, La Tribune Olympienne) **inactifs** (`channelId:null`). Pipeline prêt : chaîne → playlist d'uploads → `videos.list` groupé → association → **file de modération uniquement**, budget/quota/pause partagés, jamais `search.list`.

**Équipes.** La fiche club V24 (aperçu, actualités, mercato, matchs, stats datées avec période et nombre de matchs, vidéos ; alias contrôlés) est conservée et harmonisée (cartes vidéo et articles Premium).

## 3. Registres

### Visuels
| Visuel | Statut | Licence / auteur | Raison |
|---|---|---|---|
| Couverture « 17 » | affiché | Création NYVO | chiffre UEFA |
| Progression 9→13→14→16→17 | affiché | Création NYVO | comptes rendus UEFA |
| Ronaldo, Ballon d'Or 2014 (15/01/2015) | affiché | CC BY 2.0, Anish Morarji | fiche ouverte en V24, non rouverte (réseau) |
| Fontaine, Toulouse 1971 | affiché (V24) | CC BY-SA 4.0, André Cros | inchangé |
| Cérémonie finale Lisbonne 2014 | **non affiché** | CC BY-SA 4.0, Biser Todorov | Commons inaccessible : vérification visuelle impossible |
| Célébration Décima Madrid | **non affiché** | CC BY 3.0 | idem |
| Série tribunes Miguelazo84 | **rejeté** | CC BY-SA 4.0 | date 12/08/2014 contradictoire |

Aucune photo libre d'un but de 2013/14 n'a été vérifiée : l'article renvoie vers la page d'archive officielle de la finale sur UEFA.com (lecture non vérifiée).

### Sources d'actualité
Actives : Le Monde (titres, extraits), Foot Mercato (titres). Bloquées : L'Équipe (403), Le Parisien (HTML). En attente : RMC Sport, Franceinfo Sport, France 24 Sport, BBC Sport, The Guardian Football, clubs/ligues — conditions officielles non relues, aucune activation.

### Contenus vérifiés dans le dépôt
2 histoires, 3 brèves officielles, 27 diffusions et 1 résumé éditorial (catalogue V24), 2 photos sous licence + 2 infographies originales affichées, 6 créateurs candidats, 7 chaînes officielles épinglées et 3 candidates (DAZN France, DAZN Italia, CANAL+ Sport).

## 4. Tests réellement exécutés

- `cd site && node --test tests/*.test.mjs` : **90/90** (82 V24 dont 3 tests du lecteur retirés et 1 adapté, + 11 nouveaux : absence d'iframe/IFrame API, URL canonique, libellé retiré, assemblage, créateurs en modération, validateur tribunes, registre, article CR7).
- `npm test` (prototype) : **38/38**.
- Playwright (`site/tests/e2e/premium.spec.mjs`, Chromium 390×844) : **9/9** — accueil, liste unifiée + filtre local sans appel `/api/` + retour avec date/filtres/défilement conservés, journée vide, score absent, zéro iframe, vidéo absente, sans spoilers (aucune requête `ytimg`), article CR7, persistance des favoris.
- Captures : `docs/premium/captures/index.html` (12 écrans × iPhone 12 390×844 et desktop 1440×900, avant/après).

## 5. Limites et blocages

- **Publication sur le site existant : non effectuée.** Aucun accès Sites/ChatGPT ni jeton de déploiement dans cet environnement ; l'hébergement privé n'a pas été touché, aucun site public créé. Pour publier : depuis le dépôt source du Site, reprendre `site/public/nyvo.html`, `site/server/*`, `site/public/images/editorial/*` puis redéployer avec les outils Sites (aucune nouvelle migration D1, aucun nouveau secret).
- **Réseau sortant bloqué** (proxy 403 : uefa.com, Commons, RSS, YouTube, football-data.org). Vérifications CR7 faites sur les extraits indexés des pages UEFA (recherche web) ; impossible d'ouvrir les fiches Commons ou les chaînes des créateurs.
- **Données réelles non chargées** : sans `FOOTBALL_DATA_TOKEN`, les captures utilisent le code serveur réel avec un fournisseur simulé (`site/tests/fixtures`) : équipes/horaires réels du catalogue, **scores fictifs**. Écussons et miniatures non chargés (états de repli visibles).
- Aucun test sur iPhone physique, aucune lecture vidéo, aucun contrôle géographique.
