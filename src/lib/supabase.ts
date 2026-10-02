import { createClient } from '@supabase/supabase-js';
import { validatePublicSupabaseConfig } from './publicSupabaseConfig';

/**
 * Единствена инстанция на Supabase клиента за цялото приложение.
 * Публичният ключ е безопасен за браузъра — достъпът до данни се пази от RLS политиките.
 */
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;
validatePublicSupabaseConfig(supabaseUrl, supabaseAnonKey, import.meta.env.DEV);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});
