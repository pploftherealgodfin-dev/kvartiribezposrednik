import ProfileRecovery from '@/components/feature/ProfileRecovery';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import SiteLayout from '@/components/feature/SiteLayout';
import { useAuth } from '@/hooks/useAuth';
import { dashboardPath, readPendingRole, setPendingRole, type RegisterRole } from '@/lib/roles';

interface RoleCardProps {
  active: boolean;
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}

function RoleCard({ active, icon, title, description, onClick }: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
        active
          ? 'border-primary-500 bg-primary-50'
          : 'border-background-300 bg-background-50 hover:border-primary-300'
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
          active ? 'bg-primary-600 text-background-50' : 'bg-background-100 text-foreground-700'
        }`}
      >
        <i className={`${icon} text-xl`} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-foreground-950">{title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-foreground-600">
          {description}
        </span>
      </span>
      {active && (
        <i className="ri-checkbox-circle-fill ml-auto text-lg text-primary-600" aria-hidden="true" />
      )}
    </button>
  );
}

export default function Login() {
  const { t } = useTranslation();
  const location = useLocation();
  const [params] = useSearchParams();
  const requested = params.get('next') ?? (location.state as {from?: string} | null)?.from ?? (() => { try { return window.sessionStorage.getItem('kb_return_to') ?? ''; } catch { return ''; } })();
  const from = requested.startsWith('/') && !requested.startsWith('//') && !requested.includes('\\') && !Array.from(requested).some(char => char.charCodeAt(0) <= 32) && !/^\/vhod(?:[/?]|$)/.test(requested) ? requested : '';
  const { session, profile, loading, profileError, signInWithGoogle, signInWithPhone, verifyPhoneOtp } = useAuth();

  const [role, setRole] = useState<RegisterRole>(() => readPendingRole() ?? 'tenant');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  if (session && profileError) return <ProfileRecovery />;
  if (!loading && session) {
    if (profile) {
      try { window.sessionStorage.removeItem('kb_return_to'); } catch { /* unavailable */ }
      return <Navigate to={from || dashboardPath(profile.role)} replace />;
    }
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="flex items-center gap-3 text-sm text-foreground-600">
          <i className="ri-loader-4-line animate-spin text-xl text-primary-600" />
          {t('common.loading')}
        </span>
      </div>
    );
  }

  const chooseRole = (next: RegisterRole) => {
    setRole(next);
    setPendingRole(next);
  };

  const handleGoogle = async () => {
    setError('');
    setNotice('');
    setPendingRole(role);
    setBusy(true);
    try { if (from) window.sessionStorage.setItem('kb_return_to', from); } catch { /* Browser can disable storage. */ }
    const { error: err } = await signInWithGoogle();
    if (err) {
      setError(err);
      setBusy(false);
    }
  };

  const handleSendCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const normalized = phone.replace(/[\s()-]/g, '');
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
      setError('Въведи телефон с код на държавата, например +359888123456.');
      return;
    }
    setPendingRole(role);
    setBusy(true);
    const { error: err } = await signInWithPhone(normalized);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setStep('otp');
    setNotice(t('auth.codeSent'));
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!otp.trim()) {
      setError(t('auth.otpRequired'));
      return;
    }
    setBusy(true);
    const { error: err } = await verifyPhoneOtp(phone.trim(), otp.trim());
    setBusy(false);
    if (err) {
      setError(err);
    }
  };

  return (
    <SiteLayout>
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-14 md:px-6 md:py-20">
        <div className="w-full max-w-lg">
          <h1 className="text-center font-heading text-2xl font-extrabold tracking-tight text-foreground-950 md:text-3xl">
            {t('auth.title')}
          </h1>
          <p className="mt-2 text-center text-sm text-foreground-600">{t('auth.subtitle')}</p>

          <p className="mt-8 text-xs font-semibold text-foreground-600">{t('auth.chooseRole')}</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RoleCard
              active={role === 'tenant'}
              icon="ri-user-search-line"
              title={t('auth.roleTenant')}
              description={t('auth.roleTenantDesc')}
              onClick={() => chooseRole('tenant')}
            />
            <RoleCard
              active={role === 'owner'}
              icon="ri-home-office-line"
              title={t('auth.roleOwner')}
              description={t('auth.roleOwnerDesc')}
              onClick={() => chooseRole('owner')}
            />
          </div>

          <div className="mt-6 rounded-lg border border-background-200 bg-background-50 p-6 md:p-8">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="flex w-full cursor-pointer items-center justify-center gap-2.5 whitespace-nowrap rounded-md border border-background-300 bg-background-50 px-4 py-3 text-sm font-semibold text-foreground-900 transition-colors hover:bg-background-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <i className="ri-google-fill text-lg" aria-hidden="true" />
              {t('auth.google')}
            </button>

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-background-200" />
              <span className="text-xs font-medium text-foreground-500">{t('auth.orDivider')}</span>
              <span className="h-px flex-1 bg-background-200" />
            </div>

            {step === 'phone' ? (
              <form onSubmit={handleSendCode} noValidate>
                <label htmlFor="auth-phone" className="block text-sm font-medium text-foreground-800">
                  {t('auth.phoneLabel')}
                </label>
                <input
                  id="auth-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder={t('auth.phonePlaceholder')}
                  className="mt-2 w-full rounded-md border border-background-300 bg-background-50 px-3 py-2.5 text-sm text-foreground-950 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
                />
                <p className="mt-2 text-xs text-foreground-500">{t('auth.phoneHint')}</p>
                <button
                  type="submit"
                  disabled={busy}
                  className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary-600 px-4 py-3 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <i
                    className={busy ? 'ri-loader-4-line animate-spin text-base' : 'ri-send-plane-line text-base'}
                    aria-hidden="true"
                  />
                  {busy ? t('auth.sending') : t('auth.sendCode')}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerify} noValidate>
                <label htmlFor="auth-otp" className="block text-sm font-medium text-foreground-800">
                  {t('auth.otpLabel')}
                </label>
                <input
                  id="auth-otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder={t('auth.otpPlaceholder')}
                  className="mt-2 w-full rounded-md border border-background-300 bg-background-50 px-3 py-2.5 text-center text-lg tracking-[0.3em] text-foreground-950 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
                />
                <p className="mt-2 text-xs text-foreground-500">{phone}</p>
                <button
                  type="submit"
                  disabled={busy}
                  className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary-600 px-4 py-3 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <i
                    className={busy ? 'ri-loader-4-line animate-spin text-base' : 'ri-shield-check-line text-base'}
                    aria-hidden="true"
                  />
                  {busy ? t('auth.verifying') : t('auth.verify')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                    setError('');
                    setNotice('');
                  }}
                  className="mt-3 w-full cursor-pointer text-center text-xs font-medium text-foreground-600 transition-colors hover:text-primary-700"
                >
                  {t('auth.changePhone')}
                </button>
              </form>
            )}

            {notice && !error && (
              <p className="mt-4 rounded-md bg-accent-100 px-3 py-2 text-xs font-medium text-accent-900">
                {notice}
              </p>
            )}
            {error && (
              <p role="alert" className="mt-4 rounded-md bg-background-200 px-3 py-2 text-xs font-medium text-foreground-900">
                {error}
              </p>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-foreground-500">{t('auth.trustNote')}</p>
        </div>
      </section>
    </SiteLayout>
  );
}