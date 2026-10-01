import { eq, desc, asc } from 'drizzle-orm';
import { db, isPostgresReady } from './index.ts';
import {
  supabase,
  isSupabaseReady,
  markSupabaseKeyInvalid,
  clearSupabaseKeyError,
  packCreatedByWithPassword,
  unpackCreatedByAndPassword,
} from '../../supabase.ts';
import { 
  weddingSettingsTable, 
  guests, 
  wishes, 
  galleryPhotos, 
  users 
} from './schema.ts';
import type { 
  WeddingSettings, 
  Guest, 
  Wish, 
  GalleryPhoto, 
  AdminUser 
} from '../types.ts';

let supabaseBackoffUntil = 0;

export function resetSupabaseBackoff() {
  supabaseBackoffUntil = 0;
}

function canUseSupabase(): boolean {
  return isSupabaseReady() && Date.now() >= supabaseBackoffUntil;
}

function handleSupabaseError(err: any) {
  const code = String(err?.code || '');
  const msg = String(err?.message || err || '');
  const lower = msg.toLowerCase();
  if (code === '42501' || lower.includes('permission denied')) {
    supabaseBackoffUntil = Date.now() + 8000;
    markSupabaseKeyInvalid(
      'Izin akses tabel Supabase (GRANT SELECT/INSERT/UPDATE/DELETE) untuk role anon belum aktif. Silakan klik "Salin Script SQL Supabase" di bawah lalu jalankan (Run) di SQL Editor Dashboard Supabase Anda.'
    );
  } else if (
    lower.includes('invalid api key') ||
    lower.includes('jwt') ||
    lower.includes('apikey')
  ) {
    supabaseBackoffUntil = Date.now() + 15000;
    markSupabaseKeyInvalid(
      'API Key Supabase tidak sesuai dengan Project URL. Pastikan VITE_SUPABASE_ANON_KEY atau VITE_SUPABASE_PUBLISHABLE_KEY cocok dengan VITE_SUPABASE_URL proyek Anda.'
    );
  } else if (code === '42P01' || lower.includes('does not exist')) {
    supabaseBackoffUntil = Date.now() + 8000;
    markSupabaseKeyInvalid(
      'Tabel di proyek Supabase Anda belum dibuat. Silakan klik "Salin Script SQL Supabase" di bawah lalu jalankan (Run) di SQL Editor Dashboard Supabase Anda.'
    );
  }
}

export const SUPABASE_SCHEMA_SQL = `-- ============================================================================
-- SCRIPT SQL SUPABASE EKSTERNAL LENGKAP (5 Tabel + GRANT Hak Akses API)
-- Jalankan seluruh script ini di menu SQL Editor pada Dashboard Supabase Anda:
-- https://supabase.com/dashboard/project/aksqfqromigvrkklhjhw/sql/new
-- ============================================================================

-- 1. Tabel Pengaturan Undangan & Multi-Tenant Mempelai (wedding_settings)
CREATE TABLE IF NOT EXISTS public.wedding_settings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Akun Pengelola, Super Admin Mempelai & Admin WO (users)
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  username TEXT,
  password TEXT,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  wedding_slug TEXT,
  couple_names TEXT,
  phone TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT;

-- 3. Tabel Buku Tamu, Kuota Pax, RSVP & Check-in QR (guests)
CREATE TABLE IF NOT EXISTS public.guests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  phone TEXT,
  category TEXT NOT NULL DEFAULT 'Sahabat',
  pax_allocated INTEGER NOT NULL DEFAULT 1,
  rsvp_status TEXT NOT NULL DEFAULT 'unconfirmed',
  pax_confirmed INTEGER NOT NULL DEFAULT 0,
  checked_in BOOLEAN NOT NULL DEFAULT FALSE,
  checked_in_at TEXT,
  notes TEXT,
  custom_greeting TEXT,
  invitation_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Ucapan, Doa Restu & Balasan Mempelai (wishes)
CREATE TABLE IF NOT EXISTS public.wishes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  attendance TEXT NOT NULL DEFAULT 'attending',
  message TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  admin_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Galeri Foto Prewedding & Momen Bahagia (gallery_photos)
CREATE TABLE IF NOT EXISTS public.gallery_photos (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  caption TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Prewedding',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. WAJIB: Berikan Hak Akses Tabel & Sequence ke Role API Supabase (anon & authenticated)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.wedding_settings TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.users TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.guests TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.wishes TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.gallery_photos TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 7. Aktifkan Row Level Security (RLS) & Kebijakan Akses Penuh
ALTER TABLE public.wedding_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wedding_settings' AND policyname = 'Allow full access wedding_settings') THEN
    CREATE POLICY "Allow full access wedding_settings" ON public.wedding_settings FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow full access users') THEN
    CREATE POLICY "Allow full access users" ON public.users FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'guests' AND policyname = 'Allow full access guests') THEN
    CREATE POLICY "Allow full access guests" ON public.guests FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wishes' AND policyname = 'Allow full access wishes') THEN
    CREATE POLICY "Allow full access wishes" ON public.wishes FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gallery_photos' AND policyname = 'Allow full access gallery_photos') THEN
    CREATE POLICY "Allow full access gallery_photos" ON public.gallery_photos FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
  END IF;
END $$;`;

// ----------------- SETTINGS -----------------
export async function getSettings(id: string = 'main'): Promise<WeddingSettings | null> {
  let supaResult: WeddingSettings | null = null;
  if (canUseSupabase()) {
    try {
      const { data, error } = await supabase
        .from('wedding_settings')
        .select('data')
        .eq('id', id)
        .maybeSingle();
      if (error) {
        handleSupabaseError(error);
      } else {
        clearSupabaseKeyError();
        if (data?.data) {
          supaResult = data.data as WeddingSettings;
        }
      }
    } catch (err) {
      handleSupabaseError(err);
    }
  }

  if (isPostgresReady()) {
    try {
      const records = await db.select().from(weddingSettingsTable).where(eq(weddingSettingsTable.id, id));
      if (records.length > 0) {
        const pgData = records[0].data as WeddingSettings;
        return supaResult ? { ...pgData, ...supaResult } : pgData;
      }
    } catch {
      // ignore
    }
  }
  return supaResult;
}

export async function saveSettings(settings: WeddingSettings, id: string = 'main'): Promise<void> {
  if (canUseSupabase()) {
    try {
      const { error } = await supabase
        .from('wedding_settings')
        .upsert(
          {
            id,
            data: settings,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'id' }
        );
      if (error) {
        handleSupabaseError(error);
      } else {
        clearSupabaseKeyError();
      }
    } catch (err) {
      handleSupabaseError(err);
    }
  }

  if (isPostgresReady()) {
    try {
      await db.insert(weddingSettingsTable)
        .values({
          id,
          data: settings,
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: weddingSettingsTable.id,
          set: {
            data: settings,
            updatedAt: new Date()
          }
        });
    } catch {
      // fallback handled in memory
    }
  }
}

export async function getAllWeddings(): Promise<Array<{ id: string; data: WeddingSettings; updatedAt?: string }>> {
  const byId = new Map<string, { data: WeddingSettings; updatedAt?: string }>();

  if (isPostgresReady()) {
    try {
      const records = await db.select().from(weddingSettingsTable).orderBy(asc(weddingSettingsTable.updatedAt));
      for (const r of records) {
        const ts = r.updatedAt ? r.updatedAt.toISOString() : undefined;
        const d = (r.data || {}) as WeddingSettings;
        if (ts) (d as any).updatedAt = ts;
        byId.set(r.id, { data: d, updatedAt: ts });
      }
    } catch {
      // ignore
    }
  }

  if (canUseSupabase()) {
    try {
      const { data, error } = await supabase
        .from('wedding_settings')
        .select('id, data, updated_at')
        .order('updated_at', { ascending: true });
      if (error) {
        handleSupabaseError(error);
      } else if (Array.isArray(data)) {
        clearSupabaseKeyError();
        for (const r of data as any[]) {
          const ts = r.updated_at ? new Date(r.updated_at).toISOString() : undefined;
          const d = (r.data || {}) as WeddingSettings;
          if (ts) (d as any).updatedAt = ts;
          byId.set(String(r.id), { data: d, updatedAt: ts });
        }
      }
    } catch (err) {
      handleSupabaseError(err);
    }
  }

  return Array.from(byId.entries()).map(([id, val]) => ({ id, data: val.data, updatedAt: val.updatedAt }));
}

// ----------------- GUESTS -----------------
export async function getAllGuests(): Promise<Guest[]> {
  const byId = new Map<string, Guest>();

  if (isPostgresReady()) {
    try {
      const list = await db.select().from(guests).orderBy(desc(guests.createdAt));
      for (const g of list) {
        byId.set(g.id, {
          id: g.id,
          name: g.name,
          slug: g.slug,
          phone: g.phone || undefined,
          category: g.category as Guest['category'],
          paxAllocated: g.paxAllocated,
          rsvpStatus: g.rsvpStatus as Guest['rsvpStatus'],
          paxConfirmed: g.paxConfirmed,
          checkedIn: g.checkedIn,
          checkedInAt: g.checkedInAt || null,
          notes: g.notes || undefined,
          customGreeting: g.customGreeting || undefined,
          invitationSent: g.invitationSent,
          createdAt: g.createdAt ? g.createdAt.toISOString() : new Date().toISOString()
        });
      }
    } catch {
      // ignore
    }
  }

  if (canUseSupabase()) {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        handleSupabaseError(error);
      } else if (Array.isArray(data)) {
        clearSupabaseKeyError();
        for (const g of data as any[]) {
          byId.set(g.id, {
            id: g.id,
            name: g.name,
            slug: g.slug,
            phone: g.phone || undefined,
            category: (g.category || 'Sahabat') as Guest['category'],
            paxAllocated: Number(g.pax_allocated ?? 1),
            rsvpStatus: (g.rsvp_status || 'unconfirmed') as Guest['rsvpStatus'],
            paxConfirmed: Number(g.pax_confirmed ?? 0),
            checkedIn: Boolean(g.checked_in),
            checkedInAt: g.checked_in_at || null,
            notes: g.notes || undefined,
            customGreeting: g.custom_greeting || undefined,
            invitationSent: Boolean(g.invitation_sent),
            createdAt: g.created_at ? new Date(g.created_at).toISOString() : new Date().toISOString()
          });
        }
      }
    } catch (err) {
      handleSupabaseError(err);
    }
  }

  const merged = Array.from(byId.values());
  merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return merged;
}

export async function upsertGuest(guest: Guest): Promise<void> {
  if (canUseSupabase()) {
    const buildPayload = (slugToUse: string) => ({
      id: guest.id,
      name: guest.name,
      slug: slugToUse,
      phone: guest.phone || null,
      category: guest.category,
      pax_allocated: guest.paxAllocated,
      rsvp_status: guest.rsvpStatus,
      pax_confirmed: guest.paxConfirmed,
      checked_in: guest.checkedIn,
      checked_in_at: guest.checkedInAt || null,
      notes: guest.notes || null,
      custom_greeting: guest.customGreeting || null,
      invitation_sent: guest.invitationSent,
      created_at: guest.createdAt ? new Date(guest.createdAt).toISOString() : new Date().toISOString()
    });

    try {
      const { error } = await supabase
        .from('guests')
        .upsert(buildPayload(guest.slug), { onConflict: 'id' });
      if (error) {
        handleSupabaseError(error);
        if (error.code === '23505') {
          await supabase
            .from('guests')
            .upsert(buildPayload(`${guest.slug}-${guest.id.slice(-4)}`), { onConflict: 'id' });
        }
      } else {
        clearSupabaseKeyError();
      }
    } catch (err) {
      handleSupabaseError(err);
    }
  }

  if (isPostgresReady()) {
    const attemptUpsert = async (slugToUse: string) => {
      await db.insert(guests)
        .values({
          id: guest.id,
          name: guest.name,
          slug: slugToUse,
          phone: guest.phone || null,
          category: guest.category,
          paxAllocated: guest.paxAllocated,
          rsvpStatus: guest.rsvpStatus,
          paxConfirmed: guest.paxConfirmed,
          checkedIn: guest.checkedIn,
          checkedInAt: guest.checkedInAt || null,
          notes: guest.notes || null,
          customGreeting: guest.customGreeting || null,
          invitationSent: guest.invitationSent,
          createdAt: guest.createdAt ? new Date(guest.createdAt) : new Date()
        })
        .onConflictDoUpdate({
          target: guests.id,
          set: {
            name: guest.name,
            slug: slugToUse,
            phone: guest.phone || null,
            category: guest.category,
            paxAllocated: guest.paxAllocated,
            rsvpStatus: guest.rsvpStatus,
            paxConfirmed: guest.paxConfirmed,
            checkedIn: guest.checkedIn,
            checkedInAt: guest.checkedInAt || null,
            notes: guest.notes || null,
            customGreeting: guest.customGreeting || null,
            invitationSent: guest.invitationSent
          }
        });
    };

    try {
      await attemptUpsert(guest.slug);
    } catch {
      try {
        await attemptUpsert(`${guest.slug}-${guest.id.slice(-4)}`);
      } catch {
        // fallback handled in memory
      }
    }
  }
}

export async function deleteGuest(id: string): Promise<void> {
  if (canUseSupabase()) {
    try {
      const { error } = await supabase.from('guests').delete().eq('id', id);
      if (error) handleSupabaseError(error);
    } catch (err) {
      handleSupabaseError(err);
    }
  }

  if (isPostgresReady()) {
    try {
      await db.delete(guests).where(eq(guests.id, id));
    } catch {
      // fallback handled in memory
    }
  }
}

// ----------------- WISHES -----------------
export async function getAllWishes(): Promise<Wish[]> {
  const byId = new Map<string, Wish>();

  if (isPostgresReady()) {
    try {
      const list = await db.select().from(wishes).orderBy(desc(wishes.isPinned), desc(wishes.createdAt));
      for (const w of list) {
        byId.set(w.id, {
          id: w.id,
          senderName: w.name,
          attendance: (w.attendance || 'attending') as Wish['attendance'],
          message: w.message,
          pax: 1,
          isPinned: w.isPinned,
          isApproved: w.isApproved,
          reactionCount: 0,
          adminReply: w.adminReply || undefined,
          createdAt: w.createdAt ? w.createdAt.toISOString() : new Date().toISOString()
        });
      }
    } catch {
      // ignore
    }
  }

  if (canUseSupabase()) {
    try {
      const { data, error } = await supabase
        .from('wishes')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) {
        handleSupabaseError(error);
      } else if (Array.isArray(data)) {
        clearSupabaseKeyError();
        for (const w of data as any[]) {
          byId.set(w.id, {
            id: w.id,
            senderName: w.name,
            attendance: (w.attendance || 'attending') as Wish['attendance'],
            message: w.message,
            pax: 1,
            isPinned: Boolean(w.is_pinned),
            isApproved: w.is_approved !== false,
            reactionCount: 0,
            adminReply: w.admin_reply || undefined,
            createdAt: w.created_at ? new Date(w.created_at).toISOString() : new Date().toISOString()
          });
        }
      }
    } catch (err) {
      handleSupabaseError(err);
    }
  }

  return Array.from(byId.values());
}

export async function upsertWish(wish: Wish): Promise<void> {
  if (canUseSupabase()) {
    try {
      const { error } = await supabase
        .from('wishes')
        .upsert(
          {
            id: wish.id,
            name: wish.senderName,
            attendance: wish.attendance,
            message: wish.message,
            is_pinned: wish.isPinned,
            is_approved: wish.isApproved,
            admin_reply: wish.adminReply || null,
            created_at: wish.createdAt ? new Date(wish.createdAt).toISOString() : new Date().toISOString()
          },
          { onConflict: 'id' }
        );
      if (error) handleSupabaseError(error);
      else clearSupabaseKeyError();
    } catch (err) {
      handleSupabaseError(err);
    }
  }

  if (isPostgresReady()) {
    try {
      await db.insert(wishes)
        .values({
          id: wish.id,
          name: wish.senderName,
          attendance: wish.attendance,
          message: wish.message,
          isPinned: wish.isPinned,
          isApproved: wish.isApproved,
          adminReply: wish.adminReply || null,
          createdAt: wish.createdAt ? new Date(wish.createdAt) : new Date()
        })
        .onConflictDoUpdate({
          target: wishes.id,
          set: {
            name: wish.senderName,
            attendance: wish.attendance,
            message: wish.message,
            isPinned: wish.isPinned,
            isApproved: wish.isApproved,
            adminReply: wish.adminReply || null
          }
        });
    } catch {
      // fallback handled in memory
    }
  }
}

export async function deleteWish(id: string): Promise<void> {
  if (canUseSupabase()) {
    try {
      const { error } = await supabase.from('wishes').delete().eq('id', id);
      if (error) handleSupabaseError(error);
    } catch (err) {
      handleSupabaseError(err);
    }
  }

  if (isPostgresReady()) {
    try {
      await db.delete(wishes).where(eq(wishes.id, id));
    } catch {
      // fallback handled in memory
    }
  }
}

// ----------------- GALLERIES -----------------
export async function getAllGalleries(): Promise<GalleryPhoto[]> {
  const byId = new Map<string, GalleryPhoto>();

  if (isPostgresReady()) {
    try {
      const list = await db.select().from(galleryPhotos).orderBy(desc(galleryPhotos.uploadedAt));
      for (const p of list) {
        byId.set(p.id, {
          id: p.id,
          url: p.url,
          caption: p.caption,
          category: p.category,
          isFeatured: p.isFeatured,
          uploadedAt: p.uploadedAt ? p.uploadedAt.toISOString() : new Date().toISOString()
        });
      }
    } catch {
      // ignore
    }
  }

  if (canUseSupabase()) {
    try {
      const { data, error } = await supabase
        .from('gallery_photos')
        .select('*')
        .order('uploaded_at', { ascending: false });
      if (error) {
        handleSupabaseError(error);
      } else if (Array.isArray(data)) {
        clearSupabaseKeyError();
        for (const p of data as any[]) {
          byId.set(p.id, {
            id: p.id,
            url: p.url,
            caption: p.caption,
            category: p.category || 'Prewedding',
            isFeatured: Boolean(p.is_featured),
            uploadedAt: p.uploaded_at ? new Date(p.uploaded_at).toISOString() : new Date().toISOString()
          });
        }
      }
    } catch (err) {
      handleSupabaseError(err);
    }
  }

  return Array.from(byId.values());
}

export async function upsertGallery(photo: GalleryPhoto): Promise<void> {
  if (canUseSupabase()) {
    try {
      const { error } = await supabase
        .from('gallery_photos')
        .upsert(
          {
            id: photo.id,
            url: photo.url,
            caption: photo.caption,
            category: photo.category,
            is_featured: photo.isFeatured,
            uploaded_at: photo.uploadedAt ? new Date(photo.uploadedAt).toISOString() : new Date().toISOString()
          },
          { onConflict: 'id' }
        );
      if (error) handleSupabaseError(error);
      else clearSupabaseKeyError();
    } catch (err) {
      handleSupabaseError(err);
    }
  }

  if (isPostgresReady()) {
    try {
      await db.insert(galleryPhotos)
        .values({
          id: photo.id,
          url: photo.url,
          caption: photo.caption,
          category: photo.category,
          isFeatured: photo.isFeatured,
          uploadedAt: photo.uploadedAt ? new Date(photo.uploadedAt) : new Date()
        })
        .onConflictDoUpdate({
          target: galleryPhotos.id,
          set: {
            url: photo.url,
            caption: photo.caption,
            category: photo.category,
            isFeatured: photo.isFeatured
          }
        });
    } catch {
      // fallback handled in memory
    }
  }
}

export async function deleteGallery(id: string): Promise<void> {
  if (canUseSupabase()) {
    try {
      const { error } = await supabase.from('gallery_photos').delete().eq('id', id);
      if (error) handleSupabaseError(error);
    } catch (err) {
      handleSupabaseError(err);
    }
  }

  if (isPostgresReady()) {
    try {
      await db.delete(galleryPhotos).where(eq(galleryPhotos.id, id));
    } catch {
      // fallback handled in memory
    }
  }
}

// ----------------- USERS -----------------
export async function getAllUsers(): Promise<Array<AdminUser & { password?: string }>> {
  const byKey = new Map<string, AdminUser & { password?: string }>();

  if (isPostgresReady()) {
    try {
      const list = await db.select().from(users).orderBy(desc(users.createdAt));
      for (const u of list) {
        const id = u.uid || `user-${u.id}`;
        const uname = (u.username || u.email.split('@')[0]).toLowerCase();
        byKey.set(uname, {
          id,
          username: u.username || u.email.split('@')[0],
          password: u.password || undefined,
          name: u.name || u.username || u.email.split('@')[0],
          email: u.email,
          role: (u.role === 'owner' ? 'super_admin' : (u.role as AdminUser['role'])) || 'admin',
          weddingSlug: u.weddingSlug || undefined,
          coupleNames: u.coupleNames || undefined,
          phone: u.phone || undefined,
          notes: u.notes || undefined,
          active: u.active !== false,
          createdBy: u.createdBy || undefined,
          createdByName: u.createdByName || undefined,
          isOwner:
            u.role === 'owner' ||
            u.email?.toLowerCase() === 'asepsulistiyono1@gmail.com' ||
            u.username?.toLowerCase() === 'asepsulistiyono1',
          createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString()
        });
      }
    } catch {
      // ignore
    }
  }

  if (canUseSupabase()) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        handleSupabaseError(error);
      } else if (Array.isArray(data)) {
        clearSupabaseKeyError();
        for (const u of data as any[]) {
          const id = u.uid || `user-${u.id}`;
          const uname = (u.username || (u.email ? String(u.email).split('@')[0] : 'admin')).toLowerCase();
          const existing = byKey.get(uname);
          const isOwnerRow =
            u.role === 'owner' ||
            String(u.email || '').toLowerCase() === 'asepsulistiyono1@gmail.com' ||
            String(u.username || '').toLowerCase() === 'asepsulistiyono1';
          const unpacked = unpackCreatedByAndPassword(u.created_by, u.password);
          byKey.set(uname, {
            id: isOwnerRow ? 'user-owner-1' : (existing?.id || id),
            username: u.username || existing?.username || (u.email ? String(u.email).split('@')[0] : 'admin'),
            password: unpacked.password || existing?.password || undefined,
            name: u.name || existing?.name || u.username || (u.email ? String(u.email).split('@')[0] : 'Admin'),
            email: u.email || existing?.email,
            role: (u.role === 'owner' ? 'super_admin' : (u.role as AdminUser['role'])) || existing?.role || 'admin',
            weddingSlug: u.wedding_slug || existing?.weddingSlug || undefined,
            coupleNames: u.couple_names || existing?.coupleNames || undefined,
            phone: u.phone || existing?.phone || undefined,
            notes: u.notes || existing?.notes || undefined,
            active: u.active !== false,
            createdBy: unpacked.createdBy || existing?.createdBy || undefined,
            createdByName: u.created_by_name || existing?.createdByName || undefined,
            isOwner: isOwnerRow,
            createdAt: u.created_at ? new Date(u.created_at).toISOString() : (existing?.createdAt || new Date().toISOString())
          });
        }
      }
    } catch (err) {
      handleSupabaseError(err);
    }
  }

  return Array.from(byKey.values());
}

export async function createDbUser(user: {
  uid: string;
  username?: string;
  password?: string;
  email: string;
  name?: string;
  role?: string;
  weddingSlug?: string;
  coupleNames?: string;
  phone?: string;
  notes?: string;
  active?: boolean;
  createdBy?: string;
  createdByName?: string;
}): Promise<void> {
  if (isSupabaseReady()) {
    try {
      const cleanUsername = user.username || user.email.split('@')[0];
      const baseRow: Record<string, any> = {
        uid: user.uid,
        username: cleanUsername,
        email: user.email,
        name: user.name || cleanUsername,
        role: user.role || 'admin',
        wedding_slug: user.weddingSlug || null,
        couple_names: user.coupleNames || null,
        phone: user.phone || null,
        notes: user.notes || null,
        active: user.active !== false,
        created_by: user.createdBy || null,
        created_by_name: user.createdByName || null
      };

      // Clean up any existing row in Supabase with the same username or email but a different uid
      const { data: existingSupaUsers } = await supabase.from('users').select('uid, username, email');
      if (Array.isArray(existingSupaUsers)) {
        for (const r of existingSupaUsers as any[]) {
          if (
            r.uid &&
            r.uid !== user.uid &&
            ((r.username && String(r.username).toLowerCase() === cleanUsername.toLowerCase()) ||
              (r.email && String(r.email).toLowerCase() === user.email.toLowerCase()))
          ) {
            await supabase.from('users').delete().eq('uid', r.uid);
          }
        }
      }

      let { error } = await supabase
        .from('users')
        .upsert({ ...baseRow, password: user.password || null }, { onConflict: 'uid' });

      // If the user's Supabase users table does not have a 'password' column (PGRST204), upsert with password packed in created_by
      if (error && (error.code === 'PGRST204' || String(error.message || '').includes('password'))) {
        const retryRes = await supabase
          .from('users')
          .upsert(
            {
              ...baseRow,
              created_by: packCreatedByWithPassword(user.createdBy, user.password),
            },
            { onConflict: 'uid' }
          );
        error = retryRes.error;
      }

      if (error) handleSupabaseError(error);
      else clearSupabaseKeyError();
    } catch (err) {
      handleSupabaseError(err);
    }
  }

  if (isPostgresReady()) {
    try {
      const cleanUsername = user.username || user.email.split('@')[0];
      const existingRows = await db.select().from(users);
      const duplicateByUsernameOrEmail = existingRows.filter(
        (r) =>
          r.uid !== user.uid &&
          ((r.username && r.username.toLowerCase() === cleanUsername.toLowerCase()) ||
            (r.email && r.email.toLowerCase() === user.email.toLowerCase()))
      );
      for (const dup of duplicateByUsernameOrEmail) {
        await db.delete(users).where(eq(users.uid, dup.uid));
      }

      await db.insert(users)
        .values({
          uid: user.uid,
          username: cleanUsername,
          password: user.password || null,
          email: user.email,
          name: user.name || cleanUsername,
          role: user.role || 'admin',
          weddingSlug: user.weddingSlug || null,
          coupleNames: user.coupleNames || null,
          phone: user.phone || null,
          notes: user.notes || null,
          active: user.active !== false,
          createdBy: user.createdBy || null,
          createdByName: user.createdByName || null,
          createdAt: new Date()
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            username: cleanUsername,
            password: user.password || null,
            email: user.email,
            name: user.name || cleanUsername,
            role: user.role || 'admin',
            weddingSlug: user.weddingSlug || null,
            coupleNames: user.coupleNames || null,
            phone: user.phone || null,
            notes: user.notes || null,
            active: user.active !== false,
            createdBy: user.createdBy || null,
            createdByName: user.createdByName || null,
            createdAt: new Date()
          }
        });
    } catch (err) {
      console.error('Postgres createDbUser error:', err);
    }
  }
}

export async function deleteDbUser(uid: string): Promise<void> {
  if (canUseSupabase()) {
    try {
      const { error } = await supabase.from('users').delete().eq('uid', uid);
      if (error) handleSupabaseError(error);
    } catch (err) {
      handleSupabaseError(err);
    }
  }

  if (isPostgresReady()) {
    try {
      await db.delete(users).where(eq(users.uid, uid));
    } catch {
      // fallback handled in memory
    }
  }
}

export async function getTableCounts(): Promise<{
  wedding_settings: number;
  guests: number;
  wishes: number;
  gallery_photos: number;
  users: number;
}> {
  resetSupabaseBackoff();
  if (isSupabaseReady()) {
    try {
      const [settingsRes, guestsRes, wishesRes, galleryRes, usersRes] = await Promise.all([
        supabase.from('wedding_settings').select('id'),
        supabase.from('guests').select('id'),
        supabase.from('wishes').select('id'),
        supabase.from('gallery_photos').select('id'),
        supabase.from('users').select('uid'),
      ]);

      const firstError =
        settingsRes.error ||
        guestsRes.error ||
        wishesRes.error ||
        galleryRes.error ||
        usersRes.error;

      if (!firstError) {
        clearSupabaseKeyError();
        return {
          wedding_settings: settingsRes.data?.length ?? 0,
          guests: guestsRes.data?.length ?? 0,
          wishes: wishesRes.data?.length ?? 0,
          gallery_photos: galleryRes.data?.length ?? 0,
          users: usersRes.data?.length ?? 0,
        };
      }
      handleSupabaseError(firstError);
    } catch (err) {
      handleSupabaseError(err);
    }
  }

  if (isPostgresReady()) {
    try {
      const [settingsRows, guestsRows, wishesRows, galleryRows, usersRows] = await Promise.all([
        db.select().from(weddingSettingsTable),
        db.select().from(guests),
        db.select().from(wishes),
        db.select().from(galleryPhotos),
        db.select().from(users),
      ]);
      return {
        wedding_settings: settingsRows.length,
        guests: guestsRows.length,
        wishes: wishesRows.length,
        gallery_photos: galleryRows.length,
        users: usersRows.length,
      };
    } catch {
      // ignore
    }
  }

  return {
    wedding_settings: 1,
    guests: 0,
    wishes: 0,
    gallery_photos: 0,
    users: 4,
  };
}
