// Jeu de test local. Équipes, identifiants et horaires viennent du catalogue
// éditorial vérifié (server/editorial.mjs) ; les SCORES sont fictifs et ne doivent
// jamais être présentés comme des résultats réels. Aucun appel réseau.
import {EDITORIAL} from '../../server/editorial.mjs';

const OFFSET=1000000000;
const CODES={2015:{code:'FL1',name:'Ligue 1'},2001:{code:'CL',name:'UEFA Champions League'}};
const SHORT={'Paris Saint-Germain FC':'PSG','Olympique de Marseille':'Marseille','Racing Club de Lens':'Lens','RC Strasbourg Alsace':'Strasbourg','Stade Brestois 29':'Brest','AS Monaco FC':'Monaco','Lille OSC':'Lille','ES Troyes AC':'Troyes','Angers SCO':'Angers','FC Lorient':'Lorient','Le Mans FC':'Le Mans','Toulouse FC':'Toulouse','Paris FC':'Paris FC','Stade Rennais FC 1901':'Rennes'};

function rows(){
 const seen=new Map;
 for(const r of [...EDITORIAL.broadcasts,...EDITORIAL.videos])if(!seen.has(r.matchId))seen.set(r.matchId,r);
 return [...seen.values()];
}
// Deterministic fictitious score, null for one finished match to exercise "score absent".
function score(id){if(id%7===3)return {home:null,away:null};return {home:id%4,away:(id>>2)%3};}

export function fixtureMatches(league,now){
 return rows().filter(r=>r.league===league).map(r=>{
  const finished=Date.parse(r.kickoff)+2*3600000<now,live=!finished&&Date.parse(r.kickoff)<=now;
  const s=finished?score(r.matchId):live?{home:1,away:0}:{home:null,away:null};
  return {id:r.matchId-OFFSET,utcDate:r.kickoff,status:finished?'FINISHED':live?'IN_PLAY':'TIMED',matchday:league===2015?8:3,stage:league===2015?'REGULAR_SEASON':'LEAGUE_STAGE',
   competition:{id:league,name:CODES[league].name,emblem:`https://crests.football-data.org/${CODES[league].code}.png`},season:{startDate:'2026-08-01'},
   homeTeam:{id:r.homeId-OFFSET,name:r.home,shortName:SHORT[r.home]||r.home,crest:`https://crests.football-data.org/${r.homeId-OFFSET}.png`},
   awayTeam:{id:r.awayId-OFFSET,name:r.away,shortName:SHORT[r.away]||r.away,crest:`https://crests.football-data.org/${r.awayId-OFFSET}.png`},
   score:{winner:null,duration:'REGULAR',fullTime:s,halfTime:{home:null,away:null}},venue:null};
 });
}

// Fetcher replacing api.football-data.org in local tests and captures.
export function fixtureFetcher(now){
 return async url=>{
  const path=new URL(url).pathname.replace('/v4/','');
  const code=path.split('/')[1],league=Object.entries(CODES).find(([,v])=>v.code===code)?.[0];
  if(!league)return Response.json({message:'Competition not in local fixture set'},{status:403});
  const id=Number(league);
  if(/^competitions\/[A-Z0-9]+$/.test(path))return Response.json({id,name:CODES[id].name,emblem:`https://crests.football-data.org/${code}.png`,currentSeason:{id:9000+id,startDate:'2026-08-01',endDate:'2027-05-31'},seasons:[{id:9000+id,startDate:'2026-08-01',endDate:'2027-05-31'}]});
  if(path.endsWith('/matches'))return Response.json({matches:fixtureMatches(id,now())});
  return Response.json({message:'not in fixture'},{status:404});
 };
}
