import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { clearPendingRole, readPendingRole } from '@/lib/roles';
import type { Role } from '@/lib/types';

export interface AuthProfile {
  id: string;
  role: Role;
  name: string;
  ownerVerified: boolean;
}

export interface AuthResult {
  error: string | null;
}

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithPhone: (phone: string) => Promise<AuthResult>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function redirectUrl(): string {
  const base = typeof __BASE_PATH__ === 'string' ? __BASE_PATH__ : '/';
  return `${window.location.origin}${base}`;
}

/** Създава публичния профил и контактите при първи вход. */
async function ensureProfile(user: User): Promise<void> {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (typeof metadata.full_name === 'string' && metadata.full_name) ||
    (typeof metadata.name === 'string' && metadata.name) ||
    user.email ||
    user.phone ||
    'Потребител';

  await supabase
    .from('profiles')
    .upsert(
      { id: user.id, name, role: readPendingRole() ?? 'tenant' },
      { onConflict: 'id', ignoreDuplicates: true },
    );

  const phone = user.phone ?? null;
  const email = user.email ?? null;
  if (phone || email) {
    await supabase
      .from('profile_contacts')
      .upsert(
        { id: user.id, phone, email, phone_verified: Boolean(phone) },
        { onConflict: 'id' },
      );
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const currentUser = session?.user;
    if (!currentUser) {
      setProfile(null);
      return;
    }

    let active = true;
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
        }
      } catch {
        if (active) setProfile(null);
      }
    })();

    return () => {
      active = false;
    };
  }, [session]);

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl() },
    });
    return { error: error ? error.message : null };
  }, []);

  const signInWithPhone = useCallback(async (phone: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    return { error: error ? error.message : null };
  }, []);

  const verifyPhoneOtp = useCallback(async (phone: string, token: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    return { error: error ? error.message : null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signInWithGoogle,
      signInWithPhone,
      verifyPhoneOtp,
      signOut,
    }),
    [session, profile, loading, signInWithGoogle, signInWithPhone, verifyPhoneOtp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}