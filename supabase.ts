import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function cleanEnvValue(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/^['"]+|['"]+$/g, '').trim();
}

function isValidSupabaseUrl(value: string): boolean {
  if (!value || /placeholder|your_|my_|example\.com/i.test(value)) return false;

  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' ||
      (url.protocol === 'http:' &&
        ['localhost', '127.0.0.1'].includes(url.hostname))
    );
  } catch {
    return false;
  }
}

function isLegacyAnonKey(value: string): boolean {
  const payload = value.split('.')[1];
  if (!payload) return false;

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return JSON.parse(atob(padded)).role === 'anon';
  } catch {
    return false;
  }
}

function isPublishableKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || isLegacyAnonKey(value);
}

export const supabaseUrl = cleanEnvValue(
  import.meta.env.VITE_SUPABASE_URL
);

const publishableKey = cleanEnvValue(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

if (!isValidSupabaseUrl(supabaseUrl)) {
  throw new Error('VITE_SUPABASE_URL belum diisi atau tidak valid.');
}

if (!isPublishableKey(publishableKey)) {
  throw new Error(
    'Gunakan Supabase publishable key (atau legacy anon key), bukan secret/service-role key.'
  );
}

let runtimeKeyInvalidReason: string | null = null;

export function markSupabaseKeyInvalid(reason?: string) {
  runtimeKeyInvalidReason = reason || 'API key Supabase tidak valid';
}

export function getSupabaseKeyError(): string | null {
  return runtimeKeyInvalidReason;
}

export function isSupabaseReady(): boolean {
  return runtimeKeyInvalidReason === null;
}

export const isSupabaseConfigured = true;

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  publishableKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export default supabase;

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
