// Construit dist/nyvo.html : un seul fichier autonome (JS, CSS et police intégrés),
// utilisable hors serveur (ouverture directe du fichier) ou sur n'importe quel hébergement statique.
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const root = new URL('../app/', import.meta.url);
const out = new URL('../dist/', import.meta.url);

const js = await build({
  entryPoints: [new URL('src/main.js', root).pathname],
  bundle: true,
  format: 'iife',
  target: ['es2020', 'safari15'],
  minify: true,
  write: false,
  legalComments: 'none',
});

const font = (await readFile(new URL('assets/fonts/inter-latin-var.woff2', root))).toString('base64');
let css = '';
for (const f of ['base.css', 'components.css', 'screens.css']) css += await readFile(new URL(`styles/${f}`, root), 'utf8');
css = css.replace("url('../assets/fonts/inter-latin-var.woff2')", `url(data:font/woff2;base64,${font})`);

let html = await readFile(new URL('index.html', root), 'utf8');
const code = js.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
html = html
  .replace(/<!--styles-->[\s\S]*<!--\/styles-->/, () => `<style>${css}</style>`)
  .replace(/<!--script-->[\s\S]*<!--\/script-->/, () => `<script>${code}</script>`);

await mkdir(out, { recursive: true });
await writeFile(new URL('nyvo.html', out), html);
console.log(`dist/nyvo.html — ${(html.length / 1024).toFixed(0)} Ko`);
