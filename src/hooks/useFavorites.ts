import { useContext } from 'react';
import { FavoritesContext, type FavoritesContextValue } from '@/lib/favorites/context';

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites трябва да се използва вътре във FavoritesProvider.');
  }
  return context;
}