import React from 'react';
import { motion } from 'motion/react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';

interface LanguageSwitcherProps {
  variant?: 'floating' | 'inline' | 'navbar';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  variant = 'floating',
  className = '' 
}) => {
  const { lang, setLang, toggleLang } = useLanguage();

  if (variant === 'navbar') {
    return (
      <button
        onClick={toggleLang}
        title={lang === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
        className="p-1.5 sm:px-2.5 text-stone-300 hover:text-amber-300 hover:bg-stone-800/80 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-700/60"
        aria-label="Change Language"
      >
        <Globe className="w-3.5 h-3.5 text-amber-400" />
        <span className="font-bold tracking-wider">{lang.toUpperCase()}</span>
      </button>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`inline-flex items-center p-1 bg-stone-900/80 backdrop-blur-md rounded-full border border-amber-300/30 shadow-md ${className}`}>
        <button
          onClick={() => setLang('id')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            lang === 'id'
              ? 'bg-amber-600 text-stone-950 shadow-xs'
              : 'text-stone-300 hover:text-white'
          }`}
        >
          <span>🇮🇩</span>
          <span>ID</span>
        </button>
        <button
          onClick={() => setLang('en')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            lang === 'en'
              ? 'bg-amber-600 text-stone-950 shadow-xs'
              : 'text-stone-300 hover:text-white'
          }`}
        >
          <span>🇬🇧</span>
          <span>EN</span>
        </button>
      </div>
    );
  }

  // Floating variant (top-right, accessible both on cover & throughout the page)
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed top-4 right-4 z-50 flex items-center p-1 bg-stone-950/80 backdrop-blur-md border border-amber-200/40 rounded-full shadow-xl ${className}`}
    >
      <button
        onClick={() => setLang('id')}
        title="Bahasa Indonesia"
        className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
          lang === 'id'
            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-xs'
            : 'text-stone-400 hover:text-stone-200'
        }`}
      >
        <span>🇮🇩</span>
        <span className="tracking-wide">ID</span>
      </button>
      <button
        onClick={() => setLang('en')}
        title="English"
        className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
          lang === 'en'
            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-xs'
            : 'text-stone-400 hover:text-stone-200'
        }`}
      >
        <span>🇬🇧</span>
        <span className="tracking-wide">EN</span>
      </button>
    </motion.div>
  );
};
