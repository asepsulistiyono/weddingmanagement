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
    const unpackedCreator = unpackCreatedByAndPassword(user.createdBy, user.password);
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
      created_by: packCreatedByWithPassword(unpackedCreator.createdBy, unpackedCreator.password),
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

    const { error } = await supabase
      .from('users')
      .upsert(baseRow, { onConflict: 'uid' });

    if (!error) {
      clearSupabaseKeyError();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function deleteUserFromSupabaseClient(
  uid: string,
  username?: string,
  options?: { email?: string; weddingSlug?: string; deleteWeddingSettings?: boolean }
): Promise<boolean> {
  if (!isSupabaseReady()) return false;
  try {
    const cleanUid = String(uid || '').trim();
    const cleanUsername = String(username || '').trim().toLowerCase();
    const cleanEmail = String(options?.email || '').trim().toLowerCase();
    const cleanSlug = String(options?.weddingSlug || '').trim().toLowerCase();

    // 1. Delete by uid
    if (cleanUid) {
      await supabase.from('users').delete().eq('uid', cleanUid);
    }

    // 2. Delete by username
    if (cleanUsername) {
      await supabase.from('users').delete().eq('username', cleanUsername);
      await supabase.from('users').delete().ilike('username', cleanUsername);
    }

    // 3. Delete by email
    if (cleanEmail) {
      await supabase.from('users').delete().eq('email', cleanEmail);
      await supabase.from('users').delete().ilike('email', cleanEmail);
    }

    // 4. Cascade delete associated WO staff and wedding_settings for this wedding slug
    if (cleanSlug && cleanSlug !== 'main' && cleanSlug !== 'default' && cleanSlug !== 'rizky_dan_siti') {
      await supabase.from('users').delete().eq('wedding_slug', cleanSlug);
      if (options?.deleteWeddingSettings !== false) {
        await supabase.from('wedding_settings').delete().eq('id', cleanSlug);
      }
    }

    clearSupabaseKeyError();
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
    const cleanData = { ...settings };
    delete cleanData._locallyModified;
    delete cleanData.oldSlug;
    cleanData.updatedAt = new Date().toISOString();

    const { error } = await supabase
      .from('wedding_settings')
      .upsert(
        {
          id,
          data: cleanData,
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

export async function ensureWeddingTemplateInSupabaseClient(
  slug: string,
  groomName: string,
  brideName: string,
  baseTemplate?: any
): Promise<any | null> {
  if (!isSupabaseReady() || !slug) return null;
  try {
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanSlug) return null;

    const { data: existingRow } = await supabase
      .from('wedding_settings')
      .select('data')
      .eq('id', cleanSlug)
      .maybeSingle();

    const gn = groomName.trim() || 'Mempelai Pria';
    const bn = brideName.trim() || 'Mempelai Wanita';
    const coupleNames = `${gn} & ${bn}`;

    let sourceObj = existingRow?.data || baseTemplate;
    if (!sourceObj) {
      const { data: mainRow } = await supabase
        .from('wedding_settings')
        .select('data')
        .eq('id', 'main')
        .maybeSingle();
      sourceObj = mainRow?.data;
    }

    const baseClone = sourceObj ? JSON.parse(JSON.stringify(sourceObj)) : {};
    delete baseClone._locallyModified;
    delete baseClone.oldSlug;

    const updatedSettings = {
      ...baseClone,
      id: cleanSlug,
      slug: cleanSlug,
      coupleNames,
      title: `The Wedding of ${coupleNames}`,
      updatedAt: new Date().toISOString(),
      groom: {
        ...(baseClone.groom || {}),
        fullName: existingRow?.data?.groom?.fullName && existingRow.data.groom.fullName !== 'Rizky Pratama Putra, S.T.' && gn === existingRow.data.groom.nickname
          ? existingRow.data.groom.fullName
          : gn,
        nickname: gn,
        instagram: `@${gn.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      },
      bride: {
        ...(baseClone.bride || {}),
        fullName: existingRow?.data?.bride?.fullName && existingRow.data.bride.fullName !== 'Siti Nurhaliza Putri, S.Psi.' && bn === existingRow.data.bride.nickname
          ? existingRow.data.bride.fullName
          : bn,
        nickname: bn,
        instagram: `@${bn.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      },
      giftAddress: baseClone.giftAddress
        ? { ...baseClone.giftAddress, recipient: coupleNames }
        : { recipient: coupleNames, phone: '0812-8899-7711', address: 'Jakarta' },
    };

    await syncSettingsToSupabaseClient(updatedSettings, cleanSlug);
    await syncSettingsToSupabaseClient(updatedSettings, 'main');
    await syncSettingsToSupabaseClient(updatedSettings, 'default');
    return updatedSettings;
  } catch {
    return null;
  }
}

export async function fetchSettingsFromSupabaseClient(slugOrId?: string | null): Promise<any | null> {
  if (!isSupabaseReady()) return null;
  try {
    const targetId = slugOrId ? slugOrId.trim().toLowerCase() : 'main';
    const { data, error } = await supabase
      .from('wedding_settings')
      .select('id, data, updated_at')
      .eq('id', targetId)
      .maybeSingle();

    if (!error && data?.data && data.data.groom?.fullName) {
      clearSupabaseKeyError();
      return { ...data.data, updatedAt: data.updated_at || data.data.updatedAt };
    }

    if (targetId !== 'main') {
      // Check if any row has data->>slug matching targetId
      const { data: allRows } = await supabase
        .from('wedding_settings')
        .select('id, data, updated_at')
        .order('updated_at', { ascending: false });
      if (Array.isArray(allRows)) {
        const matched = allRows.find(
          (r: any) =>
            r?.data?.slug && String(r.data.slug).toLowerCase() === targetId
        );
        if (matched?.data?.groom?.fullName) {
          return { ...matched.data, updatedAt: matched.updated_at || matched.data.updatedAt };
        }
      }
    }

    const { data: mainData } = await supabase
      .from('wedding_settings')
      .select('id, data, updated_at')
      .eq('id', 'main')
      .maybeSingle();
    if (mainData?.data?.groom?.fullName) {
      return { ...mainData.data, updatedAt: mainData.updated_at || mainData.data.updatedAt };
    }
    return null;
  } catch {
    return null;
  }
}

export async function syncGuestToSupabaseClient(guest: any): Promise<boolean> {
  if (!isSupabaseReady() || !guest || !guest.id || !guest.name) return false;
  const baseSlug =
    (guest.slug ? String(guest.slug) : String(guest.name))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `tamu-${Date.now()}`;

  const buildPayload = (slugToUse: string) => ({
    id: String(guest.id),
    name: String(guest.name).trim(),
    slug: slugToUse,
    phone: guest.phone ? String(guest.phone).trim() : null,
    category: guest.category || 'Sahabat',
    pax_allocated: Number(guest.paxAllocated ?? 2),
    rsvp_status: guest.rsvpStatus || 'unconfirmed',
    pax_confirmed: Number(guest.paxConfirmed ?? 0),
    checked_in: Boolean(guest.checkedIn),
    checked_in_at: guest.checkedInAt || null,
    notes: guest.notes ? String(guest.notes) : null,
    custom_greeting: guest.customGreeting ? String(guest.customGreeting) : null,
    invitation_sent: Boolean(guest.invitationSent),
    created_at: guest.createdAt ? new Date(guest.createdAt).toISOString() : new Date().toISOString(),
  });

  try {
    let { error } = await supabase
      .from('guests')
      .upsert(buildPayload(baseSlug), { onConflict: 'id' });
    if (error && error.code === '23505') {
      const retry = await supabase
        .from('guests')
        .upsert(buildPayload(`${baseSlug}-${String(guest.id).slice(-4)}`), { onConflict: 'id' });
      error = retry.error;
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

export async function syncGuestsBatchToSupabaseClient(guestsList: any[]): Promise<boolean> {
  if (!isSupabaseReady() || !Array.isArray(guestsList) || guestsList.length === 0) return false;
  try {
    for (const g of guestsList) {
      await syncGuestToSupabaseClient(g);
    }
    return true;
  } catch {
    return false;
  }
}

export async function deleteGuestFromSupabaseClient(guestId: string): Promise<boolean> {
  if (!isSupabaseReady() || !guestId) return false;
  try {
    const { error } = await supabase.from('guests').delete().eq('id', guestId);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchGuestsFromSupabaseClient(): Promise<any[]> {
  if (!isSupabaseReady()) return [];
  try {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !Array.isArray(data)) return [];
    clearSupabaseKeyError();
    return data.map((g: any) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      phone: g.phone || undefined,
      category: g.category || 'Sahabat',
      paxAllocated: Number(g.pax_allocated ?? 2),
      rsvpStatus: g.rsvp_status || 'unconfirmed',
      paxConfirmed: Number(g.pax_confirmed ?? 0),
      checkedIn: Boolean(g.checked_in),
      checkedInAt: g.checked_in_at || null,
      notes: g.notes || undefined,
      customGreeting: g.custom_greeting || undefined,
      invitationSent: Boolean(g.invitation_sent),
      createdAt: g.created_at ? new Date(g.created_at).toISOString() : new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function syncWishToSupabaseClient(wish: any): Promise<boolean> {
  if (!isSupabaseReady() || !wish || !wish.id || !(wish.senderName || wish.name) || !wish.message) {
    return false;
  }
  try {
    const { error } = await supabase
      .from('wishes')
      .upsert(
        {
          id: String(wish.id),
          name: String(wish.senderName || wish.name).trim(),
          attendance: wish.attendance || 'attending',
          message: String(wish.message).trim(),
          is_pinned: Boolean(wish.isPinned),
          is_approved: wish.isApproved !== false,
          admin_reply: wish.adminReply ? String(wish.adminReply).trim() : null,
          created_at: wish.createdAt ? new Date(wish.createdAt).toISOString() : new Date().toISOString(),
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

export async function deleteWishFromSupabaseClient(wishId: string): Promise<boolean> {
  if (!isSupabaseReady() || !wishId) return false;
  try {
    const { error } = await supabase.from('wishes').delete().eq('id', wishId);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchWishesFromSupabaseClient(): Promise<any[]> {
  if (!isSupabaseReady()) return [];
  try {
    const { data, error } = await supabase
      .from('wishes')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (error || !Array.isArray(data)) return [];
    clearSupabaseKeyError();
    return data.map((w: any) => ({
      id: w.id,
      senderName: w.name,
      attendance: w.attendance || 'attending',
      message: w.message,
      pax: 2,
      isPinned: Boolean(w.is_pinned),
      isApproved: w.is_approved !== false,
      reactionCount: 1,
      adminReply: w.admin_reply || undefined,
      createdAt: w.created_at ? new Date(w.created_at).toISOString() : new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function syncGalleryPhotoToSupabaseClient(photo: any): Promise<boolean> {
  if (!isSupabaseReady() || !photo || !photo.id || !photo.url) return false;
  try {
    const { error } = await supabase
      .from('gallery_photos')
      .upsert(
        {
          id: String(photo.id),
          url: String(photo.url),
          caption: String(photo.caption || 'Momen Bahagia'),
          category: String(photo.category || 'Prewedding'),
          is_featured: Boolean(photo.isFeatured),
          uploaded_at: photo.uploadedAt ? new Date(photo.uploadedAt).toISOString() : new Date().toISOString(),
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

export async function deleteGalleryPhotoFromSupabaseClient(photoId: string): Promise<boolean> {
  if (!isSupabaseReady() || !photoId) return false;
  try {
    const { error } = await supabase.from('gallery_photos').delete().eq('id', photoId);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchGalleryPhotosFromSupabaseClient(): Promise<any[]> {
  if (!isSupabaseReady()) return [];
  try {
    const { data, error } = await supabase
      .from('gallery_photos')
      .select('*')
      .order('uploaded_at', { ascending: false });
    if (error || !Array.isArray(data)) return [];
    clearSupabaseKeyError();
    return data.map((p: any) => ({
      id: p.id,
      url: p.url,
      caption: p.caption || 'Momen Bahagia',
      category: p.category || 'Prewedding',
      isFeatured: Boolean(p.is_featured),
      uploadedAt: p.uploaded_at ? new Date(p.uploaded_at).toISOString() : new Date().toISOString(),
    }));
  } catch {
    return [];
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
