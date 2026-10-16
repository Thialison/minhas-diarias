// Ajustes depois do "expo export" para publicar no GitHub Pages:
// - prefixa os links do PWA com o caminho do repositório (ex.: /diarias);
// - cria o 404.html (o GitHub Pages usa ele para abrir as telas internas, ex.: /diarias/calendario);
// - cria o .nojekyll (sem ele o GitHub ignora a pasta _expo).
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';

const app = JSON.parse(readFileSync('app.json', 'utf8'));
const base = (app.expo.experiments?.baseUrl ?? '').replace(/\/$/, '');
const arquivo = 'dist/index.html';

let html = readFileSync(arquivo, 'utf8');
for (const caminho of ['/manifest.json', '/apple-touch-icon.png', '/sw.js']) {
  html = html.replaceAll(`"${caminho}"`, `"${base}${caminho}"`).replaceAll(`'${caminho}'`, `'${base}${caminho}'`);
}
writeFileSync(arquivo, html);
copyFileSync(arquivo, 'dist/404.html');
writeFileSync('dist/.nojekyll', '');
console.log(`pos-build: caminho base "${base || '/'}", 404.html e .nojekyll criados`);
