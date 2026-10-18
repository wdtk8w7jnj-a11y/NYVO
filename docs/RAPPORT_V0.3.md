# NYVO — Rapport du prototype V0.3

Branche : `claude/youthful-euler-lgq3fj`. Aucune fusion dans `main`, aucune publication publique.

## 1. Audit du dossier de reprise

- `NYVO_HANDOFF_V0.2.zip` a été récupéré depuis les deux Releases en brouillon. Les deux pièces jointes sont identiques, avec le SHA-256 `b421a852…cf086741`, conforme à la valeur attendue.
- L'archive contient 29 fichiers. Les 28 empreintes de `SHA256SUMS.txt` sont valides. L'inventaire compte 9 planches validées et 11 archives non canoniques.
- Les documents lus sont `LIRE_EN_PREMIER`, `PROMPT_CLAUDE_CODEX`, les trois documents de `04_DOCUMENTATION` et `INVENTAIRE_MAQUETTES.json`.
- Les neuf planches ont été examinées une par une. Les archives n'ont pas servi de référence.
- Les tests V0.2 (`node tests/journey.cjs`) donnent 12/12. Ils vérifient la logique dans un DOM simulé, pas le rendu.
- Écarts principaux de la V0.2 avec les maquettes :
  - icônes Unicode et écussons en initiales ;
  - mise en page de type bureau ;
  - pas de groupes par compétition, pas de navigation par date ni d'interrupteur « Diffusés en… » ;
  - fiche réduite, pas de Programme TV, recherche limitée ;
  - retour navigateur absent ;
  - erreurs de stockage ignorées.
- Le dossier versionné se trouve dans `reference/v0.2/`, sans les 11 archives visuelles, qui restent dans la Release. Le fichier `SHA256SUMS.txt` les mentionne donc encore.

## 2. Choix techniques

- **Pas de framework ni d'étape de build pour développer.** Le code est en modules ES natifs, avec un rendu par gabarits échappés par défaut. Il est découpé en données, logique pure, état, routeur, composants et écrans. C'est proportionné à un prototype, lisible, et la logique est testable sous Node.
- **Navigation par fragments `#/…`**, avec `history.pushState`. Le bouton Retour du navigateur ferme les panneaux et revient à l'écran précédent, en restaurant le défilement. Les filtres et la date sont dans l'adresse, ce qui permet de partager un lien.
- **`dist/nyvo.html`** est un fichier unique (240 Ko) qui intègre JS, CSS et police. Il fonctionne ouvert directement, sans serveur.
- **Police Inter** (licence OFL) embarquée. Les icônes, les écussons fictifs, les drapeaux et les illustrations sont dessinés en SVG. Aucune image réelle n'est utilisée.
- Les tests de bout en bout utilisent Playwright 1.56.1 dans Chromium.

## 3. Réalisé dans cette version

**Fidélité visuelle (planches 01 à 09)**
- Barre supérieure avec NYVO, pastille pays et drapeau, recherche, réglages. Badge DÉMO. Barre de 5 onglets avec l'onglet actif en néon rubis. Sur Chromebook (≥ 900 px), elle devient un rail latéral.
- Composants reconstruits :
  - carte vedette « Match suivi » / « En direct » ;
  - lignes de match avec heure, écussons empilés, chaîne, chevron et étoile ;
  - groupes de compétition repliables ;
  - filtres segmentés ;
  - interrupteur « Diffusés en {pays} » ;
  - tri par compétition ou par horaire ;
  - frise du direct avec nœuds rubis ;
  - panneau « Où regarder » en feuille basse ;
  - états masqué, non confirmé et interrompu conformes aux planches 05 et 06 ;
  - Favoris avec Mon espace et Enregistrés ;
  - premier lancement en 2 étapes ;
  - Actualités et Vidéos.
- Une passe de densité aligne la typographie sur les planches tout en gardant des cibles tactiles d'au moins 44 px.

**Parcours et interactions**
- Premier lancement facultatif :
  - pays par boutons radio natifs ;
  - langue (English affiché « bientôt », désactivé) ;
  - favoris avec recherche et onglets Équipes/Compétitions ;
  - puces de sélection retirables ;
  - « Plus tard » ;
  - retour à l'étape 1 sans perte.
- Accueil :
  - Mes matchs (favoris, sinon « À la une ») et invitation à ajouter des favoris ;
  - Programme TV de la soirée d'une rencontre, choisi selon les favoris et le pays ;
  - actualité et vidéo personnalisées.
- Matchs :
  - navigation jour par jour et sélecteur de date ;
  - date et filtres conservés dans l'adresse ;
  - états vides utiles (« Revenir au 18 octobre », « Afficher tous les matchs ») ;
  - épinglage des équipes suivies et des matchs enregistrés.
- Fiche match :
  - vrais onglets ARIA (flèches clavier) ;
  - Direct (frise, Moments forts) ;
  - Compositions (terrain + liste accessible, remplaçants, buts et changements, statut « officielle ») ;
  - Statistiques (barres, « Non disponible » au lieu de zéro, définition du xG) ;
  - Classement (tableau avec légende, ou tableau final pour la coupe).
- Un panneau « Simuler un état (démonstration) » propose : normal, non confirmée, interrompu (direct seulement) et limité.
- Où regarder :
  - pays modifiable ;
  - fuseau ;
  - Toutes les diffusions / Mes accès (sélection locale facultative) ;
  - options avec format, support, accès et abonnement ;
  - « Ouvrir chez le diffuseur » annonce qu'aucun site n'est ouvert ;
  - toute la soirée avec horaire prévisionnel ;
  - source et dernière vérification.
- Programme TV : ordre chronologique, vue par chaîne, filtres Mes favoris/Gratuit/Payant, compétition, Mes accès.
- Recherche globale :
  - matchs, équipes, compétitions, joueurs, chaînes, actualités, vidéos ;
  - insensible aux accents ;
  - abréviations (PA, BU, SD1…) ;
  - catégories ;
  - historique effaçable.
- Favoris :
  - suivre et ne plus suivre équipes, compétitions et joueurs ;
  - groupes repliables ;
  - Enregistrés triés par ajout, mode Modifier ;
  - carte « compte facultatif » masquable.
- Fiches équipe, compétition et joueur : aperçu, matchs, suivre, sans spoilers par équipe. Les sections absentes sont annoncées comme non disponibles.
- Sans spoilers :
  - global et par équipe, persistants ;
  - révélation par match, en mémoire de session (comportement V0.2 conservé) ;
  - masquage du score, de la minute, des événements, statistiques, compositions et classement (y compris avant le coup d'envoi) ;
  - masquage des titres et miniatures des contenus liés, du titre de page et des libellés accessibles ;
  - horaires et chaînes toujours visibles.
- Stockage :
  - préférences validées au chargement ;
  - migration des préférences V0.2 (`nyvo-v1`) ;
  - si le stockage est bloqué ou plein, une bannière s'affiche et les messages indiquent « Non sauvegardé sur cet appareil ». Aucune fausse confirmation.
- Accessibilité :
  - lien d'évitement ;
  - focus sur le titre à chaque changement d'écran ;
  - focus rendu au bouton d'origine à la fermeture d'un panneau ;
  - `aria-pressed`, `aria-expanded` et `role="switch"` ;
  - tableaux de classement avec en-têtes ;
  - annonces d'état en direct (`role="status"`).

**Défaut corrigé grâce aux tests en navigateur.** Les attributs ARIA booléens étaient rendus vides. Les tests sur DOM simulé ne pouvaient pas le voir.

## 4. Arbitrages de cohérence des données (à valider)

Les maquettes se contredisent sur quelques points. J'ai tranché comme suit, sans toucher aux décisions écrites :

1. **Genres.** Milan Stella est masculine sur la planche 08 et féminine sur la 07. Lyon Nord est féminine sur la 08 mais joue contre Berlin Union, équipe masculine. J'ai créé des identifiants distincts :
   - Milan Stella (M) et Milan Stella (F) ;
   - Lyon Nord (M), qui joue Berlin Union ;
   - Lyon Nord (F), proposée au premier lancement.

   J'ai ajouté une rencontre féminine fictive le 19/10 (Ligue Féminine Démo, diffusion non confirmée).
2. **Coupe Élite.** Paris Atlas – Milan Stella est une demi-finale. Nantes Loire – Strasbourg Est passe donc en Ligue Démo (la planche 02 la classe en Coupe Élite). Toulouse Rive – Nice Riviera devient l'autre demi-finale.
3. **Lyon Nord – Berlin Union** est diffusé sur Sport Démo 2, comme sur les planches 01 et 02. La V0.2 l'affichait non confirmé. Le match non confirmé est Marseille Sport – Lille Capitale, comme sur la planche 02.
4. **Sport Démo 2 à 21:00** porte à la fois le multiplex (planche 04) et plusieurs matchs. Les matchs hors multiplex sont marqués « Streaming ».
5. **Remplacement à 51′.** Il est attribué à Paris Atlas, comme sur la planche 03. La V0.2 l'attribuait à Milan Stella.
6. **Horloge de démonstration.** Paris – Milan, coup d'envoi à 21:00, est à la 67′, alors que les autres rencontres de 21:00 restent « à venir », comme sur les planches. Ce point est volontairement laissé en l'état et signalé.
7. **Sport Démo 3** est marqué « Gratuit » pour permettre d'essayer le filtre Gratuit/Payant. Cette valeur est fictive.
8. **Moments forts.** Le schéma montre le terrain et la surface concernée, sans points ni trajectoires, conformément à la décision « aucun déplacement inventé ». La planche 03 dessine des joueurs et une flèche.
9. **Photographies.** Les photos des planches sont remplacées par des illustrations vectorielles marquées « Visuels d'illustration ». C'est le seul arbitrage visuel ouvert (voir la question posée dans la conversation).

## 5. Matrice réalisé / simulé / différé

| Élément | État |
|---|---|
| 5 onglets, premier lancement, Mon espace / Enregistrés, recherche, filtres, dates, panneaux, retour navigateur | **Réalisé** (local) |
| Préférences invité, favoris, enregistrements, historique de recherche | **Réalisé** dans ce navigateur (localStorage) |
| Sans spoilers global / par équipe / par match | **Réalisé** (révélation par match en mémoire de session) |
| Matchs, scores, événements, compositions, statistiques, classements | **Simulé** : données fictives |
| Chaînes, programmes, accès gratuit/payant, dernière vérification | **Simulé** : fictifs, France uniquement ; autres pays « non confirmée » |
| « Ouvrir chez le diffuseur », « Actualiser », « Réessayer » | **Simulé** : message explicite, aucun service contacté |
| Actualités, vidéos, visuels | **Simulé** : contenus fictifs, illustrations vectorielles, aucune lecture vidéo |
| Alertes / notifications | **Différé** : panneau explicatif, aucune autorisation demandée |
| Compte, sauvegarde, synchronisation | **Différé** : panneau explicatif |
| Interface anglaise | **Différé** : option visible et désactivée |
| Hors connexion (service worker), téléchargement | **Différé** |
| Animation 2D de buts, médias autorisés | **Différé** : nécessite des données de position et des droits |
| Fiches entités complètes (effectif, parcours, saisons), arbre complet des coupes | **Différé** : sections annoncées « non disponibles » |
| Sources réelles (fournisseurs, couverture, exactitude des chaînes par pays) | **Différé** au jalon 2, après validation du prototype |
| Applications natives iPhone / Android | **Différé** |

## 6. Tests réellement exécutés

| Suite | Commande | Résultat |
|---|---|---|
| Logique (node:test) | `npm test` | 12/12 |
| Navigateur Chromium, smartphone 390 px + Chromebook 1366 px, app servie | `npm run test:e2e` | 35 réussis, 1 ignoré volontairement (contrôle 360 px réservé au profil smartphone) ; 3 répétitions complètes sans échec |
| Mêmes tests sur `dist/nyvo.html` en `file://` | `NYVO_URL=file://…/dist/nyvo.html npm run test:e2e` | 35 réussis, 1 ignoré ; 3 répétitions sans échec. Les vérifications de persistance après rechargement sont sautées dans ce mode (voir ci-dessous) |
| Scénarios V0.2 hérités | `npm run test:legacy` | 12/12 (ancien prototype, DOM simulé) |

Les tests navigateur couvrent :
- le premier lancement complet et « Plus tard » ;
- le parcours accueil → matchs → fiche → Où regarder → favoris ;
- Échap et le retour du focus ;
- les dates et filtres, les groupes repliables ;
- l'absence de score dans le HTML, les attributs et le titre en mode sans spoilers ;
- la diffusion non confirmée et le changement de pays ;
- le direct interrompu, les données limitées sans zéro ;
- les onglets au clavier ;
- la recherche et l'historique ;
- les favoris après rechargement ;
- le stockage bloqué ;
- la restauration du défilement ;
- l'absence de lecture automatique ;
- le Programme TV ;
- l'absence de débordement horizontal à 360 px sur 19 écrans ;
- des cibles d'au moins 40 px et des noms accessibles.

**Constat `file://` :** dans le contexte éphémère de Playwright, Chromium perd parfois tout le `localStorage` au rechargement d'une page ouverte en `file://` (environ 1 fois sur 3 ; la clé est entièrement absente, ce n'est pas un défaut d'écriture de l'application). Servie en HTTP, la persistance a été stable sur toutes les répétitions. Ce comportement n'a pas pu être vérifié dans un vrai profil Chrome. Pour tester les favoris après rechargement, préférez la version servie (`npm start`).

**Limites :** tout a été vérifié dans Chromium. Safari iOS, Firefox, les vrais appareils et les lecteurs d'écran (VoiceOver/TalkBack) n'ont pas été testés. Il n'y a pas d'audit de contraste automatisé.

Captures : `docs/captures/ecrans/` (19 écrans en 390 px et 1280 px) et `docs/captures/comparaisons/` (les 9 planches face au rendu).

## 7. Tester la version

1. Sur l'ordinateur : `npm start`, puis ouvrir http://localhost:4173.
2. Sur smartphone, sur le même Wi-Fi : ouvrir l'adresse réseau affichée par `npm start`.
3. Sur Chromebook ou PC sans outil : télécharger `dist/nyvo.html` depuis la branche et l'ouvrir dans Chrome.
4. Recette guidée :
   - premier lancement ;
   - accueil, puis Tous les matchs ;
   - Paris Atlas – Milan Stella, puis Où regarder ;
   - Retour du navigateur ;
   - étoile, puis Favoris → Enregistrés ;
   - rechargement ;
   - Réglages → Sans spoilers ;
   - « Simuler un état » dans la fiche.
