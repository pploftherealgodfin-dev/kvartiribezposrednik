import ProfileRecovery from '@/components/feature/ProfileRecovery';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { dashboardPath } from '@/lib/roles';
import type { Role } from '@/lib/types';

interface RequireRoleProps {
  allow: Role[];
  children: ReactNode;
}

/**
 * Пази страници за определена роля. Ако няма вход — праща към /vhod.
 * Ако ролята е друга — праща потребителя в неговия собствен панел.
 */
export default function RequireRole({ allow, children }: RequireRoleProps) {
  const { t } = useTranslation();
  const { session, profile, loading, profileLoading, profileError } = useAuth();
  const location = useLocation();

  if (session && profileError) return <ProfileRecovery />;
  if (loading || (session && profileLoading)) {
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

  if (!profile || !allow.includes(profile.role)) {
    return <Navigate to={dashboardPath(profile?.role)} replace />;
  }

  return <>{children}</>;
}