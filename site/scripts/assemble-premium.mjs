// Injecte src/premium.css et src/premium.js dans public/nyvo.html (idempotent).
// public/nyvo.html reste le fichier servi tel quel par app/route.ts.
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('..',import.meta.url);
const file=new URL('public/nyvo.html',root);
const css=readFileSync(new URL('src/premium.css',root),'utf8').trim();
const js=readFileSync(new URL('src/premium.js',root),'utf8').trim().replace(/<\/script/gi,'<\\/script');
let html=readFileSync(file,'utf8');
const style=`<style id="nyvo-premium">\n${css}\n</style>`;
const script=`/* NYVO-PREMIUM:BEGIN */\n${js}\n/* NYVO-PREMIUM:END */\n`;
html=/<style id="nyvo-premium">[\s\S]*?<\/style>/.test(html)?html.replace(/<style id="nyvo-premium">[\s\S]*?<\/style>/,()=>style):html.replace('</head>',()=>style+'\n</head>');
html=/\/\* NYVO-PREMIUM:BEGIN \*\/[\s\S]*?\/\* NYVO-PREMIUM:END \*\/\n/.test(html)?html.replace(/\/\* NYVO-PREMIUM:BEGIN \*\/[\s\S]*?\/\* NYVO-PREMIUM:END \*\/\n/,()=>script):html.replace('\nye("replace");window.__nyvo=',()=>'\n'+script+'ye("replace");window.__nyvo=');
if(!html.includes('NYVO-PREMIUM:BEGIN')||!html.includes('id="nyvo-premium"'))throw new Error('injection impossible');
writeFileSync(file,html);
console.log('public/nyvo.html assemblé ('+(html.length/1024|0)+' Ko)');
