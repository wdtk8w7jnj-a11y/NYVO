# NYVO V36 — Trace de reprise, Lot 1 (inventaire et comparaison)

Date : 21 octobre 2026. Lot en lecture seule : aucun fichier applicatif modifié.

- Branche de travail : `claude/nyvo-v36-aguero-integration`
- Base : `origin/recovery/nyvo-v36-aguero-kit-20261021` @ `172b6c7`
- Fichier ajouté : ce document uniquement.

## Sources examinées

| Source | Résultat |
| --- | --- |
| 10 branches GitHub, PR #1, 2 releases brouillons | Inspectées |
| Commit V35 `d85987d7…` | Absent du GitHub public (local et API) |
| Commit V36 `65763db6…` | Absent |
| Commit Work `a561efc` | Absent |
| `NYVO-V36-Aguero.bundle` | Absent |
| Releases brouillons (18 oct.) | `NYVO_HANDOFF_V0.2.zip` uniquement, rien sur Agüero |
| `NYVO_V36_KIT_PARTIEL_ORIGINAUX_2026-10-21.zip` | Absent |
| `NYVO_AGUERO_COUVERTURE_ORIGINALE_V1.png` / `aguero-two-stadiums-cover-v1.png` | Absent (aucun blob de 2 929 140 octets dans tous les objets Git) |
| 3 SVG (frise V2, classement V1, croquis V1) | Absents |
| `NYVO_REFONTE_MAQUETTES_2026-10-20(1).zip` (V34/V35) | Absent ; seules les maquettes V0.2, V0.4 et premium du 19 oct. sont présentes |

## Meilleure base disponible sur GitHub

`site/` = snapshot SITE_V24 + couche « Premium éditorial » (`941bc3c`, 19 oct.), antérieure à V34/V35.
Elle ne contient ni la série numérotée NYVO Story, ni sommaire, ni progression de lecture.
Ne PAS l'utiliser pour écraser la V35/V36 hébergée.

## Article V7

- `handoff/premium-editorial/recovery-aguero-v7/aguero-story.mjs` : objet Git `b83431f3e88041e6e676948b6609ad87faae75d4` (identique à la référence), SHA-256 `0e11a59c07fc05f6ddb6efffb973a1613118d530173eac76c20eeff434314b4e`.
- 6 paragraphes, 4 sections, `body` = concaténation exacte des sections, 7 sources officielles, Rédaction NYVO.
- Références d'images cohérentes (couverture + 3 figures). `teamIds` 1000000065 = Manchester City, 1000000066 = Manchester United dans le catalogue.
- Attention : les 4 images portent `status: "verified"` alors que leurs fichiers sont absents ; la couche premium afficherait des liens cassés.

## Prochaine étape (bloquée)

Le Lot 2 exige la base V35/V36 hébergée et les originaux binaires, absents de GitHub.
