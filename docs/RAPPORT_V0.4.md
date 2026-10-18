# NYVO — Rapport du prototype V0.4

- **Branche :** `claude/nyvo-v0.4`, créée depuis `claude/youthful-euler-lgq3fj` au commit `f013a9b` (V0.3 audité). L'historique est conservé.
- **Publication :** aucune fusion dans `main` ni publication de site. Le prototype reste entièrement fictif et n'est pas prêt pour la production.

## 1. Point de départ vérifié
- La branche distante V0.3 était toujours au commit `f013a9b` : aucune modification à intégrer.
- Le dépôt ne contient pas d'AGENTS.md.
- `NYVO_V0.4_CLAUDE.zip` a été décompressé et ses 12 empreintes `SHA256SUMS.txt` sont valides. Les 9 maquettes ont été examinées une par une. Elles sont versionnées dans `reference/v0.4/` avec l'inventaire, le prompt et `DECISIONS_V0.4.md`. Les références V0.2 restent intactes.

## 2. Réalisé

**Programme TV** (maquettes 01, 02, 03 et 07)
- Trois vues, Horaire, Chaîne et Match, calculées à partir des mêmes entrées et des mêmes filtres :
  - **Horaire :** chronologie triée sur l'instant réel ;
  - **Chaîne :** regroupement par chaîne, avec une rubrique séparée « Diffusions non confirmées » ;
  - **Match :** avant-match, match intégral, multiplex et après-match regroupés par rencontre.
- **Programmes et multiplex :** le moment de la soirée et le format sont modélisés séparément. Le multiplex est un programme unique (« Coupe Élite · 2 rencontres », avec « Voir les rencontres ») et n'est pas dupliqué. À heure égale, le match intégral précède le multiplex.
- **Défaut de la maquette 01 corrigé :** la rencontre non confirmée de 21:00 apparaît à son heure, avant les programmes de 23:00, dans le code comme dans les captures.
- **Date et fuseau :** fuseau, passage de minuit selon le pays, horaires prévisionnels étiquetés, vérification simulée datée.
- **Navigation :** la vue, la date et les filtres sont dans l'adresse, et conservés au retour d'une fiche ou d'un panneau.
- **Hors France :** un état vide explique que le programme de démonstration ne couvre que la France.

**Filtres** (maquette 04)
- Réglages rapides : Favoris, Compétition, Gratuit/Payant, Mes accès.
- Panneau détaillé :
  - Favoris ;
  - compétitions, à choix multiples ;
  - accès Tous / Gratuit / Payant ;
  - types, à choix multiples ;
  - Mes accès et « Configurer mes services » ;
  - diffusions non confirmées.
- Le panneau travaille sur un brouillon : « Appliquer » seul valide, « Réinitialiser » remet le brouillon par défaut, Fermer, Échap et Retour annulent. Sans aucun type coché, « Appliquer » est désactivé.
- Les filtres Mes accès et Gratuit/Payant excluent les diffusions non confirmées, et le nombre exclu est annoncé.
- États vides explicites, avec « Modifier les filtres » et « Voir tout le programme ».

**Mes accès** (maquettes 05, 06 et 07)
- Nouveau modèle service / offre / option / chaîne, par pays, avec date de vérification.
- **Offres Vision Sport Démo :**
  - Pack Essentiel : Sport Démo 1 ;
  - Pack Football : Sport Démo 1 et 2 ;
  - Option Sport Plus : ajoute Sport Démo 3, seulement si elle est cochée.
- **Arena Démo et Horizon TV Démo :** offre à préciser, non utilisée par le filtre.
- **Saisie :** recherche de service ; sélection en brouillon jusqu'à « Enregistrer » ; « Choisir mon offre » avec options indépendantes ; « Ton offre est introuvable ? » permet de garder le service à préciser.
- **Libellés :** « offre déclarée », « Chaînes incluses dans ton offre déclarée », « Cette sélection ne souscrit aucun abonnement ». Aucun prix, achat ou identifiant.
- **Programme avec Mes accès :**
  - bandeau « Mes accès activé », avec l'offre déclarée et « Gérer mes services » ;
  - « Voir tout le programme » ne retire que ce filtre ;
  - trois états distincts : aucune préférence, correspondance non vérifiée, aucune correspondance.
- **Où regarder :** la phrase V0.3 est corrigée en « Aucune diffusion confirmée ne correspond à tes offres renseignées ».
- **Migration V0.3 :** les chaînes cochées deviennent des « accès historiques à préciser ». Favoris, enregistrements, historique et réglage sans spoilers sont conservés. Les valeurs stockées sont validées et le stockage indisponible est géré comme en V0.3.
- **Pays :** les accès sont propres à chaque pays. Une offre française n'est pas reprise en Belgique.

**Accès au diffuseur** (maquettes 08 et 09)
- **Ouverture :** depuis une carte du programme ou depuis « Où regarder ».
- **Contenu du panneau :** rencontre, format, heure, pays, chaîne, service, destination (`vision-sport.example`, adresse fictive), gratuit/payant, abonnement requis, et inclusion éventuelle dans l'offre déclarée.
- **Boutons :** « Ouvrir chez le diffuseur » et « Ouvrir le site » affichent une simulation explicite, sans requête ni nouvelle fenêtre.
- **Lien indisponible :** le panneau ne déduit aucune annulation. Il propose « Ouvrir le site officiel » (seulement si un site existe), « Voir les autres diffusions » et « Signaler le lien ». Le signalement demande une confirmation explicite et se conclut par « Simulation de signalement : rien n'a été envoyé ».

**Correctif serveur**
- `scripts/serve.mjs` ne plante plus si l'énumération des interfaces réseau échoue (`uv_interface_addresses`). Il continue de servir `localhost` et l'annonce.
- Les deux cas ont été vérifiés : démarrage normal, et échec simulé avec `NYVO_NO_IFACES=1`.
- Ce cas venait de l'environnement d'audit, pas de l'appareil de l'utilisateur.

## 3. Simulé ou différé
| Élément | État |
|---|---|
| Programmes, chaînes, services, offres, vérifications de correspondance | **Simulé** : données fictives, France uniquement |
| Ouverture chez le diffuseur, ouverture du site, signalement de lien | **Simulé** : aucun appel réseau, aucune ouverture externe |
| Authentification de l'abonnement de l'utilisateur | **Hors périmètre** : jamais vérifiée (« offre déclarée ») |
| Programmes réels, fournisseurs, couverture des autres pays | **Différé** au jalon des sources réelles |
| Anglais, comptes et synchronisation, notifications, applications natives, hors connexion complet | **Différé**, inchangé depuis la V0.3 |

## 4. Tests réellement exécutés
| Suite | Commande | Résultat |
|---|---|---|
| Logique (node:test) | `npm test` | **25/25** : 12 V0.3 et 13 V0.4 |
| Chromium, smartphone 390 px et Chromebook 1366 px, app servie | `npm run test:e2e` | **59 réussis, 1 ignoré** ; 3 passages complets répétés sans échec |
| Mêmes tests sur `dist/nyvo.html` en `file://` | `NYVO_URL=file://…/dist/nyvo.html npm run test:e2e` | **57 réussis, 3 ignorés** ; 3 passages sans échec |
| Scénarios V0.2 hérités | `npm run test:legacy` | 12/12 (DOM simulé) |
| Build | `npm run build` | `dist/nyvo.html`, 293 Ko |

Les tests ignorés ne sont pas comptés comme réussis :
- le contrôle de débordement à 360 px ne s'exécute que sur le profil smartphone ;
- en `file://`, la persistance après rechargement n'est pas vérifiée, car Chromium perd parfois le `localStorage` à ce moment dans un contexte de test éphémère (limite déjà décrite en V0.3). Servie en HTTP, elle est vérifiée.

Les nouveaux tests couvrent :
- **Programme :** ordre et format du multiplex sans doublon, cohérence des trois vues, chronologie et fuseau autour de minuit, combinaison des filtres et lecture de l'adresse, état vide.
- **Filtres :** application et annulation par Échap et par Retour, retour du focus, Réinitialiser puis Appliquer.
- **Mes accès :** options non sélectionnées, offre à préciser, correspondance non vérifiée, migration V0.3, changement de pays.
- **Diffuseur :** lien indisponible, signalement simulé, aucune ouverture ni requête externe en démo.
- **Transversal :** message corrigé d'Où regarder, mode sans spoilers sur le programme, absence de débordement à 360 px et cibles tactiles sur les nouveaux écrans.

**Non testé :** Safari iOS, Firefox, vrais appareils et lecteurs d'écran.

## 5. Captures
- `docs/captures/comparaisons-v0.4/` : les 9 maquettes V0.4 face au rendu à 390 × 844.
- `docs/captures/ecrans/` : écrans 20 à 28 (nouvelles vues) et écrans V0.3, en 390 px et 1280 px.
- `docs/captures/comparaisons/` : planches V0.2, toujours à jour.

## 6. Recette smartphone et Chromebook
1. `npm install`, puis `npm start`. Ouvrir http://localhost:4173, ou l'adresse réseau affichée depuis un téléphone sur le même Wi-Fi.
2. **Programme et filtres :**
   1. Ouvrir Matchs → Programme TV. Passer de Horaire à Chaîne puis à Match ; vérifier que Marseille – Lille (21:00) précède les programmes de 23:00.
   2. Ouvrir Filtres détaillés, modifier, puis Échap : rien n'est appliqué. Modifier de nouveau, puis Appliquer.
3. **Mes accès :**
   1. Mes accès → Configurer mes services → Vision Sport Démo → Pack Football → Enregistrer.
   2. Activer « Mes accès » dans le programme : Sport Démo 3 disparaît. « Voir tout le programme » ne retire que ce filtre.
4. **Diffuseur :**
   1. Toucher la carte « Match intégral » de Paris – Milan : le panneau du diffuseur s'ouvre.
   2. Toucher « Ouvrir chez le diffuseur » : un message de simulation s'affiche.
   3. Toucher la carte de Toulouse – Nice : le panneau « Lien indisponible » s'ouvre. Faire un signalement simulé.
5. **Pays :** passer en Belgique et vérifier qu'aucune offre française n'est reprise.
6. **Sans serveur :** ouvrir `dist/nyvo.html` dans Chrome. La persistance après rechargement peut être moins fiable en `file://`. Aucune installation native iPhone n'est proposée.

## 7. Limites restantes
- Les écarts de données entre les maquettes V0.4 et le catalogue V0.3 sont listés dans `reference/v0.4/DECISIONS_V0.4.md` et restent à arbitrer par le propriétaire si nécessaire.
- La typographie reste un peu plus grande que sur les maquettes, pour garder des cibles d'au moins 44 px. Les réglages rapides défilent horizontalement sur petit écran.
- La branche dépend de la V0.3, qui n'est pas fusionnée (voir la PR).
