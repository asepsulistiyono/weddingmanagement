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

const DEFAULT_PROJECT_URL = 'https://aksqfqromigvrkklhjhw.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrc3FmcXJvbWlndnJra2xoamh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMDExNjUsImV4cCI6MjEwNTc3NzE2NX0.Bjnyj1xBPhiJFBAbRjmc4R_SBYoy5PKnqyQ-e-GROAA';
const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_aCltqgMJmlHLLbHHBE6Kgw_9kTFY7rH';

let viteEnvUrl = '';
let viteEnvServiceKey = '';
let viteEnvAnonKey = '';
let viteEnvPublishableKey = '';
try {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    viteEnvUrl = cleanEnvValue(import.meta.env.VITE_SUPABASE_URL);
    viteEnvServiceKey = cleanEnvValue(import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
    viteEnvAnonKey = cleanEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);
    viteEnvPublishableKey = cleanEnvValue(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
  }
} catch {
  // ignore
}

const candidateUrls: string[] = [
  viteEnvUrl,
  typeof process !== 'undefined' ? cleanEnvValue(process.env?.VITE_SUPABASE_URL) : '',
  DEFAULT_PROJECT_URL,
  typeof process !== 'undefined' ? cleanEnvValue(process.env?.SUPABASE_URL) : '',
];

export const supabaseUrl: string = candidateUrls.find(isValidSupabaseUrl) || DEFAULT_PROJECT_URL;

const candidateKeys: string[] = [
  typeof process !== 'undefined' ? cleanEnvValue(process.env?.VITE_SUPABASE_SERVICE_ROLE_KEY) : '',
  typeof process !== 'undefined' ? cleanEnvValue(process.env?.SUPABASE_SERVICE_ROLE_KEY) : '',
  typeof process !== 'undefined' ? cleanEnvValue(process.env?.SUPABASE_SECRET_KEY) : '',
  viteEnvServiceKey,
  viteEnvAnonKey,
  typeof process !== 'undefined' ? cleanEnvValue(process.env?.VITE_SUPABASE_ANON_KEY) : '',
  typeof process !== 'undefined' ? cleanEnvValue(process.env?.SUPABASE_ANON_KEY) : '',
  viteEnvPublishableKey,
  typeof process !== 'undefined' ? cleanEnvValue(process.env?.VITE_SUPABASE_PUBLISHABLE_KEY) : '',
  DEFAULT_ANON_KEY,
  DEFAULT_PUBLISHABLE_KEY,
];

const resolvedKey: string =
  candidateKeys.find((k) => doesKeyMatchUrl(k, supabaseUrl)) || DEFAULT_ANON_KEY;

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
  supabaseUrl || DEFAULT_PROJECT_URL,
  resolvedKey || DEFAULT_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export function packCreatedByWithPassword(createdBy?: string | null, password?: string | null): string | null {
  const cleanCreator = createdBy ? String(createdBy).trim() : '';
  const cleanPass = password ? String(password).trim() : '';
  if (!cleanPass) return cleanCreator || null;
  return `${cleanCreator}::pwd::${cleanPass}`;
}

export function unpackCreatedByAndPassword(
  rawCreatedBy?: string | null,
  rawPassword?: string | null
): { createdBy?: string; password?: string } {
  const directPass = rawPassword ? String(rawPassword).trim() : '';
  const raw = rawCreatedBy ? String(rawCreatedBy) : '';
  if (raw.includes('::pwd::')) {
    const [creatorPart, passPart] = raw.split('::pwd::');
    return {
      createdBy: creatorPart ? creatorPart.trim() : undefined,
      password: directPass || (passPart ? passPart.trim() : undefined),
    };
  }
  return {
    createdBy: raw ? raw.trim() : undefined,
    password: directPass || undefined,
  };
}

export async function syncUserToSupabaseClient(user: {
  id: string;
  username: string;
  password?: string;
  email?: string;
  name?: string;
  role?: string;
  weddingSlug?: string;
  coupleNames?: string;
  phone?: string;
  notes?: string;
  active?: boolean;
  createdBy?: string;
  createdByName?: string;
}): Promise<boolean> {
  if (!isSupabaseReady()) return false;
  try {
    const cleanUsername = (user.username || (user.email ? user.email.split('@')[0] : 'admin')).trim().toLowerCase();
    const cleanEmail = (user.email || `${cleanUsername}@wedding.local`).trim().toLowerCase();
    const baseRow: Record<string, any> = {
      uid: user.id,
      username: cleanUsername,
      email: cleanEmail,
      name: user.name || cleanUsername,
      role: user.role || 'super_admin',
      wedding_slug: user.weddingSlug || null,
      couple_names: user.coupleNames || null,
      phone: user.phone || null,
      notes: user.notes || null,
      active: user.active !== false,
      created_by: user.createdBy || null,
      created_by_name: user.createdByName || null,
    };

    const { data: existingSupaUsers } = await supabase.from('users').select('uid, username, email');
    if (Array.isArray(existingSupaUsers)) {
      for (const r of existingSupaUsers as any[]) {
        if (
          r.uid &&
          r.uid !== user.id &&
          ((r.username && String(r.username).toLowerCase() === cleanUsername) ||
            (r.email && String(r.email).toLowerCase() === cleanEmail))
        ) {
          await supabase.from('users').delete().eq('uid', r.uid);
        }
      }
    }

    let { error } = await supabase
      .from('users')
      .upsert({ ...baseRow, password: user.password || null }, { onConflict: 'uid' });

    if (error && (error.code === 'PGRST204' || String(error.message || '').includes('password'))) {
      const fallbackRow = {
        ...baseRow,
        created_by: packCreatedByWithPassword(user.createdBy, user.password),
      };
      const retryRes = await supabase.from('users').upsert(fallbackRow, { onConflict: 'uid' });
      error = retryRes.error;
    }

    if (!error) {
      clearSupabaseKeyError();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function deleteUserFromSupabaseClient(uid: string, username?: string): Promise<boolean> {
  if (!isSupabaseReady()) return false;
  try {
    await supabase.from('users').delete().eq('uid', uid);
    if (username) {
      await supabase.from('users').delete().eq('username', username.toLowerCase());
    }
    return true;
  } catch {
    return false;
  }
}

export async function fetchUsersFromSupabaseClient(): Promise<any[]> {
  if (!isSupabaseReady()) return [];
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !Array.isArray(data)) return [];
    clearSupabaseKeyError();
    return data.map((u: any) => {
      const id = u.uid || `user-${u.id}`;
      const uname = (u.username || (u.email ? String(u.email).split('@')[0] : 'admin')).toLowerCase();
      const isOwnerRow =
        u.role === 'owner' ||
        String(u.email || '').toLowerCase() === 'asepsulistiyono1@gmail.com' ||
        uname === 'asepsulistiyono1';
      const unpacked = unpackCreatedByAndPassword(u.created_by, u.password);
      return {
        id: isOwnerRow ? 'user-owner-1' : id,
        username: uname,
        password: unpacked.password || (u.role === 'super_admin' ? 'super123' : 'admin123'),
        name: u.name || uname,
        email: u.email || `${uname}@wedding.local`,
        role: u.role === 'owner' ? 'super_admin' : (u.role || 'super_admin'),
        weddingSlug: u.wedding_slug || undefined,
        coupleNames: u.couple_names || undefined,
        phone: u.phone || undefined,
        notes: u.notes || undefined,
        active: u.active !== false,
        createdBy: unpacked.createdBy,
        createdByName: u.created_by_name || undefined,
        isOwner: isOwnerRow,
        createdAt: u.created_at ? new Date(u.created_at).toISOString() : new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}

export async function syncSettingsToSupabaseClient(settings: any, id: string): Promise<boolean> {
  if (!isSupabaseReady() || !id || !settings) return false;
  try {
    const { error } = await supabase
      .from('wedding_settings')
      .upsert(
        {
          id,
          data: settings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    if (!error) {
      clearSupabaseKeyError();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function fetchDirectSupabaseStatus(): Promise<{
  connected: boolean;
  host: string;
  supabaseUrl: string;
  tableCounts: {
    wedding_settings: number;
    guests: number;
    wishes: number;
    gallery_photos: number;
    users: number;
  };
  error?: string;
} | null> {
  if (!isSupabaseReady()) return null;
  let host = 'aksqfqromigvrkklhjhw.supabase.co';
  try {
    host = new URL(supabaseUrl).host;
  } catch {
    // ignore
  }
  try {
    const [settingsRes, guestsRes, wishesRes, galleryRes, usersRes] = await Promise.all([
      supabase.from('wedding_settings').select('id'),
      supabase.from('guests').select('id'),
      supabase.from('wishes').select('id'),
      supabase.from('gallery_photos').select('id'),
      supabase.from('users').select('uid'),
    ]);
    const firstErr =
      settingsRes.error ||
      guestsRes.error ||
      wishesRes.error ||
      galleryRes.error ||
      usersRes.error;
    if (firstErr) {
      return {
        connected: false,
        host,
        supabaseUrl,
        tableCounts: {
          wedding_settings: 0,
          guests: 0,
          wishes: 0,
          gallery_photos: 0,
          users: 0,
        },
        error: firstErr.message,
      };
    }
    clearSupabaseKeyError();
    return {
      connected: true,
      host,
      supabaseUrl,
      tableCounts: {
        wedding_settings: settingsRes.data?.length ?? 0,
        guests: guestsRes.data?.length ?? 0,
        wishes: wishesRes.data?.length ?? 0,
        gallery_photos: galleryRes.data?.length ?? 0,
        users: usersRes.data?.length ?? 0,
      },
    };
  } catch (err: any) {
    return null;
  }
}

export default supabase;
