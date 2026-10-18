# NYVO — Décisions d'implémentation V0.4

Ces décisions complètent celles de `reference/v0.2/04_DOCUMENTATION` et des neuf maquettes de `reference/v0.4/MAQUETTES`. Elles ne remplacent aucune décision validée par le propriétaire.

## Modèle de données
- Les programmes TV sont décrits par pays, dans `app/src/data/programmes.js`, séparément des rencontres.
- Chaque programme distingue :
  - le **moment de la soirée** (`phase` : avant-match, match, après-match) ;
  - le **format** (`format` : magazine, match intégral, multiplex).
- Un multiplex est **un seul programme** qui couvre plusieurs rencontres. Il n'est pas dupliqué en vues Horaire et Chaîne. En vue Match, il apparaît sous chacune de ses rencontres.
- Les rencontres sans diffuseur confirmé sont listées par pays (`UNCONFIRMED`), sans chaîne ni lien.
- Les liens vers le diffuseur sont prévus dans le modèle :
  - `matchPage` : lien universel vers la page du match, qui ouvre l'application si elle est installée ;
  - `site` : site officiel, en secours.

  Seul le domaine réservé fictif `vision-sport.example` est utilisé. Le programme Toulouse Rive – Nice Riviera n'a volontairement pas de lien direct, pour démontrer l'état « lien indisponible ».

## Cohérence avec la V0.3
Le catalogue V0.3 est conservé. Les maquettes V0.4 montrent des valeurs qui en divergent :

| Maquettes V0.4 | Prototype (catalogue V0.3) |
|---|---|
| Avant-match à 20:15 | 20:30 |
| Multiplex « 3 rencontres » | 2 rencontres de Coupe Élite dans le catalogue |
| Après-match sur Sport Démo 1 | Sport Démo 3, horaire prévisionnel |
| Lyon Nord – Berlin Union non confirmé | Diffusé, comme en V0.3 |

Pour Lyon Nord – Berlin Union, l'état non confirmé se démontre avec Marseille Sport – Lille Capitale, ou avec le scénario « non confirmée » de la fiche match. Ce scénario retire la rencontre de tous les programmes, multiplex compris.

**Sport Démo 3 devient payante.** Elle n'est accessible que par l'Option Sport Plus. Le filtre « Gratuit » renvoie donc un état vide dans la démonstration : aucune chaîne gratuite n'y figure.

## Vue Horaire et diffusions non confirmées
- Le défaut de la maquette 01 est corrigé : la rencontre de 21:00 était placée après 23:00. Chaque ligne est triée sur l'instant réel (UTC), avec le jour local calculé dans le fuseau du pays. Une rencontre non confirmée apparaît donc à son heure de coup d'envoi, avec un style pointillé et sans chaîne.
- En vue Chaîne, les non confirmées forment une rubrique séparée (maquette 02). En vue Match, elles affichent leur encadré (maquette 03).
- Les filtres **Mes accès** et **Gratuit / Payant** excluent les non confirmées, car aucune chaîne n'est connue pour les vérifier. L'exclusion et son nombre sont annoncés.

## Filtres
- L'état appliqué vit dans l'adresse (`vue`, `date`, `fav`, `comp`, `acces`, `types`, `mes`, `nc`). Les réglages rapides et le panneau détaillé lisent et écrivent ce même état.
- Le panneau travaille sur un brouillon :
  - « Appliquer » seul valide ;
  - « Réinitialiser » remet le brouillon par défaut ;
  - Fermer, Échap ou Retour annulent.
- Les compétitions et les types acceptent plusieurs choix. Si aucun type n'est coché, « Appliquer » est désactivé et un message l'explique.
- « Voir tout le programme » ne retire que le filtre Mes accès depuis cet état. Depuis l'état vide, il remet tous les filtres par défaut.

## Mes accès
- Les préférences sont stockées par pays : `access[pays] = { services: { id: { offer, options } }, legacy: [chaînes] }`. La clé de stockage passe à `nyvo-v4`.
- Seules l'offre et les options déclarées, dont la correspondance est vérifiée dans le catalogue du pays, produisent des chaînes incluses. Rien n'est ajouté automatiquement, ni chaîne gratuite ni chaîne payante.
- Une « correspondance vérifiée » relie une offre à des chaînes. Elle n'authentifie pas l'abonnement : on parle d'« offre déclarée ».
- « Offre à préciser » (Arena Démo, Horizon TV Démo, ou une offre introuvable) garde le service sélectionné. Il n'est pas utilisé par le filtre, et l'interface ne dit jamais que l'utilisateur n'a pas de droits.
- La sélection reste un brouillon jusqu'à « Enregistrer ». « Confirmer mon offre » reporte le choix dans ce brouillon. Rien n'est souscrit, aucun prix n'est affiché, aucun identifiant n'est demandé.
- **Migration V0.3 → V0.4.** Les chaînes cochées en V0.3 (`services`) deviennent des « accès historiques à préciser » pour le pays alors choisi. Elles ne deviennent jamais une offre vérifiée. La clé `nyvo-v3` reste lue puis conservée.
- **Pays.** Un changement de pays n'importe pas les accès d'un autre pays. Sans catalogue pour le pays, un état vide l'explique.

## Accès au diffuseur
- En mode démonstration, les boutons affichent une simulation explicite : aucun appel réseau, aucune fenêtre, aucune redirection.
- Lien direct absent : « Lien indisponible », sans en déduire une annulation. Les actions proposées dépendent des données :
  - « Ouvrir le site officiel », seulement si un site existe ;
  - « Voir les autres diffusions » ;
  - « Signaler le lien ».
- Le signalement demande une confirmation explicite. Il se conclut par « Simulation de signalement : rien n'a été envoyé ».
