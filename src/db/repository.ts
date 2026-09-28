import { eq, desc } from 'drizzle-orm';
import { db } from './index.ts';
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

// ----------------- SETTINGS -----------------
export async function getSettings(id: string = 'main'): Promise<WeddingSettings | null> {
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
  try {
    await db.insert(guests)
      .values({
        id: guest.id,
        name: guest.name,
        slug: guest.slug,
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
          slug: guest.slug,
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
  } catch (error) {
    console.error('Database query error in upsertGuest:', error);
    throw new Error('Failed to persist guest to database', { cause: error });
  }
}

export async function deleteGuest(id: string): Promise<void> {
  try {
    await db.delete(guests).where(eq(guests.id, id));
  } catch (error) {
    console.error('Database query error in deleteGuest:', error);
    throw new Error('Failed to delete guest from database', { cause: error });
  }
}

// ----------------- WISHES -----------------
export async function getAllWishes(): Promise<Wish[]> {
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
  try {
    await db.delete(wishes).where(eq(wishes.id, id));
  } catch (error) {
    console.error('Database query error in deleteWish:', error);
    throw new Error('Failed to delete wish from database', { cause: error });
  }
}

// ----------------- GALLERIES -----------------
export async function getAllGalleries(): Promise<GalleryPhoto[]> {
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
  try {
    await db.delete(galleryPhotos).where(eq(galleryPhotos.id, id));
  } catch (error) {
    console.error('Database query error in deleteGallery:', error);
    throw new Error('Failed to delete gallery photo from database', { cause: error });
  }
}

// ----------------- USERS -----------------
export async function getAllUsers(): Promise<Array<AdminUser & { password?: string }>> {
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
