# PROMPT CLAUDE CODE — intégrer uniquement deux articles NYVO

Tu travailles dans le dépôt public wdtk8w7jnj-a11y/NYVO, branche codex/nyvo-two-stories-handoff-20261024. Le dépôt est public; ne jamais ajouter de secrets, jetons, données d’accès ou contenu de compte. Ne touche pas à main et ne modifie pas la visibilité du dépôt.

## Mission
Intégrer dans l’application NYVO existante uniquement ces deux articles et leurs visuels déjà fournis :
1. Safonov et Chevalier : deux profils pour un même poste — texte complet V10 dans stories/safonov-psg-2026/ARTICLE_REFERENCE_V10.html, dossier et choix dans stories/safonov-psg-2026/README.md.
2. Du 0–2 au 3–2 : le dernier éclair de la Belgique — texte finalisé dans stories/belgium-japan-2018/ARTICLE_DRAFT.md, sources dans SOURCES.md, trois PNG sélectionnés dans VISUALS.md.

Ce travail est une intégration éditoriale ciblée. Aucune refonte, aucune modification de la DA, aucun changement aux autres articles ou fonctionnalités.

## Verrouillage graphique obligatoire
- Garde exactement la DA NYVO et les maquettes déjà enregistrées. Les références sont notamment handoff/premium-editorial/NYVO_PREMIUM_CLAUDE_2026-10-19.zip, reference/v0.2/01_MAQUETTES_VALIDEES/, reference/v0.4/MAQUETTES/ et docs/premium/captures/.
- Consulte ces maquettes pour réutiliser les composants existants. Ne les régénère, ne les retouche et ne les remplace pas.
- Ne modifie pas les couleurs, typographies, espacements généraux, navigation, logo, cartes existantes, responsive global ou système d’illustrations.
- Le HTML V10 Safonov est une source éditoriale autonome : reprends son texte et ses SVG, mais pas son CSS ni sa mise en page autonome. Rends le contenu dans les composants NYVO déjà en place.
- N’ajoute pas d’illustration de couverture nouvelle. Si une couverture dédiée déjà validée existe dans la source courante, conserve-la; sinon garde le comportement visuel existant sans improviser de nouvelle image.

## Source courante et confidentialité
Le site de production NYVO est géré dans l’espace Sites associé au compte et doit rester strictement privé. Avant toute modification de l’application, récupère et inspecte l’état actuel du projet NYVO dans l’espace Sites authentifié : le dépôt GitHub historique peut être en retard. Si tu n’as pas accès aux sources Sites, arrête l’intégration runtime et rapporte ce blocage; ne remplace jamais le site par un ancien snapshot.

Conserve l’audience et le contrôle d’accès actuels. Ne rends pas le site public, ne crée pas de version accessible sans autorisation et ne stocke hors ligne aucune donnée authentifiée. Ne déploie que si tu peux garantir le maintien de l’accès privé existant.

## Contenu — Safonov
- Reprends exactement le titre, le chapô D, l’ouverture C, le ton respectueux et la conclusion retenue du prototype V10.
- Conserve les nuances et limites méthodologiques : les taux bruts ne suffisent pas à établir une hiérarchie; les apparitions et périodes diffèrent; la décision de recrutement ne serait réouverte que si la même limite réapparaît dans plusieurs matchs.
- Intègre les trois SVG du dossier Safonov. Les trajectoires et positions sont illustratives, sans tracking.
- Garde les sources attachées aux chiffres. Ne transforme pas une donnée de match en jugement général sur le joueur.

## Contenu — Belgique–Japon 2018
- Utilise le titre, le chapô A et la conclusion A présents dans ARTICLE_DRAFT.md. Les variantes B/C sont des notes éditoriales : ne les affiche jamais dans l’application.
- Intègre les trois PNG sélectionnés : 01-sequence-48-52.png, 02-double-changement.png, 03-contre-11-secondes.png. Les SVG précédents restent archivés; n’ajoute pas 04-parcours-japon.svg dans cette intégration.
- Conserve une lecture équilibrée : la Belgique revient collectivement; les remplacements sont associés à la chronologie sans leur attribuer seuls la victoire.
- Utilise FIFA pour la minute de Vertonghen (69′) et conserve la divergence JFA (71′) dans les notes de source, sans mélanger les chronologies.
- Respecte les légendes et limites : durée de onze secondes attribuée à FIFA; schémas non issus du tracking; frises non proportionnelles.

## Périmètre de code
- Modifie uniquement l’enregistrement des deux articles, leurs contenus/visuels, et les tests strictement nécessaires à leur intégration.
- N’effectue aucune refonte de l’accueil, des cartes, de la navigation, des écrans ou de la feuille de style.
- Ne supprime ni ne réécrit Drogba, Agüero, Cristiano, les autres articles, les sources ou les fonctionnalités existantes.
- Les préférences, favoris, progression, anti-spoilers et lecture des vidéos doivent rester inchangés. En mode anti-spoiler, masquer le titre et les illustrations jusqu’à la révélation prévue par le comportement existant.

## Vérification et livraison
1. Vérifie le diff avant modification et limite-le au périmètre ci-dessus.
2. Lance l’assemblage Premium requis par le dépôt et les tests/build existants.
3. Vérifie les deux articles sur desktop et un viewport iPhone; contrôle images sans débordement, navigation, anti-spoilers, favoris et progression.
4. Fournis la liste exacte des fichiers modifiés, les tests exécutés, les résultats et les éventuels écarts de sources.
5. N’affirme pas qu’un test sur iPhone physique a été réalisé sans appareil réel. N’intègre ni ne publie les articles sur Sites si l’accès privé n’est pas vérifié.
6. Ne fusionne pas dans main et ne fais aucun push forcé.

Ce prompt dédié prévaut sur les anciens prompts de refonte générale présents dans le handoff : ici, la demande est uniquement d’ajouter ces deux articles dans la DA existante.