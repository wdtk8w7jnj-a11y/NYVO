// Génère les trois infographies Agüero recréées (V36). Sortie : argv[2].
import { writeFileSync, mkdirSync } from 'node:fs';
const out = process.argv[2]; mkdirSync(out, { recursive: true });

const C = { bg:'#08090c', panel:'#121318', panel2:'#181a20', line:'#23252d', line2:'#2e313b',
  ivory:'#f1ece2', muted:'#a8abb7', faint:'#80848f', ruby:'#db1646', rubyInk:'#ff5a7d', rubyDeep:'#5a0f22' };
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const NOTE = 'Version recréée pour NYVO V36 le 21 octobre 2026, avec accord éditorial, d’après les faits et légendes validés de l’article V7. Ce n’est pas le fichier original perdu.';
const head = (w,h,title,desc) => `<svg xmlns="http://www.w3.org/2000/svg" xml:lang="fr" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<metadata>${esc(NOTE)}</metadata>
<rect width="${w}" height="${h}" fill="${C.bg}"/>`;
const kicker = (x,y,txt) => `<g font-family="${SANS}"><rect x="${x}" y="${y-22}" width="28" height="3" fill="${C.ruby}"/><text x="${x+44}" y="${y-12}" fill="${C.rubyInk}" font-size="24" font-weight="700" letter-spacing="3">${esc(txt)}</text></g>`;
const footer = (w,y,txt) => `<g font-family="${SANS}"><path d="M64 ${y-40}H${w-64}" stroke="${C.line}" stroke-width="2"/><text x="64" y="${y}" fill="${C.faint}" font-size="23">${esc(txt)}</text></g>`;

/* 1. Frise : six moments ------------------------------------------------- */
{
  const W=1200, H=1970;
  const M=[
    {t:'20′', ev:'Rooney ouvre le score à Sunderland', city:'0–0', utd:'0–1', ch:'utd', lead:'United'},
    {t:'39′', ev:'Zabaleta place City devant', city:'1–0', utd:'0–1', ch:'city', lead:'City', note:'à la différence de buts'},
    {t:'48′', ev:'Cissé égalise pour QPR', city:'1–1', utd:'0–1', ch:'city', lead:'United'},
    {aside:'Joey Barton est expulsé : QPR joue à dix.'},
    {t:'66′', ev:'Mackie donne l’avantage à QPR', city:'1–2', utd:'0–1', ch:'city', lead:'United'},
    {t:'90+2', ev:'Džeko égalise de la tête', city:'2–2', utd:'0–1', ch:'city', lead:'United', note:'le 2–2 ne suffit pas'},
    {aside:'Bolton–Stoke s’achève sur un nul : QPR est maintenu.', aside2:'Coup de sifflet final à Sunderland : United gagne 1–0.'},
    {t:'93:20', ev:'Agüero : le but du titre', city:'3–2', utd:'0–1', ch:'city', lead:'City', utdEnd:true, final:true, note:'champion'},
  ];
  const sx=104; let y=318, body='';
  const firstY=y;
  const nodes=[];
  for(const m of M){
    if(m.aside){
      const h=m.aside2?118:80;
      body+=`<g font-family="${SANS}"><circle cx="${sx}" cy="${y+30}" r="7" fill="${C.bg}" stroke="${C.faint}" stroke-width="2"/>
<text x="160" y="${y+40}" fill="${C.muted}" font-size="28" font-style="italic">${esc(m.aside)}</text>${m.aside2?`
<text x="160" y="${y+80}" fill="${C.muted}" font-size="28" font-style="italic">${esc(m.aside2)}</text>`:''}</g>`;
      y+=h; continue;
    }
    const top=y, acc=m.final?C.rubyInk:C.ivory;
    nodes.push(top);
    body+=`<g>
<circle cx="${sx}" cy="${top+44}" r="${m.final?17:13}" fill="${m.final?C.ruby:C.bg}" stroke="${m.final?C.ruby:C.ivory}" stroke-width="3"/>
<text x="160" y="${top+66}" font-family="${SANS}" fill="${acc}" font-size="62" font-weight="800" letter-spacing="-1">${esc(m.t)}</text>
<text x="1136" y="${top+28}" text-anchor="end" font-family="${SANS}" fill="${C.faint}" font-size="21" font-weight="700" letter-spacing="3">LEADER PROJETÉ</text>
<text x="1136" y="${top+72}" text-anchor="end" font-family="${SANS}" fill="${m.lead==='City'?C.rubyInk:C.ivory}" font-size="40" font-weight="800">${esc(m.lead)}</text>
${m.note?`<text x="1136" y="${top+106}" text-anchor="end" font-family="${SANS}" fill="${C.muted}" font-size="24">${esc(m.note)}</text>`:''}
<text x="160" y="${top+120}" font-family="${SERIF}" fill="${C.ivory}" font-size="37" font-style="italic">${esc(m.ev)}</text>
<g font-family="${SANS}" font-size="30">
<rect x="160" y="${top+146}" width="452" height="64" rx="10" fill="${m.final?C.rubyDeep:C.panel}" stroke="${m.ch==='city'?C.ruby:C.line2}" stroke-width="${m.ch==='city'?2:1.5}"/>
<text x="184" y="${top+188}" fill="${C.faint}" font-size="20" font-weight="700" letter-spacing="1">ETIHAD</text>
<text x="590" y="${top+189}" text-anchor="end" fill="${C.ivory}"><tspan font-weight="600">City </tspan><tspan font-weight="800" fill="${m.ch==='city'?C.rubyInk:C.ivory}">${esc(m.city)}</tspan><tspan font-weight="600"> QPR</tspan></text>
<rect x="636" y="${top+146}" width="500" height="64" rx="10" fill="${C.panel}" stroke="${m.ch==='utd'?C.ruby:C.line2}" stroke-width="${m.ch==='utd'?2:1.5}"/>
<text x="660" y="${top+188}" fill="${C.faint}" font-size="20" font-weight="700" letter-spacing="1">${m.utdEnd?'TERMINÉ':'SUNDERLAND'}</text>
<text x="1114" y="${top+189}" text-anchor="end" fill="${C.ivory}"><tspan font-weight="600">Sund. </tspan><tspan font-weight="800" fill="${m.ch==='utd'?C.rubyInk:C.ivory}">${esc(m.utd)}</tspan><tspan font-weight="600"> United</tspan></text>
</g></g>`;
    y+=224;
  }
  const lastNode=nodes[nodes.length-1]+44;
  const spine=`<path d="M${sx} ${firstY+44}V${nodes[nodes.length-2]+44}" stroke="${C.line2}" stroke-width="3"/><path d="M${sx} ${nodes[nodes.length-2]+44}V${lastNode}" stroke="${C.ruby}" stroke-width="3"/>`;
  const svg=`${head(W,H,'Dernière journée 2011/12 : le leader provisoire minute par minute',
  'Frise des six moments clés du 13 mai 2012, avec le score de Manchester City–QPR et de Sunderland–Manchester United, et le leader projeté si les scores du moment tiennent. 20e minute, Rooney : City 0–0 QPR, Sunderland 0–1 United, United en tête. 39e, Zabaleta : City 1–0, City en tête à la différence de buts. 48e, Cissé : 1–1, United en tête. Joey Barton est expulsé, QPR à dix. 66e, Mackie : 1–2, United en tête. 90e+2, Džeko : 2–2, United en tête. Bolton–Stoke se termine sur un nul, QPR est maintenu, puis le match de Sunderland s’achève sur la victoire 1–0 de United. 93:20, Agüero : 3–2, City champion.')}
${kicker(64,96,'13 MAI 2012 · DERNIÈRE JOURNÉE')}
<text x="64" y="176" font-family="${SERIF}" fill="${C.ivory}" font-size="58">Six moments, deux stades</text>
<text x="64" y="230" font-family="${SANS}" fill="${C.muted}" font-size="28">Le leader si les scores du moment tiennent.</text>
<path d="M64 270H1136" stroke="${C.line}" stroke-width="2"/>
${spine}
${body}
${footer(W,1930,'Infographie NYVO · sources : Premier League, Manchester City · minutes officielles')}
</svg>
`;
  writeFileSync(`${out}/aguero-title-swing-timeline-v2.svg`, svg);
}

/* 2. Classement final ---------------------------------------------------- */
{
  const W=1200, H=900;
  const rows=[
    {p:1, club:'Manchester City', j:38, gnp:'28-5-5', b:'93–29', d:'+64', pts:89, champ:true},
    {p:2, club:'Manchester United', j:38, gnp:'28-5-5', b:'89–33', d:'+56', pts:89},
  ];
  const cols={p:88, club:136, j:600, gnp:720, b:868, d:1136};
  let t='';
  rows.forEach((r,i)=>{const y=372+i*118;
    t+=`<g font-family="${SANS}">
<rect x="64" y="${y}" width="1072" height="100" rx="12" fill="${r.champ?C.panel2:C.panel}" stroke="${r.champ?C.ruby:C.line2}" stroke-width="${r.champ?2:1.5}"/>
${r.champ?`<rect x="64" y="${y}" width="8" height="100" rx="4" fill="${C.ruby}"/>`:''}
<text x="${cols.p}" y="${y+64}" fill="${r.champ?C.rubyInk:C.muted}" font-size="36" font-weight="800">${r.p}</text>
<text x="${cols.club}" y="${y+(r.champ?52:64)}" fill="${C.ivory}" font-size="36" font-weight="700">${esc(r.club)}</text>
${r.champ?`<text x="${cols.club}" y="${y+84}" fill="${C.rubyInk}" font-size="21" font-weight="700" letter-spacing="3">CHAMPION</text>`:''}
<text x="${cols.j}" y="${y+64}" text-anchor="middle" fill="${C.muted}" font-size="32">${r.j}</text>
<text x="${cols.gnp}" y="${y+64}" text-anchor="middle" fill="${C.muted}" font-size="32">${r.gnp}</text>
<text x="${cols.b}" y="${y+64}" text-anchor="middle" fill="${C.muted}" font-size="32">${r.b}</text>
<text x="1004" y="${y+64}" text-anchor="middle" fill="${r.champ?C.rubyInk:C.ivory}" font-size="36" font-weight="800">${r.d}</text>
<text x="${cols.d-24}" y="${y+64}" text-anchor="end" fill="${C.ivory}" font-size="40" font-weight="800">${r.pts}</text>
</g>`;});
  const bar=(y,label,v,col,txtCol)=>{const w=Math.round(v/64*820);return `<text x="64" y="${y+30}" font-family="${SANS}" fill="${C.muted}" font-size="26" font-weight="600">${label}</text><rect x="230" y="${y+4}" width="${w}" height="34" rx="6" fill="${col}"/><text x="${230+w+16}" y="${y+32}" font-family="${SANS}" fill="${txtCol}" font-size="30" font-weight="800">+${v}</text>`;};
  const svg=`${head(W,H,'Classement final de la Premier League 2011/12 : Manchester City et Manchester United',
  'Classement final, haut du tableau. 1er, Manchester City : 38 matchs, 28 victoires, 5 nuls, 5 défaites, 93 buts marqués, 29 encaissés, différence de buts +64, 89 points, champion. 2e, Manchester United : 38 matchs, 28 victoires, 5 nuls, 5 défaites, 89 buts marqués, 33 encaissés, différence de buts +56, 89 points. À égalité de points, City est champion grâce à sa différence de buts supérieure de huit buts.')}
${kicker(64,96,'PREMIER LEAGUE 2011/12 · CLASSEMENT FINAL')}
<text x="64" y="176" font-family="${SERIF}" fill="${C.ivory}" font-size="56">89 points chacun</text>
<text x="64" y="230" font-family="${SANS}" fill="${C.muted}" font-size="28">La différence de buts donne le titre à Manchester City.</text>
<g font-family="${SANS}" fill="${C.faint}" font-size="21" font-weight="700" letter-spacing="2">
<text x="${cols.club}" y="346">CLUB</text><text x="${cols.j}" y="346" text-anchor="middle">J</text><text x="${cols.gnp}" y="346" text-anchor="middle">G-N-P</text><text x="${cols.b}" y="346" text-anchor="middle">BUTS</text><text x="1004" y="346" text-anchor="middle">DIFF.</text><text x="${cols.d-24}" y="346" text-anchor="end">PTS</text>
</g>
${t}
<text x="64" y="660" font-family="${SANS}" fill="${C.faint}" font-size="21" font-weight="700" letter-spacing="2">DIFFÉRENCE DE BUTS</text>
${bar(680,'City',64,C.ruby,C.rubyInk)}
${bar(740,'United',56,C.line2,C.ivory)}
<path d="M${230+Math.round(56/64*820)} 794V808H${230+820}V794" fill="none" stroke="${C.muted}" stroke-width="2"/>
<text x="${230+Math.round(60/64*820)}" y="836" text-anchor="middle" font-family="${SANS}" fill="${C.ivory}" font-size="24" font-weight="700">8 buts d’écart</text>
<text x="1136" y="880" text-anchor="end" font-family="${SANS}" fill="${C.faint}" font-size="21">Infographie NYVO · source : Premier League</text>
</svg>
`;
  writeFileSync(`${out}/aguero-final-table-v1.svg`, svg);
}

/* 3. Schéma de l’action finale ------------------------------------------- */
{
  const W=1200, H=1400;
  // Demi-terrain schématique, but en haut. Échelle indicative ~15 px/m (non contractuelle).
  const gx=600, gy=380, L=`stroke="${C.ivory}" stroke-opacity=".38" stroke-width="2" fill="none"`;
  const pitch=`<rect x="64" y="${gy}" width="1072" height="640" rx="4" fill="${C.panel}"/>
<g ${L}>
<path d="M64 ${gy}H1136"/>
<rect x="${gx-309}" y="${gy}" width="618" height="252"/>
<rect x="${gx-140}" y="${gy}" width="280" height="84"/>
<path d="M${gx-112} ${gy-1}V${gy-34}H${gx+112}V${gy-1}" stroke-opacity=".7"/>
<path d="M${gx-112} ${gy}h-0" />
<circle cx="${gx}" cy="${gy+168}" r="3" fill="${C.ivory}" fill-opacity=".38" stroke="none"/>
<path d="M${gx-112} ${gy+252}A140 140 0 0 0 ${gx+112} ${gy+252}"/>
</g>
<path d="M64 ${gy+640}h1072" stroke="${C.line2}" stroke-width="2" stroke-dasharray="4 10"/>`;
  const A1={x:640,y:900}, B={x:560,y:690}, A2={x:760,y:665}, T={x:820,y:590}, A3={x:830,y:520}, P={x:gx+100,y:gy+6};
  const player=(p,label,sub,opts={})=>`<g font-family="${SANS}">
<circle cx="${p.x}" cy="${p.y}" r="${opts.r||22}" fill="${C.bg}" stroke="${opts.col||C.ivory}" stroke-width="2.5" ${opts.dash?'stroke-dasharray="5 6"':''}/>
<text x="${p.x+(opts.dx??34)}" y="${p.y+(opts.dy??10)}" ${opts.anchor?`text-anchor="${opts.anchor}"`:''} fill="${opts.col||C.ivory}" font-size="30" font-weight="700">${esc(label)}</text>
${sub?`<text x="${p.x+(opts.dx??34)}" y="${p.y+(opts.dy??10)+32}" ${opts.anchor?`text-anchor="${opts.anchor}"`:''} fill="${C.muted}" font-size="23">${esc(sub)}</text>`:''}
</g>`;
  const step=(p,n)=>`<g font-family="${SANS}"><circle cx="${p.x}" cy="${p.y}" r="19" fill="${C.ruby}"/><text x="${p.x}" y="${p.y+8}" text-anchor="middle" fill="${C.ivory}" font-size="22" font-weight="800">${n}</text></g>`;
  const steps=[
    'Agüero transmet à Balotelli.',
    'Balotelli glisse, mais lui remet le ballon dans la course.',
    'Agüero contourne Taye Taiwo.',
    'Frappe au premier poteau : 3–2 à 93:20.',
  ];
  const svg=`${head(W,H,'93:20 : la combinaison Agüero–Balotelli–Agüero, schéma illustratif',
  'Schéma illustratif, non à l’échelle, de l’action du but du titre de Manchester City contre QPR le 13 mai 2012. 1. Sergio Agüero transmet le ballon à Mario Balotelli. 2. Balotelli glisse mais parvient à lui remettre le ballon dans la course. 3. Agüero contourne le défenseur de QPR Taye Taiwo. 4. Il frappe au premier poteau ; à 93:20, le ballon franchit la ligne, 3–2. Les positions et les trajectoires sont simplifiées.')}
${kicker(64,96,'93:20 · LA DERNIÈRE COMBINAISON')}
<text x="64" y="176" font-family="${SERIF}" fill="${C.ivory}" font-size="56">Agüero, Balotelli, Agüero</text>
<g font-family="${SANS}"><rect x="64" y="212" width="538" height="52" rx="26" fill="none" stroke="${C.ruby}" stroke-width="2"/>
<text x="333" y="247" text-anchor="middle" fill="${C.rubyInk}" font-size="24" font-weight="700" letter-spacing="1">SCHÉMA ILLUSTRATIF, NON À L’ÉCHELLE</text></g>
<text x="64" y="320" font-family="${SANS}" fill="${C.muted}" font-size="26">Positions et trajectoires simplifiées.</text>
${pitch}
<defs>
<marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${C.ivory}"/></marker>
<marker id="ahr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${C.rubyInk}"/></marker>
</defs>
<g fill="none" stroke-linecap="round">
<path d="M${A1.x-8} ${A1.y-24}L${B.x+10} ${B.y+26}" stroke="${C.ivory}" stroke-width="2.5" marker-end="url(#ah)"/>
<path d="M${B.x+26} ${B.y-6}Q${(B.x+A2.x)/2} ${B.y-30} ${A2.x-26} ${A2.y-2}" stroke="${C.ivory}" stroke-width="2.5" marker-end="url(#ah)"/>
<path d="M${A1.x+18} ${A1.y-16}C${A1.x+110} ${A1.y-110} ${A2.x+30} ${A2.y+80} ${A2.x+8} ${A2.y+24}" stroke="${C.muted}" stroke-width="2" stroke-dasharray="3 9"/>
<path d="M${A2.x+22} ${A2.y-12}C${T.x+60} ${T.y+40} ${T.x+60} ${T.y-30} ${A3.x+12} ${A3.y+20}" stroke="${C.ivory}" stroke-width="2.5" stroke-dasharray="10 9" marker-end="url(#ah)"/>
<path d="M${A3.x-16} ${A3.y-16}L${P.x+4} ${P.y+10}" stroke="${C.rubyInk}" stroke-width="4" marker-end="url(#ahr)"/>
</g>
<circle cx="${P.x}" cy="${P.y}" r="9" fill="${C.rubyInk}"/>
${player(A1,'Agüero',null,{dx:34})}
${player(B,'Balotelli','glisse',{anchor:'end',dx:-36})}
${player(A2,'Agüero',null,{anchor:'end',dx:-36,dy:58})}
${player(T,'Taiwo','QPR',{col:C.muted,dash:true,r:20,dx:-34,dy:-30,anchor:'end'})}
${player(A3,'Agüero','frappe',{dx:34,dy:4})}
<text x="730" y="${gy-12}" font-family="${SANS}" fill="${C.rubyInk}" font-size="23" font-weight="700">premier poteau</text>
${step({x:A1.x-60,y:A1.y-60},1)}
${step({x:(B.x+A2.x)/2,y:B.y-58},2)}
${step({x:T.x+96,y:T.y+6},3)}
${step({x:A3.x-20,y:A3.y-82},4)}
<g font-family="${SANS}" font-size="28">
${steps.map((s,i)=>`<g><circle cx="83" cy="${1083+i*58}" r="17" fill="${C.ruby}"/><text x="83" y="${1091+i*58}" text-anchor="middle" fill="${C.ivory}" font-size="20" font-weight="800">${i+1}</text><text x="120" y="${1093+i*58}" fill="${i===3?C.ivory:C.muted}" ${i===3?'font-weight="700"':''}>${esc(s)}</text></g>`).join('\n')}
</g>
<g font-family="${SANS}" font-size="22" fill="${C.faint}">
<path d="M64 1330h40" stroke="${C.ivory}" stroke-width="2.5"/><text x="116" y="1338">passe</text>
<path d="M210 1330h40" stroke="${C.ivory}" stroke-width="2.5" stroke-dasharray="10 9"/><text x="262" y="1338">course balle au pied</text>
<path d="M500 1330h40" stroke="${C.rubyInk}" stroke-width="4"/><text x="552" y="1338">frappe</text>
<text x="1136" y="1378" text-anchor="end">Schéma NYVO · sources : Premier League, Manchester City</text>
</g>
</svg>
`;
  writeFileSync(`${out}/aguero-final-action-schematic-v1.svg`, svg);
}
console.log('ok');
