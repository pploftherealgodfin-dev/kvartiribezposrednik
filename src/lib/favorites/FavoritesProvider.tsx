import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { FavoritesContext, type FavoritesContextValue } from './context';
import { useAuth } from '@/hooks/useAuth';
import { addFavorite, getFavoriteListingIds, removeFavorite } from '@/lib/repository/favorites';

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const currentUser = useRef(userId); currentUser.current = userId;
  const [state, setState] = useState<{ userId?: string; ids: string[]; loading: boolean; error: string }>({ ids: [], loading: false, error: '' });
  const ids = useRef<string[]>([]);
  const pending = useRef(new Set<string>());
  const [busyIds, setBusyIds] = useState<string[]>([]);
  const [retry, setRetry] = useState(0);
  const sameUser = state.userId === userId;
  const loading = Boolean(userId && (!sameUser || state.loading));
  const error = sameUser ? state.error : '';
  const favoriteIds = useMemo(() => sameUser ? state.ids : [], [sameUser, state.ids]);
  const reload = useCallback(() => { if (!pending.current.size) setRetry(value => value + 1); }, []);

  useEffect(() => {
    let active = true;
    pending.current = new Set(); setBusyIds([]); ids.current = [];
    setState({ userId, ids: [], loading: Boolean(userId), error: '' });
    if (!userId) return;
    getFavoriteListingIds(userId).then(result => {
      if (active) { ids.current = result; setState({ userId, ids: result, loading: false, error: '' }); }
    }).catch(() => {
      if (active) setState({ userId, ids: [], loading: false, error: 'Любимите не се заредиха. Опитай отново.' });
    });
    return () => { active = false; };
  }, [userId, retry]);

  const toggle = useCallback(async (listingId: string, next?: boolean) => {
    if (!userId || loading || error || pending.current.has(listingId)) return;
    const requests = pending.current;
    requests.add(listingId); setBusyIds([...requests]);
    const want = next ?? !ids.current.includes(listingId);
    const update = (add: boolean) => {
      ids.current = add ? [...new Set([...ids.current, listingId])] : ids.current.filter(id => id !== listingId);
      setState(old => ({ ...old, ids: ids.current }));
    };
    update(want);
    setState(old => ({ ...old, error: '' }));
    try {
      if (want) await addFavorite(userId, listingId);
      else await removeFavorite(userId, listingId);
    } catch {
      if (currentUser.current !== userId || pending.current !== requests) return;
      update(!want);
      setState(old => ({ ...old, error: want ? 'Запазването не е потвърдено. Обнови любимите и опитай отново.' : 'Премахването не е потвърдено. Обнови любимите и опитай отново.' }));
    } finally {
      // A previous account's request must not release the next account's lock.
      if (currentUser.current === userId && pending.current === requests) { requests.delete(listingId); setBusyIds([...requests]); }
    }
  }, [userId, loading, error]);

  const isFavorite = useCallback((listingId: string) => favoriteIds.includes(listingId), [favoriteIds]);
  const value = useMemo<FavoritesContextValue>(() => ({ favoriteIds, loading, error, busyIds: sameUser ? busyIds : [], isFavorite, toggle, reload }), [favoriteIds, loading, error, busyIds, sameUser, isFavorite, toggle, reload]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}
