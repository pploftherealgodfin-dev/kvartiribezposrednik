import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  addFavorite,
  getFavoriteListingIds,
  removeFavorite,
} from '@/lib/repository/favorites';

export interface FavoritesContextValue {
  favoriteIds: string[];
  loading: boolean;
  isFavorite: (listingId: string) => boolean;
  toggle: (listingId: string, next?: boolean) => Promise<void>;
}

export const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setFavoriteIds([]);
      return;
    }
    let active = true;
    setLoading(true);
    getFavoriteListingIds(user.id)
      .then((ids) => {
        if (active) setFavoriteIds(ids);
      })
      .catch(() => {
        if (active) setFavoriteIds([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const toggle = useCallback(
    async (listingId: string, next?: boolean) => {
      if (!user) return;
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
        setFavoriteIds((prev) => {
          if (want) return prev.filter((id) => id !== listingId);
          return prev.includes(listingId) ? prev : [...prev, listingId];
        });
      }
    },
    [user, favoriteIds],
  );

  const isFavorite = useCallback(
    (listingId: string) => favoriteIds.includes(listingId),
    [favoriteIds],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({ favoriteIds, loading, isFavorite, toggle }),
    [favoriteIds, loading, isFavorite, toggle],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}