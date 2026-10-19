// NYVO Premium éditorial — couche de présentation finale.
// Réutilise le transport, le cache et les préférences existants : aucune requête
// fournisseur supplémentaire, filtres et recherche strictement locaux.
const PM_LIVE=['LIVE','HT','ET','P'],PM_DONE=['FT','AET','PEN','AWD','WO'],PM_SOON=['NS','TBD'];
const pmDay=value=>new Intl.DateTimeFormat('fr-FR',{timeZone:'UTC',weekday:'long',day:'numeric',month:'long'}).format(new Date(value+'T12:00:00Z'));
const pmShortDay=value=>new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',day:'numeric',month:'short'}).format(new Date(value));
const pmFollowedRow=(r,ctx)=>teamFollowed(ctx,r.home.id)||teamFollowed(ctx,r.away.id);

// Competition tabs were abandoned: one chronological list, competition is only a secondary filter.
sigState=function(ctx){const s=realExtra(ctx);s.competition??='all';s.confirmedOnly??=false;s.favTab??='space';s.savedKind??='all';s.videoFilter??='all';s.detailTab??='overview';s.teamTab??='overview';return s;};
const pmPriorSelect=realSelect;
realSelect=function(s,ctx){if(s.filter!=='live')return pmPriorSelect(s,ctx);s.filter='all';try{return pmPriorSelect(s,ctx).filter(r=>PM_LIVE.includes(r.status))}finally{s.filter='live'}};
function pmFilterCount(s){return Number(s.competition&&s.competition!=='all')+Number(Boolean(s.filter&&s.filter!=='all'))+Number(Boolean(s.search))+Number(Boolean(s.followedOnly))+Number(Boolean(s.saved))+Number(Boolean(s.confirmedOnly));}

// ---------- Matchs ----------
function pmScore(r,ctx){
 if(fa(r,ctx))return n`<span class="pm-score is-masked">${c('eye-off',{size:18})}<small>${sigTime(r.kickoff)} · Masqué</small></span>`;
 const known=Number.isInteger(r.score?.home)&&Number.isInteger(r.score?.away),live=PM_LIVE.includes(r.status),done=PM_DONE.includes(r.status);
 if(live)return n`<span class="pm-score is-live"><b>${known?r.score.home+' – '+r.score.away:'–'}</b><small>${uaStatus(r.status)}</small></span>`;
 if(done)return n`<span class="pm-score"><b>${known?r.score.home+' – '+r.score.away:'–'}</b><small>${known?uaStatus(r.status):'Score indisponible'}</small></span>`;
 return n`<span class="pm-score is-time"><b>${sigTime(r.kickoff)}</b><small>${r.status==='NS'?'À venir':uaStatus(r.status)}</small></span>`;
}
function pmRow(r,ctx){
 const fav=pmFollowedRow(r,ctx),channel=broadcastFor(r,ctx)[0];
 return n`<article class="pm-row${fav?' is-fav':''}"><a class="pm-rowlink" href="#/reels?id=${r.id}" aria-label="${sigName(r.home)} – ${sigName(r.away)}, ${sigDate(r.kickoff)}, ${sigTime(r.kickoff)}${fav?', équipe suivie':''}">
  <span class="pm-side">${teamBadge(r.home)}<b>${r.home.shortName||sigName(r.home)}</b></span>${pmScore(r,ctx)}<span class="pm-side pm-away"><b>${r.away.shortName||sigName(r.away)}</b>${teamBadge(r.away)}</span>
  <span class="pm-rowmeta">${sigCompetition(r)}${channel?n`<span class="pm-dot">·</span><span class="pm-channel">${c('tv',{size:14})}${channel.channel}</span>`:''}</span></a>${sigSave(r,ctx)}</article>`;
}
function pmMatchList(rows,ctx){return n`<div class="pm-list">${rows.map(r=>pmRow(r,ctx))}</div>`;}
realCards=function(rows,ctx){return pmMatchList(rows,ctx);};
function pmDateBar(s){
 const today=zn(),strip=[-3,-2,-1,0,1,2,3].map(o=>lt(s.date,o));
 return n`<div class="pm-datebar"><div class="pm-dateline"><label class="pm-month">${c('calendar',{size:20})}<span>${new Intl.DateTimeFormat('fr-FR',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(s.date+'T12:00:00Z'))}</span><input aria-label="Choisir une date" type="date" value="${s.date}" data-change="real-date" data-k="pm-date"></label>
  <div class="pm-quick" role="group" aria-label="Raccourcis de date">${[[-1,'Hier'],[0,'Aujourd’hui'],[1,'Demain']].map(([o,label])=>{const d=lt(today,o);return n`<button data-action="pm-day" data-value="${d}" aria-pressed="${s.date===d}">${label}</button>`})}</div></div>
  <div class="pm-days" role="group" aria-label="Jours">${strip.map(d=>{const x=new Date(d+'T12:00:00Z');return n`<button data-action="pm-day" data-value="${d}" aria-pressed="${d===s.date}" aria-label="${ue(d)}" class="${d===s.date?'is-on':''}${d===today?' is-today':''}"><span>${new Intl.DateTimeFormat('fr-FR',{weekday:'short',timeZone:'UTC'}).format(x)}</span><b>${x.getUTCDate()}</b></button>`})}</div></div>`;
}
function pmFilterButton(s,label='Filtres'){const count=pmFilterCount(s);return n`<button class="pm-filterbtn" data-action="open" data-overlay="pmfilters" aria-label="${label}${count?', '+count+' actif'+(count>1?'s':''):''}">${c('sliders',{size:19})}<span>${label}</span>${count?n`<span class="pm-count">${count}</span>`:''}</button>`;}
function pmNearby(s,ctx){
 const days=[...new Set(realSelect(s,ctx).map(r=>realDay(r.kickoff)))].sort(),prev=days.filter(d=>d<s.date).at(-1),next=days.find(d=>d>s.date);
 const count=d=>realSelect(s,ctx).filter(r=>realDay(r.kickoff)===d).length;
 return n`${next?n`<button class="btn btn-primary" data-action="pm-day" data-value="${next}">${'Voir le '+pmDay(next)} · ${count(next)} match${count(next)>1?'s':''}</button>`:''}${prev?n`<button class="btn btn-outline" data-action="pm-day" data-value="${prev}">${'Revenir au '+pmDay(prev)}</button>`:''}`;
}
function pmMatches(ctx){
 const s=sigState(ctx);realEnsure(ctx);editorialEnsure(ctx);
 const rows=realSelect(s,ctx).filter(r=>realDay(r.kickoff)===s.date),hasData=Object.keys(s.entries).length>0,filtered=pmFilterCount(s)>0;
 const featured=rows.find(r=>pmFollowedRow(r,ctx)&&PM_LIVE.includes(r.status))||rows.find(r=>pmFollowedRow(r,ctx)&&PM_SOON.includes(r.status));
 const list=featured?rows.filter(r=>r.id!==featured.id):rows;
 return{title:'Matchs',nav:'matchs',body:n`<div class="pm pm-narrow">${sigHead('Matchs',ctx,fe('#/matchs?view=standings','Classements'))}
  ${pmDateBar(s)}<div class="pm-toolbar"><p class="pm-daytitle">${ue(s.date)}${rows.length?n` <span>· ${rows.length} match${rows.length>1?'s':''}</span>`:''}</p>${pmFilterButton(s)}</div>
  ${sigErrors(s)}
  ${featured?n`<section class="pm-featured" aria-label="Match à suivre">${sigMatch(featured,ctx,{hero:true})}</section>`:''}
  ${list.length?pmMatchList(list,ctx):featured?'':s.busy&&!hasData?sigSkeleton():hasData?sigEmpty(filtered?'Aucune rencontre avec ces filtres':'Aucune rencontre ce jour-là',`Rien de prévu le ${ue(s.date).toLowerCase()} dans les compétitions chargées${Object.keys(s.errors).length?' ; couverture incomplète':''}. La date reste celle que vous avez choisie.`,n`${pmNearby(s,ctx)}${filtered?n`<button class="text-btn" data-action="sig-reset">Effacer les filtres</button>`:''}`):sigEmpty('Rencontres indisponibles','Les données n’ont pas pu être reçues.',n`<button class="btn btn-primary" data-action="real-refresh">Réessayer</button>`,'cloud')}
  <div class="pm-listfoot"><button class="text-btn" data-action="open" data-overlay="competitions">${c('plus',{size:18})}Mes compétitions</button><span>Heure de Paris</span></div>
  ${sigSource(s)}</div>`};
}
Jt.pmfilters={render(ctx){
 const s=sigState(ctx),d=s.pmDraft??={competition:s.competition||'all',filter:s.filter||'all',search:s.search||'',followedOnly:Boolean(s.followedOnly),saved:Boolean(s.saved),confirmedOnly:Boolean(s.confirmedOnly)};
 const comps=realCompetitions.filter(comp=>(s.entries[comp.id]?.data||[]).length);
 const chip=(key,value,label)=>n`<button class="pm-chip" data-action="pm-draft-set" data-key="${key}" data-value="${value}" aria-pressed="${String(d[key])===String(value)}">${label}</button>`;
 const active=Number(d.competition!=='all')+Number(d.filter!=='all')+Number(Boolean(d.search))+Number(d.followedOnly)+Number(d.saved)+Number(d.confirmedOnly);
 return{title:'Filtres',body:n`<div class="pm-filters">
  <section><h3>Compétition</h3><div class="pm-chips">${chip('competition','all','Toutes')}${comps.map(comp=>chip('competition',String(comp.id),comp.name))}</div></section>
  <section><h3>Statut</h3><div class="pm-chips">${chip('filter','all','Tous')}${chip('filter','upcoming','À venir')}${chip('filter','live','En cours')}${chip('filter','finished','Terminés')}</div></section>
  <section><h3>Équipe</h3><label class="sig-search">${c('search',{size:20})}<input type="search" placeholder="Rechercher une équipe" aria-label="Rechercher une équipe" value="${d.search}" data-input="pm-draft-search" data-k="pm-draft-search"></label><p class="sig-caption">Parmi les équipes des rencontres chargées.</p></section>
  <section><h3>Mes favoris</h3>${pmCheck('Équipes suivies','Rencontres de mes clubs','followedOnly',d.followedOnly)}${pmCheck('Matchs enregistrés','Rencontres ajoutées à mes enregistrés','saved',d.saved)}</section>
  <section><h3>Diffusion</h3>${pmCheck('Diffusion confirmée',m[ctx.prefs.country].name+' · sources vérifiées disponibles','confirmedOnly',d.confirmedOnly)}</section>
  <p class="pm-filtersum" role="status">${active?active+' filtre'+(active>1?'s':'')+' sélectionné'+(active>1?'s':''):'Aucun filtre actif'}</p>
  <div class="sig-filterfooter"><button class="btn btn-outline" data-action="pm-draft-reset">Réinitialiser</button><button class="btn btn-primary" data-action="pm-draft-apply">Appliquer</button></div>
  <p class="sig-caption sig-center">Les filtres s’appliquent aux rencontres déjà chargées, sans nouvelle requête.</p></div>`};
},actions:{
 'pm-draft-set':(el,ctx)=>{const d=sigState(ctx).pmDraft;d[el.dataset.key]=el.dataset.value;ctx.refresh()},
 'pm-draft-search':(el,ctx)=>{sigState(ctx).pmDraft.search=el.value},
 'pm-draft-toggle':(el,ctx)=>{sigState(ctx).pmDraft[el.dataset.key]=el.checked;ctx.refresh()},
 'pm-draft-reset':(el,ctx)=>{sigState(ctx).pmDraft={competition:'all',filter:'all',search:'',followedOnly:false,saved:false,confirmedOnly:false};ctx.refresh()},
 'pm-draft-apply':(el,ctx)=>{const s=sigState(ctx),d=s.pmDraft;Object.assign(s,d,{team:'all'});s.pmDraft=null;ctx.closeThen(()=>ctx.refresh())}
}};
function pmCheck(label,description,key,checked){return n`<label class="sig-check"><input type="checkbox" data-change="pm-draft-toggle" data-key="${key}"${b('checked',checked)}><span><b>${label}</b><small>${description}</small></span></label>`;}
const pmOpen=Xn.open;Xn.open=(el,ctx,event)=>{if(el.dataset.overlay==='pmfilters')sigState(ctx).pmDraft=null;return pmOpen(el,ctx,event)};

// ---------- Contenus : étiquettes, visuels, protections ----------
function pmLabel(a){return a.category==='anecdote'?'Histoire du football':a.status==='Rumeur'?'Rumeur':a.status==='Officiel'?'Officiel':'';}
function pmKicker(a,hidden){const label=hidden?'Contenu protégé':pmLabel(a);return label?n`<span class="pm-kicker${label==='Rumeur'?' is-rumor':''}">${label}</span>`:'';}
function pmWhen(a){return a.automatic?pa(a.publishedAt):ue(String(a.publishedAt).slice(0,10));}
// Only images with a recorded licence and an explicit verified status are shown.
function pmVerifiedImages(a){
 const list=Array.isArray(a.images)?a.images.filter(i=>i.status==='verified'&&/^(https:\/\/|\/images\/)/.test(i.src||'')):[];
 if(!list.length&&a.image&&/^https:\/\//.test(a.image.url||'')&&a.image.license&&a.image.sourceUrl)list.push({id:'legacy',kind:'photo',status:'verified',src:a.image.url,alt:a.image.alt,caption:a.image.caption,author:a.image.author,license:a.image.license,licenseUrl:a.image.licenseUrl,sourceUrl:a.image.sourceUrl});
 return list;
}
function pmCover(a){const list=pmVerifiedImages(a);return list.find(i=>i.id===a.cover)||list[0]||null;}
function pmCredit(im){return n`${im.author}${im.license?' · ':''}${im.licenseUrl?n`<a href="${im.licenseUrl}" target="_blank" rel="noopener noreferrer">${im.license}</a>`:im.license||''}${im.sourceUrl?n` · <a href="${im.sourceUrl}" target="_blank" rel="noopener noreferrer">source</a>`:''}`;}
function pmTile(a,hidden){const tone=[...String(a.sources?.[0]?.name||'NYVO')].reduce((h,ch)=>h+ch.charCodeAt(0),0)%4;
 if(hidden)return n`<span class="pm-tile is-masked" aria-hidden="true">${c('eye-off',{size:22})}</span>`;
 const im=a.category==='anecdote'?pmCover(a):null;
 return im?n`<span class="pm-tile has-image"><img data-pm-img="1" class="${im.kind==='infographic'?'is-contain':''}" src="${im.src}" alt="" width="160" height="160" loading="lazy" decoding="async" referrerpolicy="no-referrer"></span>`:n`<span class="pm-tile" data-tone="${tone}" aria-hidden="true">${c(a.category==='mercato'?'swap':a.category==='anecdote'?'trophy':'news',{size:20})}<em>${a.sources?.[0]?.name||'NYVO'}</em></span>`;
}
function pmStoryRow(a,ctx){const hidden=storyProtected(a,ctx);return n`<article class="pm-story"><a class="pm-storylink" href="#/actualites?story=${a.id}" aria-label="${hidden?'Actualité masquée':a.title}">${pmTile(a,hidden)}<span class="pm-storybody">${pmKicker(a,hidden)}<b>${hidden?'Actualité masquée':a.title}</b><small>${hidden?'Révélez-la pour lire le titre':a.sources[0].name+' · '+pmWhen(a)}</small></span></a>${storySave(a,ctx)}</article>`;}
function pmLead(a,ctx,{tag='h2'}={}){
 const hidden=storyProtected(a,ctx),im=hidden?null:pmCover(a);
 if(hidden)return n`<article class="pm-lead is-masked"><div class="pm-leadart">${c('eye-off',{size:30})}<span>Actualité masquée</span></div><div class="pm-leadbody"><p>Son titre peut révéler des informations protégées.</p><button class="btn btn-outline" data-action="community-news-reveal" data-id="${a.id}">Révéler</button></div></article>`;
 const title=tag==='h1'?n`<h1>${a.title}</h1>`:n`<h2>${a.title}</h2>`;
 return n`<article class="pm-lead ${im?'has-image':'is-type'}"><a class="pm-leadlink" href="#/actualites?story=${a.id}">${im?n`<figure class="pm-leadart"><img src="${im.src}" alt="${im.alt||''}" width="1200" height="675" decoding="async" referrerpolicy="no-referrer" data-pm-img="1"></figure>`:n`<div class="pm-leadart pm-typeart" aria-hidden="true"><span>${a.sources[0].name}</span></div>`}
  <div class="pm-leadbody">${pmKicker(a,false)}${title}${a.summary?n`<p>${a.summary}</p>`:''}<small>${a.byline||a.sources[0].name} · ${pmWhen(a)}${a.readingMinutes?' · '+a.readingMinutes+' min de lecture':''}</small></div></a>${im?n`<p class="pm-credit">${im.kind==='infographic'?'Infographie NYVO':'Photo'} · ${pmCredit(im)}</p>`:''}</article>`;
}

// ---------- Vidéos : ouverture externe uniquement ----------
function pmVideoKind(v){return v.kind==='Résumé'?'Résumé officiel':v.kind==='Depuis les tribunes'?'Depuis les tribunes':'Contenu officiel';}
function pmPoster(v,ctx,hidden){
 if(hidden)return n`<span class="pm-poster is-masked">${c('eye-off',{size:26})}<small>Miniature masquée</small></span>`;
 const fallback=n`<span class="pm-posterfallback" aria-hidden="true"><b>${v.home&&v.away?v.home+' – '+v.away:v.publisher||'Vidéo'}</b><small>${v.publisher||''}</small></span>`;
 return n`<span class="pm-poster">${fallback}${v.thumbnail&&/^https:\/\/i[0-9]?\.ytimg\.com\//.test(v.thumbnail)?n`<img src="${v.thumbnail}" alt="" width="480" height="270" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-media-thumbnail="1"${/^[A-Za-z0-9_-]{11}$/.test(v.id)?n` data-fallback-src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg"`:''}>`:''}${hvDuration(v.duration)?n`<span class="pm-duration">${hvDuration(v.duration)}</span>`:''}</span>`;
}
function pmVideoCard(v,ctx,{rail=false}={}){
 const hidden=videoProtected(v,ctx);
 return n`<article class="pm-vcard${rail?' is-rail':''}"><a href="#/videos?video=${v.id}" data-action="hv-open" data-id="${v.id}" aria-label="${hidden?'Vidéo masquée, ouvrir la fiche':v.title}">${pmPoster(v,ctx,hidden)}
  <span class="pm-vbody"><span class="pm-kicker">${pmVideoKind(v)}</span><b>${hidden?(v.home&&v.away?'Résumé masqué':'Vidéo masquée'):v.title}</b><small>${v.publisher}${hidden?'':v.kickoff?' · '+pmShortDay(v.kickoff):''}${!hvAvailable(v,ctx.prefs.country)?' · Restreinte ou indisponible':''}</small></span></a>${hidden?'':hvSaved(v,ctx)}</article>`;
}
function pmVideoGroups(ctx,filter){
 const s=hvState(ctx),groups=new Map;
 for(const v of s.editorial?.videos||[]){
  if(filter==='summary'&&v.kind!=='Résumé')continue;if(filter==='stands'&&v.kind!=='Depuis les tribunes')continue;if(['player','archives'].includes(filter))continue;
  if(s.videoFilter==='followed'&&!teamFollowed(ctx,v.homeId)&&!teamFollowed(ctx,v.awayId))continue;
  if(s.hvDate&&realDay(v.kickoff)!==s.hvDate)continue;
  const key=v.kind==='Résumé'?'match:'+v.matchId:'video:'+v.id;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(v);
 }
 return [...groups.values()].map(list=>hvSorted(list,ctx)[0]).sort((a,b)=>String(b.kickoff).localeCompare(String(a.kickoff)));
}
function pmArchives(ctx){return (communityState(ctx).news?.articles||[]).filter(a=>a.archive?.url&&/^https:\/\//.test(a.archive.url));}
function pmVideos(ctx){
 const s=communityEnsure(ctx);editorialEnsure(ctx);hvState(ctx);
 if(ctx.route.query.media){const item=s.media.find(v=>v.id===ctx.route.query.media);return item?mediaDetail(item,ctx):{title:'Vidéo',nav:'videos',body:n`${sigBack('Vidéo')}${sigEmpty('Vidéo indisponible','Aucune publication vérifiée ne correspond à ce lien.')}`}}
 if(ctx.route.query.video)return pmVideoDetail(ctx);
 const filter=s.contentFilter,videos=pmVideoGroups(ctx,filter),media=s.media.filter(v=>filter==='all'||v.category===(filter==='stands'?'stands':filter)),archives=['all','archives'].includes(filter)?pmArchives(ctx):[];
 const empty={stands:['Aucune vidéo « Depuis les tribunes » validée','Six créateurs sont à l’examen : identité, publications récentes, rencontre filmée et droits. Rien n’est publié avant validation.'],player:['Aucun focus joueur vérifié','Seules les performances dont la source et le contexte sont vérifiés seront ajoutées.'],archives:['Aucune archive disponible','Les archives officielles liées aux histoires apparaîtront ici.'],summary:['Aucun résumé officiel disponible','Aucun résumé ne correspond à vos filtres.'],all:['Aucune vidéo disponible','Aucun contenu ne correspond à vos filtres.']}[filter]||['Aucune vidéo','Aucun contenu.'];
 return{title:'Vidéos',nav:'videos',body:n`<div class="pm pm-wide">${sigHead('Vidéos',ctx)}<p class="pm-sub">Résumés officiels, tribunes et archives. Les vidéos s’ouvrent sur YouTube ou chez l’éditeur.</p>
  <div class="pm-tabs">${F([['all','Tous'],['summary','Résumés'],['stands','Depuis les tribunes'],['player','Joueurs'],['archives','Archives']],filter,{action:'community-video-filter',label:'Types de vidéos'})}</div>
  <div class="pm-toolbar">${F([['all','Toutes équipes'],['followed','Mes équipes']],s.videoFilter,{action:'sig-video-filter',label:'Équipes'})}<label class="pm-datefield">${c('calendar',{size:18})}<input type="date" aria-label="Date du match" value="${s.hvDate}" data-change="hv-date"></label>${s.hvDate?n`<button class="text-btn" data-action="hv-date-clear">Toutes les dates</button>`:''}</div>
  ${s.hvError||s.editorialError?n`<p role="alert" class="sig-error">Catalogue officiel temporairement indisponible ; les contenus reçus sont conservés.</p>`:s.hv?.state==='paused'?n`<p class="hv-status">${hvErrorLabel(s.hv.error)}</p>`:''}
  ${videos.length||media.length||archives.length?n`<div class="pm-vgrid">${videos.map(v=>pmVideoCard(v,ctx))}${media.map(v=>mediaCard(v,ctx))}${archives.map(a=>pmArchiveCard(a,ctx))}</div>`:s.editorialBusy||s.communityBusy?n`<div class="pm-vgrid">${[1,2,3].map(()=>n`<div class="pm-vcard is-skeleton" aria-hidden="true"><span class="pm-poster"></span><span class="pm-vbody"><i></i><i></i></span></div>`)}</div>`:sigEmpty(empty[0],empty[1],'','video')}
  <button class="text-btn" data-action="community-refresh-all"${b('disabled',s.editorialBusy||s.communityBusy)}>${c('refresh',{size:18})}Actualiser le catalogue</button>
  <p class="sig-caption">Sources officielles épinglées : Ligue 1, UEFA, Premier League, LALIGA, Serie A, Bundesliga et ge tv. Aucune recherche YouTube par visiteur, aucun lecteur intégré.</p><a class="sig-demo-link" href="#/videos?demo=1">Vidéos de démonstration</a></div>`};
}
function pmArchiveCard(a,ctx){const hidden=storyProtected(a,ctx);return n`<article class="pm-vcard is-archive"><a href="${a.archive.url}" target="_blank" rel="noopener noreferrer" aria-label="${hidden?'Archive masquée':a.archive.label}, ouvre UEFA.com"><span class="pm-poster pm-archiveposter">${hidden?c('eye-off',{size:26}):n`<b>${a.record?.value||'Archive'}</b><small>${a.subject||''}</small>`}</span><span class="pm-vbody"><span class="pm-kicker">Archives · éditeur officiel</span><b>${hidden?'Archive masquée':a.archive.label}</b><small>${new URL(a.archive.url).hostname.replace('www.','')} ${c('external',{size:14})} · lecture non vérifiée</small></span></a></article>`;}
function pmVideoDetail(ctx){
 const s=hvState(ctx),v=s.editorial?.videos.find(x=>x.id===ctx.route.query.video),back=Y(String(sigBack('Vidéo')).replace('data-fallback="#/matchs"','data-fallback="#/videos"'));
 if(!v)return{title:'Vidéo',nav:'videos',body:n`<div class="pm pm-narrow">${back}${s.editorialBusy?sigSkeleton():sigEmpty('Vidéo indisponible','Cette vidéo n’est plus présente dans le catalogue. Aucune autre rencontre n’est proposée à sa place.',n`<a class="btn btn-outline" href="#/videos">Retour aux vidéos</a>`,'video')}</div>`};
 const hidden=videoProtected(v,ctx),available=hvAvailable(v,ctx.prefs.country),url=ytWatchUrl(v),comp=realCompetitions.find(x=>x.id===v.league)?.name||'Football';
 if(hidden)return{title:'Vidéo protégée',nav:'videos',body:n`<div class="pm pm-narrow">${back}<div class="pm-hero16 is-masked">${c('eye-off',{size:34})}<span>Titre et miniature masqués</span></div><h1 class="pm-vtitle">${v.home&&v.away?'Résumé : '+v.home+' – '+v.away:'Vidéo protégée'}</h1><p class="sig-caption">${v.publisher} · le titre et l’image peuvent révéler le résultat.</p><button class="btn btn-primary btn-block" data-action="video-reveal-real" data-id="${v.id}">Révéler cette vidéo</button></div>`};
 return{title:v.title,nav:'videos',body:n`<div class="pm pm-narrow"><article class="pm-vdetail">${back}
  <div class="pm-hero16">${pmPoster(v,ctx,false)}</div>
  <div class="pm-vhead"><span class="pm-kicker">${pmVideoKind(v)} · ${hvLang(v)}</span>${hvSaved(v,ctx)}</div>
  <h1 class="pm-vtitle">${v.title}</h1>
  <p class="pm-vby"><a href="${v.publisherUrl}" target="_blank" rel="noopener noreferrer">${v.publisher}</a>${hvDuration(v.duration)?' · '+hvDuration(v.duration):''}${v.publishedAt?' · publiée le '+pmShortDay(v.publishedAt):''}</p>
  ${!available?n`<p class="sig-error" role="alert">${v.state==='unavailable'?'Cette vidéo n’est plus disponible chez l’éditeur.':'Restriction déclarée pour votre pays.'} Elle n’est remplacée par aucune autre rencontre ; les autres versions officielles du même match restent listées ci-dessous.</p>`:''}
  ${url&&v.state!=='unavailable'?n`<a class="btn btn-primary btn-block pm-yt" href="${url}" target="_blank" rel="noopener noreferrer" data-yt="${v.id}">${c('external',{size:18})}Voir sur YouTube</a><p class="sig-caption sig-center">S’ouvre chez YouTube, dans le navigateur ou l’application selon les réglages de votre appareil. Revenez à NYVO avec le bouton retour ou l’onglet NYVO.</p>`:n`<p class="sig-caption">Lien externe indisponible pour cette version.</p>`}
  <section class="pm-context"><span class="pm-kicker">Le match</span>${v.home&&v.away?n`<h2>${v.home} – ${v.away}</h2><p>${comp} · ${sigDate(v.kickoff)}</p><a class="text-link" href="#/reels?id=${v.matchId}">Voir la fiche match${c('chevron-right',{size:16})}</a>`:n`<p>Contexte non associé à une rencontre.</p>`}</section>
  ${hvAlternatives(v,ctx)}
  <dl class="sig-facts"><div><dt>Éditeur</dt><dd>${v.publisher} · YouTube</dd></div><div><dt>Publication</dt><dd>${v.publishedAt?pa(v.publishedAt):'Non confirmée'}</dd></div><div><dt>Métadonnées vérifiées</dt><dd>${pa(v.checkedAt)}</dd></div></dl>
  <p class="sig-caption">Aucun lecteur n’est chargé dans NYVO. Les restrictions de lecture et de pays sont gérées par YouTube et peuvent changer.</p></article></div>`};
}
summaryPanel=function(row,ctx){
 const s=editorialEnsure(ctx),videos=(s.editorial?.videos||[]).filter(v=>matchingEditorial(v,row)),summaries=hvSorted(videos.filter(v=>v.kind==='Résumé'),ctx),related=videos.filter(v=>v.kind!=='Résumé'),v=summaries[0];
 return n`<section class="sig-section pm-summary"><h2>Résumé officiel</h2>${v?n`${pmVideoCard(v,ctx)}${summaries.length>1?n`<a class="text-link" href="#/videos?video=${v.id}" data-action="hv-open" data-id="${v.id}">${summaries.length-1} autre${summaries.length>2?'s':''} version${summaries.length>2?'s':''} officielle${summaries.length>2?'s':''}${c('chevron-right',{size:16})}</a>`:''}`:n`<p class="sig-caption">Aucun résumé officiel clair pour cette rencontre pour le moment. Aucun autre match n’est proposé à sa place.</p>${hvJobStatus(ctx,row)}`}
  ${related.length?n`<h3>Autour du match</h3><div class="pm-vgrid is-compact">${related.map(x=>pmVideoCard(x,ctx))}</div>`:''}</section>`;
};
// A blocked or deleted image is hidden, never replaced by a generic stadium picture.
document.addEventListener('error',e=>{const img=e.target;if(img instanceof HTMLImageElement&&img.dataset.pmImg){img.hidden=true;img.closest('figure,.pm-tile,.pm-scover')?.classList.add('is-broken');}},true);
document.addEventListener('click',e=>{const a=e.target.closest?.('a[data-yt]');if(a&&/^[A-Za-z0-9_-]{11}$/.test(a.dataset.yt))hvMarkSeen(j,a.dataset.yt);},true);

// ---------- Actualités et article ----------
function pmNews(ctx){
 const s=communityEnsure(ctx);
 if(ctx.route.query.story){const a=journalArticles(ctx).find(x=>x.id===ctx.route.query.story);return a?pmArticle(a,ctx):{title:'Actualité',nav:'actualites',body:n`<div class="pm pm-narrow">${sigBack('Actualité')}${s.communityBusy?sigSkeleton():sigEmpty('Actualité indisponible','Cet article n’est pas présent dans la sélection actuelle.')}</div>`}}
 const feed=ctx.route.query.feed||'personal',articles=selectedNews(ctx),[lead,...rest]=articles;
 return{title:'Actualités',nav:'actualites',body:n`<div class="pm pm-wide">${sigHead('Actualités',ctx)}
  <div class="pm-tabs">${F([['personal','Pour toi'],['all','Tout le foot'],['market','Mercato'],['anecdotes','Histoires'],['offfield','Hors terrain']],feed,{action:'sig-news-filter',label:'Fil d’actualités'})}</div>
  ${s.pendingNews?n`<button class="pm-newbanner" data-action="community-news-apply">${c('refresh',{size:16})}Nouvelles actualités · Afficher</button>`:''}
  ${s.communityError?n`<p role="alert" class="sig-error">Actualités indisponibles. Les derniers articles reçus sont conservés.</p>`:''}
  ${lead?n`<div class="pm-newsgrid">${pmLead(lead,ctx)}<div class="pm-stories">${rest.map(a=>pmStoryRow(a,ctx))}</div></div>`:s.communityBusy?sigSkeleton():sigEmpty('Aucune actualité disponible',feed==='market'?'Aucune information mercato dans les sources actives.':'Aucun sujet ne correspond à ce fil.','','news')}
  <div class="sig-source"><div>${(s.news?.sources||[]).map(x=>x.name).join(' · ')||'Sources éditoriales'}${s.news?.checkedAt?n`<small>Dernière collecte : ${pa(s.news.checkedAt)}${s.news.stale?' · cache ancien':''} · la date affichée sur chaque article est sa publication</small>`:n`<small>Aucune collecte automatique reçue ; brèves et histoires NYVO affichées</small>`}</div><button class="icon-btn" data-action="community-refresh" aria-label="Actualiser les actualités"${b('disabled',s.communityBusy)}>${c('refresh')}</button></div>
  <details class="journal-sources"><summary>Sources et fraîcheur</summary>${(s.news?.sources||[]).map(src=>n`<p><b>${src.name}</b> · ${src.count??0} articles<br><small>${src.lastSuccess?'Dernière réception : '+pa(src.lastSuccess):'Pas encore reçu'}${src.state==='paused'?' · temporairement indisponible':''}</small></p>`)}${(s.news?.registry||[]).filter(x=>x.state!=='active').map(x=>n`<p><b>${x.name}</b> · ${x.state==='blocked'?'bloquée':'en attente'}<br><small>${x.reason}</small></p>`)}<p class="sig-caption">Contrôle planifié au plus toutes les ${s.news?.maxIntervalMinutes||90} minutes lorsque le service fonctionne ; il ne garantit pas qu’un média ait publié. Les photographies de presse ne sont jamais reprises sans autorisation.</p></details>
  <a class="sig-demo-link" href="#/actualites?demo=1">Actualités de démonstration</a></div>`};
}
function pmArticle(a,ctx){
 const back=Y(String(sigBack(a.category==='anecdote'?'Histoire':'Actualité')).replace('data-fallback="#/matchs"','data-fallback="#/actualites"'));
 if(storyProtected(a,ctx))return{title:'Actualité protégée',nav:'actualites',body:n`<div class="pm pm-narrow">${back}${sigEmpty('Contenu masqué','Son titre, ses images et ses chiffres peuvent révéler des informations protégées.',n`<button class="btn btn-outline" data-action="community-news-reveal" data-id="${a.id}">Révéler</button>`,'eye-off')}</div>`};
 const images=pmVerifiedImages(a),cover=pmCover(a),sections=Array.isArray(a.sections)?a.sections:(Array.isArray(a.body)?a.body.map((p,i)=>({heading:a.headings?.[i]||null,paragraphs:[p]})):[]);
 const words=sections.flatMap(x=>x.paragraphs).join(' ').split(/\s+/).filter(Boolean).length,minutes=a.readingMinutes||(words?Math.max(1,Math.round(words/180)):0);
 const figure=id=>{const im=images.find(i=>i.id===id&&i.id!==cover?.id);return im?n`<figure class="pm-figure"><img data-pm-img="1" src="${im.src}" alt="${im.alt||''}" loading="lazy" decoding="async" referrerpolicy="no-referrer"${im.width?n` width="${im.width}" height="${im.height}"`:''}><figcaption>${im.caption}<span>${pmCredit(im)}</span></figcaption></figure>`:''};
 return{title:a.title,nav:'actualites',body:n`<div class="pm pm-narrow"><article class="pm-article">${back}
  ${cover?n`<figure class="pm-cover"><img data-pm-img="1" src="${cover.src}" alt="${cover.alt||''}" decoding="async" referrerpolicy="no-referrer"${cover.width?n` width="${cover.width}" height="${cover.height}"`:''}><figcaption>${cover.caption}<span>${pmCredit(cover)}</span></figcaption></figure>`:n`<div class="pm-cover pm-typeart" aria-hidden="true"><span>${a.sources[0].name}</span></div>`}
  <p class="pm-articlemeta">${pmKicker(a,false)}${minutes?n`<span>${minutes} min de lecture</span>`:''}</p>
  <h1>${a.title}</h1>
  ${a.summary?n`<p class="pm-chapo">${a.summary}</p>`:''}
  <p class="pm-byline">${a.byline?n`<b>${a.byline}</b> · `:''}${a.automatic?'Publié par '+a.sources[0].name+' le '+pa(a.publishedAt):ue(String(a.publishedAt).slice(0,10))}${a.revisedAt?' · révisé le '+pmShortDay(a.revisedAt):''}${storySave(a,ctx)}</p>
  ${sections.map((sec,i)=>n`${sec.heading?n`<h2>${sec.heading}</h2>`:''}${sec.paragraphs.map(p=>n`<p class="pm-p">${p}</p>`)}${i===0&&a.record?n`<aside class="pm-record"><strong>${a.record.value}</strong><b>${a.record.label}</b><p>${a.record.scope}</p></aside>`:''}${sec.figure?figure(sec.figure):''}`)}
  ${!sections.length?n`<p class="sig-caption">${a.contentOrigin==='rss'?'Extrait transmis par le flux de '+a.sources[0].name+'. ':'Synthèse originale NYVO. '}${a.access||''}</p><a class="btn btn-primary btn-block" href="${a.sources[0].url}" target="_blank" rel="noopener noreferrer">Lire chez ${a.sources[0].name}${c('external',{size:18})}</a>`:''}
  ${a.archive?n`<section class="pm-further"><span class="pm-kicker">Pour aller plus loin</span><a class="pm-furtherlink" href="${a.archive.url}" target="_blank" rel="noopener noreferrer">${c('video',{size:22})}<span><b>${a.archive.label}</b><small>Archive officielle chez l’éditeur · lecture et disponibilité en France non vérifiées</small></span>${c('external',{size:18})}</a></section>`:''}
  <section class="pm-sources"><h2>Sources et vérification</h2>${a.sources.map(x=>n`<a class="sig-settingrow" href="${x.url}" target="_blank" rel="noopener noreferrer">${x.name}${c('external',{size:16})}</a>`)}
   ${a.verification?n`<p class="sig-caption">${a.verification}</p>`:''}<p class="sig-caption">${a.automatic?'Collecté le '+pa(a.checkedAt)+' · publié le '+pa(a.publishedAt):'Vérification : '+pa(a.checkedAt)}.</p>
   ${images.length?n`<h3>Crédits des visuels</h3>${images.map(im=>n`<p class="sig-caption">${im.kind==='infographic'?'Infographie':'Photo'} · ${pmCredit(im)}${im.crop?n`<br>${im.crop}`:''}</p>`)}`:a.automatic?n`<p class="sig-caption">Aucune photographie de l’éditeur reprise : droits de réutilisation non établis.</p>`:''}</section>
 </article></div>`};
}

// Earlier layers drew every article with the same generic stadium picture: replaced everywhere.
storyCard=function(a,ctx){return pmStoryRow(a,ctx)};
homeStory=function(a,ctx){return pmLead(a,ctx)};

// ---------- Accueil ----------
function pmHome(ctx){
 const s=sigState(ctx);realEnsure(ctx);editorialEnsure(ctx);communityEnsure(ctx);
 const all=realRows(s),now=Date.now(),today=zn(),cs=communityState(ctx);
 const followed=all.filter(r=>pmFollowedRow(r,ctx)),fUpcoming=followed.filter(r=>PM_LIVE.includes(r.status)||(PM_SOON.includes(r.status)&&Date.parse(r.kickoff)>=now-3*3600000)),fRecent=followed.filter(r=>PM_DONE.includes(r.status)).sort((a,b)=>b.kickoff.localeCompare(a.kickoff));
 const pick=homeSelection(s,ctx),mine=[...fUpcoming.slice(0,2),...fRecent.slice(0,1)].sort((a,b)=>a.kickoff.localeCompare(b.kickoff)),rows=(mine.length?mine:pick.rows).slice(0,3);
 const news=selectedNews(ctx),lead=news[0],more=news.slice(1,4),ids=ctx.prefs.pilot.followedTeams||[];
 const topics=journalArticles(ctx).filter(a=>a.category!=='anecdote'&&a.id!==lead?.id&&a.teamIds.some(id=>ids.includes(id))).slice(0,3);
 const stories=(cs.news?.articles||[]).filter(a=>a.category==='anecdote');
 const groups=pmVideoGroups(ctx,'summary'),videos=groups.sort((a,b)=>Number(teamFollowed(ctx,b.homeId)||teamFollowed(ctx,b.awayId))-Number(teamFollowed(ctx,a.homeId)||teamFollowed(ctx,a.awayId))).slice(0,2);
 return{title:'Accueil',nav:'accueil',body:n`<div class="pm pm-wide pm-home">${O(ctx)}<h1 class="sr-only" tabindex="-1">Accueil · Mon football</h1>
  <p class="pm-date">${ue(today)}</p>
  ${lead?pmLead(lead,ctx):stories[0]?pmLead(stories[0],ctx):cs.communityBusy?n`<div class="pm-lead is-skeleton" aria-hidden="true"><div class="pm-leadart"></div></div>`:''}
  <section class="pm-section">${Ye(mine.length?'Vos matchs':pick.label,fe('#/matchs','Tous les matchs'))}${sigErrors(s)}${rows.length?pmMatchList(rows,ctx):s.busy?sigSkeleton():n`<p class="sig-caption">Les rencontres apparaîtront dès leur réception.</p>`}${!ids.length?n`<a class="pm-hint" href="#/favoris">${c('star',{size:18})}<span>Suivez vos équipes pour voir leurs matchs et leurs sujets en premier.</span>${c('chevron-right',{size:16})}</a>`:''}</section>
  ${videos.length?n`<section class="pm-section">${Ye('Résumés',fe('#/videos','Voir tout'))}<div class="pm-rail" role="list">${videos.map(v=>n`<div role="listitem" class="pm-railitem">${pmVideoCard(v,ctx,{rail:true})}</div>`)}<a class="pm-railmore" href="#/videos">${c('video',{size:24})}<span>Toutes les vidéos</span></a></div></section>`:''}
  ${topics.length?n`<section class="pm-section">${Ye('Autour de vos équipes',fe('#/actualites','Actualités'))}<div class="pm-stories">${topics.map(a=>pmStoryRow(a,ctx))}</div></section>`:''}
  ${more.length?n`<section class="pm-section">${Ye('Actualités',fe('#/actualites','Tout voir'))}<div class="pm-newsgrid">${pmLead(more[0],ctx)}<div class="pm-stories">${more.slice(1).map(a=>pmStoryRow(a,ctx))}</div></div></section>`:''}
  ${stories.length?n`<section class="pm-section">${Ye('Histoires du football',fe('#/actualites?feed=anecdotes','Tout lire'))}<div class="pm-rail is-stories" role="list">${stories.map(a=>n`<div role="listitem" class="pm-railitem">${pmStoryCard(a,ctx)}</div>`)}</div></section>`:''}
  ${sigSource(s)}<a class="sig-demo-link" href="#/accueil?demo=1">Démonstration</a></div>`};
}
function pmStoryCard(a,ctx){const hidden=storyProtected(a,ctx),im=hidden?null:pmCover(a);return n`<article class="pm-scard"><a href="#/actualites?story=${a.id}" aria-label="${hidden?'Histoire masquée':a.title}"><span class="pm-scover">${hidden?c('eye-off',{size:26}):im?n`<img data-pm-img="1" class="${im.kind==='infographic'?'is-contain':''}" src="${im.src}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"><b class="pm-fallback">${a.record?.value||''}</b>`:n`<b>${a.record?.value||''}</b>`}</span><span class="pm-vbody"><span class="pm-kicker">${hidden?'Contenu protégé':a.subject||'Histoire'}</span><b>${hidden?'Histoire masquée':a.title}</b><small>${a.readingMinutes?a.readingMinutes+' min · ':''}${a.byline||'Rédaction NYVO'}</small></span></a></article>`;}

// ---------- Réglages : sources à jour ----------
Jt.sigsources.render=()=>({title:'Sources et couverture',body:n`<div class="sig-settings"><section><h3>Matchs et classements</h3><p>football-data.org · compétitions chargées à la demande après contrôle d’accès. Scores différés ; source et dernière réception affichées.</p></section><section><h3>Diffusion</h3><p>Sélection partielle vérifiée manuellement par match et par pays. Un contrat de droits général ne vaut pas confirmation de chaîne.</p></section><section><h3>Vidéos</h3><p>Métadonnées de chaînes officielles. Aucune lecture dans NYVO : chaque vidéo s’ouvre sur YouTube après votre clic. « Depuis les tribunes » : créateurs en examen, rien n’est publié sans validation.</p></section><section><h3>Actualités</h3><p>Le Monde (titres et extraits) et Foot Mercato (titres) en lecture personnelle privée, contrôle au plus toutes les 90 minutes lorsque le service fonctionne. Brèves et histoires rédigées par la Rédaction NYVO. Aucune photographie de presse reprise sans autorisation.</p></section></div>`});

// ---------- Routes ----------
gt.accueil.render=ctx=>sigDemo(ctx)?demoHome.render(ctx):pmHome(ctx);
gt.matchs.render=ctx=>{if(sigDemo(ctx))return demoMatches.render(ctx);const s=sigState(ctx);if(ctx.route.query.followed==='1'&&s.followRoute!==ctx.route.query.followed){s.followedOnly=true;s.followRoute='1'}if(!ctx.route.query.followed)s.followRoute=null;return ctx.route.query.view==='standings'?standingsPage(ctx):pmMatches(ctx)};
gt.reels.render=ctx=>ctx.route.query.team?sigTeam(ctx):ctx.route.query.id?sigDetail(ctx):pmMatches(ctx);
gt.videos.render=ctx=>sigDemo(ctx)?originalVideos.render(ctx):pmVideos(ctx);
gt.actualites.render=ctx=>sigDemo(ctx)?sigDemoNews.render(ctx):pmNews(ctx);
Object.assign(realActions,{'pm-day':(el,ctx)=>{if(/^\d{4}-\d{2}-\d{2}$/.test(el.dataset.value||'')){sigState(ctx).date=el.dataset.value;ctx.refresh()}}});
for(const route of ['accueil','matchs','reels','favoris','videos','actualites','programme'])Object.assign(gt[route].actions,realActions);
for(const name of ['sigwatch','sigprotections','signearby','hvcontrol','pmfilters'])Object.assign(Jt[name].actions,realActions);
