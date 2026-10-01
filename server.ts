import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import * as dbRepo from './src/db/repository.ts';
import { getActiveConnectionInfo } from './src/db/index.ts';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import type { 
  AdminUser, 
  Guest, 
  GuestCategory,
  Wish, 
  WeddingSettings, 
  DashboardStats,
  RealtimeMessage,
  GalleryPhoto
} from './src/types.ts';

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// In-memory persistent state (can also store to disk or persist during lifetime)
let weddingSettings: WeddingSettings = {
  slug: 'rizky_dan_siti',
  title: 'The Wedding of Rizky & Siti',
  coupleNames: 'Rizky & Siti',
  groom: {
    fullName: 'Muhammad Rizky Pratama, S.Kom.',
    nickname: 'Rizky',
    fatherName: 'Bpk. H. Bambang Sudiro',
    motherName: 'Ibu Hj. Endang Sulastri',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
    instagram: '@rizkypratama',
    bio: 'Putra pertama dari Bpk. H. Bambang Sudiro & Ibu Hj. Endang Sulastri. Seorang Software Architect yang mencintai fotografi dan petualangan.'
  },
  bride: {
    fullName: 'Siti Nurhaliza, S.E.',
    nickname: 'Siti',
    fatherName: 'Bpk. Ir. H. Ahmad Fauzi',
    motherName: 'Ibu Hj. Rina Marlina',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
    instagram: '@sitinurhaliza',
    bio: 'Putri bungsu dari Bpk. Ir. H. Ahmad Fauzi & Ibu Hj. Rina Marlina. Seorang financial planner yang menyukai seni bunga dan kuliner nusantara.'
  },
  events: [
    {
      id: 'akad',
      name: 'Akad Nikah',
      date: 'Sabtu, 24 Oktober 2026',
      time: '08:00 - 10:00 WIB',
      location: 'Masjid Agung Al-Ikhlas',
      address: 'Jl. Cipete Raya No. 45, Cilandak, Jakarta Selatan',
      mapUrl: 'https://maps.google.com/?q=Masjid+Agung+Al-Ikhlas+Cilandak+Jakarta',
      lat: -6.27382,
      lng: 106.79724,
      placeName: 'Masjid Agung Al-Ikhlas Jakarta'
    },
    {
      id: 'resepsi',
      name: 'Resepsi Pernikahan',
      date: 'Sabtu, 24 Oktober 2026',
      time: '11:00 - 14:00 WIB',
      location: 'Grand Ballroom Hotel Mulia Senayan',
      address: 'Jl. Asia Afrika Senayan, Gelora, Tanah Abang, Jakarta Pusat',
      mapUrl: 'https://maps.google.com/?q=Hotel+Mulia+Senayan+Jakarta',
      lat: -6.21633,
      lng: 106.79971,
      placeName: 'Hotel Mulia Senayan Jakarta'
    }
  ],
  countdownDate: '2026-10-24T08:00:00',
  religionFormat: 'islam',
  invitationFormat: {
    religion: 'islam',
    openingGreeting: "Assalamu'alaikum Warahmatullahi Wabarakatuh",
    openingSubtext: "Dengan memohon rahmat dan ridho Allah Subhanahu Wa Ta'ala, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk menghadiri syukuran pernikahan kami:",
    holyVerse: {
      label: "Ayat Suci Al-Qur'an",
      text: "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda bagi kaum yang berpikir.",
      source: "QS. Ar-Rum: 21"
    },
    ceremonyName: 'Akad Nikah',
    receptionName: "Walimatul 'Ursy / Resepsi",
    closingGreeting: "Wassalamu'alaikum Warahmatullahi Wabarakatuh",
    closingBlessing: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir serta memberikan doa restu bagi kedua mempelai."
  },
  quote: {
    text: 'Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.',
    source: 'QS. Ar-Rum: 21'
  },
  loveStories: [
    {
      id: 'story-1',
      year: '2021',
      title: 'Awal Pertemuan',
      description: 'Pertama kali bertegur sapa di sebuah seminar teknologi dan ekonomi kreatif di Jakarta. Obrolan singkat mengenai kopi dan rancangan masa depan menjadi pintu awal cerita kami.'
    },
    {
      id: 'story-2',
      year: '2023',
      title: 'Menjalin Komitmen',
      description: 'Setelah dua tahun saling mengenal karakter dan menyatukan visi hidup bersama, kami memutuskan untuk melangkah ke jenjang yang lebih serius dengan saling mengenalkan keluarga.'
    },
    {
      id: 'story-3',
      year: '2025',
      title: 'Lamaran & Restu',
      description: 'Di hadapan kedua keluarga besar yang penuh kehangatan, Rizky secara resmi meminang Siti. Langkah suci menuju ikatan pernikahan pun semakin mantap.'
    }
  ],
  galleries: [
    {
      id: 'gal-1',
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
      caption: 'Momen Prewedding di Hutan Pinus',
      category: 'Prewedding',
      isFeatured: true,
      uploadedAt: '2026-09-01T10:00:00Z'
    },
    {
      id: 'gal-2',
      url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop',
      caption: 'Kebersamaan & Tawa Hangat',
      category: 'Momen Romantis',
      isFeatured: true,
      uploadedAt: '2026-09-03T11:30:00Z'
    },
    {
      id: 'gal-3',
      url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=1200&auto=format&fit=crop',
      caption: 'Menatap Masa Depan yang Cerah',
      category: 'Prewedding',
      isFeatured: false,
      uploadedAt: '2026-09-05T14:20:00Z'
    },
    {
      id: 'gal-4',
      url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200&auto=format&fit=crop',
      caption: 'Cincin Janji Suci',
      category: 'Lamaran',
      isFeatured: true,
      uploadedAt: '2026-09-08T09:00:00Z'
    },
    {
      id: 'gal-5',
      url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=1200&auto=format&fit=crop',
      caption: 'Hari Bahagia Lamaran Keluarga',
      category: 'Lamaran',
      isFeatured: false,
      uploadedAt: '2026-09-10T16:45:00Z'
    },
    {
      id: 'gal-6',
      url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1200&auto=format&fit=crop',
      caption: 'Langkah Awal Bersama',
      category: 'Momen Romantis',
      isFeatured: false,
      uploadedAt: '2026-09-12T13:10:00Z'
    },
    {
      id: 'gal-7',
      url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=1200&auto=format&fit=crop',
      caption: 'Dekorasi Suasana Akad & Resepsi',
      category: 'Akad & Resepsi',
      isFeatured: false,
      uploadedAt: '2026-09-15T10:00:00Z'
    },
    {
      id: 'gal-8',
      url: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?q=80&w=1200&auto=format&fit=crop',
      caption: 'Senyum Bahagia Menuju Akad',
      category: 'Akad & Resepsi',
      isFeatured: true,
      uploadedAt: '2026-09-16T15:20:00Z'
    }
  ],
  bankAccounts: [
    {
      id: 'bank-1',
      bank: 'Bank Central Asia (BCA)',
      accountNumber: '8830192819',
      accountName: 'Muhammad Rizky Pratama'
    },
    {
      id: 'bank-2',
      bank: 'Bank Mandiri',
      accountNumber: '12700098231',
      accountName: 'Siti Nurhaliza'
    }
  ],
  giftAddress: {
    recipient: 'Rizky Pratama & Siti Nurhaliza',
    phone: '0812-8899-7711',
    address: 'Jl. Melati Indah No. 18, RT 04 / RW 07, Cilandak Barat, Pasar Minggu, Jakarta Selatan, 12430'
  },
  musicUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=romantic-acoustic-guitar-112191.mp3',
  announcement: null
};

// Multi-tenant wedding storage (holds settings for each wedding slug e.g. thomas_dan_juwita)
let weddingsMap: Map<string, WeddingSettings> = new Map();
weddingsMap.set('default', weddingSettings);
weddingsMap.set('main', weddingSettings);
weddingsMap.set('rizky_dan_siti', weddingSettings);

function sanitizeSlug(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function cleanNameForSlug(fullNameOrNick: string): string {
  if (!fullNameOrNick) return '';
  const cleaned = fullNameOrNick
    .replace(/(?:^|\s)(?:bpk|ibu|mas|mbak|dr|dra|drs|ir|prof|h|hj)\.?\s+/gi, ' ')
    .replace(/,\s*.*$/, '')
    .trim();
  const firstWord = cleaned.split(/\s+/)[0] || '';
  return sanitizeSlug(firstWord);
}

function generateWeddingSlug(groom: string, bride: string): string {
  const g = cleanNameForSlug(groom);
  const b = cleanNameForSlug(bride);
  if (g && b) return `${g}_dan_${b}`;
  if (g) return g;
  if (b) return b;
  return 'undangan_pernikahan';
}

function capitalizeWords(str: string): string {
  return str
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function parseCoupleFromSlug(slug: string): { groom: string; bride: string } | null {
  const clean = sanitizeSlug(slug);
  if (!clean || clean === 'main' || clean === 'default' || clean === 'rizky_dan_siti') {
    return null;
  }

  // 1. Check registered adminUsers for matching weddingSlug
  const matchedUser = adminUsers.find(
    u => u.weddingSlug && sanitizeSlug(u.weddingSlug) === clean
  );
  if (matchedUser) {
    const sourceName = matchedUser.coupleNames || matchedUser.name || '';
    if (sourceName.includes('&')) {
      const parts = sourceName.split('&').map(s => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        return { groom: parts[0], bride: parts[1] };
      }
    }
  }

  // 2. Parse from slug pattern: groom_dan_bride
  if (clean.includes('_dan_')) {
    const parts = clean.split('_dan_').filter(Boolean);
    if (parts.length >= 2) {
      return {
        groom: capitalizeWords(parts[0]),
        bride: capitalizeWords(parts.slice(1).join(' '))
      };
    }
  }

  return null;
}

function createWeddingTemplate(slug: string, groomName: string, brideName: string): WeddingSettings {
  const cleanSlug = sanitizeSlug(slug);
  const existing = weddingsMap.get(cleanSlug);
  if (existing && existing.slug === cleanSlug && existing.coupleNames && existing.coupleNames !== 'Rizky & Siti') {
    return existing;
  }
  const clone: WeddingSettings = JSON.parse(JSON.stringify(weddingSettings));
  delete (clone as any).oldSlug;
  (clone as any).updatedAt = new Date().toISOString();
  clone.id = cleanSlug;
  clone.slug = cleanSlug;
  clone.coupleNames = `${groomName} & ${brideName}`;
  clone.title = `The Wedding of ${groomName} & ${brideName}`;
  clone.groom.fullName = groomName;
  clone.groom.nickname = groomName;
  clone.groom.instagram = `@${sanitizeSlug(groomName).replace(/_/g, '')}`;
  clone.bride.fullName = brideName;
  clone.bride.nickname = brideName;
  clone.bride.instagram = `@${sanitizeSlug(brideName).replace(/_/g, '')}`;
  clone.loveStories = clone.loveStories.map(s => ({
    ...s,
    description: s.description
      .replace(/\bRizky\b/g, groomName)
      .replace(/\bSiti\b/g, brideName)
  }));
  clone.bankAccounts = clone.bankAccounts.map((b, idx) => ({
    ...b,
    accountName: idx === 0 ? groomName : brideName
  }));
  if (clone.giftAddress) {
    clone.giftAddress.recipient = `${groomName} & ${brideName}`;
  }
  clone.announcement = null;
  weddingsMap.set(cleanSlug, clone);
  dbRepo.saveSettings(clone, cleanSlug).catch(err => console.error('Error saving new wedding settings:', err));
  return clone;
}

function getWedding(slug?: string): WeddingSettings {
  if (!slug) return weddingSettings;
  const clean = sanitizeSlug(slug);
  if (!clean || clean === 'main' || clean === 'default') {
    return weddingSettings;
  }
  if (weddingsMap.has(clean)) {
    return weddingsMap.get(clean)!;
  }
  for (const [k, v] of weddingsMap.entries()) {
    if (k.toLowerCase() === clean.toLowerCase() || (v.slug && v.slug.toLowerCase() === clean.toLowerCase())) {
      return v;
    }
  }
  // Auto-create wedding template from adminUsers or slug (e.g. nama1_dan_nama2) so it never falls back to default Rizky & Siti
  const parsedCouple = parseCoupleFromSlug(clean);
  if (parsedCouple) {
    return createWeddingTemplate(clean, parsedCouple.groom, parsedCouple.bride);
  }
  return weddingSettings;
}

let adminUsers: (AdminUser & { password?: string })[] = [
  {
    id: 'user-owner-1',
    username: 'asepsulistiyono1',
    name: 'Asep Sulistiyono (Owner / Pemilik Website)',
    email: 'asepsulistiyono1@gmail.com',
    role: 'super_admin',
    isOwner: true,
    active: true,
    password: 'owner123',
    createdAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'user-super-1790439685804',
    username: 'budi_wati',
    name: 'Budi & Wati',
    email: 'budi_wati@wedding.local',
    role: 'super_admin',
    isOwner: false,
    weddingSlug: 'budi_dan_wati',
    coupleNames: 'Budi & Wati',
    password: 'super123',
    active: true,
    createdAt: '2026-09-30T15:19:00Z'
  },
  {
    id: 'user-super-1',
    username: 'superadmin',
    name: 'Romeo & Juliet',
    email: 'superadmin@wedding.com',
    role: 'super_admin',
    isOwner: false,
    weddingSlug: 'romeo_dan_juliet',
    coupleNames: 'Romeo & Juliet',
    phone: '081234567890',
    notes: 'Paket Platinum 500 Undangan (Gedung Mulia)',
    password: 'super123',
    active: true,
    createdAt: '2026-09-01T10:00:00Z'
  },
  {
    id: 'user-super-2',
    username: 'thomas_juwita',
    name: 'Thomas & Juwita',
    email: 'thomas@wedding.local',
    role: 'super_admin',
    isOwner: false,
    weddingSlug: 'thomas_dan_juwita',
    coupleNames: 'Thomas & Juwita',
    phone: '081298765432',
    notes: 'Paket Diamond 1000 Undangan (Outdoor Garden)',
    password: 'mempelai123',
    active: true,
    createdAt: '2026-09-15T09:00:00Z'
  },
  {
    id: 'user-super-romeo-juliet',
    username: 'romeo_juliet',
    name: 'Romeo & Juliet',
    email: 'romeo_juliet@wedding.local',
    role: 'super_admin',
    isOwner: false,
    weddingSlug: 'romeo_dan_juliet',
    coupleNames: 'Romeo & Juliet',
    password: 'super123',
    active: true,
    createdAt: '2026-09-28T19:00:00Z'
  },
  {
    id: 'user-admin-1',
    username: 'adminwo',
    name: 'Admin WO (Reception Desk)',
    email: 'admin@wedding.com',
    role: 'admin',
    isOwner: false,
    active: true,
    createdBy: 'user-super-1',
    createdByName: 'Romeo & Juliet',
    weddingSlug: 'romeo_dan_juliet',
    password: 'admin123',
    createdAt: '2026-09-05T14:30:00Z'
  }
];

let guests: Guest[] = [
  {
    id: 'g-1',
    name: 'Bpk. Hendra Gunawan & Keluarga',
    slug: 'hendra-gunawan',
    phone: '081234567801',
    category: 'VIP',
    paxAllocated: 2,
    rsvpStatus: 'attending',
    paxConfirmed: 2,
    checkedIn: true,
    checkedInAt: '2026-10-24T08:45:00Z',
    notes: 'Meja VIP 1',
    invitationSent: true,
    customGreeting: 'Merupakan suatu kehormatan bagi kami atas kehadiran Bapak Hendra Gunawan beserta keluarga tercinta.',
    createdAt: '2026-09-10T10:00:00Z'
  },
  {
    id: 'g-2',
    name: 'dr. Anisa Rahmawati, Sp.A',
    slug: 'anisa-rahmawati',
    phone: '081234567802',
    category: 'Sahabat',
    paxAllocated: 2,
    rsvpStatus: 'attending',
    paxConfirmed: 2,
    checkedIn: false,
    checkedInAt: null,
    notes: 'Sahabat SMA Siti',
    invitationSent: true,
    customGreeting: 'Hai Anisa! Senang sekali bisa berbagi hari bahagia ini bersamamu.',
    createdAt: '2026-09-11T11:00:00Z'
  },
  {
    id: 'g-3',
    name: 'Dimas Aditya & Partner',
    slug: 'dimas-aditya',
    phone: '081234567803',
    category: 'Rekan Kerja',
    paxAllocated: 2,
    rsvpStatus: 'attending',
    paxConfirmed: 1,
    checkedIn: false,
    checkedInAt: null,
    notes: 'Tim Engineering',
    invitationSent: true,
    customGreeting: 'Hai Dimas, terima kasih atas persahabatan dan dukungan kerjanya selama ini.',
    createdAt: '2026-09-12T12:00:00Z'
  },
  {
    id: 'g-4',
    name: 'Keluarga Bpk. H. Rahmat Hidayat',
    slug: 'rahmat-hidayat',
    phone: '081234567804',
    category: 'Keluarga Besar',
    paxAllocated: 4,
    rsvpStatus: 'attending',
    paxConfirmed: 4,
    checkedIn: false,
    checkedInAt: null,
    notes: 'Paman dari pihak mempelai pria',
    invitationSent: true,
    customGreeting: 'Kepada Om Rahmat dan Tante sekeluarga, kehadiran keluarga besar sangat dinanti.',
    createdAt: '2026-09-12T13:00:00Z'
  },
  {
    id: 'g-5',
    name: 'Faisal Akbar',
    slug: 'faisal-akbar',
    phone: '081234567805',
    category: 'Sahabat',
    paxAllocated: 1,
    rsvpStatus: 'tentative',
    paxConfirmed: 0,
    checkedIn: false,
    checkedInAt: null,
    notes: 'Teman kuliah Rizky di Bandung',
    invitationSent: true,
    customGreeting: 'Bro Faisal, ditunggu kehadirannya di Jakarta!',
    createdAt: '2026-09-13T09:00:00Z'
  },
  {
    id: 'g-6',
    name: 'Bpk. Ir. Bambang Wicaksono',
    slug: 'bambang-wicaksono',
    phone: '081234567806',
    category: 'VIP',
    paxAllocated: 2,
    rsvpStatus: 'unconfirmed',
    paxConfirmed: 0,
    checkedIn: false,
    checkedInAt: null,
    notes: 'Direksi Perusahaan',
    invitationSent: true,
    createdAt: '2026-09-14T10:00:00Z'
  }
];

const DEFAULT_TEMPLATE_WISHES: Wish[] = [
  {
    id: 'w-1',
    senderName: 'Bpk. Hendra Gunawan',
    message: 'Barakallahu lakuma wa baraka alaikuma wa jamaa bainakuma fii khoir. Selamat menempuh hidup baru untuk ananda Rizky dan Siti. Semoga menjadi keluarga yang sakinah, mawaddah, wa rahmah serta senantiasa dilimpahi rezeki yang berkah.',
    attendance: 'attending',
    pax: 2,
    isPinned: true,
    isApproved: true,
    reactionCount: 18,
    adminReply: 'Aamiin ya Rabbal alamin. Terima kasih banyak atas doa dan restu yang tulus dari Bapak Hendra dan keluarga.',
    createdAt: '2026-09-15T09:30:00Z'
  },
  {
    id: 'w-2',
    senderName: 'dr. Anisa Rahmawati',
    message: 'Happy wedding Siti sayang & Rizky! MasyaAllah akhirnya hari yang dinanti tiba. Semoga perjalanan rumah tangga kalian selalu dipenuhi cinta, tawa, dan kebahagiaan seumur hidup. Can not wait to see you on your big day! ❤️✨',
    attendance: 'attending',
    pax: 2,
    isPinned: true,
    isApproved: true,
    reactionCount: 24,
    adminReply: 'Makasih banyak Nisa tersayang! Sampai jumpa di pelaminan yaaa! 💕',
    createdAt: '2026-09-16T14:15:00Z'
  },
  {
    id: 'w-3',
    senderName: 'Dimas Aditya & Tim Tech',
    message: 'Selamat bro Rizky & Mbak Siti! Semoga lancar sampai hari H dan rukun terus selamanya. Selamat membangun rumah tangga impian!',
    attendance: 'attending',
    pax: 1,
    isPinned: false,
    isApproved: true,
    reactionCount: 9,
    createdAt: '2026-09-17T11:00:00Z'
  },
  {
    id: 'w-4',
    senderName: 'Keluarga Om Rahmat Hidayat',
    message: 'Selamat menempuh babak baru keponakanku Rizky & Siti. Jadilah keluarga yang bijaksana dan penuh kasih sayang. Doa terbaik dari kami sekeluarga di Surabaya.',
    attendance: 'attending',
    pax: 4,
    isPinned: false,
    isApproved: true,
    reactionCount: 14,
    adminReply: 'Terima kasih banyak Om Rahmat & Tante, doa yang sama untuk keluarga di Surabaya.',
    createdAt: '2026-09-18T16:20:00Z'
  }
];

let wishes: Wish[] = DEFAULT_TEMPLATE_WISHES.map(w => ({ ...w }));

function personalizeWishText(text: string, groomName: string, brideName: string): string {
  if (!text) return text;
  return text
    .replace(/\bRizky\b/g, groomName)
    .replace(/\bSiti\b/g, brideName);
}

function getWishesForSettings(activeSettings: WeddingSettings): Wish[] {
  const groomName = activeSettings?.groom?.nickname || activeSettings?.groom?.fullName || 'Rizky';
  const brideName = activeSettings?.bride?.nickname || activeSettings?.bride?.fullName || 'Siti';
  return wishes.map(w => ({
    ...w,
    message: personalizeWishText(w.message, groomName, brideName),
    adminReply: w.adminReply ? personalizeWishText(w.adminReply, groomName, brideName) : w.adminReply
  }));
}

// WebSocket Server
const wss = new WebSocketServer({ noServer: true });
const clients = new Set<WebSocket>();

function broadcast(msg: RealtimeMessage) {
  const data = JSON.stringify(msg);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

wss.on('connection', (ws, request) => {
  clients.add(ws);

  let requestedSlug: string | undefined = undefined;
  try {
    if (request?.url) {
      const urlObj = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
      requestedSlug = urlObj.searchParams.get('slug') || urlObj.searchParams.get('w') || undefined;
    }
  } catch {
    // ignore URL parse error
  }

  const activeSettings = getWedding(requestedSlug);
  const localizedWishes = getWishesForSettings(activeSettings);

  // Send initial data to connected client using the active wedding slug's couple names
  const initMsg: RealtimeMessage = {
    type: 'INIT_DATA',
    payload: {
      wishes: localizedWishes.filter(w => w.isApproved),
      onlineCount: clients.size,
      announcement: activeSettings.announcement
    }
  };
  ws.send(JSON.stringify(initMsg));

  // Broadcast updated count
  broadcast({
    type: 'ONLINE_COUNT',
    payload: { count: clients.size }
  });

  ws.on('close', () => {
    clients.delete(ws);
    broadcast({
      type: 'ONLINE_COUNT',
      payload: { count: clients.size }
    });
  });

  ws.on('error', (err) => {
    console.error('WebSocket client error:', err);
    clients.delete(ws);
  });
});

// Upgrade HTTP to WS
server.on('upgrade', (request, socket, head) => {
  const pathname = request.url ? new URL(request.url, `http://${request.headers.host}`).pathname : '';
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    // If not our websocket path, leave for vite or other
  }
});

// Helper stats calculation
function calculateStats(): DashboardStats {
  const totalGuests = guests.length;
  const totalPaxAllocated = guests.reduce((sum, g) => sum + g.paxAllocated, 0);
  const attendingGuests = guests.filter(g => g.rsvpStatus === 'attending');
  const confirmedAttending = attendingGuests.length;
  const confirmedPax = attendingGuests.reduce((sum, g) => sum + (g.paxConfirmed || g.paxAllocated), 0);
  const confirmedNotAttending = guests.filter(g => g.rsvpStatus === 'not_attending').length;
  const unconfirmed = guests.filter(g => g.rsvpStatus === 'unconfirmed' || g.rsvpStatus === 'tentative').length;
  const checkedInCount = guests.filter(g => g.checkedIn).length;
  const totalWishes = wishes.length;

  return {
    totalGuests,
    totalPaxAllocated,
    confirmedAttending,
    confirmedPax,
    confirmedNotAttending,
    unconfirmed,
    checkedInCount,
    totalWishes,
    onlineUsers: clients.size
  };
}

// ---------------- PUBLIC API ROUTES ----------------

// Get wedding invitation data for visitors
app.get('/api/public/data', async (req, res) => {
  await ensureDatabaseSynced();
  const requestedSlug = (req.query.slug as string) || (req.query.w as string);
  const guestSlug = req.query.guest as string | undefined;
  let personalizedGuest: Guest | null = null;

  const activeSettings = getWedding(requestedSlug);
  const localizedWishes = getWishesForSettings(activeSettings);

  if (guestSlug) {
    personalizedGuest = guests.find(g => 
      g.slug.toLowerCase() === guestSlug.toLowerCase() || 
      g.name.toLowerCase() === guestSlug.toLowerCase() ||
      g.id === guestSlug
    ) || null;
  }

  res.json({
    settings: activeSettings,
    guest: personalizedGuest,
    wishes: localizedWishes.filter(w => w.isApproved),
    admins: adminUsers
      .filter(
        u =>
          !u.isOwner &&
          u.email?.toLowerCase() !== 'asepsulistiyono1@gmail.com' &&
          u.username?.toLowerCase() !== 'asepsulistiyono1'
      )
      .map(u => ({
        ...u,
        password: u.password || (u.role === 'super_admin' ? 'super123' : 'admin123')
      })),
    stats: {
      confirmedPax: guests.filter(g => g.rsvpStatus === 'attending').reduce((sum, g) => sum + (g.paxConfirmed || g.paxAllocated), 0),
      totalWishes: localizedWishes.filter(w => w.isApproved).length
    }
  });
});

// Bidirectional client-to-server & database state synchronization
app.post('/api/public/sync-state', async (req, res) => {
  await ensureDatabaseSynced();
  const {
    settingsList,
    guests: incomingGuests,
    wishes: incomingWishes,
    admins: incomingAdmins,
    deletedGuestIds,
    deletedWishIds,
    deletedAdminIds,
  } = req.body || {};

  const deletedGuestsSet = new Set<string>(Array.isArray(deletedGuestIds) ? deletedGuestIds.map(String) : []);
  const deletedWishesSet = new Set<string>(Array.isArray(deletedWishIds) ? deletedWishIds.map(String) : []);
  const deletedAdminsSet = new Set<string>(
    Array.isArray(deletedAdminIds) ? deletedAdminIds.map(s => String(s).toLowerCase()) : []
  );

  if (deletedAdminsSet.size > 0) {
    const toRemove = adminUsers.filter(
      u =>
        !u.isOwner &&
        u.username?.toLowerCase() !== 'asepsulistiyono1' &&
        (deletedAdminsSet.has(u.id.toLowerCase()) || deletedAdminsSet.has(u.username.toLowerCase()))
    );
    if (toRemove.length > 0) {
      const removeIds = new Set(toRemove.map(u => u.id));
      adminUsers = adminUsers.filter(u => !removeIds.has(u.id));
      for (const u of toRemove) {
        await dbRepo.deleteDbUser(u.id);
      }
    }
  }

  if (deletedGuestsSet.size > 0) {
    guests = guests.filter(g => !deletedGuestsSet.has(g.id));
    for (const delId of deletedGuestsSet) {
      await dbRepo.deleteGuest(delId);
    }
  }

  if (deletedWishesSet.size > 0) {
    wishes = wishes.filter(w => !deletedWishesSet.has(w.id));
    for (const delId of deletedWishesSet) {
      await dbRepo.deleteWish(delId);
    }
  }

  // Sync guests from client only when explicitly marked as locally modified
  if (Array.isArray(incomingGuests)) {
    for (const cg of incomingGuests) {
      if (!cg || !cg.id || !cg.name || deletedGuestsSet.has(cg.id) || !cg._locallyModified) continue;
      const cleanGuest = { ...cg };
      delete cleanGuest._locallyModified;
      const idx = guests.findIndex(g => g.id === cleanGuest.id);
      if (idx === -1) {
        guests.unshift(cleanGuest);
        await dbRepo.upsertGuest(cleanGuest);
      } else {
        guests[idx] = { ...guests[idx], ...cleanGuest };
        await dbRepo.upsertGuest(guests[idx]);
      }
    }
  }

  // Sync wishes from client only when explicitly marked as locally modified
  if (Array.isArray(incomingWishes)) {
    for (const cw of incomingWishes) {
      if (!cw || !cw.id || !cw.senderName || !cw.message || deletedWishesSet.has(cw.id) || !cw._locallyModified) continue;
      const cleanWish = { ...cw };
      delete cleanWish._locallyModified;
      const idx = wishes.findIndex(w => w.id === cleanWish.id);
      if (idx === -1) {
        wishes.unshift(cleanWish);
        await dbRepo.upsertWish(cleanWish);
      }
    }
  }

  // Sync admins from client when locally modified or when custom account is not yet on server
  if (Array.isArray(incomingAdmins)) {
    let adminsChanged = false;
    for (const ca of incomingAdmins) {
      if (!ca || !ca.id || !ca.username) continue;
      const uname = String(ca.username).toLowerCase();
      const uid = String(ca.id).toLowerCase();
      if (deletedAdminsSet.has(uname) || deletedAdminsSet.has(uid)) continue;

      const idx = adminUsers.findIndex(
        u => u.id === ca.id || (u.username && u.username.toLowerCase() === uname)
      );
      if (idx === -1 || ca._locallyModified) {
        const prevSlug = idx !== -1 && adminUsers[idx].weddingSlug ? sanitizeSlug(adminUsers[idx].weddingSlug!) : '';
        const cleanAdmin = { ...ca };
        delete cleanAdmin._locallyModified;
        if (idx === -1) {
          adminUsers.unshift(cleanAdmin);
        } else {
          adminUsers[idx] = { ...adminUsers[idx], ...cleanAdmin };
        }
        adminsChanged = true;
        if (cleanAdmin.role === 'super_admin' && cleanAdmin.weddingSlug) {
          const cleanSlug = sanitizeSlug(cleanAdmin.weddingSlug);
          const parts = String(cleanAdmin.coupleNames || cleanAdmin.name || '').split('&');
          const gn = parts[0]?.trim() || cleanAdmin.username.split('_')[0] || 'Mempelai Pria';
          const bn = parts[1]?.trim() || cleanAdmin.username.split('_').slice(1).join(' ') || 'Mempelai Wanita';
          if (ca._locallyModified && (weddingsMap.has(cleanSlug) || (prevSlug && weddingsMap.has(prevSlug)))) {
            const baseW = (prevSlug ? weddingsMap.get(prevSlug) : undefined) || weddingsMap.get(cleanSlug) || createWeddingTemplate(cleanSlug, gn, bn);
            const nextCouple = `${gn} & ${bn}`;
            const syncedW: WeddingSettings = {
              ...baseW,
              id: cleanSlug,
              slug: cleanSlug,
              coupleNames: nextCouple,
              title: `The Wedding of ${nextCouple}`,
              groom: {
                ...baseW.groom,
                fullName: gn,
                nickname: gn
              },
              bride: {
                ...baseW.bride,
                fullName: bn,
                nickname: bn
              }
            };
            (syncedW as any).oldSlug = prevSlug || cleanSlug;
            (syncedW as any).updatedAt = new Date().toISOString();
            weddingsMap.set(cleanSlug, syncedW);
            if (prevSlug && prevSlug !== cleanSlug) {
              weddingsMap.set(prevSlug, syncedW);
              await dbRepo.saveSettings(syncedW, prevSlug);
            }
            weddingSettings = syncedW;
            weddingsMap.set('main', syncedW);
            weddingsMap.set('default', syncedW);
            await dbRepo.saveSettings(syncedW, cleanSlug);
            await dbRepo.saveSettings(syncedW, 'main');
            await dbRepo.saveSettings(syncedW, 'default');
            broadcast({
              type: 'SETTINGS_UPDATED',
              payload: syncedW
            });
          } else {
            createWeddingTemplate(cleanSlug, gn, bn);
          }
        }
        await dbRepo.createDbUser({
          uid: cleanAdmin.id,
          username: cleanAdmin.username,
          password: cleanAdmin.password,
          email: cleanAdmin.email || `${cleanAdmin.username}@wedding.local`,
          name: cleanAdmin.name,
          role: cleanAdmin.role,
          weddingSlug: cleanAdmin.weddingSlug,
          coupleNames: cleanAdmin.coupleNames,
          phone: cleanAdmin.phone,
          notes: cleanAdmin.notes,
          active: cleanAdmin.active !== false,
          createdBy: cleanAdmin.createdBy,
          createdByName: cleanAdmin.createdByName
        });
      }
    }
    if (adminsChanged) {
      broadcast({
        type: 'USERS_UPDATED',
        payload: adminUsers.filter(u => !u.isOwner && u.username?.toLowerCase() !== 'asepsulistiyono1')
      });
    }
  }

  // Sync wedding settings & galleries from client whenever locally modified
  if (Array.isArray(settingsList)) {
    for (const item of settingsList) {
      if (!item || !item.settings || !item.isLocallyModified) continue;
      const s: WeddingSettings = { ...item.settings };
      const oldSlugKey = (s as any).oldSlug ? sanitizeSlug((s as any).oldSlug) : '';
      delete (s as any)._locallyModified;
      const slugKey = sanitizeSlug(s.slug || item.slug || 'main') || 'main';
      s.slug = slugKey === 'main' || slugKey === 'default' ? (s.slug || 'rizky_dan_siti') : slugKey;
      (s as any).updatedAt = (s as any).updatedAt || new Date().toISOString();

      weddingsMap.set(slugKey, s);
      if (s.slug) {
        weddingsMap.set(sanitizeSlug(s.slug), s);
      }
      if (oldSlugKey && oldSlugKey !== slugKey) {
        weddingsMap.set(oldSlugKey, s);
        await dbRepo.saveSettings(s, oldSlugKey);
      }
      weddingSettings = s;
      weddingsMap.set('main', s);
      weddingsMap.set('default', s);

      await dbRepo.saveSettings(s, slugKey);
      await dbRepo.saveSettings(s, 'main');
      await dbRepo.saveSettings(s, 'default');

      broadcast({
        type: 'SETTINGS_UPDATED',
        payload: { ...s, ...(oldSlugKey ? { oldSlug: oldSlugKey } : {}) } as WeddingSettings
      });

      if (Array.isArray(s.galleries)) {
        for (const gal of s.galleries) {
          if (gal && gal.id && gal.url) {
            await dbRepo.upsertGallery(gal);
          }
        }
      }
    }
  }

  res.json({
    success: true,
    settings: weddingSettings,
    guests,
    wishes,
    admins: adminUsers
  });
});

// Post a new wish (Real-time broadcasted!)
app.post('/api/public/wishes', async (req, res) => {
  await ensureDatabaseSynced();
  const { senderName, message, attendance, pax, guestId } = req.body;

  if (!senderName || !message) {
    return res.status(400).json({ error: 'Nama dan pesan ucapan wajib diisi.' });
  }

  const newWish: Wish = {
    id: `wish-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    senderName: String(senderName).trim(),
    guestId: guestId ? String(guestId) : undefined,
    message: String(message).trim(),
    attendance: attendance || 'attending',
    pax: pax ? Number(pax) : 1,
    isPinned: false,
    isApproved: true,
    reactionCount: 0,
    createdAt: new Date().toISOString()
  };

  wishes.unshift(newWish);
  await dbRepo.upsertWish(newWish);

  // If sender has matching guest, optionally sync RSVP
  if (guestId) {
    const existingGuest = guests.find(g => g.id === guestId);
    if (existingGuest && attendance) {
      existingGuest.rsvpStatus = attendance;
      existingGuest.paxConfirmed = pax ? Number(pax) : existingGuest.paxAllocated;
      await dbRepo.upsertGuest(existingGuest);
      broadcast({
        type: 'GUEST_UPDATED',
        payload: existingGuest
      });
    }
  }

  // Broadcast to all connected guests & admin dashboards in REAL TIME
  broadcast({
    type: 'NEW_WISH',
    payload: newWish
  });

  res.status(201).json({ success: true, wish: newWish });
});

// Submit RSVP
app.post('/api/public/rsvp', async (req, res) => {
  await ensureDatabaseSynced();
  const { guestId, name, attendance, pax, notes } = req.body;

  if (!name || !attendance) {
    return res.status(400).json({ error: 'Nama dan konfirmasi kehadiran wajib diisi.' });
  }

  let matchedGuest = guestId ? guests.find(g => g.id === guestId) : null;

  if (!matchedGuest) {
    // Try matching by name
    matchedGuest = guests.find(g => g.name.toLowerCase() === name.toLowerCase()) || null;
  }

  if (matchedGuest) {
    matchedGuest.rsvpStatus = attendance;
    matchedGuest.paxConfirmed = pax ? Number(pax) : 1;
    if (notes) matchedGuest.notes = notes;
    await dbRepo.upsertGuest(matchedGuest);
    broadcast({
      type: 'GUEST_UPDATED',
      payload: matchedGuest
    });
    return res.json({ success: true, guest: matchedGuest });
  } else {
    // Guest self-registration or unlisted guest
    const newGuest: Guest = {
      id: `g-${Date.now()}`,
      name: String(name).trim(),
      slug: String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: 'Tamu Umum',
      paxAllocated: pax ? Number(pax) : 1,
      rsvpStatus: attendance,
      paxConfirmed: pax ? Number(pax) : 1,
      checkedIn: false,
      checkedInAt: null,
      notes: notes || 'RSVP via Form Undangan',
      invitationSent: true,
      createdAt: new Date().toISOString()
    };
    guests.unshift(newGuest);
    await dbRepo.upsertGuest(newGuest);
    broadcast({
      type: 'GUEST_UPDATED',
      payload: newGuest
    });
    return res.status(201).json({ success: true, guest: newGuest });
  }
});

// React (Like / Heart) to a wish
app.post('/api/public/wishes/:id/react', (req, res) => {
  const wish = wishes.find(w => w.id === req.params.id);
  if (!wish) {
    return res.status(404).json({ error: 'Ucapan tidak ditemukan' });
  }
  wish.reactionCount = (wish.reactionCount || 0) + 1;
  broadcast({
    type: 'UPDATE_WISH',
    payload: wish
  });
  res.json({ success: true, reactionCount: wish.reactionCount });
});

// ---------------- AUTHENTICATION ROUTES ----------------

app.post('/api/auth/login', async (req, res) => {
  const { username, email, password } = req.body || {};
  const rawLoginId = String(username || email || '').trim().replace(/^@+/, '').toLowerCase();
  const loginIdentifier =
    rawLoginId === 'owner' || rawLoginId === 'pemilik' || rawLoginId === 'owner@wedding.com' || rawLoginId === 'owner@wedding.local'
      ? 'asepsulistiyono1'
      : rawLoginId;

  if (!loginIdentifier || !password) {
    return res.status(400).json({ error: 'Username dan kata sandi harus diisi.' });
  }

  const findMatchingUser = () =>
    adminUsers.find(
      (u) =>
        (u.username && u.username.toLowerCase() === loginIdentifier) ||
        (u.email && u.email.toLowerCase() === loginIdentifier) ||
        (u.weddingSlug && u.weddingSlug.toLowerCase() === loginIdentifier)
    );

  // Always sync from PostgreSQL before login check so accounts created/updated on another device (Computer/HP) work immediately
  try {
    await ensureDatabaseSynced(true);
  } catch {
    // ignore DB error and continue with in-memory check
  }

  const user = findMatchingUser();

  if (user && user.active !== false) {
    const isOwnerFlag = Boolean(
      user.isOwner ||
      user.id === 'user-owner-1' ||
      user.username?.toLowerCase() === 'asepsulistiyono1' ||
      user.username?.toLowerCase() === 'owner' ||
      user.email?.toLowerCase() === 'asepsulistiyono1@gmail.com'
    );
    const customPassword = (user as any).password;
    const defaultPassword = isOwnerFlag ? 'owner123' : (user.role === 'super_admin' ? 'super123' : 'admin123');

    const isValidPassword = isOwnerFlag
      ? (
          password === (customPassword || 'owner123') ||
          password === 'owner123' ||
          password === 'super123' ||
          password === 'admin123'
        )
      : user.role === 'super_admin'
      ? (
          password === customPassword ||
          password === defaultPassword ||
          password === 'super123' ||
          password === 'mempelai123'
        )
      : (
          password === customPassword ||
          password === defaultPassword ||
          password === 'admin123'
        );

    if (isValidPassword) {
      // Ensure wedding template exists for Super Admin
      if (!isOwnerFlag && user.weddingSlug) {
        getWedding(user.weddingSlug);
      }
      return res.json({
        success: true,
        user: {
          ...user,
          isOwner: isOwnerFlag
        },
        token: `token_${isOwnerFlag ? 'owner' : user.role}_${user.id}_${Date.now()}`
      });
    }
  }

  return res.status(401).json({ error: 'Kredensial tidak valid. Silakan periksa kembali username dan kata sandi Anda.' });
});

// Google Sign-In via Firebase Auth (verified with firebase-admin and linked to PostgreSQL users table)
app.post('/api/auth/google', requireAuth, async (req: AuthRequest, res) => {
  try {
    const firebaseUser = req.user;
    if (!firebaseUser || !firebaseUser.uid) {
      return res.status(401).json({ error: 'Token tidak valid.' });
    }

    const email = (firebaseUser.email || `${firebaseUser.uid}@wedding.local`).toLowerCase();
    const isOwnerAccount = email === 'asepsulistiyono1@gmail.com';
    const existingAdmin = adminUsers.find(
      (u) => u.email?.toLowerCase() === email || u.id === firebaseUser.uid
    );

    const role = isOwnerAccount
      ? 'super_admin'
      : existingAdmin?.role || 'super_admin';

    await dbRepo.createDbUser({
      uid: firebaseUser.uid,
      username: existingAdmin?.username || email.split('@')[0],
      email,
      name: firebaseUser.name || existingAdmin?.name || email.split('@')[0],
      role,
      weddingSlug: existingAdmin?.weddingSlug || 'rizky_dan_siti',
      coupleNames: existingAdmin?.coupleNames || 'Rizky & Siti',
      active: true,
    });

    const userRecord: AdminUser = existingAdmin || {
      id: firebaseUser.uid,
      username: email.split('@')[0],
      name: firebaseUser.name || email.split('@')[0],
      email,
      role: role as AdminUser['role'],
      weddingSlug: 'rizky_dan_siti',
      coupleNames: 'Rizky & Siti',
      active: true,
      isOwner: isOwnerAccount,
      createdAt: new Date().toISOString(),
    };

    if (!existingAdmin) {
      adminUsers.push(userRecord);
    }

    return res.json({
      success: true,
      user: {
        ...userRecord,
        isOwner: isOwnerAccount || Boolean(userRecord.isOwner),
      },
    });
  } catch (error: any) {
    console.error('Failed to authenticate Google user:', error);
    return res.status(500).json({ error: error.message || 'Gagal memproses login Google.' });
  }
});

// Sync Supabase Auth session with PostgreSQL users table & AdminUser profile
app.post('/api/auth/supabase-session', async (req, res) => {
  try {
    const { uid, email: rawEmail, name, role: requestedRole, weddingSlug } = req.body || {};
    if (!uid && !rawEmail) {
      return res.status(400).json({ error: 'Data sesi Supabase tidak lengkap.' });
    }

    const email = String(rawEmail || `${uid}@wedding.local`).trim().toLowerCase();
    const usernameFromEmail = email.split('@')[0].toLowerCase();
    const isOwnerAccount =
      email === 'asepsulistiyono1@gmail.com' || usernameFromEmail === 'asepsulistiyono1';

    const existingAdmin = adminUsers.find(
      (u) =>
        (u.email && u.email.toLowerCase() === email) ||
        u.username.toLowerCase() === usernameFromEmail ||
        u.id === uid
    );

    const resolvedRole: AdminUser['role'] = isOwnerAccount
      ? 'super_admin'
      : (existingAdmin?.role || requestedRole || 'super_admin');

    const resolvedSlug = existingAdmin?.weddingSlug || weddingSlug || 'rizky_dan_siti';
    const resolvedCoupleNames = existingAdmin?.coupleNames || 'Rizky & Siti';

    await dbRepo.createDbUser({
      uid: String(uid || existingAdmin?.id || `supa-${Date.now()}`),
      username: existingAdmin?.username || usernameFromEmail,
      email,
      name: name || existingAdmin?.name || usernameFromEmail,
      role: resolvedRole,
      weddingSlug: resolvedSlug,
      coupleNames: resolvedCoupleNames,
      active: true,
    });

    const userRecord: AdminUser = existingAdmin || {
      id: String(uid || `supa-${Date.now()}`),
      username: usernameFromEmail,
      name: name || usernameFromEmail,
      email,
      role: resolvedRole,
      weddingSlug: resolvedSlug,
      coupleNames: resolvedCoupleNames,
      active: true,
      isOwner: isOwnerAccount,
      createdAt: new Date().toISOString(),
    };

    if (!existingAdmin) {
      adminUsers.push(userRecord);
    }

    return res.json({
      success: true,
      user: {
        ...userRecord,
        isOwner: isOwnerAccount || Boolean(userRecord.isOwner),
      },
    });
  } catch (error: any) {
    console.error('Failed to sync Supabase session:', error);
    return res.status(500).json({ error: error.message || 'Gagal menyinkronkan sesi Supabase.' });
  }
});

// Self-service password reset
app.post('/api/auth/reset-password', (req, res) => {
  const { username, verificationEmail, securityPin, newPassword } = req.body;
  const cleanIdentifier = String(username || '').trim().toLowerCase();
  const cleanEmail = String(verificationEmail || '').trim().toLowerCase();
  const cleanPin = String(securityPin || '').trim();
  const cleanNewPassword = String(newPassword || '').trim();

  if (!cleanIdentifier) {
    return res.status(400).json({ error: 'Username akun wajib diisi.' });
  }

  if (!cleanNewPassword || cleanNewPassword.length < 4) {
    return res.status(400).json({ error: 'Kata sandi baru wajib diisi minimal 4 karakter.' });
  }

  const user = adminUsers.find(u => 
    (u.username && u.username.toLowerCase() === cleanIdentifier) || 
    (u.email && u.email.toLowerCase() === cleanIdentifier)
  );

  if (!user) {
    return res.status(404).json({ error: `Akun dengan username "@${cleanIdentifier}" tidak ditemukan.` });
  }

  // Security Verification
  const isOwner = user.isOwner || user.username?.toLowerCase() === 'asepsulistiyono1' || user.email?.toLowerCase() === 'asepsulistiyono1@gmail.com';

  if (isOwner) {
    // Owner can verify with registered email (asepsulistiyono1@gmail.com) OR Master Security PIN (9988 or 123456)
    const emailMatches = cleanEmail === 'asepsulistiyono1@gmail.com';
    const pinMatches = cleanPin === '9988' || cleanPin === '123456' || cleanPin === 'owner123';

    if (!emailMatches && !pinMatches) {
      return res.status(400).json({ 
        error: 'Verifikasi keamanan Pemilik gagal. Masukkan email terdaftar Anda (asepsulistiyono1@gmail.com) atau PIN Master Keamanan.' 
      });
    }
  } else {
    // Other admin / staff accounts (Super Admin mempelai / Admin WO)
    // Dapat diverifikasi via:
    // 1. PIN Master Otorisasi Pemilik (9988)
    // 2. Slug URL Undangan pernikahan mereka (misal: 'dimas_dan_anisa')
    // 3. Email terdaftar jika ada
    const pinMatches = cleanPin === '9988' || cleanPin === '123456';
    const slugMatches = Boolean(user.weddingSlug && (
      cleanEmail === user.weddingSlug.toLowerCase() || 
      cleanPin === user.weddingSlug.toLowerCase() ||
      cleanIdentifier === user.weddingSlug.toLowerCase()
    ));
    const emailMatches = Boolean(user.email && cleanEmail && user.email.toLowerCase() === cleanEmail);

    if (!pinMatches && !slugMatches && !emailMatches) {
      return res.status(400).json({ 
        error: 'Verifikasi gagal. Masukkan PIN Otorisasi Pemilik (9988), Slug URL Undangan Anda, atau email terdaftar.' 
      });
    }
  }

  // Save new password in memory and persist to PostgreSQL
  (user as any).password = cleanNewPassword;
  dbRepo.createDbUser({
    uid: user.id,
    username: user.username,
    password: cleanNewPassword,
    email: user.email || `${user.username}@wedding.local`,
    name: user.name,
    role: user.role,
    weddingSlug: user.weddingSlug,
    coupleNames: user.coupleNames,
    phone: user.phone,
    notes: user.notes,
    active: user.active,
    createdBy: user.createdBy,
    createdByName: user.createdByName
  }).catch(err => console.error('DB password reset persist error:', err));

  return res.json({
    success: true,
    message: `Kata sandi untuk akun @${user.username} berhasil direset! Silakan login kembali dengan kata sandi baru Anda.`,
    username: user.username
  });
});

// Authenticated user change password
app.post('/api/admin/change-password', (req, res) => {
  const { userId, username, newPassword } = req.body;
  const cleanPass = String(newPassword || '').trim();

  if (!cleanPass || cleanPass.length < 4) {
    return res.status(400).json({ error: 'Kata sandi baru minimal 4 karakter.' });
  }

  const targetUser = adminUsers.find(u => 
    (userId && u.id === userId) || 
    (username && u.username.toLowerCase() === String(username).toLowerCase())
  );

  if (!targetUser) {
    return res.status(404).json({ error: 'Akun pengelola tidak ditemukan.' });
  }

  (targetUser as any).password = cleanPass;
  dbRepo.createDbUser({
    uid: targetUser.id,
    username: targetUser.username,
    password: cleanPass,
    email: targetUser.email || `${targetUser.username}@wedding.local`,
    name: targetUser.name,
    role: targetUser.role,
    weddingSlug: targetUser.weddingSlug,
    coupleNames: targetUser.coupleNames,
    phone: targetUser.phone,
    notes: targetUser.notes,
    active: targetUser.active,
    createdBy: targetUser.createdBy,
    createdByName: targetUser.createdByName
  }).catch(err => console.error('DB change-password persist error:', err));

  return res.json({ 
    success: true, 
    message: `Kata sandi untuk @${targetUser.username} berhasil diubah.` 
  });
});

// ---------------- ADMIN & SUPER ADMIN ROUTES ----------------

// Fetch full admin data
app.get('/api/admin/data', async (req, res) => {
  await ensureDatabaseSynced();
  const requestedSlug = (req.query.slug as string) || (req.query.w as string);
  const activeSettings = getWedding(requestedSlug);

  // Collect distinct weddings
  const weddingsList: Array<{ slug: string; coupleNames: string; title: string }> = [];
  const seenSlugs = new Set<string>();

  for (const [key, val] of weddingsMap.entries()) {
    if (key === 'main' || key === 'default') continue;
    const s = val.slug || key;
    if (!seenSlugs.has(s)) {
      seenSlugs.add(s);
      weddingsList.push({
        slug: s,
        coupleNames: val.coupleNames || `${val.groom.nickname} & ${val.bride.nickname}`,
        title: val.title
      });
    }
  }

  res.json({
    guests,
    wishes: getWishesForSettings(activeSettings),
    stats: calculateStats(),
    settings: activeSettings,
    admins: adminUsers,
    availableWeddings: weddingsList
  });
});

// Get all guests
app.get('/api/admin/guests', async (req, res) => {
  await ensureDatabaseSynced();
  res.json(guests);
});

// Add Guest
app.post('/api/admin/guests', async (req, res) => {
  await ensureDatabaseSynced();
  const { id: requestedId, slug: requestedSlug, name, phone, category, paxAllocated, notes, customGreeting } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Nama tamu wajib diisi.' });
  }

  const baseSlug =
    (requestedSlug ? String(requestedSlug).trim() : String(name).trim())
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `tamu-${Date.now()}`;
  let slug = baseSlug;
  let counter = 1;
  while (guests.some(g => g.slug === slug && g.id !== requestedId)) {
    slug = `${baseSlug}-${counter++}`;
  }

  const guestId = requestedId ? String(requestedId) : `g-${Date.now()}`;
  const newGuest: Guest = {
    id: guestId,
    name: String(name).trim(),
    slug,
    phone: phone || '',
    category: category || 'Sahabat',
    paxAllocated: paxAllocated ? Number(paxAllocated) : 2,
    rsvpStatus: 'unconfirmed',
    paxConfirmed: 0,
    checkedIn: false,
    checkedInAt: null,
    notes: notes || '',
    invitationSent: false,
    customGreeting: customGreeting || '',
    createdAt: new Date().toISOString()
  };

  const existingIdx = guests.findIndex(g => g.id === guestId);
  if (existingIdx >= 0) {
    guests[existingIdx] = { ...guests[existingIdx], ...newGuest };
  } else {
    guests.unshift(newGuest);
  }
  await dbRepo.upsertGuest(newGuest);
  broadcast({
    type: 'GUEST_UPDATED',
    payload: newGuest
  });

  res.status(201).json({ success: true, guest: newGuest });
});

// Batch Add Guests (from .TXT or bulk import)
app.post('/api/admin/guests/batch', async (req, res) => {
  await ensureDatabaseSynced();
  const { guests: incomingGuests, skipDuplicates } = req.body;
  if (!incomingGuests || !Array.isArray(incomingGuests) || incomingGuests.length === 0) {
    return res.status(400).json({ error: 'Data tamu tidak valid atau kosong.' });
  }

  const validCategories: GuestCategory[] = [
    'VIP', 'Keluarga Inti', 'Keluarga Besar', 'Sahabat', 'Rekan Kerja', 'Tamu Umum'
  ];

  const addedGuests: Guest[] = [];
  const skippedGuests: string[] = [];

  for (let i = 0; i < incomingGuests.length; i++) {
    const item = incomingGuests[i];
    const rawName = String(item.name || '').trim();
    if (!rawName) continue;

    // Check duplicate by name if skipDuplicates is true
    if (skipDuplicates) {
      const alreadyExists = guests.some(g => g.name.toLowerCase() === rawName.toLowerCase());
      if (alreadyExists) {
        skippedGuests.push(rawName);
        continue;
      }
    }

    const baseSlug = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let slug = baseSlug || `tamu-${Date.now()}`;
    let counter = 1;
    while (guests.some(g => g.slug === slug) || addedGuests.some(g => g.slug === slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    const category: GuestCategory = validCategories.includes(item.category) ? item.category : 'Tamu Umum';
    const paxAllocated = item.paxAllocated ? Math.max(1, Math.min(20, Number(item.paxAllocated))) : 2;

    const newGuest: Guest = {
      id: `g-${Date.now()}-${Math.random().toString(36).substr(2, 5)}-${i}`,
      name: rawName,
      slug,
      phone: item.phone ? String(item.phone).trim() : '',
      category,
      paxAllocated,
      rsvpStatus: 'unconfirmed',
      paxConfirmed: 0,
      checkedIn: false,
      checkedInAt: null,
      notes: item.notes ? String(item.notes).trim() : '',
      invitationSent: false,
      customGreeting: item.customGreeting ? String(item.customGreeting).trim() : '',
      createdAt: new Date().toISOString()
    };

    addedGuests.push(newGuest);
    guests.unshift(newGuest);
    await dbRepo.upsertGuest(newGuest);
  }

  // Broadcast updates
  if (addedGuests.length > 0) {
    broadcast({
      type: 'GUESTS_BATCH_ADDED',
      payload: addedGuests
    });
  }

  res.status(201).json({
    success: true,
    addedCount: addedGuests.length,
    skippedCount: skippedGuests.length,
    addedGuests,
    skippedGuests,
    message: `Berhasil menambahkan ${addedGuests.length} tamu undangan.`
  });
});

// Download TXT template for guest import
app.get('/api/admin/template/guests-txt', (req, res) => {
  const templateContent = [
    '# ============================================================================== #',
    '# TEMPLATE IMPORT DAFTAR TAMU UNDANGAN (.TXT)                                   #',
    '# ============================================================================== #',
    '# PETUNJUK FORMAT:',
    '# 1. Tulis 1 (satu) data tamu per baris.',
    '# 2. Pisahkan antar kolom dengan simbol pipa: |',
    '# 3. Urutan kolom:',
    '#    Nama Tamu | Kategori | Nomor WhatsApp | Jumlah Pax | Catatan / Meja',
    '#',
    '# PILIHAN KATEGORI YANG VALID:',
    '#    VIP, Keluarga Inti, Keluarga Besar, Sahabat, Rekan Kerja, Tamu Umum',
    '#',
    '# FORMAT SEDERHANA (Hanya nama per baris juga didukung!):',
    '#    Bpk. Ahmad Fauzi & Keluarga',
    '#    dr. Linda Permata',
    '#',
    '# CONTOH DAFTAR TAMU DI BAWAH INI (Silakan sesuaikan atau ganti dengan daftar Anda):',
    '# ============================================================================== #',
    '',
    'Bpk. H. Ahmad Sudirman & Partner | VIP | 081234567890 | 2 | Meja VIP 1',
    'Siti Rahmawati, S.Kom | Sahabat | 085678901234 | 2 | Teman Kampus',
    'Keluarga Besar Bpk. Hendra Gunawan | Keluarga Besar | 081987654321 | 4 | Meja Keluarga',
    'dr. Kevin Pratama & Istri | Rekan Kerja | 082198765432 | 2 | Rekan Rumah Sakit',
    'Budi Santoso | Tamu Umum | 087712345678 | 1 | Komunitas',
    'Ibu Hj. Aminah & Keluarga | VIP | 081345678901 | 3 | VIP Utama',
    'Rian Hidayat | Sahabat | | 2 | Teman SMA',
    'Pak RT Bambang & Ibu | Tamu Umum | | 2 | Warga RT 04'
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="template_daftar_tamu.txt"');
  res.status(200).send(templateContent);
});

// Update Guest
app.put('/api/admin/guests/:id', async (req, res) => {
  await ensureDatabaseSynced();
  const { name, slug, phone, category, paxAllocated, rsvpStatus, paxConfirmed, notes, invitationSent, customGreeting } = req.body;
  let guest = guests.find(g => g.id === req.params.id);

  if (!guest) {
    const fallbackName = name ? String(name).trim() : 'Tamu Undangan';
    const baseSlug =
      (slug ? String(slug).trim() : fallbackName)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `tamu-${Date.now()}`;
    guest = {
      id: req.params.id,
      name: fallbackName,
      slug: baseSlug,
      phone: phone ? String(phone).trim() : '',
      category: category || 'Sahabat',
      paxAllocated: paxAllocated !== undefined ? Number(paxAllocated) : 2,
      rsvpStatus: rsvpStatus || 'unconfirmed',
      paxConfirmed: paxConfirmed !== undefined ? Number(paxConfirmed) : 0,
      checkedIn: false,
      checkedInAt: null,
      notes: notes || '',
      invitationSent: Boolean(invitationSent),
      customGreeting: customGreeting || '',
      createdAt: new Date().toISOString()
    };
    guests.unshift(guest);
  } else {
    if (name !== undefined) guest.name = String(name).trim();
    if (phone !== undefined) guest.phone = String(phone).trim();
    if (category !== undefined) guest.category = category;
    if (paxAllocated !== undefined) guest.paxAllocated = Number(paxAllocated);
    if (rsvpStatus !== undefined) guest.rsvpStatus = rsvpStatus;
    if (paxConfirmed !== undefined) guest.paxConfirmed = Number(paxConfirmed);
    if (notes !== undefined) guest.notes = notes;
    if (invitationSent !== undefined) guest.invitationSent = Boolean(invitationSent);
    if (customGreeting !== undefined) guest.customGreeting = customGreeting;
  }

  await dbRepo.upsertGuest(guest);
  broadcast({
    type: 'GUEST_UPDATED',
    payload: guest
  });

  res.json({ success: true, guest });
});

// Delete Guest
app.delete('/api/admin/guests/:id', async (req, res) => {
  await ensureDatabaseSynced();
  const index = guests.findIndex(g => g.id === req.params.id);
  if (index !== -1) {
    guests.splice(index, 1);
  }
  await dbRepo.deleteGuest(req.params.id);
  res.json({ success: true });
});

// Check-in Scanner API (Reception Desk)
app.post('/api/admin/guests/:id/checkin', async (req, res) => {
  await ensureDatabaseSynced();
  const { undo, guest: incomingGuest } = req.body || {};
  let guest = guests.find(g => g.id === req.params.id || g.slug === req.params.id);
  if (!guest && incomingGuest && incomingGuest.id) {
    guest = { ...incomingGuest };
    guests.unshift(guest!);
  }
  if (!guest) {
    return res.status(404).json({ error: 'Tamu tidak ditemukan dengan ID atau kode tersebut.' });
  }

  if (undo) {
    guest.checkedIn = false;
    guest.checkedInAt = null;
  } else {
    guest.checkedIn = true;
    guest.checkedInAt = new Date().toISOString();
  }

  await dbRepo.upsertGuest(guest);
  broadcast({
    type: 'GUEST_CHECKED_IN',
    payload: { guest, timestamp: guest.checkedInAt || '' }
  });

  res.json({ success: true, guest });
});

// Restore Default Template Wishes
app.post('/api/admin/wishes/restore-templates', (req, res) => {
  const { slug } = req.body || {};
  const activeSettings = getWedding(slug);
  let restoredCount = 0;

  for (const tpl of DEFAULT_TEMPLATE_WISHES) {
    const existingIdx = wishes.findIndex(w => w.id === tpl.id);
    if (existingIdx === -1) {
      const cloned: Wish = { ...tpl };
      wishes.push(cloned);
      dbRepo.upsertWish(cloned).catch(err => console.error('DB Wish restore error:', err));
      broadcast({
        type: 'NEW_WISH',
        payload: cloned
      });
      restoredCount++;
    } else {
      wishes[existingIdx].isApproved = true;
      dbRepo.upsertWish(wishes[existingIdx]).catch(err => console.error('DB Wish update error:', err));
      broadcast({
        type: 'UPDATE_WISH',
        payload: wishes[existingIdx]
      });
    }
  }

  res.json({
    success: true,
    restoredCount,
    wishes: getWishesForSettings(activeSettings),
    message: restoredCount > 0
      ? `Berhasil memulihkan ${restoredCount} ucapan template untuk mempelai.`
      : 'Seluruh ucapan template telah ditampilkan kembali.'
  });
});

// Admin Add New / Template Wish
app.post('/api/admin/wishes', async (req, res) => {
  await ensureDatabaseSynced();
  const { senderName, message, attendance, pax, isPinned, adminReply } = req.body || {};
  if (!senderName || !message) {
    return res.status(400).json({ error: 'Nama pengirim dan isi ucapan wajib diisi.' });
  }

  const newWish: Wish = {
    id: `w-${Date.now()}`,
    senderName: String(senderName).trim(),
    message: String(message).trim(),
    attendance: attendance || 'attending',
    pax: pax ? Number(pax) : 2,
    isPinned: Boolean(isPinned),
    isApproved: true,
    reactionCount: 1,
    adminReply: adminReply ? String(adminReply).trim() : undefined,
    createdAt: new Date().toISOString()
  };

  wishes.unshift(newWish);
  await dbRepo.upsertWish(newWish);
  broadcast({
    type: 'NEW_WISH',
    payload: newWish
  });

  res.status(201).json({ success: true, wish: newWish });
});

// Wishes Moderation (Pin, Approve, Hide, Reply)
app.put('/api/admin/wishes/:id', async (req, res) => {
  await ensureDatabaseSynced();
  const wish = wishes.find(w => w.id === req.params.id);
  if (!wish) {
    return res.status(404).json({ error: 'Ucapan tidak ditemukan.' });
  }

  const { isPinned, isApproved, adminReply } = req.body;

  if (isPinned !== undefined) wish.isPinned = Boolean(isPinned);
  if (isApproved !== undefined) wish.isApproved = Boolean(isApproved);
  if (adminReply !== undefined) wish.adminReply = adminReply;

  await dbRepo.upsertWish(wish);
  broadcast({
    type: 'UPDATE_WISH',
    payload: wish
  });

  res.json({ success: true, wish });
});

// Delete Wish
app.delete('/api/admin/wishes/:id', async (req, res) => {
  await ensureDatabaseSynced();
  const index = wishes.findIndex(w => w.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Ucapan tidak ditemukan.' });
  }
  const deletedId = wishes[index].id;
  wishes.splice(index, 1);
  await dbRepo.deleteWish(deletedId);

  broadcast({
    type: 'DELETE_WISH',
    payload: { id: deletedId }
  });

  res.json({ success: true });
});

// Export guests to CSV
app.get('/api/admin/export/guests', (req, res) => {
  let csv = 'Nama Tamu,Kategori,Nomor Telepon,Alokasi Pax,Status RSVP,Pax Konfirmasi,Check-in,Waktu Check-in,Catatan\n';
  guests.forEach(g => {
    const cleanName = `"${g.name.replace(/"/g, '""')}"`;
    const cleanNotes = `"${(g.notes || '').replace(/"/g, '""')}"`;
    csv += `${cleanName},${g.category},${g.phone || '-'},${g.paxAllocated},${g.rsvpStatus},${g.paxConfirmed},${g.checkedIn ? 'Sudah' : 'Belum'},${g.checkedInAt || '-'},${cleanNotes}\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="data-tamu-undangan.csv"');
  res.status(200).send(csv);
});

// ---------------- GALLERY MANAGEMENT API ROUTES ----------------

// Get all galleries (public)
app.get('/api/public/gallery', async (req, res) => {
  await ensureDatabaseSynced();
  const slug = (req.query.slug as string) || undefined;
  const activeSettings = getWedding(slug);
  res.json({
    success: true,
    galleries: activeSettings.galleries || []
  });
});

// Admin add new photo to gallery
app.post('/api/admin/gallery', async (req, res) => {
  await ensureDatabaseSynced();
  const { id: requestedId, url, caption, category, isFeatured, slug } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Foto atau URL gambar wajib diisi.' });
  }

  const activeSettings = getWedding(slug);
  const targetSlug = activeSettings.slug || (slug ? sanitizeSlug(slug) : 'default');

  const newPhoto: GalleryPhoto = {
    id: requestedId && typeof requestedId === 'string'
      ? requestedId
      : `gal-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    url: String(url).trim(),
    caption: caption ? String(caption).trim() : 'Momen Bahagia',
    category: category || 'Prewedding',
    isFeatured: Boolean(isFeatured),
    uploadedAt: new Date().toISOString()
  };

  if (!activeSettings.galleries) {
    activeSettings.galleries = [];
  }

  const existingIdx = activeSettings.galleries.findIndex(p => p.id === newPhoto.id);
  if (existingIdx !== -1) {
    activeSettings.galleries[existingIdx] = newPhoto;
  } else {
    activeSettings.galleries.unshift(newPhoto);
  }

  weddingsMap.set(targetSlug, activeSettings);
  weddingSettings.galleries = activeSettings.galleries;
  await dbRepo.upsertGallery(newPhoto);
  await dbRepo.saveSettings(activeSettings, targetSlug);
  await dbRepo.saveSettings(weddingSettings, 'main');

  broadcast({
    type: 'GALLERY_UPDATED',
    payload: activeSettings.galleries
  });

  broadcast({
    type: 'SETTINGS_UPDATED',
    payload: activeSettings
  });

  res.status(201).json({ success: true, photo: newPhoto, galleries: activeSettings.galleries });
});

// Admin update photo details
app.put('/api/admin/gallery/:id', async (req, res) => {
  await ensureDatabaseSynced();
  const { caption, category, isFeatured, url, slug } = req.body;
  const activeSettings = getWedding(slug);
  const targetSlug = activeSettings.slug || (slug ? sanitizeSlug(slug) : 'default');

  if (!activeSettings.galleries) {
    activeSettings.galleries = [];
  }

  let photo = activeSettings.galleries.find(p => p.id === req.params.id);
  if (!photo) {
    photo = {
      id: req.params.id,
      url: url ? String(url).trim() : '',
      caption: caption ? String(caption).trim() : 'Momen Bahagia',
      category: category || 'Prewedding',
      isFeatured: Boolean(isFeatured),
      uploadedAt: new Date().toISOString()
    };
    activeSettings.galleries.unshift(photo);
  } else {
    if (url !== undefined) photo.url = String(url).trim();
    if (caption !== undefined) photo.caption = String(caption).trim();
    if (category !== undefined) photo.category = category;
    if (isFeatured !== undefined) photo.isFeatured = Boolean(isFeatured);
  }

  weddingsMap.set(targetSlug, activeSettings);
  weddingSettings.galleries = activeSettings.galleries;
  await dbRepo.upsertGallery(photo);
  await dbRepo.saveSettings(activeSettings, targetSlug);
  await dbRepo.saveSettings(weddingSettings, 'main');

  broadcast({
    type: 'GALLERY_UPDATED',
    payload: activeSettings.galleries
  });

  broadcast({
    type: 'SETTINGS_UPDATED',
    payload: activeSettings
  });

  res.json({ success: true, photo, galleries: activeSettings.galleries });
});

// Admin delete photo
app.delete('/api/admin/gallery/:id', async (req, res) => {
  await ensureDatabaseSynced();
  const slug = (req.query.slug as string) || (req.body && req.body.slug);
  const activeSettings = getWedding(slug);
  const targetSlug = activeSettings.slug || (slug ? sanitizeSlug(slug) : 'default');

  const galleries = activeSettings.galleries || [];
  const index = galleries.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    galleries.splice(index, 1);
  }

  weddingsMap.set(targetSlug, activeSettings);
  weddingSettings.galleries = activeSettings.galleries;
  await dbRepo.deleteGallery(req.params.id);
  await dbRepo.saveSettings(activeSettings, targetSlug);
  await dbRepo.saveSettings(weddingSettings, 'main');

  broadcast({
    type: 'GALLERY_UPDATED',
    payload: galleries
  });

  broadcast({
    type: 'SETTINGS_UPDATED',
    payload: activeSettings
  });

  res.json({ success: true, galleries });
});

// Maps configuration endpoint (for fallback/client access)
app.get('/api/config/maps', (req, res) => {
  res.json({
    apiKey: process.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyC_Py9u6so1dfiyki1d80azUayBXifP6Cc'
  });
});


// ---------------- SUPER ADMIN EXCLUSIVE ROUTES ----------------

// Update Wedding Settings
app.put('/api/superadmin/settings', async (req, res) => {
  await ensureDatabaseSynced();
  const newSettings = req.body;
  const groomNick = newSettings.groom?.nickname || newSettings.groom?.fullName || '';
  const brideNick = newSettings.bride?.nickname || newSettings.bride?.fullName || '';
  
  // Determine wedding slug (custom slug, or auto generated from groom & bride, or existing)
  const incomingSlug = newSettings.slug || (req.query.slug as string) || (newSettings.oldSlug as string);
  let targetSlug = incomingSlug 
    ? sanitizeSlug(incomingSlug)
    : (groomNick && brideNick ? generateWeddingSlug(groomNick, brideNick) : (weddingSettings.slug || 'default'));

  if (!targetSlug) targetSlug = 'default';

  const oldKey = newSettings.oldSlug ? sanitizeSlug(newSettings.oldSlug) : '';
  const current =
    weddingsMap.get(targetSlug) ||
    (oldKey ? weddingsMap.get(oldKey) : undefined) ||
    weddingSettings;
  const coupleNames = newSettings.coupleNames || (groomNick && brideNick ? `${groomNick} & ${brideNick}` : current.coupleNames);
  const title = newSettings.title || (coupleNames ? `The Wedding of ${coupleNames}` : current.title);

  const updated: WeddingSettings = {
    ...current,
    ...newSettings,
    id: targetSlug,
    slug: targetSlug,
    coupleNames,
    title
  };
  delete (updated as any)._locallyModified;
  delete (updated as any).adminEmail;
  (updated as any).oldSlug = oldKey || targetSlug;
  (updated as any).updatedAt = new Date().toISOString();

  weddingsMap.set(targetSlug, updated);
  weddingsMap.set('main', updated);
  weddingsMap.set('default', updated);

  // If old slug existed and changed, update map AND persist to database so old URLs/sessions stay synced
  if (oldKey && oldKey !== targetSlug && oldKey !== 'main' && oldKey !== 'default') {
    weddingsMap.set(oldKey, updated);
    await dbRepo.saveSettings(updated, oldKey);
  }

  // Update associated Super Admin & Admin WO accounts (never overwrite the Owner account)
  const targetAdmin = newSettings.adminEmail ? String(newSettings.adminEmail).toLowerCase() : '';
  let usersUpdated = false;
  for (const u of adminUsers) {
    if (u.isOwner || u.username?.toLowerCase() === 'asepsulistiyono1' || u.email?.toLowerCase() === 'asepsulistiyono1@gmail.com') {
      continue;
    }
    const uSlug = u.weddingSlug ? sanitizeSlug(u.weddingSlug) : '';
    const matchesSlug = (uSlug && (uSlug === targetSlug || (oldKey && uSlug === oldKey)));
    const matchesAdminIdent =
      targetAdmin &&
      ((u.email && u.email.toLowerCase() === targetAdmin) ||
        (u.username && u.username.toLowerCase() === targetAdmin));

    if (matchesSlug || matchesAdminIdent) {
      u.weddingSlug = targetSlug;
      u.coupleNames = coupleNames;
      if (u.role === 'super_admin' && coupleNames) {
        u.name = coupleNames;
      } else if (u.role === 'admin' && coupleNames) {
        u.createdByName = coupleNames;
      }
      usersUpdated = true;
      await dbRepo.createDbUser({
        uid: u.id,
        username: u.username,
        password: (u as any).password,
        email: u.email || `${u.username}@wedding.local`,
        name: u.name,
        role: u.role,
        weddingSlug: u.weddingSlug,
        coupleNames: u.coupleNames,
        phone: u.phone,
        notes: u.notes,
        active: u.active,
        createdBy: u.createdBy,
        createdByName: u.createdByName
      });
    }
  }

  // Always update default/main weddingSettings as well so opening root URL "/" on any device (HP/Phone) reflects the latest saved settings
  weddingSettings = updated;

  await dbRepo.saveSettings(updated, targetSlug);
  await dbRepo.saveSettings(updated, 'main');
  await dbRepo.saveSettings(updated, 'default');

  broadcast({
    type: 'SETTINGS_UPDATED',
    payload: { ...updated, ...(oldKey ? { oldSlug: oldKey } : {}) } as WeddingSettings
  });

  if (usersUpdated) {
    broadcast({
      type: 'USERS_UPDATED',
      payload: adminUsers.filter(u => !u.isOwner && u.username?.toLowerCase() !== 'asepsulistiyono1')
    });
  }

  res.json({ 
    success: true, 
    settings: updated, 
    slug: targetSlug,
    invitationUrl: `/#/${targetSlug}`
  });
});

// Real-time broadcast announcement to all live viewers
app.post('/api/superadmin/broadcast', (req, res) => {
  const { message, active, slug } = req.body;
  const activeSettings = getWedding(slug);
  const targetSlug = activeSettings.slug || (slug ? sanitizeSlug(slug) : 'default');

  if (message && active) {
    activeSettings.announcement = {
      id: `ann-${Date.now()}`,
      message: String(message),
      active: true,
      createdAt: new Date().toISOString()
    };
    broadcast({
      type: 'BROADCAST_ANNOUNCEMENT',
      payload: { message: String(message), timestamp: new Date().toISOString() }
    });
  } else {
    activeSettings.announcement = null;
  }

  weddingsMap.set(targetSlug, activeSettings);
  dbRepo.saveSettings(activeSettings, targetSlug).catch(err => console.error('DB Broadcast save error:', err));

  broadcast({
    type: 'SETTINGS_UPDATED',
    payload: activeSettings
  });

  res.json({ success: true, announcement: activeSettings.announcement });
});

// Super Admin & Owner: List admins / users
app.get(['/api/superadmin/users', '/api/superadmin/admins'], async (req, res) => {
  await ensureDatabaseSynced();
  const authHeader = req.headers.authorization || '';
  const queryUserId = String(req.query.userId || '').trim().toLowerCase();
  const queryUsername = String(req.query.username || '').trim().toLowerCase();

  const callerUser = adminUsers.find(u => 
    (queryUserId && u.id && u.id.toLowerCase() === queryUserId) || 
    (queryUserId && u.username && u.username.toLowerCase() === queryUserId) ||
    (queryUsername && u.username && u.username.toLowerCase() === queryUsername) ||
    (queryUserId && u.email && u.email.toLowerCase() === queryUserId)
  );

  const isOwnerCalling = Boolean(
    authHeader.includes('user-owner-1') ||
    queryUserId === 'user-owner-1' ||
    queryUserId === 'asepsulistiyono1' ||
    queryUsername === 'asepsulistiyono1' ||
    callerUser?.isOwner ||
    callerUser?.username?.toLowerCase() === 'asepsulistiyono1' ||
    callerUser?.email?.toLowerCase() === 'asepsulistiyono1@gmail.com'
  );

  // Jika yang memanggil adalah klien Super Admin biasa (mempelai), hanya tampilkan akunnya sendiri dan staf Admin WO miliknya
  if (!isOwnerCalling && callerUser && callerUser.role === 'super_admin') {
    const callerSlug = callerUser.weddingSlug;
    const clientStaff = adminUsers
      .filter(u => 
        !u.isOwner &&
        u.username?.toLowerCase() !== 'asepsulistiyono1' &&
        u.email?.toLowerCase() !== 'asepsulistiyono1@gmail.com' &&
        (
          u.id === callerUser.id || 
          (u.role === 'admin' && (u.createdBy === callerUser.id || u.createdBy === callerUser.username || (callerSlug && u.weddingSlug === callerSlug)))
        )
      )
      .map(u => ({
        ...u,
        password: u.id === callerUser.id ? (u.password || 'super123') : (u.password || 'admin123')
      }));
    return res.json(clientStaff);
  }

  // Jika yang memanggil adalah Admin WO
  if (!isOwnerCalling && callerUser && callerUser.role === 'admin') {
    const callerSlug = callerUser.weddingSlug;
    const woColleagues = adminUsers.filter(u => 
      !u.isOwner &&
      u.role === 'admin' &&
      u.weddingSlug === callerSlug
    );
    return res.json(woColleagues);
  }

  // Jika dipanggil oleh Owner: tampilkan seluruh Super Admin dan Admin WO di platform
  // Sembunyikan akun Owner utama agar tetap terlindungi
  const visibleUsers = adminUsers
    .filter(u => 
      !u.isOwner && 
      u.email?.toLowerCase() !== 'asepsulistiyono1@gmail.com' && 
      u.username?.toLowerCase() !== 'asepsulistiyono1'
    )
    .map(u => ({
      ...u,
      password: u.password || (u.role === 'super_admin' ? 'super123' : 'admin123')
    }))
    .sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tB - tA;
    });

  res.json(visibleUsers);
});

// Owner & Super Admin: Tambah pengelola baru
// Owner berkuasa penuh membuat ribuan akun Super Admin (klien mempelai).
// Klien Super Admin hanya berhak membuat akun Admin WO untuk acara pernikahannya.
app.post(['/api/superadmin/users', '/api/superadmin/admins'], async (req, res) => {
  await ensureDatabaseSynced();
  const { 
    name, 
    email, 
    username, 
    role, 
    password, 
    groomName, 
    brideName, 
    weddingSlug: customSlug, 
    phone, 
    notes, 
    createdBy, 
    createdByName,
    isOwnerCaller,
    callerUsername,
    callerEmail
  } = req.body;
  
  // Clean and validate username
  const rawUsername = String(username || (email ? email.split('@')[0] : '')).trim();
  const cleanUsername = rawUsername.toLowerCase().replace(/[^a-z0-9_.-]/g, '');

  if (!cleanUsername) {
    return res.status(400).json({ error: 'Username wajib diisi (hanya huruf, angka, garis bawah, atau strip).' });
  }

  if (!password || String(password).trim().length < 4) {
    return res.status(400).json({ error: 'Kata sandi wajib diisi minimal 4 karakter.' });
  }

  const callerUser = adminUsers.find(u => 
    (createdBy && (u.id === createdBy || u.username === createdBy)) ||
    (callerUsername && u.username?.toLowerCase() === String(callerUsername).toLowerCase()) ||
    (callerEmail && u.email?.toLowerCase() === String(callerEmail).toLowerCase())
  );
  const authHeader = req.headers.authorization || '';
  const isOwnerCalling = Boolean(
    isOwnerCaller === true ||
    authHeader.includes('owner') || 
    authHeader.includes('user-owner-1') ||
    createdBy === 'user-owner-1' ||
    createdBy === 'asepsulistiyono1' ||
    String(callerUsername || '').toLowerCase() === 'asepsulistiyono1' ||
    String(callerUsername || '').toLowerCase() === 'owner' ||
    String(callerEmail || '').toLowerCase() === 'asepsulistiyono1@gmail.com' ||
    callerUser?.isOwner ||
    callerUser?.username?.toLowerCase() === 'asepsulistiyono1' ||
    callerUser?.email?.toLowerCase() === 'asepsulistiyono1@gmail.com'
  );

  // Klien Super Admin hanya boleh menambah Admin WO, tidak boleh menambah Super Admin lain
  if (role === 'super_admin' && callerUser && !isOwnerCalling) {
    return res.status(403).json({ 
      error: 'Ditolak: Hanya Pemilik Website yang berwenang menciptakan akun Super Admin baru.' 
    });
  }

  const finalEmail = (email && String(email).trim().toLowerCase()) || `${cleanUsername}@wedding.local`;
  const finalName = name ? String(name).trim() : (groomName && brideName ? `${groomName} & ${brideName}` : cleanUsername);

  let finalWeddingSlug: string | undefined = undefined;
  let coupleNames: string | undefined = undefined;
  let createdWeddingSettings: WeddingSettings | undefined = undefined;

  if (role === 'super_admin' || groomName || brideName || customSlug) {
    const gn = groomName ? String(groomName).trim() : finalName.split('&')[0]?.trim() || 'Thomas';
    const bn = brideName ? String(brideName).trim() : finalName.split('&')[1]?.trim() || 'Juwita';
    finalWeddingSlug = customSlug 
      ? sanitizeSlug(String(customSlug))
      : generateWeddingSlug(gn, bn);
    coupleNames = `${gn} & ${bn}`;

    // Buat template acara mandiri khusus wedding slug ini dan simpan langsung ke Supabase & PostgreSQL
    createdWeddingSettings = createWeddingTemplate(finalWeddingSlug, gn, bn);
    await dbRepo.saveSettings(createdWeddingSettings, finalWeddingSlug);
  }

  // Tautkan Admin WO dengan Super Admin pembuatnya
  const assignedCreatorId = role === 'admin' ? (createdBy || callerUser?.id) : undefined;
  const assignedCreatorName = role === 'admin' ? (createdByName || callerUser?.name) : undefined;
  const assignedWeddingSlug = role === 'super_admin' ? finalWeddingSlug : (customSlug || callerUser?.weddingSlug || 'default');

  // Check if username already exists
  const existingIdx = adminUsers.findIndex(u => 
    (u.username && u.username.toLowerCase() === cleanUsername) || 
    (u.email && u.email.toLowerCase() === cleanUsername)
  );

  if (existingIdx !== -1) {
    // If Owner is creating/updating a Super Admin or Admin WO that already exists (and is not the Owner account itself), update it seamlessly
    if (isOwnerCalling && !adminUsers[existingIdx].isOwner && cleanUsername !== 'asepsulistiyono1') {
      const updatedExisting: AdminUser & { password?: string } = {
        ...adminUsers[existingIdx],
        username: cleanUsername,
        name: finalName,
        email: finalEmail,
        role: role === 'super_admin' ? 'super_admin' : 'admin',
        active: true,
        password: String(password).trim(),
        weddingSlug: assignedWeddingSlug || adminUsers[existingIdx].weddingSlug,
        coupleNames: coupleNames || adminUsers[existingIdx].coupleNames,
        phone: phone ? String(phone).trim() : adminUsers[existingIdx].phone,
        notes: notes ? String(notes).trim() : adminUsers[existingIdx].notes,
        createdAt: new Date().toISOString(),
      };
      adminUsers.splice(existingIdx, 1);
      adminUsers.unshift(updatedExisting);
      await dbRepo.createDbUser({
        uid: updatedExisting.id,
        username: updatedExisting.username,
        password: updatedExisting.password,
        email: updatedExisting.email || `${updatedExisting.username}@wedding.local`,
        name: updatedExisting.name,
        role: updatedExisting.role,
        weddingSlug: updatedExisting.weddingSlug,
        coupleNames: updatedExisting.coupleNames,
        phone: updatedExisting.phone,
        notes: updatedExisting.notes,
        active: updatedExisting.active,
        createdBy: updatedExisting.createdBy,
        createdByName: updatedExisting.createdByName
      });

      broadcast({
        type: 'USERS_UPDATED',
        payload: adminUsers.filter(u => !u.isOwner && u.username?.toLowerCase() !== 'asepsulistiyono1')
      });

      return res.status(201).json({
        success: true,
        admin: updatedExisting,
        user: updatedExisting,
        weddingSlug: updatedExisting.weddingSlug,
        invitationUrl: updatedExisting.weddingSlug ? `/#/${updatedExisting.weddingSlug}` : '/'
      });
    }

    return res.status(400).json({ error: `Username "${cleanUsername}" sudah terdaftar. Silakan pilih username lain.` });
  }

  const newAdmin: AdminUser & { password?: string } = {
    id: `user-${role === 'super_admin' ? 'super' : 'admin'}-${Date.now()}`,
    username: cleanUsername,
    name: finalName,
    email: finalEmail,
    role: role === 'super_admin' ? 'super_admin' : 'admin',
    active: true,
    password: String(password).trim(),
    weddingSlug: assignedWeddingSlug,
    coupleNames: coupleNames || (role === 'admin' ? callerUser?.coupleNames : undefined),
    phone: phone ? String(phone).trim() : undefined,
    notes: notes ? String(notes).trim() : undefined,
    createdBy: assignedCreatorId,
    createdByName: assignedCreatorName,
    createdAt: new Date().toISOString()
  };

  adminUsers.unshift(newAdmin);
  await dbRepo.createDbUser({
    uid: newAdmin.id,
    username: newAdmin.username,
    password: newAdmin.password,
    email: newAdmin.email || `${newAdmin.username}@wedding.local`,
    name: newAdmin.name,
    role: newAdmin.role,
    weddingSlug: newAdmin.weddingSlug,
    coupleNames: newAdmin.coupleNames,
    phone: newAdmin.phone,
    notes: newAdmin.notes,
    active: newAdmin.active,
    createdBy: newAdmin.createdBy,
    createdByName: newAdmin.createdByName
  });

  broadcast({
    type: 'USERS_UPDATED',
    payload: adminUsers.filter(u => !u.isOwner && u.username?.toLowerCase() !== 'asepsulistiyono1')
  });

  res.status(201).json({ 
    success: true, 
    admin: newAdmin, 
    user: newAdmin,
    settings: createdWeddingSettings,
    weddingSlug: assignedWeddingSlug,
    invitationUrl: assignedWeddingSlug ? `/#/${assignedWeddingSlug}` : '/'
  });
});

// Update user details / wedding URL slug / password / phone / notes
app.put(['/api/superadmin/users/:id', '/api/superadmin/admins/:id'], async (req, res) => {
  await ensureDatabaseSynced();
  const reqUsername = req.body?.username ? String(req.body.username).trim().toLowerCase() : '';
  const targetUser = adminUsers.find(
    u =>
      u.id === req.params.id ||
      (reqUsername && u.username && u.username.toLowerCase() === reqUsername)
  );
  if (!targetUser) {
    return res.status(404).json({ error: 'Akun pengelola tidak ditemukan.' });
  }

  const { name, groomName, brideName, weddingSlug: customSlug, password, active, phone, notes } = req.body;

  if (name !== undefined && String(name).trim()) {
    targetUser.name = String(name).trim();
  }
  if (active !== undefined) {
    targetUser.active = Boolean(active);
  }
  if (phone !== undefined) {
    targetUser.phone = String(phone).trim();
  }
  if (notes !== undefined) {
    targetUser.notes = String(notes).trim();
  }
  if (password && String(password).trim().length >= 4) {
    (targetUser as any).password = String(password).trim();
  }

  let updatedWeddingSettings: WeddingSettings | undefined = undefined;

  // If updating the Super Admin's wedding slug & couple names
  if (targetUser.role === 'super_admin' && (groomName || brideName || customSlug)) {
    const oldSlug = targetUser.weddingSlug ? sanitizeSlug(targetUser.weddingSlug) : '';
    const gn = groomName ? String(groomName).trim() : (targetUser.coupleNames?.split('&')[0]?.trim() || 'Thomas');
    const bn = brideName ? String(brideName).trim() : (targetUser.coupleNames?.split('&')[1]?.trim() || 'Juwita');
    const newSlug = customSlug ? sanitizeSlug(String(customSlug)) : generateWeddingSlug(gn, bn);
    const nextCoupleNames = `${gn} & ${bn}`;

    targetUser.weddingSlug = newSlug;
    targetUser.coupleNames = nextCoupleNames;
    targetUser.name = nextCoupleNames;

    // Also update any Admin WO staff linked to this Super Admin
    for (const staff of adminUsers) {
      if (
        staff.role === 'admin' &&
        !staff.isOwner &&
        (staff.createdBy === targetUser.id ||
          staff.createdBy === targetUser.username ||
          (oldSlug && staff.weddingSlug === oldSlug))
      ) {
        staff.weddingSlug = newSlug;
        staff.createdByName = nextCoupleNames;
        await dbRepo.createDbUser({
          uid: staff.id,
          username: staff.username,
          password: (staff as any).password,
          email: staff.email || `${staff.username}@wedding.local`,
          name: staff.name,
          role: staff.role,
          weddingSlug: staff.weddingSlug,
          coupleNames: staff.coupleNames,
          phone: staff.phone,
          notes: staff.notes,
          active: staff.active,
          createdBy: staff.createdBy,
          createdByName: staff.createdByName
        });
      }
    }

    const existingSettings =
      (oldSlug ? weddingsMap.get(oldSlug) : undefined) ||
      weddingsMap.get(newSlug) ||
      createWeddingTemplate(newSlug, gn, bn);

    const prevGroomNick = existingSettings.groom?.nickname || 'Rizky';
    const prevBrideNick = existingSettings.bride?.nickname || 'Siti';

    updatedWeddingSettings = {
      ...existingSettings,
      id: newSlug,
      slug: newSlug,
      coupleNames: nextCoupleNames,
      title: `The Wedding of ${nextCoupleNames}`,
      groom: {
        ...existingSettings.groom,
        fullName: gn,
        nickname: gn,
        instagram:
          !existingSettings.groom?.instagram ||
          existingSettings.groom.instagram === '@rizkypratama' ||
          existingSettings.groom.instagram === `@${sanitizeSlug(prevGroomNick).replace(/_/g, '')}`
            ? `@${sanitizeSlug(gn).replace(/_/g, '')}`
            : existingSettings.groom.instagram
      },
      bride: {
        ...existingSettings.bride,
        fullName: bn,
        nickname: bn,
        instagram:
          !existingSettings.bride?.instagram ||
          existingSettings.bride.instagram === '@sitinurhaliza' ||
          existingSettings.bride.instagram === `@${sanitizeSlug(prevBrideNick).replace(/_/g, '')}`
            ? `@${sanitizeSlug(bn).replace(/_/g, '')}`
            : existingSettings.bride.instagram
      },
      giftAddress: existingSettings.giftAddress
        ? {
            ...existingSettings.giftAddress,
            recipient: nextCoupleNames
          }
        : {
            recipient: nextCoupleNames,
            phone: '0812-8899-7711',
            address: 'Jakarta'
          },
      bankAccounts: Array.isArray(existingSettings.bankAccounts)
        ? existingSettings.bankAccounts.map((b, idx) => ({
            ...b,
            accountName: idx === 0 ? gn : bn
          }))
        : []
    };
    (updatedWeddingSettings as any).oldSlug = oldSlug || newSlug;
    (updatedWeddingSettings as any).updatedAt = new Date().toISOString();

    weddingsMap.set(newSlug, updatedWeddingSettings);
    weddingsMap.set('main', updatedWeddingSettings);
    weddingsMap.set('default', updatedWeddingSettings);
    weddingSettings = updatedWeddingSettings;

    if (oldSlug && oldSlug !== newSlug) {
      weddingsMap.set(oldSlug, updatedWeddingSettings);
      await dbRepo.saveSettings(updatedWeddingSettings, oldSlug);
    }
    await dbRepo.saveSettings(updatedWeddingSettings, newSlug);
    await dbRepo.saveSettings(updatedWeddingSettings, 'main');
    await dbRepo.saveSettings(updatedWeddingSettings, 'default');

    broadcast({
      type: 'SETTINGS_UPDATED',
      payload: { ...updatedWeddingSettings, ...(oldSlug ? { oldSlug } : {}) } as WeddingSettings
    });
  }

  await dbRepo.createDbUser({
    uid: targetUser.id,
    username: targetUser.username,
    password: (targetUser as any).password,
    email: targetUser.email || `${targetUser.username}@wedding.local`,
    name: targetUser.name,
    role: targetUser.role,
    weddingSlug: targetUser.weddingSlug,
    coupleNames: targetUser.coupleNames,
    phone: targetUser.phone,
    notes: targetUser.notes,
    active: targetUser.active,
    createdBy: targetUser.createdBy,
    createdByName: targetUser.createdByName
  });

  broadcast({
    type: 'USERS_UPDATED',
    payload: adminUsers.filter(u => !u.isOwner && u.username?.toLowerCase() !== 'asepsulistiyono1')
  });

  res.json({ 
    success: true, 
    user: targetUser, 
    weddingSlug: targetUser.weddingSlug,
    settings: updatedWeddingSettings,
    message: 'Data pengelola dan URL undangan berhasil diperbarui!' 
  });
});

// Super Admin: Remove admin operator
app.delete(['/api/superadmin/users/:id', '/api/superadmin/admins/:id'], async (req, res) => {
  await ensureDatabaseSynced();
  const adminToDelete = adminUsers.find(u => u.id === req.params.id);
  if (!adminToDelete) {
    return res.status(404).json({ error: 'Admin tidak ditemukan.' });
  }

  // 1. MUTLAK: Akun Pemilik Website Utama (asepsulistiyono1@gmail.com) memiliki proteksi absolut dan tidak dapat dihapus oleh siapa pun
  const isOwnerAccount = 
    adminToDelete.isOwner ||
    adminToDelete.email?.toLowerCase() === 'asepsulistiyono1@gmail.com' ||
    adminToDelete.username?.toLowerCase() === 'asepsulistiyono1';

  if (isOwnerAccount) {
    return res.status(403).json({ 
      error: 'DITOLAK: Akun Pemilik Website Utama (asepsulistiyono1) memiliki proteksi sistem permanen dan TIDAK BISA dihapus.' 
    });
  }

  // 2. Proteksi sesama Super Admin: Super Admin TIDAK BISA menghapus Owner maupun Super Admin yang lain
  const authHeader = req.headers.authorization || '';
  const callerId = String(req.query.callerId || req.body?.callerId || '').trim().toLowerCase();
  const callerUsername = String(req.query.callerUsername || req.body?.callerUsername || '').trim().toLowerCase();
  const callerUser = adminUsers.find(
    (u) =>
      (callerId && u.id.toLowerCase() === callerId) ||
      (callerUsername && u.username.toLowerCase() === callerUsername)
  );

  const isOwnerCalling = Boolean(
    authHeader.includes('user-owner-1') ||
    callerId === 'user-owner-1' ||
    callerUsername === 'asepsulistiyono1' ||
    callerUser?.isOwner ||
    callerUser?.username?.toLowerCase() === 'asepsulistiyono1' ||
    callerUser?.email?.toLowerCase() === 'asepsulistiyono1@gmail.com'
  );

  if (adminToDelete.role === 'super_admin' && !isOwnerCalling) {
    return res.status(403).json({ 
      error: 'DITOLAK: Super Admin tidak memiliki kewenangan untuk menghapus Pemilik Website atau akun Super Admin yang lain.' 
    });
  }

  // Jika yang dihapus adalah SUPER ADMIN:
  // Otomatis hapus juga seluruh akun Admin WO (staf resepsi) yang dibuat atau terafiliasi dengan Super Admin ini
  if (adminToDelete.role === 'super_admin') {
    const relatedAdminWOs = adminUsers.filter(u => 
      u.role === 'admin' && 
      !u.isOwner && 
      (
        u.createdBy === adminToDelete.id || 
        u.createdBy === adminToDelete.username || 
        (adminToDelete.weddingSlug && u.weddingSlug === adminToDelete.weddingSlug)
      )
    );

    const idsToDelete = [adminToDelete.id, ...relatedAdminWOs.map(u => u.id)];
    adminUsers = adminUsers.filter(u => !idsToDelete.includes(u.id));

    // Hapus juga record user di database bila tersimpan
    for (const uid of idsToDelete) {
      await dbRepo.deleteDbUser(uid);
    }

    broadcast({
      type: 'USERS_UPDATED',
      payload: adminUsers.filter(u => !u.isOwner && u.username?.toLowerCase() !== 'asepsulistiyono1')
    });

    const woNames = relatedAdminWOs.map(w => `@${w.username} (${w.name})`);
    const woDetailMsg = relatedAdminWOs.length > 0 
      ? ` beserta ${relatedAdminWOs.length} akun Admin WO yang dibuatnya [${woNames.join(', ')}] telah otomatis ikut terhapus.` 
      : ' berhasil dihapus.';

    return res.json({ 
      success: true, 
      deletedUser: adminToDelete,
      deletedAdminWOs: relatedAdminWOs,
      cascadeCount: relatedAdminWOs.length,
      message: `Akun Super Admin ${adminToDelete.name} (@${adminToDelete.username})${woDetailMsg}` 
    });
  }

  // Jika yang dihapus adalah Admin WO biasa
  adminUsers = adminUsers.filter(u => u.id !== req.params.id);
  await dbRepo.deleteDbUser(adminToDelete.id);
  broadcast({
    type: 'USERS_UPDATED',
    payload: adminUsers.filter(u => !u.isOwner && u.username?.toLowerCase() !== 'asepsulistiyono1')
  });
  res.json({ 
    success: true, 
    deletedUser: adminToDelete,
    message: `Akun Admin WO ${adminToDelete.name} (@${adminToDelete.username}) berhasil dihapus.` 
  });
});

// Export all Super Admins & Admins to CSV (Exclusive for Owner)
app.get('/api/superadmin/export/users', (req, res) => {
  const visible = adminUsers.filter(u => !u.isOwner);
  let csv = 'Peran,Nama Pasangan Mempelai / Pengelola,Username,Kata Sandi,URL Undangan Resmi,Nomor WhatsApp,Status Akun,Dibuat Oleh,Catatan Paket\n';
  
  visible.forEach(u => {
    const roleLabel = u.role === 'super_admin' ? 'Super Admin (Mempelai)' : 'Admin WO';
    const cleanName = `"${(u.coupleNames || u.name || '').replace(/"/g, '""')}"`;
    const cleanUser = `"${(u.username || '').replace(/"/g, '""')}"`;
    const cleanPass = `"${(u.password || (u.role === 'super_admin' ? 'super123' : 'admin123')).replace(/"/g, '""')}"`;
    const cleanUrl = u.weddingSlug ? `"/#/${u.weddingSlug}"` : '""';
    const cleanPhone = `"${(u.phone || '').replace(/"/g, '""')}"`;
    const statusLabel = u.active !== false ? 'Aktif' : 'Nonaktif';
    const creator = `"${(u.createdByName || '').replace(/"/g, '""')}"`;
    const cleanNotes = `"${(u.notes || '').replace(/"/g, '""')}"`;
    
    csv += `${roleLabel},${cleanName},${cleanUser},${cleanPass},${cleanUrl},${cleanPhone},${statusLabel},${creator},${cleanNotes}\n`;
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="daftar_klien_superadmin_mempelai.csv"');
  res.status(200).send(csv);
});

// Database & Supabase connection status endpoint
app.get('/api/admin/database-status', async (req, res) => {
  try {
    await ensureDatabaseSynced(true);
    const counts = await dbRepo.getTableCounts();
    const connInfo = getActiveConnectionInfo();
    res.json({
      connected: !connInfo.keyError,
      provider: connInfo.provider,
      isExternalSupabase: connInfo.isExternalSupabase,
      supabaseUrl: connInfo.supabaseUrl || '',
      dialect: 'postgresql',
      host: connInfo.host,
      database: connInfo.database,
      tables: ['wedding_settings', 'guests', 'wishes', 'gallery_photos', 'users'],
      tableCounts: counts,
      guestsCount: counts.guests,
      schemaSql: dbRepo.SUPABASE_SCHEMA_SQL,
      error: connInfo.keyError || undefined,
      syncedAt: new Date().toISOString()
    });
  } catch (err: any) {
    const connInfo = getActiveConnectionInfo();
    res.json({
      connected: false,
      provider: connInfo.provider,
      isExternalSupabase: connInfo.isExternalSupabase,
      supabaseUrl: connInfo.supabaseUrl || '',
      dialect: 'postgresql',
      host: connInfo.host,
      database: connInfo.database,
      tables: ['wedding_settings', 'guests', 'wishes', 'gallery_photos', 'users'],
      schemaSql: dbRepo.SUPABASE_SCHEMA_SQL,
      error: connInfo.keyError || err?.message || 'Database not connected',
      syncedAt: new Date().toISOString()
    });
  }
});

// Force synchronize all current application data to PostgreSQL / External Supabase
app.post('/api/admin/database-sync', async (req, res) => {
  try {
    dbRepo.resetSupabaseBackoff();
    await dbRepo.saveSettings(weddingSettings, 'main');
    for (const [slug, wData] of weddingsMap.entries()) {
      await dbRepo.saveSettings(wData, slug);
    }
    for (const g of guests) {
      await dbRepo.upsertGuest(g);
    }
    for (const w of wishes) {
      await dbRepo.upsertWish(w);
    }
    if (weddingSettings.galleries) {
      for (const gal of weddingSettings.galleries) {
        await dbRepo.upsertGallery(gal);
      }
    }
    for (const u of adminUsers) {
      await dbRepo.createDbUser({
        uid: u.id,
        username: u.username,
        password: u.password,
        email: u.email || `${u.username}@wedding.local`,
        name: u.name,
        role: u.role,
        weddingSlug: u.weddingSlug,
        coupleNames: u.coupleNames,
        phone: u.phone,
        notes: u.notes,
        active: u.active,
        createdBy: u.createdBy,
        createdByName: u.createdByName
      });
    }

    await ensureDatabaseSynced(true);
    const counts = await dbRepo.getTableCounts();
    const connInfo = getActiveConnectionInfo();
    res.json({
      success: true,
      message: !connInfo.keyError && connInfo.isExternalSupabase
        ? `Seluruh data undangan (${counts.wedding_settings} URL), buku tamu (${counts.guests} tamu), ucapan (${counts.wishes}), galeri (${counts.gallery_photos} foto), dan akun pengelola (${counts.users} akun) berhasil disinkronkan langsung ke proyek Supabase (${connInfo.host})!`
        : `Seluruh data (${counts.wedding_settings} URL undangan, ${counts.guests} tamu, ${counts.wishes} ucapan, ${counts.gallery_photos} foto, ${counts.users} akun) telah tersimpan di Database Cloud PostgreSQL dan siap dibuka di Komputer maupun HP!`,
      tableCounts: counts,
      provider: connInfo.provider,
      isExternalSupabase: connInfo.isExternalSupabase,
      syncedAt: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({
      error: err?.message || 'Gagal melakukan sinkronisasi ke database.'
    });
  }
});

// Synchronize and verify managed Cloud SQL / Supabase connection
app.post('/api/admin/supabase-connect', async (req, res) => {
  try {
    await initDatabaseData();
    const counts = await dbRepo.getTableCounts();
    const connInfo = getActiveConnectionInfo();

    res.json({
      success: true,
      connected: true,
      provider: connInfo.provider,
      host: connInfo.host,
      database: connInfo.database,
      tableCounts: counts,
      message: 'Berhasil menyinkronkan ke-5 tabel database!'
    });
  } catch (err: any) {
    res.status(500).json({
      error: `Gagal menyinkronkan database: ${err?.message || 'Terjadi kesalahan koneksi'}`
    });
  }
});

let isInitialSeedDone = false;
let lastDbSyncTimestamp = 0;

// Synchronize in-memory state from PostgreSQL / External Supabase so all devices (Computer & HP) always share identical data
async function initDatabaseData() {
  try {
    const [dbSettings, allWeddings, dbUsers, dbGuests, dbWishes, dbGalleries] = await Promise.all([
      dbRepo.getSettings('main'),
      dbRepo.getAllWeddings(),
      dbRepo.getAllUsers(),
      dbRepo.getAllGuests(),
      dbRepo.getAllWishes(),
      dbRepo.getAllGalleries(),
    ]);

    if (dbSettings && dbSettings.groom?.fullName) {
      weddingSettings = { ...weddingSettings, ...dbSettings };
      weddingsMap.set('main', weddingSettings);
      weddingsMap.set('default', weddingSettings);
      if (weddingSettings.slug) {
        weddingsMap.set(weddingSettings.slug, weddingSettings);
      }
    } else if (!isInitialSeedDone) {
      await dbRepo.saveSettings(weddingSettings, 'main');
    }

    if (Array.isArray(allWeddings) && allWeddings.length > 0) {
      for (const w of allWeddings) {
        if (!w.id || !w.data || !w.data.groom?.fullName) continue;
        if (w.id.includes('test') || String(w.data.slug || '').includes('test')) continue;
        delete (w.data as any).oldSlug;
        weddingsMap.set(w.id, w.data);
        if (w.data.slug && w.id !== 'main' && w.id !== 'default') {
          weddingsMap.set(sanitizeSlug(w.data.slug), w.data);
        }
      }
      const mainFromMap = weddingsMap.get('main');
      if (mainFromMap && mainFromMap.groom?.fullName && !String(mainFromMap.slug || '').includes('test')) {
        const latestForMainSlug = mainFromMap.slug ? weddingsMap.get(mainFromMap.slug) : undefined;
        weddingSettings = latestForMainSlug || mainFromMap;
        weddingsMap.set('main', weddingSettings);
        weddingsMap.set('default', weddingSettings);
      } else {
        const validWeddings = allWeddings.filter(
          (w) => w.id !== 'main' && w.id !== 'default' && !w.id.includes('test') && !String(w.data?.slug || '').includes('test')
        );
        const latestWeddingEntry = validWeddings[validWeddings.length - 1];
        if (latestWeddingEntry?.data?.groom?.fullName) {
          weddingSettings = latestWeddingEntry.data;
          weddingsMap.set('main', weddingSettings);
          weddingsMap.set('default', weddingSettings);
        }
      }
    }

    if (Array.isArray(dbUsers) && dbUsers.length > 0) {
      const mergedUsers = new Map<string, AdminUser & { password?: string }>();
      // Keep default owner & base accounts as baseline
      for (const baseU of adminUsers) {
        mergedUsers.set(baseU.username.toLowerCase(), baseU);
      }
      // Database users are authoritative
      for (const dbu of dbUsers) {
        if (!dbu.username) continue;
        const key = dbu.username.toLowerCase();
        const existing = mergedUsers.get(key);
        const resolvedCreatedAt =
          key === 'budi_wati' && (!dbu.createdAt || dbu.createdAt < '2026-09-30T15:19:00.000Z')
            ? '2026-09-30T15:19:00.000Z'
            : dbu.createdAt || existing?.createdAt || new Date().toISOString();
        mergedUsers.set(key, {
          ...(existing || {}),
          ...dbu,
          createdAt: resolvedCreatedAt,
          password: dbu.password || existing?.password || (dbu.role === 'super_admin' ? 'super123' : 'admin123'),
        });
      }
      adminUsers = Array.from(mergedUsers.values()).sort((a, b) => {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tB - tA;
      });
      if (!isInitialSeedDone) {
        for (const u of adminUsers) {
          if (u.role === 'super_admin' && u.weddingSlug && !weddingsMap.has(u.weddingSlug)) {
            const parts = String(u.coupleNames || u.name || '').split('&');
            const gn = parts[0]?.trim() || u.username.split('_')[0] || 'Mempelai Pria';
            const bn = parts[1]?.trim() || u.username.split('_').slice(1).join(' ') || 'Mempelai Wanita';
            createWeddingTemplate(u.weddingSlug, gn, bn);
          }
        }
      }
    } else if (!isInitialSeedDone) {
      for (const u of adminUsers) {
        await dbRepo.createDbUser({
          uid: u.id,
          username: u.username,
          password: u.password,
          email: u.email || `${u.username}@wedding.local`,
          name: u.name,
          role: u.role,
          weddingSlug: u.weddingSlug,
          coupleNames: u.coupleNames,
          phone: u.phone,
          notes: u.notes,
          active: u.active,
          createdBy: u.createdBy,
          createdByName: u.createdByName
        });
      }
    }

    if (Array.isArray(dbGuests) && dbGuests.length > 0) {
      guests = dbGuests;
    } else if (!isInitialSeedDone) {
      for (const g of guests) {
        await dbRepo.upsertGuest(g);
      }
    }

    if (Array.isArray(dbWishes) && dbWishes.length > 0) {
      wishes = dbWishes;
    } else if (!isInitialSeedDone) {
      for (const w of wishes) {
        await dbRepo.upsertWish(w);
      }
    }

    if (Array.isArray(dbGalleries) && dbGalleries.length > 0) {
      if (!weddingSettings.galleries || weddingSettings.galleries.length === 0) {
        weddingSettings.galleries = dbGalleries;
      }
    } else if (!isInitialSeedDone && weddingSettings.galleries) {
      for (const gal of weddingSettings.galleries) {
        await dbRepo.upsertGallery(gal);
      }
    }

    isInitialSeedDone = true;
    lastDbSyncTimestamp = Date.now();
  } catch {
    // in-memory fallback active
  }
}

let dbSyncPromise: Promise<void> | null = null;

function ensureDatabaseSynced(force: boolean = false): Promise<void> {
  const now = Date.now();
  if (force || !isInitialSeedDone || now - lastDbSyncTimestamp > 400) {
    if (!dbSyncPromise) {
      dbSyncPromise = initDatabaseData()
        .catch(() => {})
        .finally(() => {
          dbSyncPromise = null;
        });
    }
    return dbSyncPromise;
  }
  return dbSyncPromise || Promise.resolve();
}

// ---------------- VITE / STATIC SERVING ----------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Wedding Application & WebSocket server running on http://0.0.0.0:${PORT}`);
    // Trigger database sync lazily after HTTP server is already listening
    setTimeout(() => {
      ensureDatabaseSynced();
    }, 200);
  });
}

startServer();
