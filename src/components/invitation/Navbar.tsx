import React from 'react';
import { 
  Home, 
  Heart, 
  Calendar, 
  Images, 
  Send, 
  MessageSquareHeart, 
  Gift, 
  QrCode, 
  ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { LanguageSwitcher } from '../common/LanguageSwitcher.tsx';
import { parseWeddingAndGuestFromUrl } from '../../utils/slugHelper.ts';

interface NavbarProps {
  onOpenQr: () => void;
  onOpenLogin: () => void;
  onOpenAdmin: () => void;
  onOpenGallery?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenQr, onOpenLogin, onOpenAdmin, onOpenGallery }) => {
  const { isAuthenticated, isSuperAdmin, isOwner, user } = useAuth();
  const { t } = useLanguage();

  const { weddingSlug: currentUrlSlug } = parseWeddingAndGuestFromUrl();
  const isLoggedIntoCurrentWedding = isAuthenticated && (
    currentUrlSlug
      ? user?.weddingSlug?.toLowerCase() === currentUrlSlug.toLowerCase()
      : true
  );

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-fit px-2.5 sm:px-3 py-2 bg-stone-900/90 backdrop-blur-md border border-stone-700/60 rounded-full shadow-2xl flex items-center gap-1 sm:gap-1.5">
      <button
        onClick={() => scrollTo('hero-section')}
        title={t.nav.home}
        className="p-2 sm:px-3 text-stone-300 hover:text-amber-300 hover:bg-stone-800/80 rounded-full text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">{t.nav.home}</span>
      </button>

      <button
        onClick={() => scrollTo('couple-section')}
        title={t.nav.couple}
        className="p-2 sm:px-3 text-stone-300 hover:text-amber-300 hover:bg-stone-800/80 rounded-full text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
      >
        <Heart className="w-4 h-4" />
        <span className="hidden sm:inline">{t.nav.couple}</span>
      </button>

      <button
        onClick={() => scrollTo('events-section')}
        title={t.nav.events}
        className="p-2 sm:px-3 text-stone-300 hover:text-amber-300 hover:bg-stone-800/80 rounded-full text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
      >
        <Calendar className="w-4 h-4" />
        <span className="hidden sm:inline">{t.nav.events}</span>
      </button>

      <button
        onClick={() => {
          if (onOpenGallery) {
            onOpenGallery();
          } else {
            scrollTo('story-gallery-section');
          }
        }}
        title={t.nav.gallery}
        className="p-2 sm:px-3 text-stone-300 hover:text-amber-300 hover:bg-stone-800/80 rounded-full text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
      >
        <Images className="w-4 h-4" />
        <span className="hidden sm:inline">{t.nav.gallery}</span>
      </button>

      <button
        onClick={() => scrollTo('rsvp-section')}
        title={t.nav.rsvp}
        className="p-2 sm:px-3 text-stone-300 hover:text-amber-300 hover:bg-stone-800/80 rounded-full text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
      >
        <Send className="w-4 h-4" />
        <span className="hidden sm:inline">{t.nav.rsvp}</span>
      </button>

      <button
        onClick={() => scrollTo('wishes-section')}
        title={t.nav.wishes}
        className="p-2 sm:px-3 text-stone-300 hover:text-amber-300 hover:bg-stone-800/80 rounded-full text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
      >
        <MessageSquareHeart className="w-4 h-4 text-amber-300" />
        <span className="hidden sm:inline text-amber-200">{t.nav.wishes}</span>
      </button>

      <button
        onClick={() => scrollTo('gift-section')}
        title={t.nav.gift}
        className="p-2 sm:px-3 text-stone-300 hover:text-amber-300 hover:bg-stone-800/80 rounded-full text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
      >
        <Gift className="w-4 h-4" />
        <span className="hidden sm:inline">{t.nav.gift}</span>
      </button>

      <div className="w-px h-5 bg-stone-700 mx-0.5 sm:mx-1" />

      {/* Language Switcher in Navbar */}
      <LanguageSwitcher variant="navbar" />

      {/* QR Pass */}
      <button
        onClick={onOpenQr}
        title={t.nav.qr}
        className="p-2 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded-full transition-colors cursor-pointer"
      >
        <QrCode className="w-4 h-4" />
      </button>

      {/* Admin Panel Button - Always requires login authentication first */}
      <button
        onClick={onOpenLogin}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium tracking-wide transition-colors cursor-pointer border border-stone-700"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline">{t.nav.adminLogin}</span>
      </button>
    </nav>
  );
};
