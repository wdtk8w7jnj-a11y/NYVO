# NYVO V36 — Infographies Agüero : reconstructions nouvelles

**Ces trois SVG sont des reconstructions réalisées le 21 octobre 2026, avec l'accord explicite du propriétaire de NYVO. Ce ne sont PAS les fichiers historiques V36, qui restent introuvables.** Si les originaux sont retrouvés, comparer les deux versions avant tout remplacement.

| Fichier (`site/public/images/stories/aguero/`) | Format | SHA-256 |
| --- | --- | --- |
| `aguero-title-swing-timeline-v2.svg` | 1200 × 1970 | `27e6f0837b6a6076326cbd9108befe04d197576d62f743177c189b1df3cef185` |
| `aguero-final-table-v1.svg` | 1200 × 900 | `fa9a3c2a175c179fdaa8896d83811728a984f113effffd07e2e5f964dbf21fcb` |
| `aguero-final-action-schematic-v1.svg` | 1200 × 1400 | `b554b56ca583bdd11fa267a202a3d9596803bfaf4fcb6954bc8158df8f4f32bf` |

- Les noms, dimensions et légendes correspondent aux entrées `images` du module V7 (`handoff/premium-editorial/recovery-aguero-v7/aguero-story.mjs`). Ce module n'est pas modifié : la mention « Création vectorielle originale NYVO » y est conservée.
- Chaque SVG porte la mention de reconstruction dans son élément `<metadata>`, ainsi qu'un `<title>` et une `<desc>` complète en français (`role="img"`).
- Générateur reproductible : `handoff/v36-aguero-kit/outils/generer-infographies-aguero.mjs` (`node … <dossier de sortie>`).
- Emplacement : la branche publique contient le site sous `site/`, d'où `site/public/…`. Dans la source V35/V36 du site privé, la cible est `public/images/stories/aguero/`, servie à l'URL `/images/stories/aguero/…` attendue par l'article.
- La couverture `aguero-two-stadiums-cover-v1.png` n'est pas dans ce dossier : c'est l'original validé, qui sera fourni à part et ne doit être ni recréé ni remplacé.

## Direction artistique

Fond `#08090c`, panneaux anthracite `#121318` et `#181a20`, texte ivoire `#f1ece2`, gris `#a8abb7` et `#80848f`, rubis `#db1646` et `#ff5a7d` réservé aux moments décisifs. Titres en serif (Georgia, puis Times, puis serif), données en Inter, puis -apple-system et la police système. Sur iPhone, Inter est remplacée par la police système d'Apple, ce qui est accepté.

## Vérification des faits (21 octobre 2026)

Accès direct aux sites officiels bloqué par le proxy de l'environnement. Les vérifications s'appuient sur les pages officielles telles que les restitue le moteur de recherche, recoupées avec d'autres sources.

| Donnée | Valeur | Sources |
| --- | --- | --- |
| Rooney, Sunderland | 20′, 0–1 | [premierleague.com/match/7842](https://www.premierleague.com/match/7842) |
| Zabaleta | 39′ | [mancity.com, compte rendu](https://www.mancity.com/news/first-team/match-report/2012/may/city-v-qpr-may-13-2012) · Al Jazeera |
| Cissé | 48′ | idem · Al Jazeera (« trois minutes après la reprise ») |
| Expulsion de Barton | entre 48′ et 66′ (55′ selon la PL ; minute non affichée) | premierleague.com |
| Mackie | 66′ | mancity.com · Al Jazeera |
| Džeko | 90+2 | premierleague.com |
| Bolton–Stoke 2–2, QPR maintenu pendant que City cherche le but | avant 93:20 | [premierleague.com/en/news/59706](https://www.premierleague.com/en/news/59706) · [bilan 2011/12](https://www.premierleague.com/en/news/693667) |
| Fin du match de Sunderland avant le but d'Agüero | oui | premierleague.com (article 59706) · manutd.com |
| Agüero | 93:20, 3–2 | mancity.com (93:20) · premierleague.com |
| City : 38 J, 28-5-5, 89 pts, +64, 93–29 | | [premierleague.com, historique des saisons](https://www.premierleague.com/clubs/12/manchester-united/season-history) · [rapport annuel Manchester City 2011-12](https://mediacdn.mancity.com/-/media/archive/files/annual-report/annual-report-1112-final.ashx?la=en) |
| United : 38 J, 28-5-5, 89 pts, +56, 89–33 | 89 buts : manutd.com ; 33 = 89 − 56 | premierleague.com · [manutd.com](https://www.manutd.com/en/mutv/videos/detail/web-man-utd-2000-premier-league-goals-2011-12-season) · [ESPN](https://africa.espn.com/football/table/_/league/eng.1/season/2011) |

Les leaders projetés de la frise découlent de ces scores : City et United ont le même total de points avant la dernière journée, et City possède la meilleure différence de buts.

Le schéma de l'action finale ne reprend que les quatre étapes du texte V7. Les positions sont illustratives et mentionnées « non à l'échelle ».

## Contrôles de lisibilité

- SVG validés par `xmllint`.
- Mesure automatique dans Chromium de chaque texte : rien hors du cadre, aucun chevauchement, rien ne déborde des cartouches. Test fait avec les polices prévues et dans le pire cas (DejaVu Sans et DejaVu Serif, plus larges que la police de l'iPhone et que Georgia).
- WebKit et Safari ne sont pas disponibles dans l'environnement : un contrôle sur un iPhone réel reste à faire.
