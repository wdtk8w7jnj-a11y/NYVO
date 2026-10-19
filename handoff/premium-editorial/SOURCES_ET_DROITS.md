# Inventaire éditorial — audit du 19 octobre 2026

Cette recherche est une sélection exploitable, pas un inventaire exhaustif d'Internet. « Chaîne identifiée » ne signifie ni vidéo particulière vérifiée, ni droits de chaque image acquis. Certains accès directs YouTube étaient bloqués à la consultation : ne pas annoncer de lecture ou de fréquence vérifiée dans ces cas.

## Photos gratuites contextualisées pour CR7 / la Décima
1. Cérémonie d'ouverture de la finale du 24 mai 2014 à Lisbonne. Biser Todorov, CC BY-SA 4.0. Source et licence : https://commons.wikimedia.org/wiki/File:Final_Champions_League_2014_Lesboa.jpg — image de contexte, pas photo d'un but de Ronaldo. Fichier original : https://upload.wikimedia.org/wikipedia/commons/6/6b/Final_Champions_League_2014_Lesboa.jpg
2. Célébration de la Décima à Madrid le 25 mai 2014. Presidencia de la Comunidad de Madrid, CC BY 3.0. Source : https://commons.wikimedia.org/wiki/File:Celebración_de_La_Décima_Copa_de_Europa_Real_Madrid.jpg — célébration collective, pas action de match. La page documente une image issue d'une vidéo sous licence libre ; cette permission est spécifique à cette œuvre, pas à toutes les captures YouTube.
3. Série de tribunes « Real Madird 4-1 Atletico 2014 Final Champions Lisboa », Miguelazo84, plusieurs fichiers CC BY-SA 4.0. Exemple : https://commons.wikimedia.org/wiki/File:Real_Madird_4-1_Atletico_2014_Final_Champions_Lisboa_2.jpg — DATE À RÉCONCILIER : métadonnée du 12 août 2014, titre parlant de la finale de mai. Ne pas utiliser comme preuve d'une action précise avant clarification.

Aucune photo libre représentant avec certitude un but précis de CR7 pendant 2013/2014 n'a été confirmée dans cet audit. Préférer ces photos de contexte et des infographies originales sourcées à une attribution trompeuse. Vérifier visuellement les fichiers avant intégration et conserver le crédit visible.
Règles de réutilisation : https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia
Licences : https://creativecommons.org/licenses/by-sa/4.0/ et https://creativecommons.org/licenses/by/3.0/
Source sportive primaire pour le doublé contre le Bayern : https://www.uefa.com/uefachampionsleague/news/0250-0c510b78cbc3-317cfe6f166f-1000--masterful-madrid-end-bayern-reign/
Autres sources primaires déjà présentes dans SITE_V24/server/cr7-anecdote.mjs : les revérifier au moment de rédaction. Ne pas enrichir avec des détails mémorisés non sourcés.

## Sources officielles vidéo
Réutiliser les identifiants du registre SITE_V24/server/media-sources.mjs et highlights.mjs. État relevé, à recontrôler avant activation :

| Source | Preuve institutionnelle / point de départ | Usage |
|---|---|---|
| Ligue 1 | Registre highlights existant, chaîne officielle épinglée | Résumés FL1, association exacte |
| UEFA | Registre highlights existant | CL, archives et contexte, pas tout contenu = résumé |
| Premier League | https://www.premierleague.com/en/news/2168405 | Officiel anglais accepté |
| LALIGA | https://www.laliga.com/en-US/news/la-liga-channel-surpasses-100-million-youtube-views | Résumés espagnols selon territoire |
| Serie A | https://www.legaseriea.it/serie-a/videos/youtube/a-tu-per-tu-con-emil-holm | Source officielle italienne |
| Bundesliga | https://www.bundesliga.com/en/bundesliga | Contrôler les liens sociaux officiels |
| geTV | https://www.youtube.com/geglobo | Source brésilienne ; attention /ge n'est pas /geglobo |
| DAZN France / Italia | @daznfrance / @daznit | Candidats du registre, preuve institutionnelle et vidéo à confirmer |
| CANAL+ Sport | @canalplussport | Candidat, vérifier page éditeur et droits territoriaux vidéo |

## Créateurs depuis les tribunes : candidats, jamais activation automatique
| Candidat | URL | Preuve/limite |
|---|---|---|
| AwayDays | https://www.youtube.com/@awaydaysfootball | https://awaydays.com/about décrit le projet football/voyages/supporters. Inspecter les publications récentes via API. |
| Thogden | https://www.youtube.com/@Thogden | Matchday vlogs et réactions ; index secondaire https://footyapps.com/shows/thogden montre une activité récente, mais contrôle direct vidéo requis. |
| Footy Adventures | https://www.youtube.com/@FootyAdventures | Page chaîne identifiée ; contenu précis et cadence à contrôler. |
| StuntPegg | https://www.youtube.com/@StuntPeggNieve | Candidat groundhopping ; lecture directe indisponible pendant l'audit. |
| Smiv | https://www.youtube.com/@smiv | Série On The Road relayée par un club : https://www.pitchero.com/clubs/withamtown/videos/on-the-road--witham-town-v-heybridge-swifts--spa-road-100543.html ; activité actuelle à revérifier. |
| La Tribune Olympienne | https://www.youtube.com/@latribuneom | Piste de réactions OM ; pas validée comme source de buts filmés au stade. |

Pour mesurer la régularité, examiner les 10 à 20 dernières publications : dates, part de contenus stade, langue, matchs couverts. Conserver les observations, sans inventer une fréquence hebdomadaire. Un vlog peut être intéressant sans montrer un but ; étiqueter son vrai format. Aucun compte de réupload de télévision n'est accepté comme amateur autorisé.

## Collecte technique et quotas
Documentation primaire : https://developers.google.com/youtube/v3/docs/playlistItems/list et https://developers.google.com/youtube/v3/docs/videos/list . Lire les coûts/quotas actuels avant de budgéter. Contrôles incrémentaux par chaîne et détails batch, cache partagé, arrêt sur quota et backoff. Réutiliser HIGHLIGHTS_OPERATIONS.md. La récurrence souhaitée n'autorise pas des recherches illimitées par match.

## Photos d'actualités
Un accès gratuit à l'article n'accorde pas la republication de sa photo. Auditer les conditions de chaque éditeur, les enclosures RSS et l'usage autorisé ; stocker l'autorisation applicable. Ne pas déduire la licence depuis un domaine. Getty/AFP/Reuters restent exclus sans permission appropriée. Commons peut fournir une photo de contexte, avec légende explicite. Une carte sans image est préférable à une image générique répétée ou trompeuse.
