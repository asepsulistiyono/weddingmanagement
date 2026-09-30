import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function cleanEnvValue(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val.trim().replace(/^['"]+|['"]+$/g, '').trim();
}

function isValidSupabaseUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (
    lower.includes('placeholder') ||
    lower.includes('your_') ||
    lower.includes('my_') ||
    lower.includes('example.com')
  ) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function isValidSupabaseKey(key: string): boolean {
  if (!key || key.length < 20) return false;
  const lower = key.toLowerCase();
  if (
    lower.includes('placeholder') ||
    lower.includes('your_') ||
    lower.includes('my_') ||
    lower === 'undefined' ||
    lower === 'null'
  ) {
    return false;
  }
  // Standard Supabase anon/service_role JWTs start with "eyJ", new keys start with "sb_"
  return key.startsWith('eyJ') || key.startsWith('sb_');
}

const candidateUrls: string[] = [
  typeof import.meta !== 'undefined' ? cleanEnvValue(import.meta.env?.VITE_SUPABASE_URL) : '',
  typeof process !== 'undefined' ? cleanEnvValue(process.env?.VITE_SUPABASE_URL) : '',
  typeof process !== 'undefined' ? cleanEnvValue(process.env?.SUPABASE_URL) : '',
];

const candidateKeys: string[] = [
  typeof import.meta !== 'undefined' ? cleanEnvValue(import.meta.env?.VITE_SUPABASE_ANON_KEY) : '',
  typeof import.meta !== 'undefined' ? cleanEnvValue(import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY) : '',
  typeof process !== 'undefined' ? cleanEnvValue(process.env?.VITE_SUPABASE_ANON_KEY) : '',
  typeof process !== 'undefined' ? cleanEnvValue(process.env?.VITE_SUPABASE_PUBLISHABLE_KEY) : '',
  typeof process !== 'undefined' ? cleanEnvValue(process.env?.SUPABASE_ANON_KEY) : '',
  typeof process !== 'undefined' ? cleanEnvValue(process.env?.SUPABASE_SERVICE_ROLE_KEY) : '',
];

export const supabaseUrl: string = candidateUrls.find(isValidSupabaseUrl) || '';
const resolvedKey: string = candidateKeys.find(isValidSupabaseKey) || '';

let runtimeKeyInvalidReason: string | null = null;

export function markSupabaseKeyInvalid(reason?: string) {
  runtimeKeyInvalidReason = reason || 'API Key Supabase tidak valid';
}

export function getSupabaseKeyError(): string | null {
  return runtimeKeyInvalidReason;
}

export function isSupabaseReady(): boolean {
  return Boolean(supabaseUrl && resolvedKey && !runtimeKeyInvalidReason);
}

export const isSupabaseConfigured: boolean = Boolean(supabaseUrl && resolvedKey);

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  resolvedKey || 'placeholder-publishable-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export default supabase;
