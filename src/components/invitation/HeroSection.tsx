import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, BellRing, ChevronDown, Clock } from 'lucide-react';
import type { WeddingSettings, Guest } from '../../types.ts';
import { calculateCountdown, type CountdownResult } from '../../utils/date.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { getThemeById } from '../../utils/themeTemplates.ts';

interface HeroSectionProps {
  settings: WeddingSettings | null;
  announcement?: WeddingSettings['announcement'] | null;
  guest?: Guest | null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ settings, announcement, guest }) => {
  const { t } = useLanguage();
  const countdownDate = settings?.countdownDate || '2026-10-24T08:00:00';
  const [countdown, setCountdown] = useState<CountdownResult>(calculateCountdown(countdownDate));
  const activeTheme = getThemeById(settings?.themeTemplateId);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateCountdown(countdownDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdownDate]);

  const groomName = settings?.groom.nickname || 'Rizky';
  const brideName = settings?.bride.nickname || 'Siti';

  const handleSaveToCalendar = () => {
    // Generate Google Calendar Link
    const title = encodeURIComponent(`The Wedding of ${groomName} & ${brideName}`);
    const details = encodeURIComponent(`Pernikahan ${settings?.groom.fullName} & ${settings?.bride.fullName}.\nLokasi: ${settings?.events[0]?.location || 'Jakarta'}`);
    const location = encodeURIComponent(settings?.events[0]?.address || 'Jakarta');
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=20261024T010000Z/20261024T070000Z`;
    window.open(gCalUrl, '_blank');
  };

  return (
    <section
      id="hero-section"
      style={{ backgroundColor: activeTheme.palette.heroBg }}
      className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-4 pt-16 pb-20 overflow-hidden transition-colors duration-500"
    >
      {/* Subtle background ornamentation */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#8C7043_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Super Admin Live Broadcast Announcement Banner if active */}
      {announcement?.active && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 max-w-2xl w-full mb-8 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex items-center justify-center gap-3 text-amber-900 text-sm shadow-sm"
        >
          <BellRing className="w-4 h-4 text-amber-600 animate-bounce flex-shrink-0" />
          <p className="font-medium text-xs sm:text-sm">
            <span className="font-semibold text-amber-800">{t.announcement.label}</span> {announcement.message}
          </p>
        </motion.div>
      )}

      {/* Header Eyebrow */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{ color: activeTheme.palette.primary }}
        className="text-xs sm:text-sm tracking-[0.3em] uppercase mb-4 font-semibold"
      >
        {t.hero.eyebrow}
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        style={{ color: activeTheme.palette.headingText }}
        className="font-script-wedding text-6xl sm:text-8xl md:text-9xl my-2 leading-none"
      >
        {groomName} &amp; {brideName}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{ color: activeTheme.palette.bodyText }}
        className="font-serif-wedding text-lg sm:text-2xl italic tracking-wider mt-3 mb-10 max-w-xl"
      >
        {t.hero.invitationText}
      </motion.p>

      {/* Event Date Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        style={{
          borderColor: activeTheme.palette.accentBorder,
          color: activeTheme.palette.headingText
        }}
        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/90 border shadow-sm text-sm font-medium mb-10"
      >
        <Calendar className="w-4 h-4" style={{ color: activeTheme.palette.primary }} />
        <span>{t.hero.dateLocation}</span>
      </motion.div>

      {/* Countdown Timer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="w-full max-w-xl mx-auto mb-10"
      >
        <div className="flex items-center justify-center gap-1 text-xs text-stone-500 uppercase tracking-widest mb-4">
          <Clock className="w-3.5 h-3.5" style={{ color: activeTheme.palette.primary }} />
          <span>{t.hero.countdownTitle}</span>
        </div>

        <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
          {[
            { label: t.hero.days, value: countdown.days },
            { label: t.hero.hours, value: countdown.hours },
            { label: t.hero.minutes, value: countdown.minutes },
            { label: t.hero.seconds, value: countdown.seconds }
          ].map((item, idx) => (
            <div
              key={idx}
              style={{ borderColor: activeTheme.palette.accentBorder }}
              className="bg-white/95 backdrop-blur-sm border rounded-2xl p-3 sm:p-5 shadow-sm text-center flex flex-col items-center justify-center transition-all"
            >
              <span
                style={{ color: activeTheme.palette.headingText }}
                className="font-serif-wedding text-2xl sm:text-4xl md:text-5xl font-bold leading-none tabular-nums"
              >
                {String(item.value).padStart(2, '0')}
              </span>
              <span className="text-[11px] sm:text-xs text-stone-500 font-medium tracking-wider uppercase mt-1">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="flex flex-wrap items-center justify-center gap-3"
      >
        <button
          onClick={handleSaveToCalendar}
          style={{ background: activeTheme.palette.buttonBg }}
          className="inline-flex items-center gap-2 px-6 py-2.5 hover:opacity-95 text-white rounded-full text-xs sm:text-sm font-semibold tracking-wide shadow-md transition-all cursor-pointer"
        >
          <Calendar className="w-4 h-4 text-white" />
          <span className="text-white">{t.hero.saveCalendar}</span>
        </button>
      </motion.div>

      {/* Down indicator */}
      <div className="mt-14 animate-bounce text-stone-400">
        <ChevronDown className="w-5 h-5 mx-auto" />
      </div>
    </section>
  );
};
