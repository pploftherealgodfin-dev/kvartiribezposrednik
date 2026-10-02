import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { calculateRentalBudget } from '../src/lib/rentalBudget.ts';
import { createRevision } from '../scripts/page-revisions.mjs';
const read = path => readFileSync(resolve(path), 'utf8');
const catalog = JSON.parse(read('public/data/national-catalog.json'));
const revisions = JSON.parse(read('public/data/page-revisions.json'));
const paths = Object.keys(revisions);
const origin = 'https://kvartiribezposrednik.com';
const decode = value => value.replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const normalize = value => decode(value.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
const cityPath = city => `/kvartiri-bez-posrednik/${city.slug}`;
const htmlFor = path => read(`out${path === '/' ? '' : path}/index.html`);
const ready = city => catalog.universities.some(item => item.citySlug === city.slug) || catalog.neighborhoods.filter(item => item.citySlug === city.slug && item.associationMethod !== 'nearest_town_approximate').length >= 3;
const urls = [...read('out/sitemap.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map(match => decode(match[1]));

test('276 public pages have unique metadata, one H1 and initial structured data', () => {
  assert.equal(paths.length, 276);
  const titles = new Set(), canonicals = new Set();
  for (const path of paths) {
    const html = htmlFor(path);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, path);
    assert.equal((html.match(/<title>/g) ?? []).length, 1, path);
    assert.equal((html.match(/<meta name="description"/g) ?? []).length, 1, path);
    const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
    assert(title && !titles.has(title), `Duplicate title: ${path}`); titles.add(title);
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    assert.equal(canonical, origin + path); assert(!canonicals.has(canonical)); canonicals.add(canonical);
    const graph = JSON.parse(html.match(/<script id="ld-prerender" type="application\/ld\+json">(.*?)<\/script>/s)?.[1]);
    assert(Array.isArray(graph) && graph.length, path);
    const main = normalize(html.match(/<main\b[^>]*>(.*?)<\/main>/s)?.[1] ?? '');
    for (const entity of graph.filter(item => item['@type'] === 'FAQPage')) for (const question of entity.mainEntity) {
      assert(main.includes(normalize(question.name)), `FAQ question absent from HTML: ${path}`);
      assert(main.includes(normalize(question.acceptedAnswer.text)), `FAQ answer absent from HTML: ${path}`);
    }
  }
});

test('all 257 towns are crawlable from the HTML directory; Byala URLs are distinct', () => {
  const html = htmlFor('/kvartiri-bez-posrednik');
  const links = new Set([...html.matchAll(/href="(\/kvartiri-bez-posrednik\/[^"?#]+)"/g)].map(match => match[1]));
  assert.equal(links.size, 257);
  for (const city of catalog.cities) assert(links.has(cityPath(city)), city.slug);
  assert(normalize(htmlFor('/kvartiri-bez-posrednik/byala-varna')).includes('Област Варна'));
  assert(normalize(htmlFor('/kvartiri-bez-posrednik/byala-ruse')).includes('Област Русе'));
});

test('sitemap includes only content-ready pages and accurate stable lastmod values', () => {
  const expected = paths.filter(path => !path.startsWith('/kvartiri-bez-posrednik/') || ready(catalog.cities.find(city => cityPath(city) === path)));
  assert.equal(urls.length, 74); assert.equal(new Set(urls).size, urls.length);
  assert.deepEqual(new Set(urls), new Set(expected.map(path => origin + path)));
  for (const match of read('out/sitemap.xml').matchAll(/<url><loc>(.*?)<\/loc><lastmod>(.*?)<\/lastmod><\/url>/g)) {
    const path = decode(match[1]).slice(origin.length);
    assert.equal(match[2], revisions[path].lastmod);
    assert(match[2] <= new Date().toISOString().slice(0, 10));
  }
  assert.equal((read('out/sitemap.xml').match(/<lastmod>/g) ?? []).length, urls.length);
  for (const city of catalog.cities) assert(htmlFor(cityPath(city)).includes(`content="${ready(city) ? 'index, follow' : 'noindex, follow'}"`), city.slug);
  assert(read('out/404.html').includes('content="noindex, follow"'));
  assert(read('out/spa.html').includes('content="noindex, follow"'));
  assert(!urls.some(url => /(?:tarsene|panel|vhod|nastroyki|saobshteniya|lyubimi|kachi-obiava|\.md|404)/.test(url)));
});

test('local filters remain inside the selected town and approximate areas are explicit', () => {
  for (const city of catalog.cities) {
    const html = htmlFor(cityPath(city));
    const markdown = read(`out${cityPath(city)}/index.md`);
    for (const area of catalog.neighborhoods.filter(item => item.citySlug === city.slug)) {
      assert(html.includes(`/tarsene?grad=${city.slug}&amp;kvartal=${area.slug}`), `${city.slug}/${area.slug}`);
      assert(html.includes(`data-association="${area.associationMethod}"`));
      assert(markdown.includes(`${origin}/tarsene?grad=${city.slug}&kvartal=${area.slug}`));
      if (area.associationMethod === 'nearest_town_approximate') {
        assert(html.includes('Приблизителна връзка с града')); assert(markdown.includes('### Приблизително свързани райони'));
      }
    }
    for (const school of catalog.universities.filter(item => item.citySlug === city.slug)) {
      assert(html.includes(`/tarsene?grad=${city.slug}&amp;universitet=${school.slug}`));
      assert(html.includes(decode(school.sourceUrl).replace(/&/g, '&amp;')));
      assert(markdown.includes(school.sourceUrl));
    }
    if (city.lat == null) { assert(!html.includes('Градска точка:')); assert(markdown.includes('Няма проверена градска координата')); }
    assert(!html.includes('<iframe'), 'External map should load only after visitor action');
  }
});

test('269 Markdown alternates and the llms index resolve to public artifacts', () => {
  let count = 0;
  for (const path of paths) {
    const alternate = htmlFor(path).match(/<link rel="alternate" type="text\/markdown" href="([^"]+)"/);
    if (!alternate) continue;
    const filename = alternate[1].slice(origin.length);
    assert(existsSync(`out${filename}`), filename);
    assert(read(`out${filename}`).startsWith('# ')); count++;
  }
  assert.equal(count, 269);
  assert.equal(read('public/llms.txt'), read('out/llms.txt'));
  assert.equal(read('public/robots.txt'), read('out/robots.txt'));
  const index = read('out/llms.txt');
  for (const match of index.matchAll(/\]\(https:\/\/kvartiribezposrednik\.com(\/[^)]*\.md)\)/g)) assert(existsSync(`out${match[1]}`), match[1]);
  assert.equal((read('out/kvartiri-bez-posrednik/index.md').match(/\/index\.md\)/g) ?? []).length, 257);
  assert(index.includes('не са официален изчерпателен регистър'));
  assert(!index.includes('BGN')); assert(index.includes('не гарантира липса на измама'));
});

test('all original city, guide and directory photographs retain their credits', () => {
  let photos = 0;
  const literal = (s, field) => s.match(new RegExp(`${field}:\\s*'([^']+)'`))?.[1];
  for (const file of readdirSync('src/pages/cities/data').filter(name => name.endsWith('.ts') && !['types.ts','index.ts','localCatalog.ts','photos.ts','rentalNotes.ts','structuredData.ts'].includes(name))) {
    const source = read(`src/pages/cities/data/${file}`), image = literal(source, 'heroImage');
    if (!image) continue;
    const html = htmlFor(`/kvartiri-bez-posrednik/${literal(source,'slug')}`);
    assert(html.includes(image)); assert(normalize(html).includes(literal(source, 'heroImageCredit'))); photos++;
  }
  for (const file of readdirSync('src/pages/guides/data').filter(name => !['types.ts','index.ts'].includes(name))) {
    const source = read(`src/pages/guides/data/${file}`), image = literal(source, 'heroImage');
    if (!image) continue;
    const html = htmlFor(`/saveti/${literal(source,'slug')}`);
    assert(html.includes(image)); assert(normalize(html).includes(literal(source, 'heroImageCredit'))); photos++;
  }
  assert(htmlFor('/kvartiri-bez-posrednik').includes('Varna_Panorama.jpg')); photos++;
  assert.equal(photos, 18);
});

test('a repeated build preserves dates while changed content requires a real date', () => {
  const previous = createRevision('Local content', undefined, '2026-10-01');
  assert.deepEqual(createRevision('Local content', previous, '2026-10-02'), previous);
  const changed = createRevision('Updated local content', previous, '2026-10-02');
  assert.equal(changed.lastmod, '2026-10-02'); assert.notEqual(changed.contentHash, previous.contentHash);
  assert.throws(() => createRevision('Changed', previous, undefined));
});

test('budget arithmetic handles Bulgarian decimals, zero costs and invalid input', () => {
  assert.deepEqual(calculateRentalBudget({ rent:'450,50', bills:'80', deposit:'450.50', moving:'0' }), {monthly:530.5, initial:981});
  assert.deepEqual(calculateRentalBudget({ rent:'0', bills:'0', deposit:'0', moving:'0' }), {monthly:0, initial:0});
  for (const value of ['', '-1', 'Infinity', '1e5', '12.001', '1 000', '1000001']) assert.equal(calculateRentalBudget({rent:value,bills:'0',deposit:'0',moving:'0'}),null);
});


test('all internal links resolve to a route, with valid section anchors', () => {
  const routes = [...read('src/router/config.tsx').matchAll(/path:\s*['"]([^'"]+)['"]/g)].map(match => new RegExp('^' + match[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:[^/]+/g, '[^/]+') + '/?$'));
  for (const path of paths) {
    const html = htmlFor(path);
    for (const match of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
      const url = new URL(decode(match[1]), origin + path);
      if (url.origin !== origin) continue;
      assert(existsSync(`out${url.pathname}`) || routes.some(route => route.test(url.pathname)), `Unmatched link ${url.pathname} on ${path}`);
      if (url.hash && url.pathname === path) assert(html.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `Missing anchor ${url.hash} on ${path}`);
    }
  }
});
