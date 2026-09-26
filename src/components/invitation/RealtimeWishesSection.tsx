import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquareHeart, 
  Send, 
  Heart, 
  Pin, 
  Radio, 
  CheckCircle2, 
  Sparkles,
  User,
  Users
} from 'lucide-react';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import type { Guest, Wish, RSVPStatus } from '../../types.ts';
import { formatTimeAgo } from '../../utils/date.ts';

interface RealtimeWishesSectionProps {
  guest: Guest | null;
}

export const RealtimeWishesSection: React.FC<RealtimeWishesSectionProps> = ({ guest }) => {
  const { t, lang } = useLanguage();
  const { 
    wishes, 
    settings,
    onlineCount, 
    isConnected, 
    submitWish, 
    reactToWish,
    newWishAlert,
    clearNewWishAlert 
  } = useRealtime();

  const [name, setName] = useState<string>(guest ? guest.name : '');
  const [message, setMessage] = useState<string>('');
  const [attendance, setAttendance] = useState<'attending' | 'not_attending' | 'tentative'>('attending');
  const [pax, setPax] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'attending' | 'pinned'>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      setErrorMsg(lang === 'en' ? 'Name and wedding wish message are required.' : 'Nama dan pesan ucapan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await submitWish({
      senderName: name.trim(),
      message: message.trim(),
      attendance,
      pax,
      guestId: guest?.id
    });

    setIsSubmitting(false);

    if (res.success) {
      setMessage('');
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 4000);
    } else {
      setErrorMsg(res.error || (lang === 'en' ? 'Failed to send wish.' : 'Gagal mengirim ucapan.'));
    }
  };

  const filteredWishes = wishes.filter((w) => {
    if (filter === 'pinned') return w.isPinned;
    if (filter === 'attending') return w.attendance === 'attending';
    return true;
  });

  return (
    <section id="wishes-section" className="py-20 px-4 bg-[#F5EFE6]/50 border-t border-stone-200/80">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-stone-200 shadow-xs text-xs font-semibold text-stone-700 mb-3">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{isConnected ? t.wishes.realtimeActive : t.wishes.connecting}</span>
            <span className="text-stone-300">•</span>
            <span className="text-amber-800 font-bold">{onlineCount} {t.wishes.onlineGuests}</span>
          </div>

          <h2 className="font-serif-wedding text-3xl sm:text-4xl md:text-5xl font-bold text-stone-800">
            {t.wishes.title}
          </h2>
          <p className="text-stone-500 text-sm max-w-md mx-auto mt-2">
            {t.wishes.subtitle}
          </p>
        </div>

        {/* Live new wish alert toast */}
        <AnimatePresence>
          {newWishAlert && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              onClick={clearNewWishAlert}
              className="mb-6 p-4 rounded-2xl bg-amber-900 text-white shadow-xl flex items-center justify-between gap-3 cursor-pointer hover:bg-amber-950 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-200">{t.wishes.newWishAlert}</p>
                  <p className="text-xs text-stone-200 line-clamp-1">
                    <strong>{newWishAlert.senderName}</strong>: "{newWishAlert.message}"
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-amber-300 uppercase tracking-widest font-semibold flex-shrink-0">
                {t.wishes.closeAlert}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wish Submission Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-md mb-12">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            {successToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t.wishes.wishSentSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  {t.wishes.yourName}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.wishes.yourNamePlaceholder}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  {t.wishes.attendanceStatus}
                </label>
                <select
                  value={attendance}
                  onChange={(e) => setAttendance(e.target.value as 'attending' | 'not_attending' | 'tentative')}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-800 cursor-pointer"
                >
                  <option value="attending">✓ {t.rsvp.attending}</option>
                  <option value="not_attending">✗ {t.rsvp.notAttending}</option>
                  <option value="tentative">? {t.rsvp.tentative}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                {t.wishes.wishLabel}
              </label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.wishes.wishPlaceholder}
                className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-800"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-stone-400">
                {t.wishes.realtimeNotice}
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-medium text-xs sm:text-sm tracking-wide shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? t.wishes.sendingWish : t.wishes.sendWish}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              {t.wishes.filter}:
            </span>
            <div className="inline-flex rounded-xl p-1 bg-white border border-stone-200">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  filter === 'all' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {t.wishes.filterAll} ({wishes.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('attending')}
                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  filter === 'attending' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {t.wishes.filterAttending} ({wishes.filter((w) => w.attendance === 'attending').length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('pinned')}
                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  filter === 'pinned' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {t.wishes.filterPinned} ({wishes.filter((w) => w.isPinned).length})
              </button>
            </div>
          </div>

          <span className="text-xs text-stone-400">
            {lang === 'en' ? 'Showing' : 'Menampilkan'} {filteredWishes.length} {t.wishes.messages}
          </span>
        </div>

        {/* Wishes List Stream */}
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
          {filteredWishes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-stone-200">
              <MessageSquareHeart className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-sm text-stone-500">{t.wishes.emptyWishes}</p>
            </div>
          ) : (
            filteredWishes.map((wish) => (
              <motion.div
                key={wish.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl p-5 sm:p-6 border transition-all ${
                  wish.isPinned
                    ? 'border-amber-400/80 shadow-md bg-gradient-to-br from-amber-50/40 to-white ring-1 ring-amber-400/20'
                    : 'border-stone-200/90 shadow-xs hover:border-amber-200'
                }`}
              >
                {/* Top sender line */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-semibold text-stone-900 text-sm sm:text-base">
                      {wish.senderName}
                    </span>

                    {wish.attendance === 'attending' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        {t.rsvp.attending}
                      </span>
                    )}

                    {wish.attendance === 'not_attending' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-500 border border-stone-200">
                        {t.rsvp.notAttending}
                      </span>
                    )}

                    {wish.attendance === 'tentative' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        {t.rsvp.tentative}
                      </span>
                    )}

                    {wish.isPinned && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400/20 text-amber-900 border border-amber-400/40">
                        <Pin className="w-3 h-3 fill-amber-700 text-amber-700" />
                        {t.wishes.pinned}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-stone-400 flex-shrink-0">
                    {formatTimeAgo(wish.createdAt)}
                  </span>
                </div>

                {/* Message body */}
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed mb-4 whitespace-pre-line">
                  {wish.message}
                </p>

                {/* Admin / Couple reply if available */}
                {wish.adminReply && (
                  <div className="mb-3 p-3 bg-amber-50/70 border-l-2 border-amber-600 rounded-r-xl text-xs text-stone-700">
                    <p className="font-semibold text-amber-900 mb-0.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>
                        {t.wishes.coupleReply} ({settings?.groom?.nickname || 'Mempelai'} &amp; {settings?.bride?.nickname || 'Pasangan'}):
                      </span>
                    </p>
                    <p className="italic text-stone-600 leading-relaxed">
                      "{wish.adminReply}"
                    </p>
                  </div>
                )}

                {/* Bottom interaction */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => reactToWish(wish.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-stone-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer group"
                  >
                    <Heart className="w-3.5 h-3.5 text-stone-400 group-hover:text-rose-500 group-hover:fill-rose-500 transition-colors" />
                    <span>{wish.reactionCount || 0}</span>
                  </button>

                  <span className="text-[10px] text-stone-400 tracking-wider">
                    {t.wishes.verifiedWish}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
