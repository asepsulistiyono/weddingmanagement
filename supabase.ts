import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const rawUrl: string =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' &&
    (process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL)) ||
  '';

const rawKey: string =
  (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) ||
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
      import.meta.env?.VITE_SUPABASE_ANON_KEY)) ||
  (typeof process !== 'undefined' &&
    (process.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env?.VITE_SUPABASE_ANON_KEY ||
      process.env?.SUPABASE_ANON_KEY)) ||
  '';

export const supabaseUrl: string = rawUrl.trim();
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
    rawKey.trim() &&
    !supabaseUrl.includes('placeholder-project.supabase.co')
);

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  rawKey.trim() || 'placeholder-publishable-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export default supabase;
