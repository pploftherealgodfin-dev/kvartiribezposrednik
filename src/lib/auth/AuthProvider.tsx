import { AuthContext, type AuthProfile, type AuthResult, type AuthContextValue } from './context';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { clearPendingRole, readPendingRole } from '@/lib/roles';
import type { Role } from '@/lib/types';



function redirectUrl(): string {
  const base = typeof __BASE_PATH__ === 'string' ? __BASE_PATH__ : '/';
  return `${window.location.origin}${base}vhod`;
}

/** Създава публичния профил и контактите при първи вход. */
async function ensureProfile(user: User): Promise<void> {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (typeof metadata.full_name === 'string' && metadata.full_name) ||
    (typeof metadata.name === 'string' && metadata.name) ||
    'Потребител';

  const { error } = await supabase.rpc('ensure_my_profile', {
    p_name: name, p_role: readPendingRole() ?? 'tenant',
  });
  if (error) throw error;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const sessionRef = useRef(session); sessionRef.current = session;
  const identity = useRef<string | null>(null);
  const profileKey = [session?.user.id, session?.user.email, session?.user.phone, session?.user.email_confirmed_at, session?.user.phone_confirmed_at].join('|');
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const retryProfile = useCallback(() => setRetryKey(value => value + 1), []);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        identity.current = data.session?.user.id ?? null;
        setSession(data.session);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (identity.current !== (nextSession?.user.id ?? null)) {
        setProfile(null); setProfileLoading(Boolean(nextSession)); setProfileError(false);
      }
      identity.current = nextSession?.user.id ?? null;
      setSession(nextSession);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const currentUser = sessionRef.current?.user;
    if (!currentUser) {
      setProfile(null);
      setProfileLoading(false);
      setProfileError(false);
      return;
    }

    let active = true;
    setProfileLoading(true);
    setProfileError(false);
    (async () => {
      try {
        await ensureProfile(currentUser);
        clearPendingRole();
        const { data } = await supabase
          .from('profiles')
          .select('id, role, name, owner_verified')
          .eq('id', currentUser.id)
          .maybeSingle();
        if (!active) return;
        if (data) {
          setProfile({
            id: data.id as string,
            role: data.role as Role,
            name: (data.name as string) ?? '',
            ownerVerified: Boolean(data.owner_verified),
          });
        } else {
          setProfile(null);
          setProfileError(true);
        }
      } catch {
        if (active) { setProfile(null); setProfileError(true); }
      } finally {
        if (active) setProfileLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [profileKey, retryKey]);

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl() },
    });
    return { error: error ? 'Google входът не е започнат. Опитай отново.' : null };
    } catch { return { error: 'Не успяхме да се свържем за Google вход.' }; }
  }, []);

  const signInWithPhone = useCallback(async (phone: string): Promise<AuthResult> => {
    try { const { error } = await supabase.auth.signInWithOtp({ phone });
    return { error: error ? 'Кодът не е изпратен. Провери телефона или използвай Google вход.' : null };
    } catch { return { error: 'Няма връзка с услугата за вход. Опитай отново.' }; }
  }, []);

  const verifyPhoneOtp = useCallback(async (phone: string, token: string): Promise<AuthResult> => {
    try { const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    return { error: error ? 'Кодът е грешен или е изтекъл. Опитай отново.' : null };
    } catch { return { error: 'Няма връзка с услугата за вход. Опитай отново.' }; }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
    setSession(null); setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading, profileLoading, profileError, retryProfile,
      signInWithGoogle,
      signInWithPhone,
      verifyPhoneOtp,
      signOut,
    }),
    [session, profile, loading, profileLoading, profileError, retryProfile, signInWithGoogle, signInWithPhone, verifyPhoneOtp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}