# Récupération partielle de l’article Agüero V7

Le 21 octobre 2026, une interruption de transfert puis la maintenance automatique de l’espace temporaire ont rendu indisponibles les checkouts locaux V36 et leur bundle. Cette branche conserve le module éditorial exact déjà envoyé à GitHub avant l’interruption.

- `aguero-story.mjs` : objet Git vérifié `b83431f3e88041e6e676948b6609ad87faae75d4` ; titre, six paragraphes, chapitres, crédits et sources de la V7 validée.
- La base V35 est toujours enregistrée dans le projet hébergé existant au commit `d85987d7a924f8be30a5e839da4f473456acf800`.
- Les images originales de couverture sont présentes dans la bibliothèque utilisateur. La couverture retenue était `aguero-two-stadiums-cover-v1.png`, 2929140 octets, SHA-256 `775fa40c8ef005976548ef248ffb1e35b2a23ce48e3c4ed4fec41be756214d5a` ; la correspondance exacte reste à vérifier après récupération.
- Les trois infographies approuvées (frise V2, classement V1 et croquis V1), leurs exports et les modifications locales V36 ne sont pas encore récupérés.
- Le bundle recherché est `NYVO-V36-Aguero.bundle`, dernier commit local `65763db6987cf2b3ac3f4aae8e85914df449d933`.

Cette branche n’est pas une livraison V36 complète. Aucun déploiement n’a été effectué. Les 116 tests et la compilation avaient réussi avant la maintenance ; ils ne valident pas une restauration complète qui n’a pas encore eu lieu. Préserver main et ne pas recréer artificiellement les visuels manquants.
