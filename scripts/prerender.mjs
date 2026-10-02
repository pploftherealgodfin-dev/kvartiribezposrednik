import { build } from 'vite';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { prepareCityContent } from './prepare-city-content.mjs';
import { createRevision, sourceModificationDate } from './page-revisions.mjs';

export async function preparePublicContent() {
  await prepareCityContent();
  await build({ build: { ssr: 'src/entry-catalog.ts', outDir: '.prerender', emptyOutDir: true, rollupOptions: { output: { entryFileNames: 'entry-catalog.mjs' } } } });
  const { publicPaths, getPageMeta, SITE_ORIGIN, getPublicJsonLd, getPublicLastmod, getPublicMarkdown, getLlmsIndex, getPublicSourcePaths } = await import(pathToFileURL(resolve('.prerender/entry-catalog.mjs')).href);
  await writeFile('public/llms.txt', getLlmsIndex());
  return { publicPaths, getPageMeta, SITE_ORIGIN, getPublicJsonLd, getPublicLastmod, getPublicMarkdown, getLlmsIndex, getPublicSourcePaths };
}

export async function prerenderPublicSite(catalog, outDir = 'out') {
  const { publicPaths, getPageMeta, SITE_ORIGIN, getPublicJsonLd, getPublicLastmod, getPublicMarkdown, getPublicSourcePaths } = catalog;
  await build({ build: { ssr: 'src/entry-server.tsx', outDir: '.prerender', emptyOutDir: false, rollupOptions: { output: { entryFileNames: 'entry-server.mjs' } } } });
  const { render } = await import(pathToFileURL(resolve('.prerender/entry-server.mjs')).href);
  const template = await readFile(`${outDir}/index.html`, 'utf8');
  const defaultSocialImage = template.match(/<meta property="og:image" content="([^"]+)"\s*\/?>/)?.[1]?.replace(/&amp;/g, '&');
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const json = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const clean = template.replace(/<title>[^<]*<\/title>/g, '').replace(/<meta\s+(?:name|property)="(?:description|robots|og:[^"]+|twitter:[^"]+)"[^>]*>/g, '').replace(/<link\s+rel="canonical"[^>]*>/g, '').replace(/<link\s+rel="alternate"[^>]*>/g, '');
  let previousRevisions = {};
  try { previousRevisions = JSON.parse(await readFile('public/data/page-revisions.json', 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const revisions = {};
  let markdownCount = 0;
  for (const path of [...publicPaths, '/404']) {
    const meta = getPageMeta(path);
    const socialImage = meta.ogImage ?? defaultSocialImage;
    const canonical = `${SITE_ORIGIN}${meta.canonicalPath}`;
    const content = await render(path);
    const data = getPublicJsonLd(path);
    if (path !== '/404') {
      const mainContent = content.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
      if (!mainContent) throw new Error(`Missing main content: ${path}`);
      const previous = previousRevisions[path];
      // Dates are sourced from content history, never shifted backwards for rankings.
      const sourceDate = await sourceModificationDate(getPublicSourcePaths(path));
      const editorialDate = getPublicLastmod(path);
      const date = !previous && editorialDate ? editorialDate : sourceDate ?? editorialDate ?? previous?.lastmod;
      revisions[path] = createRevision(mainContent, previous, date);
    }
    const head = [
      `<title>${escape(meta.title)}</title>`,
      `<meta name="description" content="${escape(meta.description)}">`,
      `<meta name="robots" content="${escape(meta.robots)}">`,
      `<link rel="canonical" href="${escape(canonical)}">`,
      `<meta property="og:title" content="${escape(meta.title)}">`,
      `<meta property="og:description" content="${escape(meta.description)}">`,
      `<meta property="og:url" content="${escape(canonical)}">`,
      `<meta property="og:type" content="${meta.ogType ?? 'website'}">`,
      `<meta property="og:locale" content="bg_BG">`,
      `<meta property="og:site_name" content="Квартири без посредник">`,
      `<meta name="twitter:card" content="${socialImage ? 'summary_large_image' : 'summary'}">`,
      `<meta name="twitter:title" content="${escape(meta.title)}">`,
      `<meta name="twitter:description" content="${escape(meta.description)}">`,
      ...(socialImage ? [`<meta property="og:image" content="${escape(socialImage)}">`, `<meta name="twitter:image" content="${escape(socialImage)}">`] : []),
      ...(meta.markdownPath ? [`<link rel="alternate" type="text/markdown" href="${SITE_ORIGIN}${meta.markdownPath}">`] : []),
      ...(data.length ? [`<script id="ld-prerender" type="application/ld+json">${json(data)}</script>`] : []),
    ].join('');
    const output = path === '/404' ? `${outDir}/404.html` : resolve(outDir, `.${path}`, 'index.html');
    await mkdir(dirname(output), { recursive: true });
    // Avoid hydrating the home page when a host serves it as an SPA fallback.
    const html = clean.replace('</head>', `${head}</head>`).replace('<div id="root"></div>', `<div id="root" data-prerender-path="${escape(path)}">${content}</div>`);
    await writeFile(output, html);
    const markdown = getPublicMarkdown(path);
    if (markdown) {
      await writeFile(resolve(outDir, `.${meta.markdownPath}`), markdown);
      markdownCount++;
    }
  }
  // Fallback shell stays noindex until an actual public listing is successfully loaded.
  await writeFile(`${outDir}/spa.html`, template);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicPaths.filter(path => getPageMeta(path).robots.startsWith('index')).map(path => {
    const modified = revisions[path]?.lastmod;
    return `  <url><loc>${escape(`${SITE_ORIGIN}${path}`)}</loc>${modified ? `<lastmod>${escape(modified)}</lastmod>` : ''}</url>`;
  }).join('\n')}\n</urlset>\n`;
  await writeFile(`${outDir}/sitemap.xml`, sitemap);
  // Keep this available to hosts that run the standard Vite asset-copy build.
  await writeFile('public/sitemap.xml', sitemap);
  const manifest = `${JSON.stringify(revisions, null, 2)}\n`;
  await writeFile('public/data/page-revisions.json', manifest);
  await writeFile(`${outDir}/data/page-revisions.json`, manifest);
  // Vite copies public/robots.txt; do not replace the reviewed source with a second policy.
  const robots = await readFile('public/robots.txt', 'utf8');
  if (!robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`)) throw new Error('robots.txt sitemap origin mismatch');
  if (await readFile(`${outDir}/robots.txt`, 'utf8') !== robots) throw new Error('robots.txt was not copied faithfully');
  await rm('.prerender', { recursive: true, force: true });
  console.log(`Prerendered ${publicPaths.length} public pages and 404; ${markdownCount} public Markdown versions. No database access during build.`);
}

if (process.argv[2] === 'prepare') await preparePublicContent();
else if (process.argv[2] === 'render') {
  const catalog = await import(pathToFileURL(resolve('.prerender/entry-catalog.mjs')).href);
  await prerenderPublicSite(catalog, process.argv[3]);
} else throw new Error('Expected prepare or render phase');
