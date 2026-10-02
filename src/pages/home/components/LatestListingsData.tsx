import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { repository } from '@/lib/repository';
import type { ListingView } from '@/lib/types';
import LatestListings from './LatestListings';

export default function LatestListingsData() {
  const { user } = useAuth();
  const actor = user?.id ?? '';
  const [state, setState] = useState<{ actor: string; listings: ListingView[]; loading: boolean; error: boolean }>({ actor, listings: [], loading: true, error: false });
  const [retry, setRetry] = useState(0);
  const current = state.actor === actor ? state : { actor, listings: [], loading: true, error: false };
  useEffect(() => {
    let active = true;
    setState({ actor, listings: [], loading: true, error: false });
    repository.getLatestListings(6)
      .then(listings => { if (active) setState({ actor, listings, loading: false, error: false }); })
      .catch(() => { if (active) setState({ actor, listings: [], loading: false, error: true }); });
    return () => { active = false; };
  }, [actor, retry]);
  if (current.error) return <section role="alert" className="mx-auto max-w-6xl px-4 py-14 md:px-6"><h2 className="font-heading text-2xl font-semibold">Последни обяви</h2><p className="mt-4 text-sm">Обявите не се заредиха. <button type="button" className="ui-secondary ml-2" onClick={() => setRetry(value => value + 1)}>Опитай отново</button></p></section>;
  return <LatestListings listings={current.listings} loading={current.loading} />;
}
