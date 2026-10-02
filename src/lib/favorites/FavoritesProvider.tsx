import { FavoritesContext, type FavoritesContextValue } from './context';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  addFavorite,
  getFavoriteListingIds,
  removeFavorite,
} from '@/lib/repository/favorites';



export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(new Set<string>());
  const currentUser = useRef(user?.id); currentUser.current = user?.id;
  const [retry, setRetry] = useState(0);
  const reload = useCallback(() => setRetry(value => value + 1), []);
  const [busyIds, setBusyIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setFavoriteIds([]); setLoading(false); setError(''); pending.current.clear(); setBusyIds([]);
      return;
    }
    let active = true;
    setLoading(true); setError('');
    getFavoriteListingIds(user.id)
      .then((ids) => {
        if (active) setFavoriteIds(ids);
      })
      .catch(() => {
        if (active) { setFavoriteIds([]); setError('Любимите не се заредиха. Опитай отново.'); }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, retry]);

  const toggle = useCallback(
    async (listingId: string, next?: boolean) => {
      if (!user || loading || pending.current.has(listingId)) return;
      pending.current.add(listingId); setBusyIds([...pending.current]); setError('');
      const want = next ?? !favoriteIds.includes(listingId);
      setFavoriteIds((prev) => {
        if (want) return prev.includes(listingId) ? prev : [...prev, listingId];
        return prev.filter((id) => id !== listingId);
      });
      try {
        if (want) {
          await addFavorite(user.id, listingId);
        } else {
          await removeFavorite(user.id, listingId);
        }
      } catch {
        if (currentUser.current !== user.id) return;
        setError('Обявата не е запазена. Опитай отново.');
        setFavoriteIds((prev) => {
          if (want) return prev.filter((id) => id !== listingId);
          return prev.includes(listingId) ? prev : [...prev, listingId];
        });
      } finally {
        pending.current.delete(listingId); setBusyIds([...pending.current]);
      }
    },
    [user, favoriteIds, loading],
  );

  const isFavorite = useCallback(
    (listingId: string) => favoriteIds.includes(listingId),
    [favoriteIds],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({ favoriteIds, loading, error, busyIds, isFavorite, toggle, reload }),
    [favoriteIds, loading, error, busyIds, isFavorite, toggle, reload],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}