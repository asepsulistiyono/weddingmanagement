import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import type { Wish, WeddingSettings, RealtimeMessage, Guest } from '../types.ts';
import { parseWeddingAndGuestFromUrl } from '../utils/slugHelper.ts';

interface RealtimeContextType {
  wishes: Wish[];
  guests: Guest[];
  onlineCount: number;
  announcement: WeddingSettings['announcement'] | null;
  isConnected: boolean;
  settings: WeddingSettings | null;
  guest: Guest | null;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  isPlayingMusic: boolean;
  toggleMusic: () => void;
  startMusic: () => void;
  submitWish: (data: { senderName: string; message: string; attendance: 'attending' | 'not_attending' | 'tentative'; pax: number; guestId?: string }) => Promise<{ success: boolean; error?: string }>;
  reactToWish: (wishId: string) => Promise<void>;
  submitRsvp: (data: { name: string; attendance: 'attending' | 'not_attending' | 'tentative'; pax: number; notes?: string; guestId?: string }) => Promise<{ success: boolean; guest?: Guest; error?: string }>;
  refreshData: () => Promise<void>;
  fetchGuests: () => Promise<void>;
  refreshAll: () => Promise<void>;
  updateSettingsDirectly: (newSettings: WeddingSettings) => void;
  upsertGuestDirectly: (guestItem: Guest) => void;
  addGuestsBatchDirectly: (newGuests: Guest[]) => void;
  removeGuestDirectly: (guestId: string) => void;
  upsertWishDirectly: (wishItem: Wish) => void;
  removeWishDirectly: (wishId: string) => void;
  restoreTemplateWishesDirectly: () => void;
  newWishAlert: Wish | null;
  clearNewWishAlert: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

const GUESTS_CACHE_KEY = 'wedding_guests_cache_v1';
const DELETED_GUESTS_KEY = 'wedding_deleted_guests_v1';
const WISHES_CACHE_KEY = 'wedding_wishes_cache_v1';
const DELETED_WISHES_KEY = 'wedding_deleted_wishes_v1';

const DEFAULT_FALLBACK_GUESTS: Guest[] = [
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
    checkedInAt: '2026-09-18T18:45:00Z',
    notes: 'Rekan Bisnis Ayah Mempelai Pria',
    invitationSent: true,
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
    notes: 'Sahabat Kuliah Siti',
    invitationSent: true,
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
    checkedIn: true,
    checkedInAt: '2026-09-18T19:10:00Z',
    notes: 'Tim Engineering Jakarta',
    invitationSent: true,
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
    notes: 'Paman dari Surabaya',
    invitationSent: true,
    createdAt: '2026-09-12T13:00:00Z'
  },
  {
    id: 'g-5',
    name: 'Faisal Akbar',
    slug: 'faisal-akbar',
    phone: '081234567805',
    category: 'Sahabat',
    paxAllocated: 1,
    rsvpStatus: 'not_attending',
    paxConfirmed: 0,
    checkedIn: false,
    checkedInAt: null,
    notes: 'Sedang dinas di luar negeri',
    invitationSent: false,
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
    notes: 'Direktur Utama',
    invitationSent: false,
    createdAt: '2026-09-14T10:00:00Z'
  }
];

const DEFAULT_FALLBACK_WISHES: Wish[] = [
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

function getDeletedIds(storageKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed.map(String));
    }
  } catch {
    // ignore
  }
  return new Set();
}

function addDeletedId(storageKey: string, id: string) {
  try {
    const set = getDeletedIds(storageKey);
    set.add(id);
    localStorage.setItem(storageKey, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

function removeDeletedId(storageKey: string, id: string) {
  try {
    const set = getDeletedIds(storageKey);
    if (set.has(id)) {
      set.delete(id);
      localStorage.setItem(storageKey, JSON.stringify(Array.from(set)));
    }
  } catch {
    // ignore
  }
}

function loadCachedGuests(): Guest[] {
  const deleted = getDeletedIds(DELETED_GUESTS_KEY);
  try {
    const raw = localStorage.getItem(GUESTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((g: Guest) => g && g.id && !deleted.has(g.id));
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_FALLBACK_GUESTS.filter((g) => !deleted.has(g.id));
}

function saveCachedGuests(list: Guest[]) {
  try {
    localStorage.setItem(GUESTS_CACHE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function mergeServerAndLocalGuests(serverList: Guest[], localList: Guest[]): Guest[] {
  const deleted = getDeletedIds(DELETED_GUESTS_KEY);
  const byId = new Map<string, Guest>();

  // First put local cached guests (which have the user's immediate edits/creations)
  for (const g of localList) {
    if (g && g.id && !deleted.has(g.id)) {
      byId.set(g.id, g);
    }
  }

  // Merge server guests (local cache takes precedence for fields edited locally if same id, or add server guests not in local)
  for (const sg of serverList) {
    if (!sg || !sg.id || deleted.has(sg.id)) continue;
    const existingLocal = byId.get(sg.id);
    if (existingLocal) {
      byId.set(sg.id, { ...sg, ...existingLocal });
    } else {
      byId.set(sg.id, sg);
    }
  }

  const merged = Array.from(byId.values());
  merged.sort((a, b) => {
    const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tB - tA;
  });
  return merged;
}

function loadCachedWishes(): Wish[] {
  const deleted = getDeletedIds(DELETED_WISHES_KEY);
  try {
    const raw = localStorage.getItem(WISHES_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((w: Wish) => w && w.id && !deleted.has(w.id));
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_FALLBACK_WISHES.filter((w) => !deleted.has(w.id));
}

function saveCachedWishes(list: Wish[]) {
  try {
    localStorage.setItem(WISHES_CACHE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function resolveActiveWeddingSlug(): { weddingSlug: string | null; guestSlug: string | null } {
  const fromUrl = parseWeddingAndGuestFromUrl();
  if (fromUrl.weddingSlug) {
    return fromUrl;
  }
  try {
    const activeSlug = sessionStorage.getItem('wedding_active_slug');
    if (activeSlug) {
      return { weddingSlug: activeSlug, guestSlug: fromUrl.guestSlug };
    }
    const savedUser = localStorage.getItem('wedding_auth_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed?.weddingSlug && !parsed?.isOwner) {
        return { weddingSlug: parsed.weddingSlug, guestSlug: fromUrl.guestSlug };
      }
    }
  } catch {
    // ignore storage errors
  }
  return fromUrl;
}

function extractCoupleFromSlugOrSettings(
  settings: WeddingSettings | null,
  slug: string | null
): { groomName: string; brideName: string } {
  if (settings?.groom?.nickname && settings?.bride?.nickname) {
    const isDefaultSettings =
      settings.groom.nickname === 'Rizky' && settings.bride.nickname === 'Siti';
    if (!isDefaultSettings || !slug || slug === 'rizky_dan_siti' || slug === 'default') {
      return {
        groomName: settings.groom.nickname,
        brideName: settings.bride.nickname
      };
    }
  }

  if (slug && slug.includes('_dan_')) {
    const parts = slug.split('_dan_').filter(Boolean);
    if (parts.length >= 2) {
      const cap = (s: string) =>
        s
          .split(/[\s_-]+/)
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
      return {
        groomName: cap(parts[0]),
        brideName: cap(parts.slice(1).join(' '))
      };
    }
  }

  return {
    groomName: settings?.groom?.nickname || 'Rizky',
    brideName: settings?.bride?.nickname || 'Siti'
  };
}

function localizeWishesList(
  rawWishes: Wish[],
  settings: WeddingSettings | null,
  slug: string | null
): Wish[] {
  const { groomName, brideName } = extractCoupleFromSlugOrSettings(settings, slug);
  return rawWishes.map((w) => ({
    ...w,
    message: w.message
      .replace(/\bRizky\b/g, groomName)
      .replace(/\bSiti\b/g, brideName),
    adminReply: w.adminReply
      ? w.adminReply
          .replace(/\bRizky\b/g, groomName)
          .replace(/\bSiti\b/g, brideName)
      : w.adminReply
  }));
}

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishes, setWishes] = useState<Wish[]>(() => loadCachedWishes());
  const [guests, setGuests] = useState<Guest[]>(() => loadCachedGuests());
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [announcement, setAnnouncement] = useState<WeddingSettings['announcement'] | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [settings, setSettings] = useState<WeddingSettings | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(false);
  const [newWishAlert, setNewWishAlert] = useState<Wish | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const settingsRef = useRef<WeddingSettings | null>(null);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const upsertGuestDirectly = useCallback((guestItem: Guest) => {
    if (!guestItem || !guestItem.id) return;
    removeDeletedId(DELETED_GUESTS_KEY, guestItem.id);
    setGuests((prev) => {
      const exists = prev.some((g) => g.id === guestItem.id);
      const next = exists
        ? prev.map((g) => (g.id === guestItem.id ? { ...g, ...guestItem } : g))
        : [guestItem, ...prev];
      saveCachedGuests(next);
      return next;
    });
    setGuest((prevGuest) => (prevGuest && prevGuest.id === guestItem.id ? { ...prevGuest, ...guestItem } : prevGuest));
  }, []);

  const addGuestsBatchDirectly = useCallback((newGuests: Guest[]) => {
    if (!Array.isArray(newGuests) || newGuests.length === 0) return;
    newGuests.forEach((g) => {
      if (g?.id) removeDeletedId(DELETED_GUESTS_KEY, g.id);
    });
    setGuests((prev) => {
      const existingIds = new Set(prev.map((g) => g.id));
      const uniqueNew = newGuests.filter((g) => g && g.id && !existingIds.has(g.id));
      const next = [...uniqueNew, ...prev];
      saveCachedGuests(next);
      return next;
    });
  }, []);

  const removeGuestDirectly = useCallback((guestId: string) => {
    if (!guestId) return;
    addDeletedId(DELETED_GUESTS_KEY, guestId);
    setGuests((prev) => {
      const next = prev.filter((g) => g.id !== guestId);
      saveCachedGuests(next);
      return next;
    });
  }, []);

  const upsertWishDirectly = useCallback((wishItem: Wish) => {
    if (!wishItem || !wishItem.id) return;
    removeDeletedId(DELETED_WISHES_KEY, wishItem.id);
    const { weddingSlug } = resolveActiveWeddingSlug();
    const [localized] = localizeWishesList([wishItem], settingsRef.current, weddingSlug);
    setWishes((prev) => {
      const exists = prev.some((w) => w.id === localized.id);
      const next = exists
        ? prev.map((w) => (w.id === localized.id ? { ...w, ...localized } : w))
        : [localized, ...prev];
      saveCachedWishes(next);
      return next;
    });
  }, []);

  const removeWishDirectly = useCallback((wishId: string) => {
    if (!wishId) return;
    addDeletedId(DELETED_WISHES_KEY, wishId);
    setWishes((prev) => {
      const next = prev.filter((w) => w.id !== wishId);
      saveCachedWishes(next);
      return next;
    });
  }, []);

  const restoreTemplateWishesDirectly = useCallback(() => {
    DEFAULT_FALLBACK_WISHES.forEach((w) => removeDeletedId(DELETED_WISHES_KEY, w.id));
    const { weddingSlug } = resolveActiveWeddingSlug();
    const localizedDefaults = localizeWishesList(DEFAULT_FALLBACK_WISHES, settingsRef.current, weddingSlug);
    setWishes((prev) => {
      const byId = new Map<string, Wish>();
      for (const w of prev) {
        byId.set(w.id, w);
      }
      for (const def of localizedDefaults) {
        byId.set(def.id, { ...def, isApproved: true });
      }
      const next = Array.from(byId.values());
      saveCachedWishes(next);
      return next;
    });
  }, []);

  const fetchGuests = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/guests', { cache: 'no-store' });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setGuests((prev) => {
            const localBase = prev.length > 0 ? prev : loadCachedGuests();
            const merged = mergeServerAndLocalGuests(data, localBase);
            saveCachedGuests(merged);
            return merged;
          });
          return;
        }
      }
    } catch {
      // not authenticated or network error
    }
    setGuests((prev) => (prev.length > 0 ? prev : loadCachedGuests()));
  }, []);

  const updateSettingsDirectly = useCallback((newSettings: WeddingSettings) => {
    setSettings(newSettings);
    settingsRef.current = newSettings;
    if (newSettings.announcement !== undefined) {
      setAnnouncement(newSettings.announcement);
    }
    try {
      const slugKey = newSettings.slug || resolveActiveWeddingSlug().weddingSlug || 'default';
      localStorage.setItem(`wedding_settings_cache_${slugKey}`, JSON.stringify(newSettings));
      if (newSettings.slug) {
        sessionStorage.setItem('wedding_active_slug', newSettings.slug);
      }
    } catch {
      // ignore storage quota errors
    }
  }, []);

  const refreshData = useCallback(async () => {
    const { weddingSlug, guestSlug } = resolveActiveWeddingSlug();
    const slugKey = weddingSlug || 'default';
    try {
      const params = new URLSearchParams();
      if (weddingSlug) params.set('slug', weddingSlug);
      if (guestSlug) params.set('guest', guestSlug);

      const qs = params.toString();
      const url = qs ? `/api/public/data?${qs}` : '/api/public/data';
      
      const res = await fetch(url, { cache: 'no-store' });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        let resolvedSettings: WeddingSettings = data.settings;
        try {
          const cachedRaw = localStorage.getItem(`wedding_settings_cache_${slugKey}`);
          if (cachedRaw) {
            const cached = JSON.parse(cachedRaw) as WeddingSettings;
            // If server returned uncustomized default template while local cache has user's saved customizations for this slug, merge them
            if (cached && (!cached.slug || cached.slug === slugKey || cached.slug === resolvedSettings?.slug)) {
              resolvedSettings = {
                ...resolvedSettings,
                ...cached,
                galleries:
                  (resolvedSettings?.galleries && resolvedSettings.galleries.length > 0)
                    ? resolvedSettings.galleries
                    : cached.galleries || [],
              };
            }
          }
        } catch {
          // ignore cache parse error
        }
        setSettings(resolvedSettings);
        settingsRef.current = resolvedSettings;

        const deletedWishes = getDeletedIds(DELETED_WISHES_KEY);
        const serverWishes: Wish[] = Array.isArray(data.wishes) ? data.wishes : [];
        const cachedWishes = loadCachedWishes();
        const wishMap = new Map<string, Wish>();
        for (const cw of cachedWishes) {
          if (cw && cw.id && !deletedWishes.has(cw.id)) wishMap.set(cw.id, cw);
        }
        for (const sw of serverWishes) {
          if (sw && sw.id && !deletedWishes.has(sw.id)) {
            wishMap.set(sw.id, { ...sw, ...(wishMap.get(sw.id) || {}) });
          }
        }
        const mergedWishes = localizeWishesList(Array.from(wishMap.values()), resolvedSettings, weddingSlug);
        setWishes(mergedWishes);
        saveCachedWishes(mergedWishes);

        if (data.guest) {
          setGuest(data.guest);
        } else if (guestSlug) {
          const localGuests = loadCachedGuests();
          const matchedLocalGuest =
            localGuests.find(
              (g) =>
                g.slug.toLowerCase() === guestSlug.toLowerCase() ||
                g.name.toLowerCase() === guestSlug.toLowerCase() ||
                g.id === guestSlug
            ) || null;
          if (matchedLocalGuest) {
            setGuest(matchedLocalGuest);
          }
        }
        if (resolvedSettings?.announcement) {
          setAnnouncement(resolvedSettings.announcement);
        }
        return;
      }
    } catch (err) {
      console.error('Failed to fetch public wedding data:', err);
    }

    // Fallback to cached settings & guest if server is temporarily unreachable
    try {
      const cachedRaw = localStorage.getItem(`wedding_settings_cache_${slugKey}`);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as WeddingSettings;
        setSettings(cached);
        settingsRef.current = cached;
      }
      if (guestSlug) {
        const localGuests = loadCachedGuests();
        const matchedLocalGuest =
          localGuests.find(
            (g) =>
              g.slug.toLowerCase() === guestSlug.toLowerCase() ||
              g.name.toLowerCase() === guestSlug.toLowerCase() ||
              g.id === guestSlug
          ) || null;
        if (matchedLocalGuest) {
          setGuest(matchedLocalGuest);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Listen to hash / URL changes (e.g. /#/thomas_dan_juwita or /#/romeo_dan_juliet)
  useEffect(() => {
    const handleUrlChange = () => {
      refreshData();
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [refreshData]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshData(), fetchGuests()]);
  }, [refreshData, fetchGuests]);

  // Background audio setup
  useEffect(() => {
    if (!audioRef.current && settings?.musicUrl) {
      const audio = new Audio(settings.musicUrl);
      audio.loop = true;
      audioRef.current = audio;
    }
  }, [settings?.musicUrl]);

  const startMusic = () => {
    if (!audioRef.current && settings?.musicUrl) {
      audioRef.current = new Audio(settings.musicUrl);
      audioRef.current.loop = true;
    }
    if (audioRef.current && !isPlayingMusic) {
      audioRef.current.play().then(() => {
        setIsPlayingMusic(true);
      }).catch((err) => {
        console.warn('Audio auto-play prevented:', err);
      });
    }
  };

  const toggleMusic = () => {
    if (!audioRef.current && settings?.musicUrl) {
      audioRef.current = new Audio(settings.musicUrl);
      audioRef.current.loop = true;
    }

    if (audioRef.current) {
      if (isPlayingMusic) {
        audioRef.current.pause();
        setIsPlayingMusic(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlayingMusic(true);
        }).catch((err) => {
          console.warn('Audio auto-play prevented:', err);
        });
      }
    }
  };

  // WebSocket real-time connection
  useEffect(() => {
    refreshData();
    fetchGuests();

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const { weddingSlug } = resolveActiveWeddingSlug();
      const wsQuery = weddingSlug ? `?slug=${encodeURIComponent(weddingSlug)}` : '';
      const wsUrl = `${protocol}//${window.location.host}/ws${wsQuery}`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data: RealtimeMessage = JSON.parse(event.data);
            const currentSlug = resolveActiveWeddingSlug().weddingSlug;
            switch (data.type) {
              case 'INIT_DATA': {
                const deletedWishes = getDeletedIds(DELETED_WISHES_KEY);
                const incomingWishes = (data.payload.wishes || []).filter((w: Wish) => w && !deletedWishes.has(w.id));
                const localized = localizeWishesList(incomingWishes, settingsRef.current, currentSlug);
                setWishes((prev) => {
                  const map = new Map<string, Wish>();
                  for (const pw of prev) {
                    if (!deletedWishes.has(pw.id)) map.set(pw.id, pw);
                  }
                  for (const lw of localized) {
                    map.set(lw.id, { ...lw, ...(map.get(lw.id) || {}) });
                  }
                  const next = Array.from(map.values());
                  saveCachedWishes(next);
                  return next;
                });
                setOnlineCount(data.payload.onlineCount);
                if (data.payload.announcement) {
                  setAnnouncement(data.payload.announcement);
                }
                break;
              }

              case 'ONLINE_COUNT':
                setOnlineCount(data.payload.count);
                break;

              case 'NEW_WISH': {
                const [localizedNew] = localizeWishesList([data.payload], settingsRef.current, currentSlug);
                removeDeletedId(DELETED_WISHES_KEY, localizedNew.id);
                setWishes((prev) => {
                  if (prev.some((w) => w.id === localizedNew.id)) return prev;
                  const next = [localizedNew, ...prev];
                  saveCachedWishes(next);
                  return next;
                });
                setNewWishAlert(localizedNew);
                break;
              }

              case 'UPDATE_WISH': {
                const [localizedUpd] = localizeWishesList([data.payload], settingsRef.current, currentSlug);
                setWishes((prev) => {
                  const next = prev.map((w) => (w.id === localizedUpd.id ? localizedUpd : w));
                  saveCachedWishes(next);
                  return next;
                });
                break;
              }

              case 'DELETE_WISH':
                addDeletedId(DELETED_WISHES_KEY, data.payload.id);
                setWishes((prev) => {
                  const next = prev.filter((w) => w.id !== data.payload.id);
                  saveCachedWishes(next);
                  return next;
                });
                break;

              case 'SETTINGS_UPDATED':
                if (!currentSlug || !data.payload?.slug || data.payload.slug === currentSlug) {
                  setSettings(data.payload);
                  settingsRef.current = data.payload;
                  setAnnouncement(data.payload.announcement || null);
                  try {
                    const slugKey = data.payload.slug || currentSlug || 'default';
                    localStorage.setItem(`wedding_settings_cache_${slugKey}`, JSON.stringify(data.payload));
                  } catch {
                    // ignore
                  }
                }
                break;

              case 'GALLERY_UPDATED':
                setSettings((prev) => prev ? { ...prev, galleries: data.payload } : null);
                break;

              case 'BROADCAST_ANNOUNCEMENT':
                setAnnouncement({
                  id: `ann-${Date.now()}`,
                  message: data.payload.message,
                  active: true,
                  createdAt: data.payload.timestamp
                });
                break;

              case 'GUEST_UPDATED':
                removeDeletedId(DELETED_GUESTS_KEY, data.payload.id);
                setGuests((prev) => {
                  const exists = prev.some((g) => g.id === data.payload.id);
                  const next = exists
                    ? prev.map((g) => (g.id === data.payload.id ? data.payload : g))
                    : [data.payload, ...prev];
                  saveCachedGuests(next);
                  return next;
                });
                if (guest && guest.id === data.payload.id) {
                  setGuest(data.payload);
                }
                break;

              case 'GUESTS_BATCH_ADDED':
                setGuests((prev) => {
                  const existingIds = new Set(prev.map((g) => g.id));
                  const incoming = (data.payload || []).filter((g: Guest) => g && !existingIds.has(g.id));
                  const next = [...incoming, ...prev];
                  saveCachedGuests(next);
                  return next;
                });
                break;

              case 'GUEST_CHECKED_IN':
                setGuests((prev) => {
                  const exists = prev.some((g) => g.id === data.payload.guest.id);
                  const next = exists
                    ? prev.map((g) => (g.id === data.payload.guest.id ? data.payload.guest : g))
                    : [data.payload.guest, ...prev];
                  saveCachedGuests(next);
                  return next;
                });
                if (guest && guest.id === data.payload.guest.id) {
                  setGuest(data.payload.guest);
                }
                break;

              default:
                break;
            }
          } catch (e) {
            console.error('Failed to parse WS message:', e);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Try to reconnect in 3s
          reconnectTimeoutRef.current = window.setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (err) => {
          console.warn('WS error occurred:', err);
          ws.close();
        };
      } catch (err) {
        console.error('Failed to init WS connection:', err);
        reconnectTimeoutRef.current = window.setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [refreshData, fetchGuests, guest?.id]);

  const submitWish = async (data: {
    senderName: string;
    message: string;
    attendance: 'attending' | 'not_attending' | 'tentative';
    pax: number;
    guestId?: string;
  }) => {
    const optimisticWish: Wish = {
      id: `wish-${Date.now()}`,
      senderName: data.senderName.trim(),
      message: data.message.trim(),
      attendance: data.attendance || 'attending',
      pax: data.pax || 1,
      guestId: data.guestId,
      isPinned: false,
      isApproved: true,
      reactionCount: 0,
      createdAt: new Date().toISOString()
    };
    upsertWishDirectly(optimisticWish);

    try {
      const res = await fetch('/api/public/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.wish) {
          removeWishDirectly(optimisticWish.id);
          upsertWishDirectly(json.wish);
        }
      }
      return { success: true };
    } catch {
      return { success: true };
    }
  };

  const reactToWish = async (wishId: string) => {
    try {
      setWishes((prev) => {
        const next = prev.map((w) => (w.id === wishId ? { ...w, reactionCount: (w.reactionCount || 0) + 1 } : w));
        saveCachedWishes(next);
        return next;
      });
      await fetch(`/api/public/wishes/${wishId}/react`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to react to wish:', err);
    }
  };

  const submitRsvp = async (data: {
    name: string;
    attendance: 'attending' | 'not_attending' | 'tentative';
    pax: number;
    notes?: string;
    guestId?: string;
  }) => {
    const existing = guests.find(
      (g) =>
        (data.guestId && g.id === data.guestId) ||
        g.name.toLowerCase() === data.name.trim().toLowerCase()
    );
    const optimisticGuest: Guest = existing
      ? {
          ...existing,
          rsvpStatus: data.attendance,
          paxConfirmed: data.pax || 1,
          notes: data.notes ? data.notes.trim() : existing.notes
        }
      : {
          id: `g-${Date.now()}`,
          name: data.name.trim(),
          slug: data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `tamu-${Date.now()}`,
          category: 'Tamu Umum',
          paxAllocated: data.pax || 1,
          rsvpStatus: data.attendance,
          paxConfirmed: data.pax || 1,
          checkedIn: false,
          checkedInAt: null,
          notes: data.notes || 'RSVP via Form Undangan',
          invitationSent: true,
          createdAt: new Date().toISOString()
        };

    upsertGuestDirectly(optimisticGuest);
    setGuest(optimisticGuest);

    try {
      const res = await fetch('/api/public/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.guest) {
          upsertGuestDirectly(json.guest);
          setGuest(json.guest);
          return { success: true, guest: json.guest };
        }
      }
      return { success: true, guest: optimisticGuest };
    } catch {
      return { success: true, guest: optimisticGuest };
    }
  };

  const clearNewWishAlert = () => {
    setNewWishAlert(null);
  };

  return (
    <RealtimeContext.Provider
      value={{
        wishes,
        guests,
        onlineCount,
        announcement,
        isConnected,
        settings,
        guest,
        soundEnabled,
        setSoundEnabled,
        isPlayingMusic,
        toggleMusic,
        startMusic,
        submitWish,
        reactToWish,
        submitRsvp,
        refreshData,
        fetchGuests,
        refreshAll,
        updateSettingsDirectly,
        upsertGuestDirectly,
        addGuestsBatchDirectly,
        removeGuestDirectly,
        upsertWishDirectly,
        removeWishDirectly,
        restoreTemplateWishesDirectly,
        newWishAlert,
        clearNewWishAlert
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
