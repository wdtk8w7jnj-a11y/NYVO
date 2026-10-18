import { h, attr } from '../ui/html.js';
import { topBar, emptyState } from '../ui/components.js';

const ERRORS = {
  not_configured: 'La connexion aux données réelles n’est pas encore configurée sur le serveur.',
  season_unavailable: 'Cette saison n’est pas accessible avec l’offre actuelle. Choisissez une autre saison ; aucune donnée fictive ne la remplace.',
  quota_exhausted: 'Le quota disponible est atteint. Réessayez demain ; les données déjà chargées restent consultables.',
  provider_paused: 'Le fournisseur a rencontré une erreur. Patientez deux minutes avant de réessayer.',
  slow_down: 'Patientez quelques secondes entre deux demandes.',
  access_denied: 'Le fournisseur refuse l’accès. La clé et l’offre doivent être vérifiées côté serveur.',
  invalid_selection: 'Choisissez une date comprise dans la saison sélectionnée.',
  unknown_fixture: 'Rechargez d’abord la liste des matchs avant d’ouvrir cette rencontre.',
  offline: 'Connexion interrompue. Les dernières données reçues sont conservées sur cet écran.',
  static: 'Les matchs réels nécessitent le serveur NYVO. Le fichier autonome permet de tester la démo.',
  provider_unavailable: 'Le fournisseur est indisponible. Les dernières données reçues restent consultables.',
  provider_error: 'Le fournisseur n’a pas pu traiter cette demande. Réessayez ultérieurement.',
  invalid_response: 'La réponse du fournisseur est incomplète ou invalide. Aucun résultat n’a été inventé.',
  coverage_unavailable: 'La couverture de cette compétition n’a pas pu être confirmée.',
  invalid_request: 'Cette sélection n’est pas prise en charge par le pilote.',
  unavailable: 'Le serveur du pilote est temporairement indisponible.',
};
const labels = { NS: 'À venir', TBD: 'Horaire à confirmer', '1H': 'Première période', HT: 'Mi-temps', '2H': 'Deuxième période', ET: 'Prolongation', BT: 'Pause', P: 'Tirs au but', FT: 'Terminé', AET: 'Terminé après prolongation', PEN: 'Terminé aux tirs au but', PST: 'Reporté', CANC: 'Annulé', SUSP: 'Suspendu', INT: 'Interrompu', ABD: 'Abandonné', AWD: 'Décision administrative', WO: 'Forfait', LIVE: 'En cours' };
const dateParis = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const clock = value => new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
const message = code => ERRORS[code] || 'Les données ne sont pas disponibles actuellement. Vous pouvez réessayer.';
export function pilotState(ctx) {
  return ctx.session.pilot ||= { status: null, league: '61', seasons: null, season: '', date: dateParis(), list: null, detail: null, busy: false, error: null, revealed: new Set(), request: 0 };
}
export function maskedFixture(f, ctx) {
  const p = ctx.prefs.pilot;
  return (ctx.prefs.spoiler.global || p?.spoilerMatches.includes(f.id) || p?.spoilerTeams.includes(f.home.id) || p?.spoilerTeams.includes(f.away.id)) && !pilotState(ctx).revealed.has(f.id);
}
async function call(ctx, path, apply) {
  const s = pilotState(ctx);
  if (s.busy) return;
  s.busy = true; s.error = null;
  ctx.refresh();
  try {
    if (location.protocol === 'file:') throw new Error('static');
    const r = await fetch(`/api/pilot/${path}`, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
    const json = await r.json().catch(() => { throw new Error('static'); });
    if (!r.ok) throw new Error(json.error);
    apply(json);
  } catch (e) { s.error = ERRORS[e.message] ? e.message : 'offline'; }
  finally { s.busy = false; ctx.refresh(); }
}
function provenance(result, error) {
  if (!result) return '';
  return h`<p class="pilot-source">Source : API-Football · Reçu le ${clock(result.fetchedAt)} · Fuseau Europe/Paris.<br>
    ${result.stale || error || Date.now() >= result.expiresAt ? 'Actualisation à relancer — données anciennes, aucun direct garanti.' : 'Actualisation à la demande, cache de 5 minutes. Aucun suivi seconde par seconde.'}</p>`;
}
function team(f, side) {
  return h`<span class="pilot-team"><span class="pilot-monogram" aria-hidden="true">${(f[side].name || '?').slice(0, 2).toUpperCase()}</span><strong>${f[side].name || 'Équipe inconnue'}</strong></span>`;
}
export function fixtureCard(f, ctx, detail = false) {
  const hidden = maskedFixture(f, ctx);
  const status = labels[f.status] || 'Statut indisponible';
  return h`<article class="pilot-card">
    <p class="pilot-eyebrow">${f.league.name} · ${f.league.season}/${Number(f.league.season) + 1}</p>
    <div class="pilot-scoreboard">${team(f, 'home')}<div class="pilot-score">${hidden ? h`<span class="pilot-hidden">Score masqué</span>` : h`<strong>${f.score.home ?? '—'} <span>:</span> ${f.score.away ?? '—'}</strong>`}</div>${team(f, 'away')}</div>
    <p class="pilot-meta">${clock(f.kickoff)}${hidden ? '' : h` · ${status}${f.elapsed !== null ? h` · ${f.elapsed}${f.extra ? `+${f.extra}` : ''}′` : ''}`}</p>
    ${!hidden && f.penalties.home !== null && f.penalties.away !== null ? h`<p>Tirs au but : ${f.penalties.home} – ${f.penalties.away}</p>` : ''}
    <p class="pilot-broadcast">Diffusion non confirmée dans votre pays</p>
    <div class="pilot-actions">${detail ? '' : h`<a class="btn btn-outline" href="#/reels?id=${f.id}">Voir la fiche</a>`}
      ${hidden ? h`<button class="btn btn-outline" data-action="pilot-reveal" data-id="${f.id}">Révéler ce match</button>` : ''}
      <button class="btn btn-outline" data-action="pilot-save" data-id="${f.id}" aria-pressed="${ctx.prefs.pilot.saved.includes(f.id)}">${ctx.prefs.pilot.saved.includes(f.id) ? 'Enregistré' : 'Enregistrer'}</button>
    </div></article>`;
}
function details(f, ctx) {
  const hidden = maskedFixture(f, ctx);
  return h`${fixtureCard(f, ctx, true)}
    <section class="pilot-panel"><h2>Mes préférences</h2><div class="pilot-actions">
      <button class="btn btn-outline" data-action="pilot-protect" data-id="${f.id}" aria-pressed="${ctx.prefs.pilot.spoilerMatches.includes(f.id)}">Masquer ce match</button>
      ${[f.home, f.away].map(t => h`<button class="btn btn-outline" data-action="pilot-protect-team" data-id="${t.id}" aria-pressed="${ctx.prefs.pilot.spoilerTeams.includes(t.id)}">Masquer ${t.name}</button>`)}
    </div></section>
    <section class="pilot-panel"><h2>Faits de match</h2>${hidden ? h`<p>Événements et détails masqués pour éviter les spoilers.</p>` : h`<p>${f.venue || 'Stade non renseigné'}</p>${f.events?.length ? h`<ol class="pilot-events">${f.events.map(e => h`<li><strong>${e.minute ?? '—'}${e.extra ? `+${e.extra}` : ''}′</strong><span>${e.player || 'Joueur non renseigné'} · ${e.team || 'Équipe non renseignée'}<small>${e.type || 'Événement'} · ${e.detail || 'Détail non renseigné'}</small></span></li>`)}</ol>` : h`<p>Aucun événement fourni pour cette rencontre. Cela ne garantit pas l’absence d’événements.</p>`}`}</section>
    <section class="pilot-panel"><h2>Où regarder</h2><p>Aucune chaîne vérifiée pour cette rencontre. Le Programme TV de démonstration est distinct.</p></section>
    <p class="pilot-source">Compositions, statistiques détaillées, classements, actualités et vidéos réels ne sont pas encore connectés à ce pilote.</p>`;
}
export default {
  render(ctx) {
    const s = pilotState(ctx);
    const id = Number(ctx.route.query.id);
    const selected = s.seasons?.data.seasons.find(x => String(x.year) === s.season);
    const f = s.detail?.data.find(x => x.id === id) || s.list?.data.find(x => x.id === id);
    const list = s.list?.data.filter(f => !s.savedOnly || ctx.prefs.pilot.saved.includes(f.id));
    const result = id ? (s.detail?.data.some(x => x.id === id) ? s.detail : s.list) : s.list;
    return { title: 'Matchs réels · Pilote', nav: 'matchs', body: h`${topBar(ctx)}
      <div class="pilot-heading"><span class="demo-badge">Pilote API</span><h1 tabindex="-1">${id ? 'Fiche match' : 'Matchs réels'}</h1><p>Les rencontres du fournisseur, dans un espace distinct de la démo.</p></div>
      <div class="pilot-actions"><a class="btn btn-outline" href="#/matchs">Retour à la démo</a>${id ? h`<a class="btn btn-outline" href="#/reels">Tous les matchs du pilote</a>` : ''}<button class="btn btn-outline" data-action="pilot-global" aria-pressed="${ctx.prefs.spoiler.global}">Sans spoilers : ${ctx.prefs.spoiler.global ? 'activé' : 'désactivé'}</button></div>
      ${s.error ? h`<div class="pilot-notice" role="alert">${message(s.error)}</div>` : ''}
      ${s.busy ? h`<p role="status" class="pilot-notice">Chargement des données…</p>` : ''}
      ${!s.status ? h`<section class="pilot-panel"><h2>Connecter le pilote</h2><p>Vérifie la configuration du serveur, sans consommer d’appel chez le fournisseur. Aucune clé n’est demandée dans l’interface.</p><button class="btn btn-primary" data-action="pilot-connect"${attr('disabled', s.busy)}>Vérifier la connexion</button></section>` : !s.status.configured ? h`<section class="pilot-panel"><h2>Connexion à configurer</h2><p>${ERRORS.not_configured}</p><p>La démo reste accessible. Une fois le serveur configuré, relancez la vérification.</p><button class="btn btn-outline" data-action="pilot-connect"${attr('disabled', s.busy)}>Vérifier à nouveau</button></section>` : id ? h`
        ${f ? details(f, ctx) : emptyState({ title: 'Rencontre à charger', text: 'Revenez à la liste si cette rencontre n’a pas encore été consultée sur ce serveur.' })}
        <button class="btn btn-primary" data-action="pilot-detail" data-id="${id}"${attr('disabled', s.busy)}>Actualiser la fiche</button>${provenance(result, s.error)}
      ` : h`<section class="pilot-panel"><h2>Choisir une rencontre</h2><p>Le catalogue des saisons ne garantit pas leur accès avec votre offre. Les refus du fournisseur sont affichés sans remplacement par la démo.</p>
        <div class="pilot-fields"><label>Compétition<select aria-label="Compétition" data-change="pilot-league" data-k="pilot-league"${attr('disabled', s.busy)}>${s.status.competitions.map(c => h`<option value="${c.id}"${attr('selected', String(c.id) === s.league)}>${c.name}</option>`)}</select></label>
        <button class="btn btn-outline" data-action="pilot-seasons"${attr('disabled', s.busy)}>Charger les saisons</button>
        ${s.seasons ? h`<label>Saison<select aria-label="Saison" data-change="pilot-season" data-k="pilot-season"${attr('disabled', s.busy)}>${s.seasons.data.seasons.slice().sort((a,b) => b.year-a.year).map(x => h`<option value="${x.year}"${attr('selected', String(x.year) === s.season)}>${x.year}/${x.year+1}${x.current ? ' · actuelle' : ' · archives'}</option>`)}</select></label>
        <label>Date (Europe/Paris)<input type="date" value="${s.date}" min="${selected?.start}" max="${selected?.end}" data-change="pilot-date" data-k="pilot-date"${attr('disabled', s.busy)}></label>
        <button class="btn btn-primary" data-action="pilot-load"${attr('disabled', s.busy || !s.season)}>Afficher les matchs</button>` : ''}</div>
        <p class="pilot-source">Plafond local : ${s.status.budget} appels/jour pour tous les visiteurs. Rafraîchissement manuel uniquement.</p></section>
        <button class="btn btn-outline" data-action="pilot-saved-only" aria-pressed="${!!s.savedOnly}">${s.savedOnly ? 'Afficher tous les matchs' : 'Mes matchs enregistrés à cette date'}</button>
        ${result?.stale ? h`<div class="pilot-notice">${message(result.reason)}</div>` : ''}
        ${list?.length ? h`<div class="pilot-grid">${list.map(f => fixtureCard(f, ctx))}</div>` : list ? emptyState({ title: s.savedOnly ? 'Aucun match enregistré à cette date.' : 'Aucun match renvoyé pour cette date.', text: 'Cette réponse ne garantit pas une couverture exhaustive.' }) : ''}${provenance(result, s.error)}
      `}` };
  },
  actions: {
    'pilot-connect': (el, ctx) => call(ctx, 'status', value => { pilotState(ctx).status = value; }),
    'pilot-league': (el, ctx) => { const s = pilotState(ctx); if(s.busy) return; s.league = el.value; s.seasons = s.list = s.detail = null; s.error = null; s.season = ''; ctx.refresh(); },
    'pilot-seasons': (el, ctx) => { const s = pilotState(ctx); call(ctx, `leagues?league=${s.league}`, value => { s.seasons = value; const season = value.data.seasons.find(x=>x.current) || value.data.seasons.slice().sort((a,b)=>b.year-a.year)[0]; s.season = String(season?.year || ''); if(season && (s.date < season.start || s.date > season.end)) s.date = season.start; s.list = s.detail = null; }); },
    'pilot-season': (el, ctx) => { const s = pilotState(ctx); if(s.busy) return; s.season = el.value; const season = s.seasons.data.seasons.find(x=>String(x.year)===s.season); s.date = season.start; s.list = s.detail = null; s.error = null; ctx.refresh(); },
    'pilot-date': (el, ctx) => { const s = pilotState(ctx); if(s.busy) return; s.date = el.value; s.list = s.detail = null; s.error = null; ctx.refresh(); },
    'pilot-load': (el, ctx) => { const s = pilotState(ctx); call(ctx, `fixtures?${new URLSearchParams({league:s.league,season:s.season,date:s.date})}`, value => { s.list = value; s.detail = null; }); },
    'pilot-detail': (el, ctx) => call(ctx, `fixture?id=${encodeURIComponent(el.dataset.id)}`, value => { pilotState(ctx).detail = value; }),
    'pilot-reveal': (el, ctx) => { pilotState(ctx).revealed.add(Number(el.dataset.id)); ctx.refresh(); },
    'pilot-global': (el, ctx) => { pilotState(ctx).revealed.clear(); ctx.session.revealed.clear(); ctx.session.revealedContent.clear(); ctx.save(p=>{p.spoiler.global=!p.spoiler.global;}); },
    'pilot-save': (el, ctx) => toggle(ctx, 'saved', Number(el.dataset.id)),
    'pilot-protect': (el, ctx) => { pilotState(ctx).revealed.delete(Number(el.dataset.id)); toggle(ctx, 'spoilerMatches', Number(el.dataset.id)); },
    'pilot-protect-team': (el, ctx) => { pilotState(ctx).revealed.clear(); toggle(ctx, 'spoilerTeams', Number(el.dataset.id)); },
    'pilot-saved-only': (el, ctx) => { const s = pilotState(ctx); s.savedOnly = !s.savedOnly; ctx.refresh(); },
  },
};
function toggle(ctx, field, id) { ctx.save(p => { const list = p.pilot[field]; const i = list.indexOf(id); if(i < 0) list.push(id); else list.splice(i,1); }); }
