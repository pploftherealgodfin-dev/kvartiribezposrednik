import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { JSDOM } from 'jsdom';

const read = path => readFileSync(path, 'utf8');
const manifest = JSON.parse(read('out/.vite/manifest.json'));
function staticKeys(entry) {
  const keys = new Set();
  const visit = key => { if (keys.has(key)) return; assert.ok(manifest[key], key); keys.add(key); (manifest[key].imports ?? []).forEach(visit); };
  visit(entry); return keys;
}
const initial = staticKeys('index.html');
const size = keys => [...keys].reduce((total, key) => total + gzipSync(readFileSync('out/' + manifest[key].file)).byteLength, 0);

test('public bundles keep initial JS and home hydration inside release budgets', () => {
  const home = new Set([...initial, ...staticKeys('src/pages/home/page.tsx')]);
  assert.ok(size(initial) < 170 * 1024, 'Initial JS exceeds 170 KiB gzip');
  assert.ok(size(home) < 205 * 1024, 'Home JS exceeds 205 KiB gzip');
  for (const path of ['src/pages/panel/owner/components/PhotoPicker.tsx', 'src/pages/panel/owner/components/ListingForm.tsx', 'src/pages/panel/owner/components/EditListingForm.tsx', 'src/pages/panel/owner/components/ListingPhotosManager.tsx', 'src/pages/home/components/LatestListingsData.tsx']) {
    assert.equal(manifest[path]?.isDynamicEntry, true, path);
    assert.equal(initial.has(path), false, path);
    assert.equal(home.has(path), false, path);
  }
});
test('every emitted HTML page has a compatible CSP, private referrer policy and no inline executable scripts', () => {
  const paths = Object.keys(JSON.parse(read('public/data/page-revisions.json')));
  const files = [...paths.map(path => 'out' + (path === '/' ? '' : path) + '/index.html'), 'out/spa.html', 'out/404.html'];
  for (const file of files) {
    const dom = new JSDOM(read(file)), doc = dom.window.document;
    const meta = doc.querySelector('meta[http-equiv="Content-Security-Policy"]');
    assert.ok(meta, file); assert.equal(doc.querySelectorAll('meta[http-equiv="Content-Security-Policy"]').length,1,file); const policy = meta.content;
    assert.ok(policy.includes("script-src 'self'"), file); assert.ok(policy.includes("object-src 'none'"), file);
    assert.ok(policy.includes("base-uri 'none'"), file); assert.ok(!policy.includes('unsafe-eval'), file);
    assert.equal(doc.querySelector('meta[name="referrer"]').content, 'no-referrer', file);
    assert.ok(doc.head.children[0].getAttribute('charset'), file);
    assert.equal(doc.head.children[1], meta, file);
    const permittedImages = policy.match(/(?:^|;\s*)img-src ([^;]+)/)[1].split(' ');
    for (const image of doc.querySelectorAll('img[src]')) {
      const url = new URL(image.getAttribute('src'), 'https://kvartiribezposrednik.com');
      assert.ok(url.origin === 'https://kvartiribezposrednik.com' || permittedImages.includes(url.origin) || permittedImages.includes(url.protocol), file + ': ' + url.origin);
    }
    for (const script of doc.scripts) assert.ok(script.src || script.type === 'application/ld+json', file);
    assert.equal(doc.querySelector('link[rel="stylesheet"][href^="https://"]'), null, file);
    dom.window.close();
  }
});
test('fonts remain same-origin WOFF2 files and the selected icon font stays under 8 KiB', () => {
  const font = readFileSync('src/assets/remixicon-subset.woff2');
  assert.equal(font.subarray(0, 4).toString(), 'wOF2'); assert.ok(font.length < 8192);
  const css = manifest['index.html'].css.map(path => read('out/' + path)).join('\n');
  assert.ok(!css.includes('fonts.googleapis.com')); assert.ok(!css.includes('cdnjs.cloudflare.com'));
  assert.ok(!/url\(["']?data:(?:font|application\/font)/.test(css), 'CSP would block an inlined font');
  const file = css.match(/url\(["']?(\/assets\/remixicon-subset-[^"')]+\.woff2)/)?.[1];
  assert.ok(file, 'The small icon font must be emitted, not inlined'); assert.ok(existsSync('out' + file));
  assert.equal(readFileSync('out' + file).length, font.length);
});
test('a service key aborts the real Vite build before touching public output or printing that key', () => {
  const file = 'out/' + manifest['index.html'].file, before = readFileSync(file);
  const secretFixture = 'sb_secret_NEVER_INCLUDE_THIS_IN_PUBLIC_ASSETS';
  const result = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], {
    encoding: 'utf8', timeout: 15000,
    env: { ...process.env, VITE_PUBLIC_SUPABASE_URL: 'https://build-only.example.invalid', VITE_PUBLIC_SUPABASE_ANON_KEY: secretFixture },
  });
  assert.ok(!result.error, String(result.error)); assert.notEqual(result.status, 0);
  assert.match(result.stderr + result.stdout, /секретните ключове са забранени/);
  assert.ok(!(result.stderr + result.stdout).includes(secretFixture));
  assert.deepEqual(readFileSync(file), before);
});
test('the home social card retains the current Readdy logo while city imagery remains specific', () => {
  const source = new JSDOM(read('index.html')), home = new JSDOM(read('out/index.html')), city = new JSDOM(read('out/kvartiri-bez-posrednik/varna/index.html'));
  assert.equal(home.window.document.querySelector('meta[property="og:image"]').content, source.window.document.querySelector('meta[property="og:image"]').content);
  assert.notEqual(city.window.document.querySelector('meta[property="og:image"]').content, home.window.document.querySelector('meta[property="og:image"]').content);
  source.window.close(); home.window.close(); city.window.close();
});
test('the source home is indexable and protected while the utility fallback stays noindex', () => {
  const source=new JSDOM(read('index.html')),fallback=new JSDOM(read('out/spa.html'));
  assert.equal(source.window.document.querySelector('meta[name="robots"]').content,'index, follow');
  assert.equal(source.window.document.querySelector('meta[property="og:locale"]').content,'bg_BG');
  assert.equal(source.window.document.querySelector('link[rel="canonical"]').href,'https://kvartiribezposrednik.com/');
  assert.ok(source.window.document.querySelector('meta[http-equiv="Content-Security-Policy"]'));
  assert.equal(fallback.window.document.querySelector('meta[name="robots"]').content,'noindex, follow');
  assert.equal(fallback.window.document.querySelector('link[rel="canonical"]'),null);
  source.window.close();fallback.window.close();
});
test('Organization identity and social links are consistent in the visible public pages and machine-readable content',()=>{
  const urls=['https://www.facebook.com/profile.php?id=61595029650181','https://www.instagram.com/kvartiribezposrednik/'];
  for(const file of ['out/index.html','out/za-nas/index.html']){
    const dom=new JSDOM(read(file)),doc=dom.window.document;
    const schema=JSON.parse(doc.getElementById('ld-prerender').textContent).find(item=>item['@type']==='Organization');
    assert.ok(schema,file);assert.deepEqual(schema.sameAs,urls);assert.equal(schema['@id'],'https://kvartiribezposrednik.com/#organization');
    for(const url of urls)assert.ok([...doc.querySelectorAll('a')].some(link=>link.href===url),file+': '+url);
    dom.window.close();
  }
  for(const url of urls)assert.ok(read('out/llms.txt').includes(url));
  assert.ok(read('out/llms.txt').includes('една текуща обява на акаунт'));
});
