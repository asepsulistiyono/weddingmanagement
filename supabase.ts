import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url: string =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  '';

const publishableKey: string =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
      import.meta.env?.VITE_SUPABASE_ANON_KEY)) ||
  (typeof process !== 'undefined' &&
    (process.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env?.VITE_SUPABASE_ANON_KEY)) ||
  '';

export const isSupabaseConfigured: boolean = Boolean(url && publishableKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Variabel environment Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY) belum diatur'
  );
}

export const supabase: SupabaseClient = createClient(
  url || 'https://placeholder-project.supabase.co',
  publishableKey || 'placeholder-publishable-key'
);

export default supabase;
