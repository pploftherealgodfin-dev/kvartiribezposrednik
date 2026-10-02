import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
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
  profileLoading: boolean;
  profileError: boolean;
  retryProfile: () => void;
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithPhone: (phone: string) => Promise<AuthResult>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
