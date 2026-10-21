# NYVO V35/V36 — Rapport de récupération (édition pour le dépôt public)

Date du contrôle : 21 octobre 2026. Ce rapport décrit une récupération PARTIELLE et ne constitue pas une preuve de déploiement.

## Retrouvé et vérifié

- L'article Sergio Agüero V7 est enregistré mot pour mot sous `handoff/premium-editorial/recovery-aguero-v7/aguero-story.mjs`, commité sur la branche parente de récupération (9d2f3bf).
- La couverture approuvée V1 a été retrouvée dans la bibliothèque du projet, sous le nom initial « Deux stades, un même suspense.png ».
- Fichier de destination prévu : `public/images/stories/aguero/aguero-two-stadiums-cover-v1.png`.
- Dimensions : 1672 × 941 ; taille : 2 929 140 octets ; SHA-256 : `775fa40c8ef005976548ef248ffb1e35b2a23ce48e3c4ed4fec41be756214d5a`.
- Deux versions alternatives de couverture existent, mais ne sont PAS retenues.
- L'archive de maquettes V34/V35 « NYVO_REFONTE_MAQUETTES_2026-10-20(1).zip » possède 21 fichiers intègres, SHA-256 `9e982d291cc646f8be3dc49fb27dbe52098bcb51d3721ead1a19d8bc29b81aa6`. Elle précède la V36 Agüero.

## Manquant dans les sources GitHub vérifiées

| Original attendu | Statut |
| --- | --- |
| `aguero-title-swing-timeline-v2.svg` — frise | Non retrouvé |
| `aguero-final-table-v1.svg` — classement | Non retrouvé |
| `aguero-final-action-schematic-v1.svg` — action finale | Non retrouvé |
| `NYVO-V36-Aguero.bundle` — bundle local | Non retrouvé |
| Code complet source V35 | Présent historiquement dans le dépôt source du site hébergé, non exporté sur le GitHub public |

La couverture V1 et les variantes sont conservées dans le kit ZIP indépendant. **Un nom de fichier mentionné ici ne signifie pas que ses octets ont été déposés dans le dépôt GitHub.** Vérifier explicitement leur présence à chaque transfert.

## Précautions de restauration

1. Vérifier la source Git de l'application hébergée et l'historique V35/V36 avant de sélectionner une base.
2. Conserver la direction artistique NYVO : noir, anthracite, ivoire, accent rubis discret, croquis et graphique originaux.
3. Préserver le module Agüero V7 exact : texte, six paragraphes, sections, légendes, crédits et sources officielles.
4. Ne pas inventer les trois SVG manquants ; une éventuelle reconstruction doit être présentée comme telle et approuvée.
5. Ne jamais publier la source privée du site en bloc dans le dépôt public : vérifier secrets, caches et fichiers internes.
6. Ne modifier ni `main`, ni le site déployé lors d'une simple sauvegarde documentaire.

## Tests

Les 112 tests V35 et 116 tests V36 rapportés par des sessions précédentes ne constituent PAS de nouveaux tests : ils devront être relancés après restauration. L'intégration et le rendu de l'article Agüero ne sont pas encore validés dans le GitHub public.
