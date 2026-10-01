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

function extractProjectRefFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname;
    return host.split('.')[0] || '';
  } catch {
    return '';
  }
}

function doesKeyMatchUrl(key: string, url: string): boolean {
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

  if (key.startsWith('sb_')) {
    return true;
  }

  if (key.startsWith('eyJ')) {
    const urlRef = extractProjectRefFromUrl(url);
    if (!urlRef) return true;
    try {
      const parts = key.split('.');
      if (parts.length >= 2) {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const jsonStr =
          typeof atob === 'function'
            ? atob(base64)
            : Buffer.from(base64, 'base64').toString('utf8');
        const payload = JSON.parse(jsonStr);
        if (payload?.ref && typeof payload.ref === 'string') {
          return payload.ref === urlRef;
        }
      }
    } catch {
      // If decoding fails, still allow key
    }
    return true;
  }

  return false;
}

const candidateUrls: string[] = [
  typeof import.meta !== 'undefined' ? cleanEnvValue(import.meta.env?.VITE_SUPABASE_URL) : '',
  typeof process !== 'undefined' ? cleanEnvValue(process.env?.VITE_SUPABASE_URL) : '',
  typeof process !== 'undefined' ? cleanEnvValue(process.env?.SUPABASE_URL) : '',
];

export const supabaseUrl: string = candidateUrls.find(isValidSupabaseUrl) || '';

const candidateKeys: string[] = [
  typeof process !== 'undefined' ? cleanEnvValue(process.env?.VITE_SUPABASE_SERVICE_ROLE_KEY) : '',
  typeof process !== 'undefined' ? cleanEnvValue(process.env?.SUPABASE_SERVICE_ROLE_KEY) : '',
  typeof process !== 'undefined' ? cleanEnvValue(process.env?.SUPABASE_SECRET_KEY) : '',
  typeof import.meta !== 'undefined' ? cleanEnvValue(import.meta.env?.VITE_SUPABASE_SERVICE_ROLE_KEY) : '',
  typeof import.meta !== 'undefined' ? cleanEnvValue(import.meta.env?.VITE_SUPABASE_ANON_KEY) : '',
  typeof process !== 'undefined' ? cleanEnvValue(process.env?.VITE_SUPABASE_ANON_KEY) : '',
  typeof process !== 'undefined' ? cleanEnvValue(process.env?.SUPABASE_ANON_KEY) : '',
  typeof import.meta !== 'undefined' ? cleanEnvValue(import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY) : '',
  typeof process !== 'undefined' ? cleanEnvValue(process.env?.VITE_SUPABASE_PUBLISHABLE_KEY) : '',
];

const resolvedKey: string =
  candidateKeys.find((k) => doesKeyMatchUrl(k, supabaseUrl)) || '';

let runtimeSupabaseNotice: string | null = null;
let runtimeKeyInvalid: boolean = false;

export function markSupabaseKeyInvalid(reason?: string) {
  const msg = String(reason || '');
  runtimeSupabaseNotice = msg || 'API Key Supabase tidak valid';
  if (
    msg.toLowerCase().includes('invalid api key') ||
    msg.toLowerCase().includes('jwt')
  ) {
    runtimeKeyInvalid = true;
  }
}

export function clearSupabaseKeyError() {
  runtimeSupabaseNotice = null;
  runtimeKeyInvalid = false;
}

export function getSupabaseKeyError(): string | null {
  return runtimeSupabaseNotice;
}

export function isSupabaseReady(): boolean {
  return Boolean(supabaseUrl && resolvedKey && !runtimeKeyInvalid);
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
