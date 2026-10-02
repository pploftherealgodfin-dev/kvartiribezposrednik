import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

// Some hosts invoke `vite build` directly. Both build entry points must emit
// the reviewed public HTML, sitemap and Markdown, rather than only the SPA shell.
export function publicSeoPlugin(): Plugin {
  let root = '';
  let outDir = '';
  let failed = false;
  const run = (phase: 'prepare' | 'render') => new Promise<void>((accept, reject) => {
    // Isolate SSR builds from the client's native bundler lifecycle.
    const child = spawn(process.execPath, [resolve(root, 'scripts/prerender.mjs'), phase, outDir], { cwd: root, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) => code === 0 ? accept() : reject(new Error(`Public ${phase} failed (${signal ?? code})`)));
  });
  return {
    name: 'public-seo',
    // Catalogue and rendering builds load this config too; never recurse.
    apply: (_config, { command, isSsrBuild }) => command === 'build' && !isSsrBuild,
    configResolved(config) {
      root = config.root;
      outDir = resolve(root, config.build.outDir);
    },
    async buildStart() {
      await run('prepare');
    },
    buildEnd(error) {
      failed = Boolean(error);
    },
    async closeBundle() {
      if (!failed) await run('render');
    },
  };
}
