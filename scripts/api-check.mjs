// Vérifie les saisons accessibles avec la clé API-Football, avant toute activation.
//   npm run api:check                 → simulation : aucun appel, coût estimé affiché
//   npm run api:check -- --confirmer  → appels réels (quelques requêtes du quota du jour)
//   options : --saisons=2024,2025 pour tester aussi des saisons précises
// La clé est lue dans l'environnement (ou .env local) et n'est jamais affichée.
import { loadDotEnv, readConfig, publicConfig } from '../server/config.mjs';
import { createPilot } from '../server/football/service.mjs';
import { checkAccess, estimateCost, saveReport, activation } from '../server/football/seasons.mjs';

loadDotEnv();
const config = readConfig();
const args = process.argv.slice(2);
const confirm = args.includes('--confirmer');
const extra = (args.find((a) => a.startsWith('--saisons=')) || '').slice(10).split(',').filter(Boolean).map(Number).filter((n) => Number.isInteger(n) && n > 1900);
const pub = publicConfig(config);
const pilot = createPilot({ config });
const cost = estimateCost(config.leagues, extra);

console.log('Vérification des saisons API-Football — NYVO pilote');
console.log(`  Clé : ${pub.cle} (valeur jamais affichée)`);
console.log(`  Compétitions : ${config.leagues.join(', ')}${extra.length ? ` · saisons supplémentaires : ${extra.join(', ')}` : ''}`);
console.log(`  Coût estimé : ${cost} requête(s) au maximum · restantes pour NYVO aujourd’hui : ${pilot.quota.snapshot().restantesPourNyvo}`);

if (!config.hasKey) {
  console.log('\nAucune clé : définir API_FOOTBALL_KEY dans les secrets de l’environnement (voir docs/PILOTE_API_FOOTBALL.md).');
  process.exit(2);
}
if (!confirm) {
  console.log('\nSimulation uniquement : aucun appel effectué. Relancer avec « -- --confirmer » pour consommer ces requêtes.');
  process.exit(0);
}
if (pilot.quota.snapshot().restantesPourNyvo < cost) {
  console.log('\nBudget du jour insuffisant pour la vérification complète. Réessayer après 00:00 UTC.');
  process.exit(3);
}

const today = new Date().toISOString().slice(0, 10);
const report = await checkAccess({ client: pilot.client, quota: pilot.quota, leagues: config.leagues, extraSeasons: extra, today });
saveReport(config.accessReport, report);

if (report.compte) console.log(`\nOffre : ${report.compte.offre ?? 'inconnue'} · active : ${report.compte.active ?? 'inconnu'} · requêtes du jour : ${report.compte.requetesDuJour ?? '?'} / ${report.compte.quotaJournalier ?? '?'}`);
for (const c of report.competitions) {
  console.log(`\n${c.id} · ${c.nom ?? 'nom inconnu'}${c.pays ? ` (${c.pays})` : ''}${c.erreur ? ` — ${c.erreur}` : ''}`);
  for (const s of c.saisons) console.log(`  Saison ${s.annee}${s.courante ? ' (courante)' : ''} : ${s.acces}${s.message ? ` — ${s.message}` : ''}`);
}
const act = activation(config, report);
console.log(`\nVrais matchs : ${act.active ? 'activables' : 'non activés'}`);
for (const l of act.competitions) if (!l.active) console.log(`  ${l.id} : ${l.raisons.join(' ')}`);
console.log(`Rapport enregistré (sans clé) : ${config.accessReport}`);
console.log(`Quota NYVO : ${JSON.stringify(pilot.quota.snapshot())}`);
