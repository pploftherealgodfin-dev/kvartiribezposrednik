import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '@/components/feature/SiteLayout';
import ListingCard from '@/components/feature/ListingCard';
import { useFavorites } from '@/hooks/useFavorites';
import { repository } from '@/lib/repository';
import type { ListingView } from '@/lib/types';

export default function FavoritesPage() {
  const { favoriteIds, loading: idsLoading, error: idsError, reload } = useFavorites();
  const [items, setItems] = useState<ListingView[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const pageSize = 18;
  const pages = Math.max(1, Math.ceil(favoriteIds.length / pageSize));
  const current = Math.min(page, pages);
  useEffect(() => {
    let live = true;
    setLoading(true); setError(false);
    repository.getListingViewsByIds(favoriteIds.slice((current - 1) * pageSize, current * pageSize))
      .then(rows => { if (live) setItems(rows); })
      .catch(() => { if (live) setError(true); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [favoriteIds, current, retry]);
  return <SiteLayout><div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
    <h1 className="font-heading text-3xl font-bold">Любими обяви</h1>
    <p className="mt-3 text-foreground-600">Жилищата, които си запазил. Оттеглените и изтеклите обяви може вече да не са достъпни.</p>
    <Link to="/tarsene" className="mt-4 inline-block text-primary-700 underline">Намери още жилища</Link>
    {error || idsError ? <div role="alert" className="mt-6 rounded-lg border p-5"><p>Любимите не се заредиха.</p><button onClick={() => { reload(); setRetry(v => v + 1); }} className="mt-3 text-primary-700 underline">Опитай отново</button></div>
      : loading || idsLoading ? <p role="status" className="mt-6">Зареждане…</p>
      : !items.length ? <p className="mt-6 rounded-lg bg-background-100 p-6">{favoriteIds.length ? 'Запазените обяви на тази страница вече не са публични.' : 'Нямаш любими обяви. Натисни сърцето върху жилище, което ти харесва.'}</p>
      : <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map(view => <ListingCard key={view.listing.id} view={view} />)}</div>}
    {pages > 1 && <nav aria-label="Страници с любими" className="mt-8 flex items-center gap-4"><button disabled={current === 1} onClick={() => setPage(current - 1)} className="rounded-md border px-4 py-2 disabled:opacity-40">Предишна</button><span>{current} / {pages}</span><button disabled={current === pages} onClick={() => setPage(current + 1)} className="rounded-md border px-4 py-2 disabled:opacity-40">Следваща</button></nav>}
  </div></SiteLayout>;
}
