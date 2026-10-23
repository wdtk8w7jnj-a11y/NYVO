# NYVO — Reprise Premium éditoriale

Dossier préparé le 19 octobre 2026 pour Claude Codex. Il s'agit d'un cahier de réalisation et d'archives visuelles, pas d'une mise à jour déjà déployée.

## Démarrage
Lire PROMPT_CLAUDE.md, DESIGN_PREMIUM.md, SOURCES_ET_DROITS.md et RECETTE.md. Ouvrir MAQUETTES/index.html et consulter INVENTAIRE.json.

## Base technique : attention aux deux historiques
Le site de production NYVO est géré dans l’espace Sites associé au compte et doit rester strictement privé, propriétaire uniquement.
Le snapshot SITE_V24 contient les fichiers suivis du site à partir du commit 9f47b5f8e73a1cfba7595eb1cf42c5ac64f5743a. Les secrets, fichiers de configuration de déploiement privés, caches et dépendances ne sont pas exportés. Ce snapshot est une référence de migration : comparer avant de remplacer des fichiers.
Le dépôt GitHub possède un historique différent. La branche de livraison part de claude/youthful-euler-lgq3fj, commit f606a635925180bed371a64ff83333774d8a8154. Ne pas repartir du main presque vide ni remettre en production l'ancien prototype. Inspecter les changements plus récents avant d'intégrer le snapshot.

## Priorité des spécifications
1. Dernière demande utilisateur et PROMPT_CLAUDE.md.
2. DESIGN_PREMIUM.md et RECETTE.md.
3. Maquettes Signature et rubis, références de composition.
4. Anciens essais visuels, archivés seulement.

Les anciennes maquettes comportent des informations fictives, des photos illustratives et des composants devenus obsolètes. Ne pas extraire leurs photos, logos, scores ou textes comme données de production. Le lecteur intégré est abandonné. Les onglets séparés Ligue 1/Ligue des champions sont abandonnés. Les styles or, vert, violet et néons multicolores sont archivés.

Les maquettes sont fournies en WebP optimisé à leur résolution d'origine pour rendre le ZIP transportable. Le manifeste conserve les noms et empreintes SHA-256 des originaux retrouvés, ainsi que les doublons. Ce dossier contient les maquettes récupérables, pas une garantie de retrouver un fichier dont l'envoi avait échoué.

Le dépôt destinataire est public : ne jamais y ajouter de clé, jeton Sites, compte personnel, capture de configuration, réponse fournisseur privée ou catalogue RSS collecté.


## Deux articles à intégrer — 24 octobre 2026
L’index des deux dossiers est dans [stories/README.md](stories/README.md). Safonov est disponible en texte complet V10 avec trois schémas tactiques. Belgique–Japon a son texte finalisé, ses sources et trois PNG corrigés. Aucun des deux n’est encore intégré ni publié.

Le prompt dédié [PROMPT_CLAUDE_CODE_DEUX_ARTICLES_2026-10-24.md](PROMPT_CLAUDE_CODE_DEUX_ARTICLES_2026-10-24.md) prévaut sur les anciennes consignes de refonte générale : il interdit tout changement de DA et limite l’intervention à ces deux articles. Les maquettes et spécifications de design sont des références à conserver, jamais à modifier.
