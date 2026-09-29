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
  newWishAlert: Wish | null;
  clearNewWishAlert: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

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
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
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

  const fetchGuests = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/guests');
      if (res.ok) {
        const data = await res.json();
        setGuests(data);
      }
    } catch {
      // not authenticated or network error
    }
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
      
      const res = await fetch(url);
      if (res.ok) {
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
        setWishes(localizeWishesList(data.wishes || [], resolvedSettings, weddingSlug));
        if (data.guest) {
          setGuest(data.guest);
        }
        if (resolvedSettings?.announcement) {
          setAnnouncement(resolvedSettings.announcement);
        }
        return;
      }
    } catch (err) {
      console.error('Failed to fetch public wedding data:', err);
    }

    // Fallback to cached settings if server is temporarily unreachable
    try {
      const cachedRaw = localStorage.getItem(`wedding_settings_cache_${slugKey}`);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as WeddingSettings;
        setSettings(cached);
        settingsRef.current = cached;
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
              case 'INIT_DATA':
                setWishes(localizeWishesList(data.payload.wishes || [], settingsRef.current, currentSlug));
                setOnlineCount(data.payload.onlineCount);
                if (data.payload.announcement) {
                  setAnnouncement(data.payload.announcement);
                }
                break;

              case 'ONLINE_COUNT':
                setOnlineCount(data.payload.count);
                break;

              case 'NEW_WISH': {
                const [localizedNew] = localizeWishesList([data.payload], settingsRef.current, currentSlug);
                setWishes((prev) => {
                  if (prev.some((w) => w.id === localizedNew.id)) return prev;
                  return [localizedNew, ...prev];
                });
                setNewWishAlert(localizedNew);
                break;
              }

              case 'UPDATE_WISH': {
                const [localizedUpd] = localizeWishesList([data.payload], settingsRef.current, currentSlug);
                setWishes((prev) =>
                  prev.map((w) => (w.id === localizedUpd.id ? localizedUpd : w))
                );
                break;
              }

              case 'DELETE_WISH':
                setWishes((prev) => prev.filter((w) => w.id !== data.payload.id));
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
                setGuests((prev) =>
                  prev.map((g) => (g.id === data.payload.id ? data.payload : g))
                );
                if (guest && guest.id === data.payload.id) {
                  setGuest(data.payload);
                }
                break;

              case 'GUESTS_BATCH_ADDED':
                setGuests((prev) => [...data.payload, ...prev]);
                break;

              case 'GUEST_CHECKED_IN':
                setGuests((prev) =>
                  prev.map((g) =>
                    g.id === data.payload.guest.id ? data.payload.guest : g
                  )
                );
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
  }, [refreshData, guest?.id]);

  const submitWish = async (data: {
    senderName: string;
    message: string;
    attendance: 'attending' | 'not_attending' | 'tentative';
    pax: number;
    guestId?: string;
  }) => {
    try {
      const res = await fetch('/api/public/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || 'Gagal mengirim ucapan.' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Terjadi kesalahan jaringan.' };
    }
  };

  const reactToWish = async (wishId: string) => {
    try {
      // Optimistic update
      setWishes((prev) =>
        prev.map((w) => (w.id === wishId ? { ...w, reactionCount: (w.reactionCount || 0) + 1 } : w))
      );
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
    try {
      const res = await fetch('/api/public/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || 'Gagal mengirim RSVP.' };
      }
      if (json.guest) {
        setGuest(json.guest);
      }
      return { success: true, guest: json.guest };
    } catch {
      return { success: false, error: 'Terjadi kesalahan jaringan.' };
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
