import React, { useState } from 'react';
import { 
  Pin, 
  Eye, 
  EyeOff, 
  Trash2, 
  MessageSquare, 
  CornerDownRight, 
  Heart, 
  Search, 
  Sparkles,
  CheckCircle2,
  Clock,
  RotateCcw,
  Plus,
  X
} from 'lucide-react';
import type { Wish } from '../../types.ts';
import { formatTimeAgo } from '../../utils/date.ts';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { parseWeddingAndGuestFromUrl } from '../../utils/slugHelper.ts';

interface WishesManagementTabProps {
  wishes: Wish[];
  onRefresh: () => void;
}

function capitalizeSlugPart(str: string): string {
  return str
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export const WishesManagementTab: React.FC<WishesManagementTabProps> = ({
  wishes,
  onRefresh
}) => {
  const { settings } = useRealtime();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [replyWishId, setReplyWishId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [restoringTemplates, setRestoringTemplates] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // State untuk form tambah ucapan / template baru
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSenderName, setNewSenderName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newAdminReply, setNewAdminReply] = useState('');
  const [newIsPinned, setNewIsPinned] = useState(true);
  const [addingWish, setAddingWish] = useState(false);

  // Tentukan slug aktif dari URL saat ini atau akun pengelola yang sedang login
  const { weddingSlug: urlSlug } = parseWeddingAndGuestFromUrl();
  const activeSlug = urlSlug || user?.weddingSlug || settings?.slug || 'rizky_dan_siti';

  // Ambil nama mempelai pria & wanita dari slug atau pengaturan aktif (bukan default jika di URL slug lain)
  const getActiveCoupleNames = (): { groomName: string; brideName: string } => {
    // 1. Jika ada coupleNames pada user yang sedang login dan cocok dengan activeSlug
    if (user?.coupleNames && user.coupleNames.includes('&') && (!urlSlug || user.weddingSlug === urlSlug)) {
      const [g, b] = user.coupleNames.split('&').map((s) => s.trim());
      if (g && b) return { groomName: g, brideName: b };
    }

    // 2. Jika settings memiliki nama mempelai yang bukan default (atau memang di slug rizky_dan_siti)
    if (settings?.groom?.nickname && settings?.bride?.nickname) {
      const isDefault =
        settings.groom.nickname === 'Rizky' && settings.bride.nickname === 'Siti';
      if (!isDefault || activeSlug === 'rizky_dan_siti' || activeSlug === 'default') {
        return {
          groomName: settings.groom.nickname,
          brideName: settings.bride.nickname
        };
      }
    }

    // 3. Ekstrak otomatis dari slug URL (format: mempelai_pria_dan_mempelai_wanita)
    if (activeSlug && activeSlug.includes('_dan_')) {
      const parts = activeSlug.split('_dan_').filter(Boolean);
      if (parts.length >= 2) {
        return {
          groomName: capitalizeSlugPart(parts[0]),
          brideName: capitalizeSlugPart(parts.slice(1).join(' '))
        };
      }
    }

    return {
      groomName: settings?.groom?.nickname || 'Rizky',
      brideName: settings?.bride?.nickname || 'Siti'
    };
  };

  const { groomName, brideName } = getActiveCoupleNames();
  const coupleDisplayName = `${groomName} & ${brideName}`;

  // Pastikan seluruh ucapan template otomatis menggunakan nama pengantin dari slug/URL yang bersangkutan
  const localizedWishes = wishes.map((w) => ({
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

  const quickReplyTemplates = [
    `Aamiin ya Rabbal alamin. Terima kasih banyak atas doa dan restu yang tulus untuk kami berdua, ${groomName} & ${brideName}. 🙏✨`,
    `Terima kasih banyak atas ucapan dan doa terbaiknya! Sampai jumpa di hari bahagia ${groomName} & ${brideName} ya! ❤️🎉`,
    `Terima kasih atas doa restunya. Kehadiran dan doa Bapak/Ibu/Saudara/i sangat berarti bagi keluarga besar ${groomName} & ${brideName}.`
  ];

  const sampleWishPresets = [
    {
      sender: 'Bpk. Hendra Gunawan & Keluarga',
      message: `Barakallahu lakuma wa baraka alaikuma wa jamaa bainakuma fii khoir. Selamat menempuh hidup baru untuk ananda ${groomName} dan ${brideName}. Semoga menjadi keluarga yang sakinah, mawaddah, wa rahmah serta senantiasa dilimpahi rezeki yang berkah.`,
      reply: `Aamiin ya Rabbal alamin. Terima kasih banyak atas doa dan restu yang tulus dari Bapak Hendra dan keluarga untuk kami, ${groomName} & ${brideName}.`
    },
    {
      sender: 'dr. Anisa Rahmawati',
      message: `Happy wedding ${brideName} sayang & ${groomName}! MasyaAllah akhirnya hari yang dinanti tiba. Semoga perjalanan rumah tangga kalian selalu dipenuhi cinta, tawa, dan kebahagiaan seumur hidup! ❤️✨`,
      reply: `Makasih banyak Nisa tersayang! Sampai jumpa di pelaminan ${groomName} & ${brideName} yaaa! 💕`
    },
    {
      sender: 'Sahabat & Rekan Kerja',
      message: `Selamat menempuh hidup baru untuk ${groomName} & ${brideName}! Semoga lancar sampai hari H dan rukun bahagia selamanya.`,
      reply: `Terima kasih banyak teman-teman semua atas doa terbaiknya untuk ${groomName} & ${brideName}! 🙏🎉`
    }
  ];

  const filteredWishes = localizedWishes.filter(
    (w) =>
      w.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRestoreTemplates = async () => {
    setRestoringTemplates(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch('/api/admin/wishes/restore-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: activeSlug })
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackMsg(
          data.message || `Ucapan template untuk ${coupleDisplayName} berhasil dimunculkan kembali!`
        );
        onRefresh();
        setTimeout(() => setFeedbackMsg(null), 5000);
      }
    } catch (err) {
      console.error('Failed to restore template wishes:', err);
    } finally {
      setRestoringTemplates(false);
    }
  };

  const handleCreateWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSenderName.trim() || !newMessage.trim()) return;
    setAddingWish(true);
    try {
      const res = await fetch('/api/admin/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: newSenderName.trim(),
          message: newMessage.trim(),
          adminReply: newAdminReply.trim() || undefined,
          isPinned: newIsPinned,
          attendance: 'attending',
          pax: 2
        })
      });
      if (res.ok) {
        setNewSenderName('');
        setNewMessage('');
        setNewAdminReply('');
        setIsAddOpen(false);
        setFeedbackMsg(`Ucapan baru untuk ${coupleDisplayName} berhasil ditambahkan!`);
        onRefresh();
        setTimeout(() => setFeedbackMsg(null), 5000);
      }
    } catch (err) {
      console.error('Failed to add wish:', err);
    } finally {
      setAddingWish(false);
    }
  };

  const handleTogglePin = async (wish: Wish) => {
    setLoadingId(wish.id);
    try {
      await fetch(`/api/admin/wishes/${wish.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !wish.isPinned })
      });
      onRefresh();
    } catch (err) {
      console.error('Failed to pin wish:', err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleToggleApprove = async (wish: Wish) => {
    setLoadingId(wish.id);
    try {
      await fetch(`/api/admin/wishes/${wish.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: !wish.isApproved })
      });
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle approve wish:', err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteWish = async (wish: Wish) => {
    setLoadingId(wish.id);
    try {
      await fetch(`/api/admin/wishes/${wish.id}`, { method: 'DELETE' });
      setFeedbackMsg(
        `Ucapan dari "${wish.senderName}" dihapus. Klik tombol "Munculkan Ucapan Template" di atas jika ingin mengembalikannya.`
      );
      onRefresh();
      setTimeout(() => setFeedbackMsg(null), 6000);
    } catch (err) {
      console.error('Failed to delete wish:', err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleSaveReply = async (wishId: string) => {
    if (!replyText.trim()) return;
    setLoadingId(wishId);
    try {
      await fetch(`/api/admin/wishes/${wishId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminReply: replyText.trim() })
      });
      setReplyWishId(null);
      setReplyText('');
      onRefresh();
    } catch (err) {
      console.error('Failed to reply wish:', err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Mempelai & Tombol Munculkan Kembali Template */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4 fill-white text-white" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-stone-900">
              Moderasi Ucapan Mempelai: <span className="text-amber-900">{coupleDisplayName}</span>
            </p>
            <p className="text-[11px] text-stone-600 font-mono">
              URL Undangan Aktif: <strong>/#/{activeSlug}</strong> • Total: <strong>{localizedWishes.length} Ucapan</strong> (Dipin: {localizedWishes.filter((w) => w.isPinned).length})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRestoreTemplates}
            disabled={restoringTemplates}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Kembalikan ucapan template bawaan sesuai nama pengantin"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-white ${restoringTemplates ? 'animate-spin' : ''}`} />
            <span className="text-white">
              {restoringTemplates ? 'Memulihkan...' : 'Munculkan Ucapan Template'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-white">+ Buat Ucapan / Template</span>
          </button>
        </div>
      </div>

      {/* Notifikasi Status Pemulihan / Penghapusan */}
      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{feedbackMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Panel Tambah Ucapan / Template Baru */}
      {isAddOpen && (
        <form
          onSubmit={handleCreateWish}
          className="bg-white border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-md space-y-4"
        >
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h4 className="font-bold text-stone-900 text-sm">
                Tambah Ucapan / Template untuk {coupleDisplayName}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Pilihan Preset Otomatis */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider">
              Isi Cepat dari Contoh Template ({coupleDisplayName}):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {sampleWishPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setNewSenderName(preset.sender);
                    setNewMessage(preset.message);
                    setNewAdminReply(preset.reply);
                  }}
                  className="text-left text-xs px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 font-semibold transition-colors cursor-pointer"
                >
                  Pilih Template {idx + 1} ({preset.sender})
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nama Pengirim Ucapan
              </label>
              <input
                type="text"
                required
                value={newSenderName}
                onChange={(e) => setNewSenderName(e.target.value)}
                placeholder="Contoh: Bpk. Hendra Gunawan & Keluarga"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 font-medium"
              />
            </div>

            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIsPinned}
                  onChange={(e) => setNewIsPinned(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Sematkan (Pin) ucapan ini di urutan teratas</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Isi Doa &amp; Ucapan (Otomatis untuk {coupleDisplayName})
            </label>
            <textarea
              rows={3}
              required
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Selamat menempuh hidup baru untuk ${coupleDisplayName}...`}
              className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Balasan Mempelai {coupleDisplayName} (Opsional)
            </label>
            <textarea
              rows={2}
              value={newAdminReply}
              onChange={(e) => setNewAdminReply(e.target.value)}
              placeholder={`Terima kasih banyak atas doa restunya untuk kami, ${coupleDisplayName}...`}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={addingWish}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs disabled:opacity-50"
            >
              {addingWish ? 'Menyimpan...' : 'Simpan & Tampilkan Ucapan'}
            </button>
          </div>
        </form>
      )}

      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Cari nama pengirim atau ucapan untuk ${coupleDisplayName}...`}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Wishes Cards Grid / List */}
      <div className="space-y-4">
        {filteredWishes.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-2xl border border-stone-200 space-y-3">
            <MessageSquare className="w-10 h-10 text-amber-400 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-stone-800">
                Belum ada daftar ucapan yang tampil untuk {coupleDisplayName}
              </p>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Jika Anda baru saja menghapus ucapan template bawaan, klik tombol di bawah ini untuk memunculkannya kembali secara instan.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleRestoreTemplates}
                disabled={restoringTemplates}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                <RotateCcw className={`w-4 h-4 text-white ${restoringTemplates ? 'animate-spin' : ''}`} />
                <span className="text-white">
                  {restoringTemplates ? 'Memulihkan Template...' : `Munculkan Ucapan Template (${coupleDisplayName})`}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                <span className="text-white">+ Buat Ucapan Manual</span>
              </button>
            </div>
          </div>
        ) : (
          filteredWishes.map((wish) => (
            <div
              key={wish.id}
              className={`bg-white rounded-2xl p-5 border transition-all shadow-xs ${
                wish.isPinned
                  ? 'border-amber-400 bg-amber-50/20'
                  : !wish.isApproved
                  ? 'border-stone-200 opacity-60 bg-stone-50'
                  : 'border-stone-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-stone-900 text-sm">
                    {wish.senderName}
                  </span>

                  {wish.attendance === 'attending' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      Hadir ({wish.pax} Pax)
                    </span>
                  )}

                  {wish.isPinned && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900">
                      <Pin className="w-3 h-3 fill-amber-700 text-amber-700" />
                      Dipin
                    </span>
                  )}

                  {!wish.isApproved && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-100 text-rose-700">
                      Disembunyikan
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-stone-400">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimeAgo(wish.createdAt)}</span>
                </div>
              </div>

              {/* Message */}
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed mb-3 whitespace-pre-line">
                {wish.message}
              </p>

              {/* Existing admin reply */}
              {wish.adminReply && (
                <div className="mb-3 p-3 bg-amber-50/80 border-l-2 border-amber-600 rounded-r-xl text-xs text-stone-700">
                  <p className="font-semibold text-amber-900 mb-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    Balasan Mempelai ({coupleDisplayName}):
                  </p>
                  <p className="italic text-stone-600">{wish.adminReply}</p>
                </div>
              )}

              {/* Inline Reply Form */}
              {replyWishId === wish.id && (
                <div className="mb-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    Tulis Balasan atas nama {coupleDisplayName} untuk {wish.senderName}:
                  </label>

                  {/* Template Balasan Cepat Menggunakan Nama Pengantin dari Slug */}
                  <div className="space-y-1.5">
                    <span className="block text-[10.5px] font-semibold text-amber-900">
                      Pilih Template Balasan Cepat ({coupleDisplayName}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {quickReplyTemplates.map((tpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setReplyText(tpl)}
                          className="text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200/90 transition-colors cursor-pointer"
                        >
                          Template {idx + 1}: "{tpl.slice(0, 58)}..."
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Contoh: Terima kasih banyak atas doa dan restunya untuk kami, ${coupleDisplayName}...`}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyWishId(null);
                        setReplyText('');
                      }}
                      className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveReply(wish.id)}
                      className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Simpan Balasan
                    </button>
                  </div>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                <div className="flex items-center gap-1.5 text-stone-500">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span>{wish.reactionCount || 0} Suka</span>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReplyWishId(replyWishId === wish.id ? null : wish.id);
                      setReplyText(wish.adminReply || '');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium cursor-pointer transition-colors"
                  >
                    <CornerDownRight className="w-3.5 h-3.5" />
                    <span>{wish.adminReply ? 'Edit Balasan' : 'Balas'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTogglePin(wish)}
                    disabled={loadingId === wish.id}
                    title={wish.isPinned ? 'Lepas Pin' : 'Sematkan ke Atas'}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                      wish.isPinned
                        ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    <Pin className={`w-3.5 h-3.5 ${wish.isPinned ? 'fill-amber-700 text-amber-700' : ''}`} />
                    <span className="hidden sm:inline">{wish.isPinned ? 'Lepas Pin' : 'Pin'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleApprove(wish)}
                    disabled={loadingId === wish.id}
                    title={wish.isApproved ? 'Sembunyikan dari Publik' : 'Tampilkan ke Publik'}
                    className="p-1 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-100 cursor-pointer"
                  >
                    {wish.isApproved ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-rose-500" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteWish(wish)}
                    disabled={loadingId === wish.id}
                    title="Hapus Ucapan"
                    className="p-1 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
