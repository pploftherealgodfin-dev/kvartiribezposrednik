/** Reject privileged credentials before Vite can include them in public assets. */
export function validatePublicSupabaseConfig(url: string, key: string, allowLocal = false): string {
  let parsed: URL;
  try { parsed = new URL(url); } catch { throw new Error('Липсва валиден публичен Supabase URL.'); }
  const local = allowLocal && ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  if ((parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:')) || parsed.username || parsed.password || parsed.search || parsed.hash || (parsed.pathname !== '/' && parsed.pathname !== '')) {
    throw new Error('Supabase URL трябва да е HTTPS адрес без идентификационни данни.');
  }
  if (!key || key.startsWith('sb_secret_')) throw new Error('Фронтендът изисква публичен Supabase ключ; секретните ключове са забранени.');
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return parsed.origin;
  try {
    const parts = key.split('.');
    if (parts.length !== 3) throw new Error();
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')));
    if (claims.role !== 'anon') throw new Error();
    return parsed.origin;
  } catch {
    throw new Error('Разрешени са само publishable или anon ключове. service_role и потребителски токени не се включват във фронтенда.');
  }
}
