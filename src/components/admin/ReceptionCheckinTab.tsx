import React, { useState } from 'react';
import { 
  QrCode, 
  CheckCircle2, 
  Search, 
  UserCheck, 
  Users, 
  Sparkles, 
  Clock, 
  Undo2,
  CalendarCheck
} from 'lucide-react';
import type { Guest } from '../../types.ts';
import { useRealtime } from '../../context/RealtimeContext.tsx';

interface ReceptionCheckinTabProps {
  guests: Guest[];
  onRefresh: () => void;
}

export const ReceptionCheckinTab: React.FC<ReceptionCheckinTabProps> = ({
  guests,
  onRefresh
}) => {
  const { upsertGuestDirectly } = useRealtime();
  const [query, setQuery] = useState('');
  const [successGuest, setSuccessGuest] = useState<Guest | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const totalGuests = guests.length;
  const checkedInGuests = guests.filter((g) => g.checkedIn);
  const attendanceRate = totalGuests > 0 ? Math.round((checkedInGuests.length / totalGuests) * 100) : 0;
  const totalPaxPresent = checkedInGuests.reduce((sum, g) => sum + (g.paxConfirmed || g.paxAllocated || 1), 0);

  // Search results for fast check-in
  const searchResults = query.trim()
    ? guests.filter(
        (g) =>
          g.name.toLowerCase().includes(query.toLowerCase()) ||
          g.slug.toLowerCase().includes(query.toLowerCase()) ||
          (g.phone && g.phone.includes(query)) ||
          g.id.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handlePerformCheckin = async (guest: Guest, undo: boolean = false) => {
    setLoading(true);
    setErrorMsg(null);

    const updatedGuest: Guest = {
      ...guest,
      checkedIn: !undo,
      checkedInAt: undo ? null : new Date().toISOString()
    };

    upsertGuestDirectly(updatedGuest);
    if (!undo) {
      setSuccessGuest(updatedGuest);
    } else {
      setSuccessGuest(null);
    }
    setQuery('');

    try {
      const res = await fetch(`/api/admin/guests/${guest.id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ undo, guest: updatedGuest })
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.guest) {
          upsertGuestDirectly(data.guest);
          if (!undo) {
            setSuccessGuest(data.guest);
          }
        }
      }
      onRefresh();
    } catch {
      // Already updated in local cache
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateQrScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // QR format: WEDDING-GUEST:{id}:{slug}
    let targetGuest: Guest | undefined;
    if (query.includes('WEDDING-GUEST:')) {
      const parts = query.split(':');
      const guestId = parts[1];
      const guestSlug = parts[2];
      targetGuest = guests.find((g) => g.id === guestId || g.slug === guestSlug);
    } else {
      targetGuest = guests.find(
        (g) =>
          g.id === query.trim() ||
          g.slug === query.trim() ||
          g.name.toLowerCase() === query.trim().toLowerCase()
      );
    }

    if (!targetGuest) {
      setErrorMsg('Data tamu tidak ditemukan. Silakan cari berdasarkan nama di daftar.');
      return;
    }

    await handlePerformCheckin(targetGuest, false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-medium">Tamu Hadir di Lokasi</p>
            <h4 className="text-2xl font-bold text-stone-900">
              {checkedInGuests.length} <span className="text-sm font-normal text-stone-400">/ {totalGuests}</span>
            </h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-medium">Total Jiwa / Pax Masuk</p>
            <h4 className="text-2xl font-bold text-stone-900">{totalPaxPresent} Orang</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center flex-shrink-0">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-medium">Tingkat Kehadiran</p>
            <h4 className="text-2xl font-bold text-stone-900">{attendanceRate}%</h4>
          </div>
        </div>
      </div>

      {/* Fast Scanner / Lookup Input Box */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-amber-800" />
          </div>
          <div>
            <h3 className="font-serif-wedding text-2xl font-bold text-stone-800">
              Meja Resepsi: Check-In Tamu
            </h3>
            <p className="text-xs text-stone-500">
              Pindai QR code dari tamu atau ketik nama untuk menandai kehadiran seketika.
            </p>
          </div>
        </div>

        <form onSubmit={handleSimulateQrScan} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="Pindai QR pass atau ketik nama tamu..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs sm:text-sm font-semibold tracking-wide shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Check-In Sekarang'}
          </button>
        </form>

        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Success check-in toast display */}
        {successGuest && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-emerald-900 text-sm">
                  Check-In Berhasil: {successGuest.name}
                </p>
                <p className="text-xs text-emerald-700">
                  {successGuest.category} • Alokasi: {successGuest.paxAllocated} Pax {successGuest.notes ? `(${successGuest.notes})` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => handlePerformCheckin(successGuest, true)}
              className="text-xs text-rose-600 hover:text-rose-800 underline font-medium flex items-center gap-1 cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Batal Check-In</span>
            </button>
          </div>
        )}

        {/* Live Search Instant Matching Dropdown */}
        {query.trim().length > 0 && searchResults.length > 0 && (
          <div className="mt-4 border border-stone-200 rounded-2xl divide-y divide-stone-100 max-h-60 overflow-y-auto">
            {searchResults.map((guest) => (
              <div
                key={guest.id}
                className="p-3.5 hover:bg-amber-50/40 flex items-center justify-between gap-3 transition-colors"
              >
                <div>
                  <h5 className="font-semibold text-stone-900 text-xs sm:text-sm">
                    {guest.name}
                  </h5>
                  <p className="text-[11px] text-stone-500">
                    {guest.category} • Alokasi: {guest.paxAllocated} Pax {guest.notes ? `• ${guest.notes}` : ''}
                  </p>
                </div>

                <div>
                  {guest.checkedIn ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Sudah Hadir
                      </span>
                      <button
                        onClick={() => handlePerformCheckin(guest, true)}
                        className="text-[11px] text-stone-400 hover:text-rose-600 underline"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePerformCheckin(guest, false)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold tracking-wide transition-colors cursor-pointer"
                    >
                      Tandai Hadir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Check-Ins Log Feed */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
        <h4 className="font-serif-wedding text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-700" />
          <span>Daftar Tamu yang Telah Hadir ({checkedInGuests.length})</span>
        </h4>

        {checkedInGuests.length === 0 ? (
          <p className="text-xs text-stone-400 text-center py-8">
            Belum ada tamu yang melakukan check-in hari ini.
          </p>
        ) : (
          <div className="divide-y divide-stone-100 max-h-96 overflow-y-auto">
            {checkedInGuests.map((guest) => (
              <div key={guest.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <h5 className="font-semibold text-stone-800 text-xs sm:text-sm">
                      {guest.name}
                    </h5>
                    <p className="text-[11px] text-stone-400">
                      {guest.category} • {guest.paxConfirmed || guest.paxAllocated} Orang
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <span className="text-[11px] text-stone-500 font-medium">
                    {guest.checkedInAt ? new Date(guest.checkedInAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Hadir'} WIB
                  </span>
                  <button
                    onClick={() => handlePerformCheckin(guest, true)}
                    className="p-1 text-stone-400 hover:text-rose-600 rounded-md hover:bg-stone-100"
                    title="Batalkan check-in"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
