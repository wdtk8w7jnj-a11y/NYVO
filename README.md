#NYVO

Application football premium (iPhone/Android, web responsive). Cette branche **V0.5 pilote** conserve la démo V0.4 et ajoute un espace **Matchs réels**, connecté à API-Football uniquement lorsque la clé serveur est configurée. Les chaînes, actualités et vidéos de la démo restent fictives. Aucune notification, synchronisation ou lecture vidéo réelle n'est opérationnelle. L'intégration fournisseur attend sa validation avec une vraie clé ; aucune saison actuelle n'est garantie avec l'offre gratuite.

Pour activer le pilote : [docs/PILOTE_API_FOOTBALL.md](docs/PILOTE_API_FOOTBALL.md). Ne communiquez jamais votre clé dans le chat ou GitHub.

## Lancer

Prérequis : Node.js ≥ 20.6 (Node 22 ou 24 conseillé). L'application elle-même n'a aucune dépendance.

```bash
npm start                 # sert app/ sur http://localhost:4173 (et l'adresse réseau locale pour un smartphone sur le même Wi-Fi)
```

Version autonome, sans serveur : ouvrir `dist/nyvo.html` dans Chrome/Chromebook (double-clic), ou `npm run serve:dist`.

## Tester

```bash
npm install               # outils de test et de build uniquement (Playwright, esbuild, police Inter)
npm test                  # logique, cache, quota, secrets, serveur HTTP (node:test)
npm run test:e2e          # tests Chromium : profils smartphone 390 px et Chromebook 1366 px
NYVO_URL="file://$PWD/dist/nyvo.html" npm run test:e2e   # mêmes tests sur la version monofichier
npm run test:legacy       # 12 scénarios hérités du prototype V0.2 (DOM simulé)
npm run build             # régénère dist/nyvo.html
npm run screenshots -- docs/captures/ecrans   # captures (serveur lancé)
npm run compare -- docs/captures/comparaisons # maquettes V0.2 / rendu côte à côte
npm run compare -- docs/captures/comparaisons-v0.4 http://localhost:4173/ v04   # maquettes V0.4
```

Adresses utiles pour la recette (le paramètre `etat` simule un état) :
`#/match/pa-ms` (direct simulé) · `#/match/pa-ms?etat=interrupted` · `#/match/msp-lc` (diffusion non confirmée) · `#/match/mso-lci` (données limitées) · `#/bienvenue` (premier lancement) · `#/programme?vue=match&mes=1` (Mes accès) · `#/acces` · `#/programme?p=diffuseur&ref=fr-trnr-sd2` (lien indisponible).

Si l'énumération des interfaces réseau échoue, `npm start` continue de servir `localhost` (essai : `NYVO_NO_IFACES=1 npm start`).

## Structure

```
app/                  prototype (HTML + CSS + modules JS, sans build)
  src/data/           jeu de données fictif (catalogue, rencontres, programmes TV, services/offres, contenus)
  src/domain/         logique pure testée : diffusion, sans spoilers, filtres, programme TV, recherche, fils
  src/state/store.js  préférences invité (localStorage), validation, migrations V0.2 et V0.3, stockage indisponible
  src/router.js       navigation par fragments (#/…), historique navigateur, panneaux
  src/ui/             composants (écussons et drapeaux SVG, icônes, cartes, lignes de match…)
  src/screens/        écrans ; src/overlays/ panneaux (Où regarder, recherche, réglages…)
dist/nyvo.html        version monofichier générée
tests/unit, tests/e2e tests de logique et tests navigateur
reference/v0.2/       dossier de reprise V0.2 (maquettes validées, documentation, prototype et tests d'origine)
reference/v0.4/       maquettes V0.4 validées, inventaire, prompt et décisions d'implémentation V0.4
docs/                 rapports V0.3 et V0.4, captures et comparaisons
```

Voir [docs/RAPPORT_V0.4.md](docs/RAPPORT_V0.4.md) (V0.4) et [docs/RAPPORT_V0.3.md](docs/RAPPORT_V0.3.md) pour l'audit, les changements, la matrice réalisé / simulé / différé et les points à arbitrer.
