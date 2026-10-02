// Само публични географски каталози. Профили, обяви, контакти и сесии не се кешират тук.
const cache = new Map<string, { until: number; promise: Promise<unknown> }>();
export function referenceCache<T>(key: string, load: () => Promise<T>): Promise<T> {
  const old = cache.get(key);
  if (old && old.until > Date.now()) return old.promise as Promise<T>;
  const promise = load().catch(error => { if (cache.get(key)?.promise === promise) cache.delete(key); throw error; });
  cache.set(key,{until:Date.now()+5*60*1000,promise});
  return promise;
}
