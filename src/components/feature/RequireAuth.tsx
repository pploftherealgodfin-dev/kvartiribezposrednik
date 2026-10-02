import { Fragment, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PageLoading from '@/components/feature/PageLoading';
import { useAuth } from '@/hooks/useAuth';

interface RequireAuthProps {
  children: ReactNode;
}

/**
 * Пази страници, които изискват вход (качване на обява, профил, контакт със собственик).
 * Ако няма сесия — праща към /vhod и помни откъде е дошъл потребителят.
 */
export default function RequireAuth({ children }: RequireAuthProps) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoading />;
  }

  if (!session) {
    return (
      <Navigate
        to="/vhod"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Fragment key={session.user.id}>{children}</Fragment>;
}
