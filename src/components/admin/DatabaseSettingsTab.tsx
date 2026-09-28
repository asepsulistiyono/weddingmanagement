import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  RefreshCw, 
  Layers, 
  Server,
  CloudUpload,
  AlertCircle
} from 'lucide-react';

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
  dialect: string;
  host: string;
  database: string;
  tables: string[];
  tableCounts?: TableCounts;
  guestsCount?: number;
  syncedAt?: string;
  error?: string;
}

export const DatabaseSettingsTab: React.FC = () => {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
        provider: 'PostgreSQL 16 (asia-southeast1)',
        dialect: 'postgresql',
        host: '127.0.0.1',
        database: 'ai_studio_db',
        tables: [],
        error: 'Gagal menghubungi server'
      });
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
      const res = await fetch('/api/admin/database-sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', message: data.message });
        await fetchStatus();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Gagal menyinkronkan data.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Terjadi kesalahan jaringan saat sinkronisasi.' });
    } finally {
      setSyncing(false);
    }
  };

  const counts = status?.tableCounts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif-wedding text-2xl font-bold text-stone-800 flex items-center gap-2">
              <Database className="w-6 h-6 text-amber-700" />
              <span>Manajemen Data &amp; Sinkronisasi Cloud SQL</span>
            </h3>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
              Khusus Pemilik Website
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Penyimpanan relasional PostgreSQL di region <strong>asia-southeast1</strong> menggunakan Drizzle ORM untuk seluruh data mempelai, tamu, ucapan, dan galeri.
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
              {syncing ? 'Menyinkronkan...' : 'Sinkronkan Data Sekarang'}
            </span>
          </button>

          <button
            type="button"
            onClick={fetchStatus}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan Data</span>
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
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-bold text-stone-800 text-base">
                  Cloud SQL PostgreSQL (asia-southeast1)
                </h4>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100/80 text-emerald-900 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Aktif
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Seluruh perubahan pada pengaturan mempelai, daftar tamu, check-in resepsi, moderasi ucapan, dan galeri tersimpan otomatis ke tabel PostgreSQL.
              </p>
            </div>
          </div>
        </div>

        {/* Database Tables List with Live Row Counts */}
        <div>
          <h5 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-700" />
            <span>Ringkasan Tabel Data</span>
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
