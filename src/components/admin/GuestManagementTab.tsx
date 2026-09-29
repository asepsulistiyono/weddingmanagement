import React, { useState } from 'react';
import { 
  UserPlus, 
  Search, 
  Download, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Clock, 
  Share2, 
  Edit3, 
  Trash2, 
  Check, 
  Copy, 
  ExternalLink,
  Users,
  QrCode,
  X,
  MessageCircle,
  Send,
  Phone,
  CheckCheck,
  Sparkles,
  Upload,
  FileText
} from 'lucide-react';
import type { Guest, GuestCategory, RSVPStatus } from '../../types.ts';
import { formatIndonesianDate } from '../../utils/date.ts';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { WhatsAppShareModal } from './WhatsAppShareModal.tsx';
import { GuestImportModal } from './GuestImportModal.tsx';
import { getFullInvitationUrl } from '../../utils/slugHelper.ts';

interface GuestManagementTabProps {
  guests: Guest[];
  onRefresh: () => void;
  onOpenQr: (guest: Guest) => void;
}

export const GuestManagementTab: React.FC<GuestManagementTabProps> = ({
  guests,
  onRefresh,
  onOpenQr
}) => {
  const { settings, upsertGuestDirectly, removeGuestDirectly } = useRealtime();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRsvp, setSelectedRsvp] = useState<string>('all');
  const [selectedCheckin, setSelectedCheckin] = useState<string>('all');
  const [selectedSentStatus, setSelectedSentStatus] = useState<string>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [selectedWaGuest, setSelectedWaGuest] = useState<Guest | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [confirmDeleteGuestId, setConfirmDeleteGuestId] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCategory, setFormCategory] = useState<GuestCategory>('Sahabat');
  const [formPax, setFormPax] = useState<number>(2);
  const [formPaxInput, setFormPaxInput] = useState<string>('2');
  const [formNotes, setFormNotes] = useState('');
  const [formCustomGreeting, setFormCustomGreeting] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const categories: GuestCategory[] = [
    'VIP',
    'Keluarga Inti',
    'Keluarga Besar',
    'Sahabat',
    'Rekan Kerja',
    'Tamu Umum'
  ];

  // Stats calculation
  const totalGuests = guests.length;
  const sentCount = guests.filter((g) => g.invitationSent).length;
  const unsentCount = totalGuests - sentCount;
  const attendingPax = guests
    .filter((g) => g.rsvpStatus === 'attending')
    .reduce((acc, g) => acc + (g.paxConfirmed || g.paxAllocated), 0);
  const sentPercentage = totalGuests > 0 ? Math.round((sentCount / totalGuests) * 100) : 0;

  // Filtering
  const filteredGuests = guests.filter((g) => {
    const matchesSearch = 
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.phone && g.phone.includes(searchTerm));
    
    const matchesCat = selectedCategory === 'all' || g.category === selectedCategory;
    const matchesRsvp = selectedRsvp === 'all' || g.rsvpStatus === selectedRsvp;
    const matchesCheckin = 
      selectedCheckin === 'all' ||
      (selectedCheckin === 'checked_in' && g.checkedIn) ||
      (selectedCheckin === 'not_checked_in' && !g.checkedIn);

    const matchesSent = 
      selectedSentStatus === 'all' ||
      (selectedSentStatus === 'sent' && g.invitationSent) ||
      (selectedSentStatus === 'not_sent' && !g.invitationSent);

    return matchesSearch && matchesCat && matchesRsvp && matchesCheckin && matchesSent;
  });

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => {
      setSaveToast((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const handleCreateGuest = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (formLoading) return;

    const cleanName = formName.trim();
    if (!cleanName) {
      setFormError('Mohon isi Nama Tamu Undangan terlebih dahulu.');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    const parsedPax = parseInt(formPaxInput, 10);
    const validPax = !isNaN(parsedPax) && parsedPax >= 1 ? Math.min(100, parsedPax) : Math.max(1, formPax || 2);

    const baseSlug =
      cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `tamu-${Date.now()}`;
    let slug = baseSlug;
    let counter = 1;
    while (guests.some((g) => g.slug === slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    const newGuestId = `g-${Date.now()}`;
    const optimisticGuest: Guest = {
      id: newGuestId,
      name: cleanName,
      slug,
      phone: formPhone.trim(),
      category: formCategory,
      paxAllocated: validPax,
      rsvpStatus: 'unconfirmed',
      paxConfirmed: 0,
      checkedIn: false,
      checkedInAt: null,
      notes: formNotes.trim(),
      invitationSent: false,
      customGreeting: formCustomGreeting.trim(),
      createdAt: new Date().toISOString()
    };

    // Immediately add to state & localStorage cache so the new guest appears right away at the top of the table
    upsertGuestDirectly(optimisticGuest);
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedRsvp('all');
    setSelectedCheckin('all');
    setSelectedSentStatus('all');
    setIsAddModalOpen(false);
    resetForm();
    showToast(`Tamu "${cleanName}" berhasil disimpan ke daftar undangan!`);

    try {
      const res = await fetch('/api/admin/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newGuestId,
          slug,
          name: cleanName,
          phone: optimisticGuest.phone,
          category: optimisticGuest.category,
          paxAllocated: optimisticGuest.paxAllocated,
          notes: optimisticGuest.notes,
          customGreeting: optimisticGuest.customGreeting
        })
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.guest) {
          upsertGuestDirectly(data.guest);
        }
      }
      onRefresh();
    } catch (err) {
      console.error('Failed to sync guest to server, saved in local cache:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateGuest = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (formLoading || !editingGuest) return;

    const cleanName = formName.trim();
    if (!cleanName) {
      setFormError('Mohon isi Nama Tamu Undangan terlebih dahulu.');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    const parsedPax = parseInt(formPaxInput, 10);
    const validPax = !isNaN(parsedPax) && parsedPax >= 1 ? Math.min(100, parsedPax) : Math.max(1, formPax || editingGuest.paxAllocated || 2);

    const updatedGuest: Guest = {
      ...editingGuest,
      name: cleanName,
      phone: formPhone.trim(),
      category: formCategory,
      paxAllocated: validPax,
      notes: formNotes.trim(),
      customGreeting: formCustomGreeting.trim(),
      invitationSent: Boolean(editingGuest.invitationSent)
    };

    // Immediately update in state & localStorage cache
    upsertGuestDirectly(updatedGuest);
    setEditingGuest(null);
    resetForm();
    showToast(`Data tamu "${cleanName}" berhasil diperbarui!`);

    try {
      const res = await fetch(`/api/admin/guests/${editingGuest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingGuest.id,
          slug: editingGuest.slug,
          name: updatedGuest.name,
          phone: updatedGuest.phone,
          category: updatedGuest.category,
          paxAllocated: updatedGuest.paxAllocated,
          notes: updatedGuest.notes,
          customGreeting: updatedGuest.customGreeting,
          invitationSent: updatedGuest.invitationSent
        })
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.guest) {
          upsertGuestDirectly(data.guest);
        }
      }
      onRefresh();
    } catch (err) {
      console.error('Failed to update guest on server, saved in local cache:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteGuest = async (id: string) => {
    const target = guests.find((g) => g.id === id);
    setConfirmDeleteGuestId(null);
    removeGuestDirectly(id);
    if (target) {
      showToast(`Tamu "${target.name}" telah dihapus dari daftar.`);
    }
    try {
      const res = await fetch(`/api/admin/guests/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to delete guest:', err);
    }
  };

  const handleExportGuestsCsv = () => {
    let csv = 'Nama Tamu,Kategori,Nomor Telepon,Alokasi Pax,Status RSVP,Pax Konfirmasi,Check-in,Waktu Check-in,Catatan\n';
    guests.forEach((g) => {
      const cleanName = `"${(g.name || '').replace(/"/g, '""')}"`;
      const cleanNotes = `"${(g.notes || '').replace(/"/g, '""')}"`;
      csv += `${cleanName},${g.category},${g.phone || '-'},${g.paxAllocated},${g.rsvpStatus},${g.paxConfirmed},${g.checkedIn ? 'Sudah' : 'Belum'},${g.checkedInAt || '-'},${cleanNotes}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data-tamu-undangan.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleToggleCheckin = async (guest: Guest) => {
    const nextCheckedIn = !guest.checkedIn;
    const updatedGuest: Guest = {
      ...guest,
      checkedIn: nextCheckedIn,
      checkedInAt: nextCheckedIn ? new Date().toISOString() : null
    };
    upsertGuestDirectly(updatedGuest);
    showToast(
      nextCheckedIn
        ? `Check-In berhasil untuk "${guest.name}"!`
        : `Status Check-In "${guest.name}" dibatalkan.`
    );
    try {
      await fetch(`/api/admin/guests/${guest.id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ undo: guest.checkedIn, guest: updatedGuest })
      });
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle check-in:', err);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormPhone('');
    setFormCategory('Sahabat');
    setFormPax(2);
    setFormPaxInput('2');
    setFormNotes('');
    setFormCustomGreeting('');
    setFormError(null);
  };

  const openEditModal = (g: Guest) => {
    setEditingGuest(g);
    setFormName(g.name);
    setFormPhone(g.phone || '');
    setFormCategory(g.category);
    setFormPax(g.paxAllocated);
    setFormPaxInput(String(g.paxAllocated || 2));
    setFormNotes(g.notes || '');
    setFormCustomGreeting(g.customGreeting || '');
    setFormError(null);
  };

  const copyInvitationLink = (guest: Guest) => {
    const invitationUrl = getFullInvitationUrl(settings?.slug, guest.slug);
    navigator.clipboard.writeText(invitationUrl);
    setCopiedSlug(guest.slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const shareViaWhatsApp = (guest: Guest) => {
    const invitationUrl = getFullInvitationUrl(settings?.slug, guest.slug);
    const coupleTitle = settings?.title || (settings?.coupleNames ? `The Wedding of ${settings.coupleNames}` : 'The Wedding of Rizky & Siti');
    const weddingDate = settings?.events[0]?.date || 'Sabtu, 24 Oktober 2026';
    const msg = `Kepada Yth. Bapak/Ibu/Saudara/i ${guest.name},\n\nTanpa mengurangi rasa hormat, perkenankan kami mengundang Anda untuk hadir dan memberikan doa restu pada pernikahan kami:\n\n*${coupleTitle}*\n${weddingDate}\n\nBuka tautan undangan digital Anda di:\n${invitationUrl}\n\nMerupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir.\n\nTerima kasih.`;

    const waUrl = guest.phone 
      ? `https://api.whatsapp.com/send?phone=${guest.phone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, '_blank');
  };

  return (
    <div className="space-y-6 relative">
      {/* Floating & Inline Save Confirmation Toast */}
      {saveToast && (
        <div className="p-3.5 bg-emerald-900 text-white rounded-2xl shadow-lg border border-emerald-400/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <span>{saveToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveToast(null)}
            className="p-1 text-emerald-200 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Statistics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs">
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
            Total Tamu Undangan
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <h4 className="text-2xl font-bold text-stone-900">{totalGuests}</h4>
            <span className="text-xs text-stone-500 font-medium">Orang / Entitas</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Undangan WA Terkirim</span>
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <h4 className="text-2xl font-bold text-emerald-700">{sentCount}</h4>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {sentPercentage}%
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs">
          <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Belum Dikirim WA</span>
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <h4 className="text-2xl font-bold text-amber-800">{unsentCount}</h4>
            <span className="text-xs text-stone-400 font-medium">Perlu Disapa</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs">
          <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>Total Pax Hadir (RSVP)</span>
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <h4 className="text-2xl font-bold text-stone-900">{attendingPax}</h4>
            <span className="text-xs text-stone-400 font-medium">Kursi / Porsi</span>
          </div>
        </div>
      </div>

      {/* Action Header & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama tamu, kategori, atau no hp..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportGuestsCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-stone-500" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <Upload className="w-4 h-4 text-amber-700" />
            <span>Import .TXT</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs sm:text-sm font-semibold tracking-wide transition-colors cursor-pointer shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Tamu</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Category filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-stone-700 font-medium cursor-pointer"
        >
          <option value="all">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Status WhatsApp filter */}
        <select
          value={selectedSentStatus}
          onChange={(e) => setSelectedSentStatus(e.target.value)}
          className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-stone-700 font-medium cursor-pointer"
        >
          <option value="all">Semua Status WA</option>
          <option value="sent">Sudah Dikirim WA ({sentCount})</option>
          <option value="not_sent">Belum Dikirim WA ({unsentCount})</option>
        </select>

        {/* RSVP filter */}
        <select
          value={selectedRsvp}
          onChange={(e) => setSelectedRsvp(e.target.value)}
          className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-stone-700 font-medium cursor-pointer"
        >
          <option value="all">Semua RSVP</option>
          <option value="attending">Hadir</option>
          <option value="not_attending">Tidak Hadir</option>
          <option value="tentative">Masih Ragu</option>
          <option value="unconfirmed">Belum Konfirmasi</option>
        </select>

        {/* Check-in filter */}
        <select
          value={selectedCheckin}
          onChange={(e) => setSelectedCheckin(e.target.value)}
          className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-stone-700 font-medium cursor-pointer"
        >
          <option value="all">Semua Kehadiran Fisik</option>
          <option value="checked_in">Sudah Check-In</option>
          <option value="not_checked_in">Belum Check-In</option>
        </select>

        <span className="text-stone-400 ml-auto">
          Ditemukan <strong>{filteredGuests.length}</strong> tamu
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Nama Tamu</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-center">Alokasi Pax</th>
                <th className="py-3 px-4">Status RSVP</th>
                <th className="py-3 px-4">Kehadiran Fisik</th>
                <th className="py-3 px-4 text-center">Bagikan Undangan WA</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    Tidak ada data tamu yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-stone-900">{guest.name}</span>
                        {guest.invitationSent && (
                          <span title="Undangan sudah terkirim via WhatsApp" className="text-emerald-600">
                            <CheckCheck className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      {guest.phone && (
                        <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-stone-400" />
                          <span>{guest.phone}</span>
                        </div>
                      )}
                      {guest.notes && (
                        <div className="text-[11px] text-amber-800 italic mt-0.5">
                          "{guest.notes}"
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-700 border border-stone-200">
                        {guest.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-medium">
                      {guest.paxConfirmed > 0 ? (
                        <span className="text-emerald-700 font-bold">
                          {guest.paxConfirmed} / {guest.paxAllocated}
                        </span>
                      ) : (
                        <span className="text-stone-500">{guest.paxAllocated}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {guest.rsvpStatus === 'attending' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Hadir
                        </span>
                      )}
                      {guest.rsvpStatus === 'not_attending' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3" />
                          Tidak Hadir
                        </span>
                      )}
                      {guest.rsvpStatus === 'tentative' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <HelpCircle className="w-3 h-3" />
                          Ragu
                        </span>
                      )}
                      {guest.rsvpStatus === 'unconfirmed' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-500">
                          <Clock className="w-3 h-3" />
                          Belum Konfirmasi
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleCheckin(guest)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                          guest.checkedIn
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{guest.checkedIn ? 'Sudah Check-In' : 'Check-In'}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Prominent WhatsApp Share Button */}
                        <button
                          onClick={() => setSelectedWaGuest(guest)}
                          title="Buka Panel Kirim Undangan WhatsApp"
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                            guest.invitationSent
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          }`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{guest.invitationSent ? 'Kirim Ulang' : 'Share WA'}</span>
                        </button>

                        {/* Copy Link Button */}
                        <button
                          onClick={() => copyInvitationLink(guest)}
                          title="Salin Link Undangan Tamu"
                          className="p-1.5 rounded-xl bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-800 transition-colors cursor-pointer"
                        >
                          {copiedSlug === guest.slug ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* QR Code Button */}
                        <button
                          onClick={() => onOpenQr(guest)}
                          title="Lihat QR Code Tamu"
                          className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {confirmDeleteGuestId === guest.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteGuest(guest.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer"
                            >
                              Ya, Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteGuestId(null)}
                              className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 text-[11px] font-semibold cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditModal(guest)}
                              className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                              title="Edit Tamu"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteGuestId(guest.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus Tamu"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Guest */}
      {(isAddModalOpen || editingGuest) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl relative my-auto max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 pb-3 border-b border-stone-100 flex items-start justify-between shrink-0">
              <div>
                <h3 className="font-serif-wedding text-xl sm:text-2xl font-bold text-stone-800">
                  {editingGuest ? 'Edit Tamu Undangan' : 'Tambah Tamu Baru'}
                </h3>
                <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
                  Tamu akan mendapatkan tautan undangan personal dan QR Code check-in.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingGuest(null);
                }}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer shrink-0 -mr-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={editingGuest ? handleUpdateGuest : handleCreateGuest}
              noValidate
              className="flex flex-col flex-1 min-h-0"
            >
              {/* Scrollable Form Body */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 overscroll-contain">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center justify-between gap-2">
                    <span>{formError}</span>
                    <button
                      type="button"
                      onClick={() => setFormError(null)}
                      className="text-rose-500 hover:text-rose-800 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Nama Tamu Undangan *
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="Contoh: Bpk. H. Ahmad Sudirman & Partner"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                      Kategori Tamu
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as GuestCategory)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-800 cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                      Alokasi Jumlah Pax (Orang)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={formPaxInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormPaxInput(val);
                        const num = parseInt(val, 10);
                        if (!isNaN(num) && num >= 1) {
                          setFormPax(num);
                        }
                      }}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Nomor WhatsApp / Telepon (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Catatan Panitia / Nomor Meja
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Contoh: Meja VIP 2, Kursi A"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-800"
                  />
                </div>

                {editingGuest && (
                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-700">
                      <input
                        type="checkbox"
                        checked={editingGuest.invitationSent}
                        onChange={(e) => setEditingGuest({ ...editingGuest, invitationSent: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300"
                      />
                      <span>Tandai undangan telah dikirim via WhatsApp</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Sticky Footer */}
              <div className="p-3.5 sm:p-4 bg-stone-50/90 border-t border-stone-200 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingGuest(null);
                    setFormError(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-200/60 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={editingGuest ? handleUpdateGuest : handleCreateGuest}
                  disabled={formLoading}
                  className="px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 active:scale-[0.99] text-white text-xs sm:text-sm font-semibold tracking-wide transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {formLoading ? 'Menyimpan...' : editingGuest ? 'Perbarui Data' : 'Simpan Tamu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guest Import from .TXT Modal */}
      <GuestImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingGuests={guests}
        onImportSuccess={() => {
          onRefresh();
        }}
      />

      {/* WhatsApp Share & Customization Modal */}
      <WhatsAppShareModal
        isOpen={Boolean(selectedWaGuest)}
        onClose={() => setSelectedWaGuest(null)}
        guest={selectedWaGuest}
        settings={settings}
        onGuestUpdated={onRefresh}
      />
    </div>
  );
};
