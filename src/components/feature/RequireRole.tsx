import ProfileRecovery from '@/components/feature/ProfileRecovery';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PageLoading from '@/components/feature/PageLoading';
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
  const { session, profile, loading, profileLoading, profileError } = useAuth();
  const location = useLocation();

  if (session && profileError) return <ProfileRecovery />;
  if (loading || (session && profileLoading)) {
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

  if (!profile || !allow.includes(profile.role)) {
    return <Navigate to={dashboardPath(profile?.role)} replace />;
  }

  return <>{children}</>;
}