import ProfileRecovery from '@/components/feature/ProfileRecovery';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { dashboardPath } from '@/lib/roles';

/** Пренасочва към панела, който отговаря на ролята на влезлия потребител. */
export default function ProfileRedirect() {
  const { t } = useTranslation();
  const { session, profile, loading, profileLoading, profileError } = useAuth();

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
    return <Navigate to="/vhod" replace />;
  }

  return <Navigate to={dashboardPath(profile?.role)} replace />;
}