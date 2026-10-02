import { createContext } from 'react';

export interface FavoritesContextValue {
  favoriteIds: string[];
  loading: boolean;
  isFavorite: (listingId: string) => boolean;
  toggle: (listingId: string, next?: boolean) => Promise<void>;
}

export const FavoritesContext = createContext<FavoritesContextValue | null>(null);
