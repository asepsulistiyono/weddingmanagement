import { eq, desc } from 'drizzle-orm';
import { db } from './index.ts';
import { supabase, isSupabaseConfigured } from '../../supabase.ts';
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

export const SUPABASE_SCHEMA_SQL = `-- ============================================================================
-- SCRIPT SQL SUPABASE EKSTERNAL (Jalankan di SQL Editor Dashboard Supabase)
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

-- Aktifkan Row Level Security (RLS) & Kebijakan Akses API Aplikasi
ALTER TABLE public.wedding_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wedding_settings' AND policyname = 'Allow full access wedding_settings') THEN
    CREATE POLICY "Allow full access wedding_settings" ON public.wedding_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow full access users') THEN
    CREATE POLICY "Allow full access users" ON public.users FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'guests' AND policyname = 'Allow full access guests') THEN
    CREATE POLICY "Allow full access guests" ON public.guests FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wishes' AND policyname = 'Allow full access wishes') THEN
    CREATE POLICY "Allow full access wishes" ON public.wishes FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gallery_photos' AND policyname = 'Allow full access gallery_photos') THEN
    CREATE POLICY "Allow full access gallery_photos" ON public.gallery_photos FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;`;

// ----------------- SETTINGS -----------------
export async function getSettings(id: string = 'main'): Promise<WeddingSettings | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('wedding_settings')
        .select('data')
        .eq('id', id)
        .maybeSingle();
      if (!error && data?.data) {
        return data.data as WeddingSettings;
      }
    } catch (err) {
      console.error(`Supabase getSettings(${id}) error:`, err);
    }
  }

  try {
    const records = await db.select().from(weddingSettingsTable).where(eq(weddingSettingsTable.id, id));
    if (records.length > 0) {
      return records[0].data as WeddingSettings;
    }
    return null;
  } catch (error) {
    console.error(`Database query error in getSettings(${id}):`, error);
    return null;
  }
}

export async function saveSettings(settings: WeddingSettings, id: string = 'main'): Promise<void> {
  if (isSupabaseConfigured) {
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
      if (!error) return;
      console.error(`Supabase saveSettings(${id}) error:`, error.message);
    } catch (err) {
      console.error(`Supabase saveSettings(${id}) exception:`, err);
    }
  }

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
  } catch (error) {
    console.error(`Database query error in saveSettings(${id}):`, error);
  }
}

export async function getAllWeddings(): Promise<Array<{ id: string; data: WeddingSettings }>> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('wedding_settings')
        .select('id, data');
      if (!error && Array.isArray(data)) {
        return data.map(r => ({ id: String(r.id), data: r.data as WeddingSettings }));
      }
    } catch (err) {
      console.error('Supabase getAllWeddings error:', err);
    }
  }

  try {
    const records = await db.select().from(weddingSettingsTable);
    return records.map(r => ({ id: r.id, data: r.data as WeddingSettings }));
  } catch (error) {
    console.error('Database query error in getAllWeddings:', error);
    return [];
  }
}

// ----------------- GUESTS -----------------
export async function getAllGuests(): Promise<Guest[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && Array.isArray(data)) {
      return data.map((g: any) => ({
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
      }));
    }
    if (error) {
      throw new Error(`Supabase guests error: ${error.message}`);
    }
  }

  try {
    const list = await db.select().from(guests).orderBy(desc(guests.createdAt));
    return list.map(g => ({
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
    }));
  } catch (error) {
    console.error('Database query error in getAllGuests:', error);
    throw new Error('Failed to retrieve guests from database', { cause: error });
  }
}

export async function upsertGuest(guest: Guest): Promise<void> {
  if (isSupabaseConfigured) {
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
      if (!error) return;
      // Retry with unique slug suffix if slug collision
      const { error: retryErr } = await supabase
        .from('guests')
        .upsert(buildPayload(`${guest.slug}-${guest.id.slice(-4)}`), { onConflict: 'id' });
      if (!retryErr) return;
      console.error('Supabase upsertGuest error:', retryErr.message);
    } catch (err) {
      console.error('Supabase upsertGuest exception:', err);
    }
  }

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
  } catch (error) {
    try {
      await attemptUpsert(`${guest.slug}-${guest.id.slice(-4)}`);
    } catch (retryError) {
      console.error('Database query error in upsertGuest:', retryError);
    }
  }
}

export async function deleteGuest(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('guests').delete().eq('id', id);
      if (!error) return;
      console.error('Supabase deleteGuest error:', error.message);
    } catch (err) {
      console.error('Supabase deleteGuest exception:', err);
    }
  }

  try {
    await db.delete(guests).where(eq(guests.id, id));
  } catch (error) {
    console.error('Database query error in deleteGuest:', error);
    throw new Error('Failed to delete guest from database', { cause: error });
  }
}

// ----------------- WISHES -----------------
export async function getAllWishes(): Promise<Wish[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('wishes')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (!error && Array.isArray(data)) {
      return data.map((w: any) => ({
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
      }));
    }
    if (error) {
      throw new Error(`Supabase wishes error: ${error.message}`);
    }
  }

  try {
    const list = await db.select().from(wishes).orderBy(desc(wishes.isPinned), desc(wishes.createdAt));
    return list.map(w => ({
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
    }));
  } catch (error) {
    console.error('Database query error in getAllWishes:', error);
    throw new Error('Failed to retrieve wishes from database', { cause: error });
  }
}

export async function upsertWish(wish: Wish): Promise<void> {
  if (isSupabaseConfigured) {
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
      if (!error) return;
      console.error('Supabase upsertWish error:', error.message);
    } catch (err) {
      console.error('Supabase upsertWish exception:', err);
    }
  }

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
  } catch (error) {
    console.error('Database query error in upsertWish:', error);
    throw new Error('Failed to persist wish to database', { cause: error });
  }
}

export async function deleteWish(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('wishes').delete().eq('id', id);
      if (!error) return;
      console.error('Supabase deleteWish error:', error.message);
    } catch (err) {
      console.error('Supabase deleteWish exception:', err);
    }
  }

  try {
    await db.delete(wishes).where(eq(wishes.id, id));
  } catch (error) {
    console.error('Database query error in deleteWish:', error);
    throw new Error('Failed to delete wish from database', { cause: error });
  }
}

// ----------------- GALLERIES -----------------
export async function getAllGalleries(): Promise<GalleryPhoto[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('gallery_photos')
      .select('*')
      .order('uploaded_at', { ascending: false });
    if (!error && Array.isArray(data)) {
      return data.map((p: any) => ({
        id: p.id,
        url: p.url,
        caption: p.caption,
        category: p.category || 'Prewedding',
        isFeatured: Boolean(p.is_featured),
        uploadedAt: p.uploaded_at ? new Date(p.uploaded_at).toISOString() : new Date().toISOString()
      }));
    }
    if (error) {
      throw new Error(`Supabase gallery_photos error: ${error.message}`);
    }
  }

  try {
    const list = await db.select().from(galleryPhotos).orderBy(desc(galleryPhotos.uploadedAt));
    return list.map(p => ({
      id: p.id,
      url: p.url,
      caption: p.caption,
      category: p.category,
      isFeatured: p.isFeatured,
      uploadedAt: p.uploadedAt ? p.uploadedAt.toISOString() : new Date().toISOString()
    }));
  } catch (error) {
    console.error('Database query error in getAllGalleries:', error);
    throw new Error('Failed to retrieve gallery photos from database', { cause: error });
  }
}

export async function upsertGallery(photo: GalleryPhoto): Promise<void> {
  if (isSupabaseConfigured) {
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
      if (!error) return;
      console.error('Supabase upsertGallery error:', error.message);
    } catch (err) {
      console.error('Supabase upsertGallery exception:', err);
    }
  }

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
  } catch (error) {
    console.error('Database query error in upsertGallery:', error);
    throw new Error('Failed to persist gallery photo to database', { cause: error });
  }
}

export async function deleteGallery(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('gallery_photos').delete().eq('id', id);
      if (!error) return;
      console.error('Supabase deleteGallery error:', error.message);
    } catch (err) {
      console.error('Supabase deleteGallery exception:', err);
    }
  }

  try {
    await db.delete(galleryPhotos).where(eq(galleryPhotos.id, id));
  } catch (error) {
    console.error('Database query error in deleteGallery:', error);
    throw new Error('Failed to delete gallery photo from database', { cause: error });
  }
}

// ----------------- USERS -----------------
export async function getAllUsers(): Promise<Array<AdminUser & { password?: string }>> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && Array.isArray(data)) {
      return data.map((u: any) => ({
        id: u.uid || `user-${u.id}`,
        username: u.username || (u.email ? String(u.email).split('@')[0] : 'admin'),
        password: u.password || undefined,
        name: u.name || u.username || (u.email ? String(u.email).split('@')[0] : 'Admin'),
        email: u.email,
        role: (u.role as AdminUser['role']) || 'admin',
        weddingSlug: u.wedding_slug || undefined,
        coupleNames: u.couple_names || undefined,
        phone: u.phone || undefined,
        notes: u.notes || undefined,
        active: u.active !== false,
        createdBy: u.created_by || undefined,
        createdByName: u.created_by_name || undefined,
        isOwner:
          String(u.email || '').toLowerCase() === 'asepsulistiyono1@gmail.com' ||
          String(u.username || '').toLowerCase() === 'asepsulistiyono1',
        createdAt: u.created_at ? new Date(u.created_at).toISOString() : new Date().toISOString()
      }));
    }
    if (error) {
      throw new Error(`Supabase users error: ${error.message}`);
    }
  }

  try {
    const list = await db.select().from(users).orderBy(desc(users.createdAt));
    return list.map(u => ({
      id: u.uid || `user-${u.id}`,
      username: u.username || u.email.split('@')[0],
      password: u.password || undefined,
      name: u.name || u.username || u.email.split('@')[0],
      email: u.email,
      role: (u.role as AdminUser['role']) || 'admin',
      weddingSlug: u.weddingSlug || undefined,
      coupleNames: u.coupleNames || undefined,
      phone: u.phone || undefined,
      notes: u.notes || undefined,
      active: u.active !== false,
      createdBy: u.createdBy || undefined,
      createdByName: u.createdByName || undefined,
      isOwner: u.email?.toLowerCase() === 'asepsulistiyono1@gmail.com' || u.username?.toLowerCase() === 'asepsulistiyono1',
      createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString()
    }));
  } catch (error) {
    console.error('Database query error in getAllUsers:', error);
    throw new Error('Failed to retrieve users from database', { cause: error });
  }
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
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('users')
        .upsert(
          {
            uid: user.uid,
            username: user.username || user.email.split('@')[0],
            password: user.password || null,
            email: user.email,
            name: user.name || user.username || user.email.split('@')[0],
            role: user.role || 'admin',
            wedding_slug: user.weddingSlug || null,
            couple_names: user.coupleNames || null,
            phone: user.phone || null,
            notes: user.notes || null,
            active: user.active !== false,
            created_by: user.createdBy || null,
            created_by_name: user.createdByName || null
          },
          { onConflict: 'uid' }
        );
      if (!error) return;
      console.error('Supabase createDbUser error:', error.message);
    } catch (err) {
      console.error('Supabase createDbUser exception:', err);
    }
  }

  try {
    await db.insert(users)
      .values({
        uid: user.uid,
        username: user.username || user.email.split('@')[0],
        password: user.password || null,
        email: user.email,
        name: user.name || user.username || user.email.split('@')[0],
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
          username: user.username || user.email.split('@')[0],
          password: user.password || null,
          email: user.email,
          name: user.name || user.username || user.email.split('@')[0],
          role: user.role || 'admin',
          weddingSlug: user.weddingSlug || null,
          coupleNames: user.coupleNames || null,
          phone: user.phone || null,
          notes: user.notes || null,
          active: user.active !== false,
          createdBy: user.createdBy || null,
          createdByName: user.createdByName || null
        }
      });
  } catch (error) {
    console.error('Database query error in createDbUser:', error);
    throw new Error('Failed to register user to database', { cause: error });
  }
}

export async function deleteDbUser(uid: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('users').delete().eq('uid', uid);
      if (!error) return;
      console.error('Supabase deleteDbUser error:', error.message);
    } catch (err) {
      console.error('Supabase deleteDbUser exception:', err);
    }
  }

  try {
    await db.delete(users).where(eq(users.uid, uid));
  } catch (error) {
    console.error('Database query error in deleteDbUser:', error);
  }
}

export async function getTableCounts(): Promise<{
  wedding_settings: number;
  guests: number;
  wishes: number;
  gallery_photos: number;
  users: number;
}> {
  if (isSupabaseConfigured) {
    const [settingsRes, guestsRes, wishesRes, galleryRes, usersRes] = await Promise.all([
      supabase.from('wedding_settings').select('id', { count: 'exact', head: true }),
      supabase.from('guests').select('id', { count: 'exact', head: true }),
      supabase.from('wishes').select('id', { count: 'exact', head: true }),
      supabase.from('gallery_photos').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('uid', { count: 'exact', head: true }),
    ]);

    const firstError =
      settingsRes.error ||
      guestsRes.error ||
      wishesRes.error ||
      galleryRes.error ||
      usersRes.error;

    if (firstError) {
      throw new Error(
        `Tabel Supabase belum lengkap atau belum diinisialisasi (${firstError.message}). Jalankan Script SQL di SQL Editor Supabase Anda.`
      );
    }

    return {
      wedding_settings: settingsRes.count ?? 0,
      guests: guestsRes.count ?? 0,
      wishes: wishesRes.count ?? 0,
      gallery_photos: galleryRes.count ?? 0,
      users: usersRes.count ?? 0,
    };
  }

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
}
