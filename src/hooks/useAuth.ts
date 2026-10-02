import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@/lib/auth/context';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth трябва да се използва вътре в AuthProvider.');
  }
  return context;
}