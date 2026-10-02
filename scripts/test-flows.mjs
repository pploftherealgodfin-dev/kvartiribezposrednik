import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
try {
  await build({ configFile: false, plugins: [react()], define: { __BASE_PATH__: '"/"' }, resolve: { alias: [
    { find: /^(?:@\/lib\/supabase|\.\/supabase)$/, replacement: resolve('tests/support/backend.ts') },
    { find: '@', replacement: resolve('src') },
  ] }, build: { ssr: 'tests/support/entry.tsx', outDir: '.test-build', emptyOutDir: true, rollupOptions: { output: { entryFileNames: 'entry.mjs' } } }, logLevel: 'warn' });
  const result = spawnSync(process.execPath, ['--test', '--test-timeout=10000', 'tests/functional-flows.test.mjs'], { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'test' } });
  process.exitCode = result.status ?? 1;
} finally { await rm('.test-build', { recursive: true, force: true }); }
