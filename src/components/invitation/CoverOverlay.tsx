import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MailOpen, Heart, Sparkles, UserCheck } from 'lucide-react';
import type { WeddingSettings, Guest } from '../../types.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { LanguageSwitcher } from '../common/LanguageSwitcher.tsx';

interface CoverOverlayProps {
  isOpen?: boolean;
  onOpen: () => void;
  settings: WeddingSettings | null;
  guest: Guest | null;
}

export const CoverOverlay: React.FC<CoverOverlayProps> = ({
  isOpen = true,
  onOpen,
  settings,
  guest
}) => {
  if (!isOpen) return null;

  const { t } = useLanguage();
  const groomName = settings?.groom.nickname || 'Rizky';
  const brideName = settings?.bride.nickname || 'Siti';

  return (
    <AnimatePresence>
      <motion.div
        id="wedding-cover-overlay"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, y: -40, transition: { duration: 0.8, ease: 'easeInOut' } }}
        className="fixed inset-0 z-50 bg-[#1E1B18] text-stone-100 overflow-y-auto overflow-x-hidden"
      >
        {/* Ambient background with warm romantic overlay */}
        <div 
          className="fixed inset-0 bg-cover bg-center opacity-30 scale-105 pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600&auto=format&fit=crop')`
          }}
        />
        <div className="fixed inset-0 bg-gradient-to-t from-[#141210] via-[#1a1714]/85 to-[#141210] pointer-events-none" />

        {/* Decorative floral/golden border accents */}
        <div className="fixed inset-3 sm:inset-6 md:inset-8 border border-amber-200/20 rounded-2xl pointer-events-none" />
        <div className="fixed inset-4 sm:inset-7 md:inset-9 border border-amber-100/10 rounded-xl pointer-events-none" />

        {/* Top-right Language Switcher */}
        <div className="fixed top-5 right-5 sm:top-6 sm:right-6 z-30">
          <LanguageSwitcher variant="inline" />
        </div>

        <div className="relative z-10 min-h-full w-full flex flex-col items-center justify-center px-5 pt-14 pb-10 sm:py-12">
          <div className="max-w-lg w-full text-center flex flex-col items-center my-auto">
            {/* Top Label */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-2 text-amber-200/90 text-[11px] sm:text-xs tracking-[0.25em] sm:tracking-[0.3em] uppercase mb-2 sm:mb-4"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>{t.cover.celebration}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            </motion.div>

            {/* Couple Display Name */}
            <motion.h1
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="font-script-wedding text-5xl sm:text-7xl md:text-8xl text-amber-100 my-1 sm:my-2 leading-tight drop-shadow-md break-words max-w-full px-2"
            >
              {groomName} &amp; {brideName}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-stone-300 text-xs sm:text-sm tracking-widest uppercase mb-4 sm:mb-7"
            >
              {t.cover.date}
            </motion.p>

            {/* Guest Recipient Box */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full bg-stone-900/85 backdrop-blur-md border border-amber-200/30 rounded-2xl p-4 sm:p-6 mb-5 sm:mb-7 shadow-2xl"
            >
              <p className="text-[11px] sm:text-xs tracking-wider text-amber-200/80 uppercase mb-1.5">
                {t.cover.to}
              </p>
              <h2 className="text-lg sm:text-2xl font-serif-wedding font-bold text-white tracking-wide break-words">
                {guest ? guest.name : t.cover.honoredGuest}
              </h2>
              {guest && (
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-400/15 text-amber-300 border border-amber-400/30">
                    <UserCheck className="w-3 h-3" />
                    {guest.category} • {guest.paxAllocated} {t.cover.person}
                  </span>
                </div>
              )}
              <p className="text-[11px] sm:text-xs text-stone-300 mt-2.5 italic">
                {t.cover.apology}
              </p>
            </motion.div>

            {/* Open Invitation Button - High contrast white text and always visible on mobile */}
            <button
              id="btn-buka-undangan"
              type="button"
              onClick={onOpen}
              style={{ color: '#ffffff' }}
              className="group relative z-20 inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:via-amber-400 hover:to-amber-500 active:scale-95 text-white font-bold rounded-full shadow-[0_4px_25px_rgba(245,158,11,0.5)] border-2 border-amber-200/90 cursor-pointer transition-all duration-300 w-full max-w-[260px] sm:w-auto"
            >
              <MailOpen className="w-5 h-5 text-white shrink-0 transition-transform group-hover:rotate-12 drop-shadow-xs" />
              <span className="tracking-wider text-sm sm:text-base font-extrabold text-white drop-shadow-xs">
                {t.cover.open}
              </span>
              <Heart className="w-4 h-4 text-white fill-white shrink-0 drop-shadow-xs" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
