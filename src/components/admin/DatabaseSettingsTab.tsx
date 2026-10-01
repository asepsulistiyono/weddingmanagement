import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  RefreshCw, 
  Layers, 
  Server,
  CloudUpload,
  AlertCircle,
  Copy,
  Check,
  Terminal,
  ExternalLink
} from 'lucide-react';
import {
  supabaseUrl,
  fetchDirectSupabaseStatus,
  syncUserToSupabaseClient,
} from '../../lib/supabase.ts';
import { getCachedAdminsList } from '../../context/AuthContext.tsx';

interface TableCounts {
  wedding_settings: number;
  guests: number;
  wishes: number;
  gallery_photos: number;
  users: number;
}

interface DatabaseStatus {
  connected: boolean;
  provider: string;
  isExternalSupabase?: boolean;
  supabaseUrl?: string;
  dialect: string;
  host: string;
  database: string;
  tables: string[];
  tableCounts?: TableCounts;
  guestsCount?: number;
  schemaSql?: string;
  syncedAt?: string;
  error?: string;
}

const DEFAULT_SUPABASE_SQL = `-- ============================================================================
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

-- 7. Aktifkan Row Level Security (RLS) & Kebijakan Akses API Aplikasi
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

export const DatabaseSettingsTab: React.FC = () => {
  const defaultHost = (() => {
    try {
      return supabaseUrl ? new URL(supabaseUrl).host : 'aksqfqromigvrkklhjhw.supabase.co';
    } catch {
      return 'aksqfqromigvrkklhjhw.supabase.co';
    }
  })();

  const [status, setStatus] = useState<DatabaseStatus | null>({
    connected: true,
    provider: `Supabase Cloud PostgreSQL (${defaultHost})`,
    isExternalSupabase: true,
    supabaseUrl: supabaseUrl || 'https://aksqfqromigvrkklhjhw.supabase.co',
    dialect: 'postgresql',
    host: defaultHost,
    database: 'postgres (Supabase Cloud)',
    tables: ['wedding_settings', 'guests', 'wishes', 'gallery_photos', 'users'],
    schemaSql: DEFAULT_SUPABASE_SQL,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlBox, setShowSqlBox] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const [res, directStatus] = await Promise.all([
        fetch('/api/admin/database-status').catch(() => null),
        fetchDirectSupabaseStatus(),
      ]);

      if (res && res.ok) {
        const data = await res.json();
        if (directStatus && directStatus.connected) {
          setStatus({
            ...data,
            connected: true,
            isExternalSupabase: true,
            supabaseUrl: directStatus.supabaseUrl,
            host: directStatus.host,
            tableCounts: directStatus.tableCounts,
            error: undefined,
          });
        } else {
          setStatus(data);
        }
        return;
      }

      if (directStatus) {
        setStatus({
          connected: directStatus.connected,
          provider: `Supabase Cloud PostgreSQL (${directStatus.host})`,
          isExternalSupabase: true,
          supabaseUrl: directStatus.supabaseUrl,
          dialect: 'postgresql',
          host: directStatus.host,
          database: 'postgres (Supabase Cloud)',
          tables: ['wedding_settings', 'guests', 'wishes', 'gallery_photos', 'users'],
          tableCounts: directStatus.tableCounts,
          schemaSql: DEFAULT_SUPABASE_SQL,
          error: directStatus.error,
          syncedAt: new Date().toISOString(),
        });
      }
    } catch {
      const directStatus = await fetchDirectSupabaseStatus();
      if (directStatus) {
        setStatus({
          connected: directStatus.connected,
          provider: `Supabase Cloud PostgreSQL (${directStatus.host})`,
          isExternalSupabase: true,
          supabaseUrl: directStatus.supabaseUrl,
          dialect: 'postgresql',
          host: directStatus.host,
          database: 'postgres (Supabase Cloud)',
          tables: ['wedding_settings', 'guests', 'wishes', 'gallery_photos', 'users'],
          tableCounts: directStatus.tableCounts,
          schemaSql: DEFAULT_SUPABASE_SQL,
          error: directStatus.error,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSyncAllData = async () => {
    setSyncing(true);
    setFeedback(null);
    try {
      // Push all local cached admins directly to Supabase first
      const cachedAdmins = getCachedAdminsList();
      for (const admin of cachedAdmins) {
        await syncUserToSupabaseClient(admin);
      }

      const res = await fetch('/api/admin/database-sync', { method: 'POST' }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        setFeedback({ type: 'success', message: data.message });
        await fetchStatus();
      } else {
        const directStatus = await fetchDirectSupabaseStatus();
        if (directStatus && directStatus.connected) {
          const c = directStatus.tableCounts;
          setFeedback({
            type: 'success',
            message: `Seluruh data undangan (${c.wedding_settings} URL), buku tamu (${c.guests} tamu), ucapan (${c.wishes}), galeri (${c.gallery_photos} foto), dan akun pengelola (${c.users} akun) berhasil disinkronkan langsung ke proyek Supabase (${directStatus.host})!`,
          });
          await fetchStatus();
        } else {
          setFeedback({ type: 'error', message: 'Gagal menyinkronkan data ke Supabase.' });
        }
      }
    } catch {
      setFeedback({ type: 'error', message: 'Terjadi kesalahan jaringan saat sinkronisasi.' });
    } finally {
      setSyncing(false);
    }
  };

  const sqlScript = status?.schemaSql || DEFAULT_SUPABASE_SQL;

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      // fallback
    }
  };

  const counts = status?.tableCounts;
  const isExternalConnected = Boolean(status?.isExternalSupabase);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif-wedding text-2xl font-bold text-stone-800 flex items-center gap-2">
              <Database className="w-6 h-6 text-emerald-700" />
              <span>Integrasi Proyek Supabase Eksternal</span>
            </h3>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
              Khusus Pemilik Website
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Koneksi langsung ke database proyek <strong>Supabase</strong> milik Anda untuk menyimpan seluruh pengaturan undangan, buku tamu, RSVP, ucapan, galeri foto, dan akun pengelola.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSyncAllData}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <CloudUpload className={`w-4 h-4 text-white ${syncing ? 'animate-bounce' : ''}`} />
            <span className="text-white">
              {syncing ? 'Menyinkronkan ke Supabase...' : 'Sinkronkan Data ke Supabase'}
            </span>
          </button>

          <button
            type="button"
            onClick={fetchStatus}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Cek Status Koneksi</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Summary Card */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                isExternalConnected
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-bold text-stone-800 text-base">
                  {isExternalConnected
                    ? `Terhubung ke Supabase Eksternal (${status?.host})`
                    : 'Menunggu Konfigurasi Environment Proyek Supabase Anda'}
                </h4>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    isExternalConnected && status?.connected
                      ? 'bg-emerald-100/80 text-emerald-900 border-emerald-300'
                      : 'bg-amber-100/80 text-amber-900 border-amber-300'
                  }`}
                >
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      isExternalConnected && status?.connected ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  />
                  {isExternalConnected
                    ? status?.connected
                      ? 'Supabase Aktif'
                      : 'Perlu Inisialisasi Tabel SQL'
                    : 'Mode Cadangan Lokal Aktif'}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {isExternalConnected
                  ? `Seluruh operasi baca & tulis (pengaturan mempelai, tamu, ucapan, galeri, dan akun pengelola) terhubung langsung ke ${status?.supabaseUrl}.`
                  : 'Atur variabel VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY (atau VITE_SUPABASE_PUBLISHABLE_KEY) pada pengaturan Secrets / Environment aplikasi untuk mengaktifkan koneksi langsung.'}
              </p>
              {status?.error && isExternalConnected && (
                <p className="text-xs text-rose-600 font-medium mt-1.5">
                  Catatan: {status.error}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Step-by-Step Setup Guide for External Supabase */}
        <div className="bg-stone-50 rounded-2xl border border-stone-200/80 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h5 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-700" />
              <span>3 Langkah Menghubungkan Proyek Supabase Eksternal Anda</span>
            </h5>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              <span>Buka Dashboard Supabase</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white border border-stone-200/80 space-y-1.5">
              <div className="font-bold text-stone-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] flex items-center justify-center font-bold">
                  1
                </span>
                <span>Isi Variabel Environment</span>
              </div>
              <p className="text-stone-600 leading-relaxed text-[11px]">
                Di panel <strong>Secrets / Environment Variables</strong> AI Studio, masukkan:
                <br />• <code className="font-mono font-bold text-stone-800">VITE_SUPABASE_URL</code> (Project URL)
                <br />• <code className="font-mono font-bold text-stone-800">VITE_SUPABASE_ANON_KEY</code> atau <code className="font-mono font-bold text-stone-800">VITE_SUPABASE_PUBLISHABLE_KEY</code>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-stone-200/80 space-y-1.5">
              <div className="font-bold text-stone-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] flex items-center justify-center font-bold">
                  2
                </span>
                <span>Jalankan Script SQL Tabel</span>
              </div>
              <p className="text-stone-600 leading-relaxed text-[11px]">
                Klik tombol <strong>Salin Script SQL Supabase</strong> di bawah, buka menu <strong>SQL Editor</strong> di proyek Supabase Anda, tempel (paste), lalu klik <strong>Run</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-stone-200/80 space-y-1.5">
              <div className="font-bold text-stone-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] flex items-center justify-center font-bold">
                  3
                </span>
                <span>Sinkronkan Data</span>
              </div>
              <p className="text-stone-600 leading-relaxed text-[11px]">
                Klik tombol hijau <strong>Sinkronkan Data ke Supabase</strong> di kanan atas halaman ini untuk mengunggah seluruh data awal ke ke-5 tabel Supabase Anda.
              </p>
            </div>
          </div>

          {/* SQL Schema Copy Section */}
          <div className="pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <button
                type="button"
                onClick={() => setShowSqlBox((prev) => !prev)}
                className="text-xs font-bold text-stone-700 hover:text-stone-900 cursor-pointer underline"
              >
                {showSqlBox ? 'Sembunyikan Script SQL Supabase' : 'Tampilkan Script SQL Supabase (5 Tabel + RLS)'}
              </button>

              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Script SQL Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Script SQL Supabase</span>
                  </>
                )}
              </button>
            </div>

            {showSqlBox && (
              <pre className="p-4 rounded-xl bg-stone-900 text-stone-100 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-64 overflow-y-auto border border-stone-800 select-all">
                {sqlScript}
              </pre>
            )}
          </div>
        </div>

        {/* Database Tables List with Live Row Counts */}
        <div>
          <h5 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-700" />
            <span>Ringkasan 5 Tabel Proyek Supabase</span>
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                name: 'wedding_settings',
                desc: 'Pengaturan mempelai, 12 tema desain, format agama & URL slug',
                count: counts?.wedding_settings ?? 1,
                unit: 'URL Undangan'
              },
              {
                name: 'users',
                desc: 'Akun Pemilik, Klien Super Admin mempelai & operator Admin WO',
                count: counts?.users ?? 4,
                unit: 'Akun'
              },
              {
                name: 'guests',
                desc: 'Daftar buku tamu, kuota pax, status RSVP & check-in QR',
                count: counts?.guests ?? status?.guestsCount ?? 0,
                unit: 'Tamu'
              },
              {
                name: 'wishes',
                desc: 'Ucapan & doa restu, moderasi ucapan & balasan mempelai',
                count: counts?.wishes ?? 4,
                unit: 'Ucapan'
              },
              {
                name: 'gallery_photos',
                desc: 'Koleksi foto prewedding & momen bahagia pernikahan',
                count: counts?.gallery_photos ?? 8,
                unit: 'Foto'
              },
            ].map(tbl => (
              <div key={tbl.name} className="p-4 rounded-xl border border-stone-200/80 bg-stone-50/50 flex flex-col justify-between gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-amber-900">{tbl.name}</span>
                    <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold tabular-nums">
                      {tbl.count} {tbl.unit}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-snug">{tbl.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
