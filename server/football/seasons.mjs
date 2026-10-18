// Vérification des saisons accessibles avec la clé du pilote, avant toute activation.
// Le rapport ne contient ni la clé ni d'information personnelle du compte.
import { mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { dirname } from 'node:path';
import { ProviderError } from './client.mjs';

export const REPORT_MAX_AGE_MS = 7 * 86_400_000;

// Coût en requêtes : 1 (statut) + 2 par compétition (+1 par saison supplémentaire).
export const estimateCost = (leagues, extraSeasons = []) => 1 + leagues.length * (2 + extraSeasons.length);

export async function checkAccess({ client, quota, leagues, extraSeasons = [], today, now = () => Date.now() }) {
  const report = { verifiedAt: new Date(now()).toISOString(), compte: null, competitions: [] };

  const status = await client.get('/status');
  const s = status.response && !Array.isArray(status.response) ? status.response : status.response?.[0];
  if (s) {
    report.compte = {
      offre: s.subscription?.plan ?? null,
      active: s.subscription?.active ?? null,
      finAbonnement: s.subscription?.end ?? null,
      requetesDuJour: s.requests?.current ?? null,
      quotaJournalier: s.requests?.limit_day ?? null,
    };
    quota.syncFromStatus(s.requests?.current, s.requests?.limit_day);
  }

  for (const id of leagues) {
    const entry = { id, nom: null, pays: null, saisons: [] };
    report.competitions.push(entry);
    let info;
    try {
      info = (await client.get('/leagues', { id })).response?.[0];
    } catch (err) {
      entry.erreur = describe(err);
      if (stops(err)) break;
      continue;
    }
    if (!info) {
      entry.erreur = 'Compétition introuvable chez le fournisseur.';
      continue;
    }
    entry.nom = info.league?.name ?? null;
    entry.pays = info.country?.name ?? null;
    const seasons = Array.isArray(info.seasons) ? info.seasons : [];
    const current = seasons.find((x) => x.current) || null;
    const targets = [...new Set([current?.year, ...extraSeasons].filter(Number.isInteger))];
    for (const year of targets) {
      const meta = seasons.find((x) => x.year === year) || null;
      const row = {
        annee: year,
        courante: Boolean(meta?.current),
        debut: meta?.start ?? null,
        fin: meta?.end ?? null,
        couverture: meta?.coverage ? summarizeCoverage(meta.coverage) : null,
        acces: 'inconnu',
        message: null,
      };
      try {
        await client.get('/fixtures', { league: id, season: year, date: today, timezone: 'UTC' });
        row.acces = 'accessible';
      } catch (err) {
        row.acces = err.code === 'plan' || err.code === 'acces' ? 'refusee' : 'inconnu';
        row.message = describe(err);
        if (stops(err)) {
          entry.saisons.push(row);
          return report;
        }
      }
      entry.saisons.push(row);
    }
    if (!targets.length) entry.erreur = 'Aucune saison courante annoncée par le fournisseur.';
  }
  return report;
}

const stops = (err) => err instanceof Error && ['quota-jour', 'quota-minute', 'quota-fournisseur', 'cle', 'cle-absente'].includes(err.code);
const describe = (err) => (err instanceof ProviderError || err?.code ? `${err.message}` : 'Erreur inattendue.');

function summarizeCoverage(c) {
  return {
    evenements: c.fixtures?.events ?? null,
    compositions: c.fixtures?.lineups ?? null,
    statistiquesMatch: c.fixtures?.statistics_fixtures ?? null,
    classement: c.standings ?? null,
    joueurs: c.players ?? null,
  };
}

export function saveReport(file, report) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(`${file}.tmp`, JSON.stringify(report, null, 2));
  renameSync(`${file}.tmp`, file);
}

export function loadReport(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

// Activation des vrais matchs : demandée explicitement ET saison courante vérifiée accessible récemment.
export function activation(config, report, now = Date.now()) {
  const global = [];
  if (!config.realMatches) global.push('NYVO_REAL_MATCHES n’est pas à 1 : vrais matchs non demandés.');
  if (!config.hasKey) global.push('Clé API_FOOTBALL_KEY absente côté serveur.');
  if (!report) global.push('Saisons jamais vérifiées : lancer « npm run api:check -- --confirmer ».');
  else if (now - Date.parse(report.verifiedAt) > REPORT_MAX_AGE_MS) global.push('Vérification des saisons de plus de 7 jours : la relancer.');
  const leagues = config.leagues.map((id) => {
    const entry = report?.competitions?.find((c) => c.id === id);
    const season = entry?.saisons?.find((s) => s.courante && s.acces === 'accessible');
    const raisons = [...global];
    if (report && !entry) raisons.push('Compétition absente de la dernière vérification.');
    else if (report && !season) raisons.push('Saison courante non accessible avec cette clé (ou non vérifiée).');
    return { id, nom: entry?.nom ?? null, saison: season?.annee ?? null, active: raisons.length === 0, raisons };
  });
  return { active: leagues.some((l) => l.active), competitions: leagues };
}
