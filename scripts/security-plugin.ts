import type { Plugin } from 'vite';
import { validatePublicSupabaseConfig } from '../src/lib/publicSupabaseConfig';

export function clientSecurityPlugin(): Plugin {
  let origin = '';
  return {
    name: 'public-client-security',
    apply: 'build',
    configResolved(config) {
      origin = validatePublicSupabaseConfig(config.env.VITE_PUBLIC_SUPABASE_URL, config.env.VITE_PUBLIC_SUPABASE_ANON_KEY);
    },
    transformIndexHtml: { order: 'pre', handler(html) {
      // Meta CSP also reaches hosts without configurable response headers.
      // frame-ancestors and HSTS require real hosting headers; see release docs.
      const policy = [
        "default-src 'none'", "base-uri 'none'", "object-src 'none'",
        "script-src 'self'", "script-src-attr 'none'",
        "style-src 'self' 'unsafe-inline'", "font-src 'self'",
        `img-src 'self' data: blob: ${origin} https://readdy.ai https://storage.helloreaddy.io https://thumb.wikimedia.org https://upload.wikimedia.org`,
        `connect-src 'self' ${origin} ${origin.replace('https:', 'wss:')} https://readdy.ai`,
        "frame-src https://www.openstreetmap.org", "form-action 'self'", "worker-src 'self'",
      ].join('; ');
      const clean = html.replace(/<meta\s+http-equiv="Content-Security-Policy"[^>]*>/gi, '');
      return clean.replace(/<meta charset="UTF-8"\s*\/?>/i, match => match + '\n    <meta http-equiv="Content-Security-Policy" content="' + policy + '" />');
    } },
  };
}
