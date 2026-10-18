#NYVO

Application football premium (iPhone/Android, web responsive). Ce dépôt contient le **prototype interactif V0.3** : données, chaînes, actualités et vidéos **fictives**. Aucune API, aucun direct réel, aucune notification, aucune synchronisation ni lecture vidéo n'est opérationnelle.

## Lancer

Prérequis : Node.js ≥ 20. L'application elle-même n'a aucune dépendance.

```bash
npm start                 # sert app/ sur http://localhost:4173 (et l'adresse réseau locale pour un smartphone sur le même Wi-Fi)
```

Version autonome, sans serveur : ouvrir `dist/nyvo.html` dans Chrome/Chromebook (double-clic), ou `npm run serve:dist`.

## Tester

```bash
npm install               # outils de test et de build uniquement (Playwright, esbuild, police Inter)
npm test                  # 12 tests de logique (node:test)
npm run test:e2e          # 35 tests dans Chromium : profils smartphone 390 px et Chromebook 1366 px
NYVO_URL="file://$PWD/dist/nyvo.html" npm run test:e2e   # mêmes tests sur la version monofichier
npm run test:legacy       # 12 scénarios hérités du prototype V0.2 (DOM simulé)
npm run build             # régénère dist/nyvo.html
npm run screenshots -- docs/captures/ecrans   # captures (serveur lancé)
npm run compare -- docs/captures/comparaisons # maquette validée / rendu côte à côte
```

Adresses utiles pour la recette (le paramètre `etat` simule un état) :
`#/match/pa-ms` (direct simulé) · `#/match/pa-ms?etat=interrupted` · `#/match/msp-lc` (diffusion non confirmée) · `#/match/mso-lci` (données limitées) · `#/bienvenue` (premier lancement).

## Structure

```
app/                  prototype (HTML + CSS + modules JS, sans build)
  src/data/           jeu de données fictif (catalogue, rencontres, contenus)
  src/domain/         logique pure testée : diffusion, sans spoilers, filtres, programme TV, recherche, fils
  src/state/store.js  préférences invité (localStorage), validation, migration V0.2, stockage indisponible
  src/router.js       navigation par fragments (#/…), historique navigateur, panneaux
  src/ui/             composants (écussons et drapeaux SVG, icônes, cartes, lignes de match…)
  src/screens/        écrans ; src/overlays/ panneaux (Où regarder, recherche, réglages…)
dist/nyvo.html        version monofichier générée
tests/unit, tests/e2e tests de logique et tests navigateur
reference/v0.2/       dossier de reprise V0.2 (maquettes validées, documentation, prototype et tests d'origine)
docs/                 rapport V0.3, captures et comparaisons
```

Voir [docs/RAPPORT_V0.3.md](docs/RAPPORT_V0.3.md) pour l'audit, les changements, la matrice réalisé / simulé / différé et les points à arbitrer.
