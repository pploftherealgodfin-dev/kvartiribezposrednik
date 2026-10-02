import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';

interface RequireAuthProps {
  children: ReactNode;
}

/**
 * Пази страници, които изискват вход (качване на обява, профил, контакт със собственик).
 * Ако няма сесия — праща към /vhod и помни откъде е дошъл потребителят.
 */
export default function RequireAuth({ children }: RequireAuthProps) {
  const { t } = useTranslation();
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="flex items-center gap-3 text-sm text-foreground-600">
          <i className="ri-loader-4-line animate-spin text-xl text-primary-600" />
          {t('common.loading')}
        </span>
      </div>
    );
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

  return <>{children}</>;
}