import { build } from 'vite';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
await build();
await build({ build: { ssr: 'src/entry-server.tsx', outDir: '.prerender', emptyOutDir: true, rollupOptions: { output: { entryFileNames: 'entry-server.mjs' } } } });
const { render } = await import(pathToFileURL(resolve('.prerender/entry-server.mjs')).href);
await build({ build: { ssr: 'src/entry-catalog.ts', outDir: '.prerender', emptyOutDir: false, rollupOptions: { output: { entryFileNames: 'entry-catalog.mjs' } } } });
const { publicPaths, getPageMeta, SITE_ORIGIN } = await import(pathToFileURL(resolve('.prerender/entry-catalog.mjs')).href);
const template = await readFile('out/index.html', 'utf8');
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
for (const path of [...publicPaths, '/404']) {
  const meta = getPageMeta(path);
  const content = await render(path);
  const clean = template.replace(/<title>[^<]*<\/title>/g, '').replace(/<meta\s+(?:name|property)="(?:description|robots|og:[^"]+|twitter:[^"]+)"[^>]*>/g, '').replace(/<link\s+rel="canonical"[^>]*>/g, '');
  const head = `<title>${escape(meta.title)}</title><meta name="description" content="${escape(meta.description)}"><meta name="robots" content="${meta.robots}"><link rel="canonical" href="${SITE_ORIGIN}${path}"><meta property="og:title" content="${escape(meta.title)}"><meta property="og:description" content="${escape(meta.description)}"><meta property="og:url" content="${SITE_ORIGIN}${path}"><meta property="og:type" content="${path.startsWith('/saveti/') ? 'article' : 'website'}"><meta property="og:locale" content="bg_BG"><meta name="twitter:card" content="summary">`;
  const output = path === '/404' ? 'out/404.html' : resolve('out', `.${path}`, 'index.html');
  await mkdir(dirname(output), { recursive: true });
  // Record route to avoid hydrating the homepage when the host serves it as an SPA fallback.
  const html = clean.replace('</head>', `${head}</head>`).replace('<div id="root"></div>', `<div id="root" data-prerender-path="${escape(path)}">${content}</div>`);
  await writeFile(output, html);
}
// Dynamic routes must use this shell, never the prerendered homepage.
await writeFile('out/spa.html', template);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicPaths.map(path => `<url><loc>${SITE_ORIGIN}${path}</loc></url>`).join('')}</urlset>\n`;
await writeFile('out/sitemap.xml', sitemap);
await writeFile('out/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`);
await rm('.prerender', { recursive: true, force: true });
console.log(`Prerendered ${publicPaths.length} public pages and 404. No database access during build.`);
