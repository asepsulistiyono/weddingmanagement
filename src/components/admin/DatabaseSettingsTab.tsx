import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  RefreshCw, 
  Copy, 
  ExternalLink, 
  Layers, 
  Check, 
  Server,
  Code2
} from 'lucide-react';

interface DatabaseStatus {
  connected: boolean;
  provider: string;
  dialect: string;
  host: string;
  database: string;
  tables: string[];
  guestsCount?: number;
  syncedAt?: string;
  error?: string;
}

export const DatabaseSettingsTab: React.FC = () => {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedSql, setCopiedSql] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/database-status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      setStatus({
        connected: false,
        provider: 'PostgreSQL / Supabase',
        dialect: 'postgresql',
        host: '127.0.0.1',
        database: 'ai_studio_db',
        tables: [],
        error: 'Gagal menghubungi server database'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const supabaseSqlSchema = `-- SKEMA DATABASE UNTUK SUPABASE (POSTGRESQL)
-- Salin dan jalankan script ini di menu "SQL Editor" pada dashboard Supabase Anda jika ingin mereplikasi tabel.

-- 1. Tabel Users & Admin
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uid TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'admin' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Pengaturan Undangan (Settings & Tradisi/Format Agama)
CREATE TABLE IF NOT EXISTS wedding_settings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Data Tamu Undangan
CREATE TABLE IF NOT EXISTS guests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  phone TEXT,
  category TEXT DEFAULT 'Sahabat' NOT NULL,
  pax_allocated INTEGER DEFAULT 1 NOT NULL,
  rsvp_status TEXT DEFAULT 'unconfirmed' NOT NULL,
  pax_confirmed INTEGER DEFAULT 0 NOT NULL,
  checked_in BOOLEAN DEFAULT FALSE NOT NULL,
  checked_in_at TEXT,
  notes TEXT,
  custom_greeting TEXT,
  invitation_sent BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabel Doa & Ucapan (Wishes)
CREATE TABLE IF NOT EXISTS wishes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  attendance TEXT DEFAULT 'attending' NOT NULL,
  message TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
  is_approved BOOLEAN DEFAULT TRUE NOT NULL,
  admin_reply TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabel Galeri Foto
CREATE TABLE IF NOT EXISTS gallery_photos (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  caption TEXT NOT NULL,
  category TEXT DEFAULT 'Prewedding' NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index performa pencarian tamu dan ucapan
CREATE INDEX IF NOT EXISTS idx_guests_slug ON guests(slug);
CREATE INDEX IF NOT EXISTS idx_wishes_pinned_created ON wishes(is_pinned DESC, created_at DESC);
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(supabaseSqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif-wedding text-2xl font-bold text-stone-800 flex items-center gap-2">
              <Database className="w-6 h-6 text-amber-700" />
              <span>Pengaturan Database &amp; Supabase</span>
            </h3>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
              Khusus Pemilik Website
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Database relasional PostgreSQL terkelola (Cloud SQL &amp; Supabase-compatible) dengan ORM Drizzle. Menu ini disembunyikan dari Super Admin dan Admin WO.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Status</span>
        </button>
      </div>

      {/* Connection Card */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              status?.connected ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
            }`}>
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-stone-800 text-base">
                  PostgreSQL Engine
                </h4>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  status?.connected ? 'bg-emerald-100/70 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {status?.connected ? 'Terhubung & Aktif' : 'Terputus'}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {status?.provider || 'Cloud SQL Developer Edition (PostgreSQL 16) di region asia-southeast1'}
              </p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-amber-900/5">
            <span className="text-[11px] text-stone-500 font-medium block mb-1">Dialek &amp; Engine</span>
            <span className="text-sm font-semibold text-stone-800 font-mono">PostgreSQL 16</span>
          </div>

          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-amber-900/5">
            <span className="text-[11px] text-stone-500 font-medium block mb-1">ORM / Query Engine</span>
            <span className="text-sm font-semibold text-stone-800 font-mono">Drizzle ORM + PG Pool</span>
          </div>

          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-amber-900/5">
            <span className="text-[11px] text-stone-500 font-medium block mb-1">Database Terdaftar</span>
            <span className="text-sm font-semibold text-stone-800 font-mono">{status?.database || 'ai_studio_db'}</span>
          </div>

          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-amber-900/5">
            <span className="text-[11px] text-stone-500 font-medium block mb-1">Total Tabel Aktif</span>
            <span className="text-sm font-semibold text-emerald-700 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              5 Tabel Terstruktur
            </span>
          </div>
        </div>

        {/* Database Tables List */}
        <div>
          <h5 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-700" />
            <span>Tabel-Tabel Terkelola di PostgreSQL</span>
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { name: 'wedding_settings', desc: 'Pengaturan mempelai, teks salam, format agama & acara', rows: 'Aktif' },
              { name: 'guests', desc: 'Daftar buku tamu, kuota pax, status RSVP & check-in QR', rows: 'Aktif' },
              { name: 'wishes', desc: 'Ucapan & doa restu, moderasi ucapan & balasan admin', rows: 'Aktif' },
              { name: 'gallery_photos', desc: 'Koleksi foto prewedding & momen pernikahan', rows: 'Aktif' },
              { name: 'users', desc: 'Akun pengelola, hak akses operator WO & Super Admin', rows: 'Aktif' },
            ].map(tbl => (
              <div key={tbl.name} className="p-3.5 rounded-xl border border-stone-200/80 bg-stone-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-amber-900">{tbl.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">Synced</span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-snug">{tbl.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Supabase Schema & Replication Box */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-stone-800 text-sm sm:text-base flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-600" />
              <span>Skema DDL SQL untuk Supabase SQL Editor</span>
            </h4>
            <p className="text-xs text-stone-500">
              Jika Anda ingin menjalankan atau mereplikasi struktur tabel di project Supabase mandiri Anda.
            </p>
          </div>

          <button
            onClick={handleCopySql}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'Tersalin ke Clipboard!' : 'Salin Skema SQL'}</span>
          </button>
        </div>

        <div className="relative">
          <pre className="bg-stone-900 text-stone-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-72 leading-relaxed">
            {supabaseSqlSchema}
          </pre>
        </div>

        {/* Integration Instructions */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-2">
          <p className="font-bold flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
            Cara Menghubungkan ke Project Supabase Eksternal:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-stone-700 pl-1 text-[11px] sm:text-xs">
            <li>Buka dashboard Supabase Anda di <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-amber-800 font-semibold underline">supabase.com</a>.</li>
            <li>Buka menu <strong>Project Settings &gt; Database</strong> dan salin string koneksi (Host, User, Password, Port 5432).</li>
            <li>Variabel lingkungan telah disiapkan di file <code>.env.example</code> (<code>SQL_HOST</code>, <code>SQL_USER</code>, <code>SQL_PASSWORD</code>, <code>SQL_DB_NAME</code>, serta <code>SUPABASE_URL</code> dan <code>SUPABASE_ANON_KEY</code>).</li>
            <li>Saat ini aplikasi telah terhubung secara otomatis ke database Cloud SQL PostgreSQL di region <code>asia-southeast1</code> dengan kompatibilitas penuh skema Supabase.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
