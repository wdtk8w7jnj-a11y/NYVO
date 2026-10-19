import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../public/nyvo.html',import.meta.url),'utf8');

test('aucun lecteur YouTube intégré : ni iframe, ni IFrame API, ni domaine embed',()=>{
 for(const forbidden of ['<iframe','createElement(\'iframe\')','iframe_api','YT.Player','youtube-nocookie','/embed/','onYouTubeIframeAPIReady','video-load-real','Lire dans NYVO'])
  assert.equal(html.includes(forbidden),false,forbidden);
});
test('URL YouTube canonique construite uniquement depuis un identifiant vérifié',()=>{
 const rt={};vm.createContext(rt);vm.runInContext(html.split('\n').find(l=>l.startsWith('function ytWatchUrl(')),rt);
 assert.equal(rt.ytWatchUrl({id:'cfbv7R2jw8E',title:'x'}),'https://www.youtube.com/watch?v=cfbv7R2jw8E');
 for(const id of ['','abc','cfbv7R2jw8E&list=1','../evil/xx','Troyes – Marseille'])assert.equal(rt.ytWatchUrl({id}),null);
 assert.equal(rt.ytWatchUrl(null),null);
});
test('libellé « Information rapportée » absent de toute l’interface',()=>{
 assert.equal(/Information rapport(é|\\xE9)e/i.test(html),false);
});
test('public/nyvo.html contient exactement les sources src/premium.* assemblées',()=>{
 const css=readFileSync(new URL('../src/premium.css',import.meta.url),'utf8').trim(),js=readFileSync(new URL('../src/premium.js',import.meta.url),'utf8').trim();
 assert(html.includes(`<style id="nyvo-premium">\n${css}\n</style>`),'CSS non assemblée : node scripts/assemble-premium.mjs');
 assert(html.includes(`/* NYVO-PREMIUM:BEGIN */\n${js}\n/* NYVO-PREMIUM:END */`),'JS non assemblé : node scripts/assemble-premium.mjs');
});
test('la couche Premium n’appelle aucun fournisseur directement',()=>{
 const js=readFileSync(new URL('../src/premium.js',import.meta.url),'utf8');
 assert.equal(/fetch\(|api\.football-data|googleapis|search\.list/.test(js),false);
});
