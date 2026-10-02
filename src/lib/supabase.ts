import { createClient } from '@supabase/supabase-js';

/**
 * Единствена инстанция на Supabase клиента за цялото приложение.
 * Публичният ключ е безопасен за браузъра — достъпът до данни се пази от RLS политиките.
 */
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});