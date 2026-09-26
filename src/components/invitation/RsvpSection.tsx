import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, HelpCircle, Users, Send, Sparkles, User } from 'lucide-react';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import type { Guest, RSVPStatus } from '../../types.ts';

interface RsvpSectionProps {
  guest: Guest | null;
}

export const RsvpSection: React.FC<RsvpSectionProps> = ({ guest }) => {
  const { t, lang } = useLanguage();
  const { submitRsvp } = useRealtime();

  const [name, setName] = useState<string>('');
  const [attendance, setAttendance] = useState<'attending' | 'not_attending' | 'tentative'>('attending');
  const [pax, setPax] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (guest) {
      setName(guest.name);
      if (guest.rsvpStatus && guest.rsvpStatus !== 'unconfirmed') {
        setAttendance(guest.rsvpStatus as 'attending' | 'not_attending' | 'tentative');
        setSubmitted(true);
      }
      setPax(guest.paxConfirmed || guest.paxAllocated || 1);
      if (guest.notes) setNotes(guest.notes);
    }
  }, [guest]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(lang === 'en' ? 'Please provide your full name.' : 'Mohon cantumkan nama Anda.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await submitRsvp({
      name: name.trim(),
      attendance,
      pax,
      notes: notes.trim(),
      guestId: guest?.id
    });

    setLoading(false);

    if (res.success) {
      setSubmitted(true);
      if (attendance === 'attending') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } else {
      setErrorMsg(res.error || (lang === 'en' ? 'Failed to save RSVP confirmation.' : 'Gagal menyimpan konfirmasi.'));
    }
  };

  const getAttendanceLabel = (att: string) => {
    if (att === 'attending') return `${t.rsvp.attending} (${pax} ${t.rsvp.person})`;
    if (att === 'not_attending') return t.rsvp.notAttending;
    return t.rsvp.tentative;
  };

  return (
    <section id="rsvp-section" className="py-20 px-4 bg-[#FAF7F2]">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs uppercase tracking-[0.25em] text-amber-800 font-semibold">
            {t.rsvp.eyebrow}
          </span>
          <h2 className="font-serif-wedding text-3xl sm:text-4xl font-bold text-stone-800 mt-2">
            {t.rsvp.title}
          </h2>
          <p className="text-stone-500 text-sm mt-2">
            {t.rsvp.subtitle}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-md"
        >
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-serif-wedding text-2xl font-bold text-stone-800 mb-2">
                {t.rsvp.thankYou}
              </h3>
              <p className="text-sm text-stone-600 mb-4">
                {lang === 'en' 
                  ? `Attendance confirmation for ${name} has been successfully recorded (${getAttendanceLabel(attendance)}).`
                  : `Konfirmasi kehadiran untuk ${name} telah berhasil dicatat (${getAttendanceLabel(attendance)}).`}
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="text-xs text-amber-800 underline hover:text-amber-900 font-medium cursor-pointer"
              >
                {t.rsvp.changeRsvp}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {guest && (
                <div className="bg-amber-50/80 border border-amber-200/70 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p>
                    {lang === 'en'
                      ? `You are registered as ${guest.name} (${guest.category}, allocated quota: ${guest.paxAllocated} guests).`
                      : `Anda terdaftar sebagai ${guest.name} (${guest.category}, kuota alokasi: ${guest.paxAllocated} tamu).`}
                  </p>
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                  {errorMsg}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  {t.rsvp.nameLabel}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.rsvp.namePlaceholder}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-stone-800"
                  />
                </div>
              </div>

              {/* Attendance Options */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  {t.rsvp.attendanceLabel}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAttendance('attending')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                      attendance === 'attending'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${attendance === 'attending' ? 'text-emerald-600' : 'text-stone-400'}`} />
                    <span>{t.rsvp.attending}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttendance('not_attending')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                      attendance === 'not_attending'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <XCircle className={`w-4 h-4 ${attendance === 'not_attending' ? 'text-rose-600' : 'text-stone-400'}`} />
                    <span>{t.rsvp.notAttending}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttendance('tentative')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                      attendance === 'tentative'
                        ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <HelpCircle className={`w-4 h-4 ${attendance === 'tentative' ? 'text-amber-600' : 'text-stone-400'}`} />
                    <span>{t.rsvp.tentative}</span>
                  </button>
                </div>
              </div>

              {/* Number of Pax if Attending */}
              {attendance === 'attending' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                    {t.rsvp.paxLabel}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <select
                      value={pax}
                      onChange={(e) => setPax(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-stone-800 cursor-pointer"
                    >
                      <option value={1}>1 {t.rsvp.person}</option>
                      <option value={2}>2 {t.rsvp.person}</option>
                      <option value={3}>3 {t.rsvp.person}</option>
                      <option value={4}>4 {t.rsvp.person} ({lang === 'en' ? 'Family' : 'Keluarga'})</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  {t.rsvp.notesLabel}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t.rsvp.notesPlaceholder}
                  className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-stone-800"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-medium text-sm tracking-wide shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? t.rsvp.submitting : t.rsvp.submitButton}</span>
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
};
