export type UserRole = 'super_admin' | 'admin';

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: UserRole;
  isOwner?: boolean;
  avatar?: string;
  active: boolean;
  weddingSlug?: string; // e.g. "thomas_dan_juwita"
  coupleNames?: string; // e.g. "Thomas & Juwita"
  phone?: string; // WhatsApp number for client communication
  notes?: string; // Notes / Package details
  password?: string; // Accessible for Owner credential sharing
  createdBy?: string; // ID of the superadmin who created this user
  createdByName?: string; // Name of the superadmin who created this user
  createdAt: string;
}

export type GuestCategory = 'VIP' | 'Keluarga Inti' | 'Keluarga Besar' | 'Sahabat' | 'Rekan Kerja' | 'Tamu Umum';
export type RSVPStatus = 'attending' | 'not_attending' | 'tentative' | 'unconfirmed';

export interface Guest {
  id: string;
  name: string;
  slug: string;
  phone?: string;
  category: GuestCategory;
  paxAllocated: number;
  rsvpStatus: RSVPStatus;
  paxConfirmed: number;
  checkedIn: boolean;
  checkedInAt: string | null;
  notes?: string;
  invitationSent: boolean;
  customGreeting?: string;
  createdAt: string;
}

export interface Wish {
  id: string;
  senderName: string;
  guestId?: string;
  message: string;
  attendance: RSVPStatus;
  pax: number;
  isPinned: boolean;
  isApproved: boolean;
  reactionCount: number;
  adminReply?: string;
  createdAt: string;
}

export interface WeddingEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  address: string;
  mapUrl: string;
  lat?: number;
  lng?: number;
  placeName?: string;
}

export interface LoveStory {
  id: string;
  year: string;
  title: string;
  description: string;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  caption: string;
  category?: 'Prewedding' | 'Lamaran' | 'Momen Romantis' | 'Akad & Resepsi' | string;
  isFeatured?: boolean;
  uploadedAt?: string;
}

export type ReligionFormat = 'islam' | 'kristen' | 'hindu' | 'buddha' | 'konghucu' | 'universal';

export type ThemeTemplateId =
  | 'royal-javanese-gold'
  | 'botanical-sage-emerald'
  | 'sakura-blush-rose'
  | 'midnight-celestial-navy'
  | 'terracotta-tuscan-sunset'
  | 'champagne-ivory-classic'
  | 'lavender-provence-romance'
  | 'burgundy-velvet-luxury'
  | 'ocean-breeze-santorini'
  | 'minimalist-monochrome-noir'
  | 'sundanese-silver-keraton'
  | 'balinese-tropical-resort';

export interface InvitationFormatConfig {
  religion: ReligionFormat;
  openingGreeting: string;
  openingSubtext?: string;
  holyVerse: {
    label: string; // e.g. "Ayat Suci Al-Qur'an", "Ayat Suci Alkitab", "Sloka Suci Rg Veda", etc.
    text: string;
    source: string;
  };
  ceremonyName: string; // e.g. "Akad Nikah", "Pemberkatan Kudus", "Upacara Pawiwahan", etc.
  receptionName: string; // e.g. "Resepsi Pernikahan", "Walimatul 'Ursy / Resepsi"
  closingGreeting: string; // e.g. "Wassalamu'alaikum Warahmatullahi Wabarakatuh", "Om Shanti Shanti Shanti Om", etc.
  closingBlessing?: string; // Doa / kalimat restu penutup
}

export interface BankAccount {
  id: string;
  bank: string;
  accountNumber: string;
  accountName: string;
  qrisUrl?: string;
}

export interface WeddingSettings {
  id?: string;
  slug?: string; // e.g. "thomas_dan_juwita"
  title: string;
  coupleNames?: string;
  groom: {
    fullName: string;
    nickname: string;
    fatherName: string;
    motherName: string;
    photoUrl: string;
    instagram: string;
    bio: string;
  };
  bride: {
    fullName: string;
    nickname: string;
    fatherName: string;
    motherName: string;
    photoUrl: string;
    instagram: string;
    bio: string;
  };
  events: WeddingEvent[];
  countdownDate: string; // ISO string e.g. '2026-10-24T08:00:00'
  themeTemplateId?: ThemeTemplateId;
  religionFormat?: ReligionFormat;
  invitationFormat?: InvitationFormatConfig;
  quote: {
    text: string;
    source: string;
  };
  loveStories: LoveStory[];
  galleries: GalleryPhoto[];
  bankAccounts: BankAccount[];
  giftAddress: {
    recipient: string;
    phone: string;
    address: string;
  };
  musicUrl: string;
  announcement?: {
    id: string;
    message: string;
    active: boolean;
    createdAt: string;
  } | null;
}

export interface DashboardStats {
  totalGuests: number;
  totalPaxAllocated: number;
  confirmedAttending: number;
  confirmedPax: number;
  confirmedNotAttending: number;
  unconfirmed: number;
  checkedInCount: number;
  totalWishes: number;
  onlineUsers: number;
}

export type RealtimeMessage =
  | { type: 'INIT_DATA'; payload: { wishes: Wish[]; onlineCount: number; announcement?: WeddingSettings['announcement'] } }
  | { type: 'ONLINE_COUNT'; payload: { count: number } }
  | { type: 'NEW_WISH'; payload: Wish }
  | { type: 'UPDATE_WISH'; payload: Wish }
  | { type: 'DELETE_WISH'; payload: { id: string } }
  | { type: 'GUEST_UPDATED'; payload: Guest }
  | { type: 'GUESTS_BATCH_ADDED'; payload: Guest[] }
  | { type: 'GUEST_CHECKED_IN'; payload: { guest: Guest; timestamp: string } }
  | { type: 'SETTINGS_UPDATED'; payload: WeddingSettings }
  | { type: 'GALLERY_UPDATED'; payload: GalleryPhoto[] }
  | { type: 'BROADCAST_ANNOUNCEMENT'; payload: { message: string; timestamp: string } }
  | { type: 'USERS_UPDATED'; payload: AdminUser[] };
