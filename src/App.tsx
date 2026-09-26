import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { RealtimeProvider, useRealtime } from './context/RealtimeContext.tsx';
import { LanguageProvider, useLanguage } from './context/LanguageContext.tsx';
import { CoverOverlay } from './components/invitation/CoverOverlay.tsx';
import { HeroSection } from './components/invitation/HeroSection.tsx';
import { CoupleSection } from './components/invitation/CoupleSection.tsx';
import { EventsSection } from './components/invitation/EventsSection.tsx';
import { StoryGallerySection } from './components/invitation/StoryGallerySection.tsx';
import { RsvpSection } from './components/invitation/RsvpSection.tsx';
import { RealtimeWishesSection } from './components/invitation/RealtimeWishesSection.tsx';
import { DigitalGiftSection } from './components/invitation/DigitalGiftSection.tsx';
import { FooterSection } from './components/invitation/FooterSection.tsx';
import { Navbar } from './components/invitation/Navbar.tsx';
import { MusicPlayer } from './components/invitation/MusicPlayer.tsx';
import { GuestQrModal } from './components/invitation/GuestQrModal.tsx';
import { GalleryPage } from './components/invitation/GalleryPage.tsx';
import { LoginModal } from './components/auth/LoginModal.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { BellRing, X } from 'lucide-react';
import type { Guest } from './types.ts';
import { parseWeddingAndGuestFromUrl } from './utils/slugHelper.ts';

const AppContent: React.FC = () => {
  const { isAuthenticated, isSuperAdmin } = useAuth();
  const { guests, settings, startMusic } = useRealtime();

  const [currentGuest, setCurrentGuest] = useState<Guest | null>(null);
  const [isCoverOpen, setIsCoverOpen] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'invitation' | 'admin'>('invitation');
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isGalleryPageOpen, setIsGalleryPageOpen] = useState<boolean>(false);
  const [announcementDismissed, setAnnouncementDismissed] = useState<boolean>(false);

  // Check URL params for ?to=slug, #/slug?to=slug or #admin
  useEffect(() => {
    const handleCheckUrl = () => {
      const { guestSlug } = parseWeddingAndGuestFromUrl();
      const params = new URLSearchParams(window.location.search);
      const adminParam = params.get('admin');

      if (adminParam === 'true' || window.location.hash.startsWith('#admin')) {
        setViewMode('admin');
      }

      if (guestSlug) {
        const found = guests.find(
          (g: Guest) => g.slug.toLowerCase() === guestSlug.toLowerCase() || g.name.toLowerCase() === guestSlug.toLowerCase()
        );
        if (found) {
          setCurrentGuest(found);
        } else {
          // Fallback temporary guest from param
          const decodedName = decodeURIComponent(guestSlug).replace(/[-_]/g, ' ');
          setCurrentGuest({
            id: 'temp-url',
            name: decodedName,
            slug: guestSlug,
            category: 'Tamu Umum',
            paxAllocated: 2,
            paxConfirmed: 0,
            rsvpStatus: 'unconfirmed',
            checkedIn: false,
            checkedInAt: null,
            invitationSent: true,
            createdAt: new Date().toISOString()
          });
        }
      }
    };

    handleCheckUrl();
    window.addEventListener('hashchange', handleCheckUrl);
    return () => window.removeEventListener('hashchange', handleCheckUrl);
  }, [guests]);

  const handleOpenInvitation = () => {
    setIsCoverOpen(false);
    startMusic();
  };

  if (viewMode === 'admin') {
    if (!isAuthenticated) {
      return (
        <div className="min-h-screen bg-[#F8F6F0] flex items-center justify-center p-4">
          <LoginModal
            isOpen={true}
            onClose={() => setViewMode('invitation')}
            onSuccess={() => setViewMode('admin')}
          />
        </div>
      );
    }
    return <AdminDashboard onBackToInvitation={() => setViewMode('invitation')} />;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 font-sans selection:bg-amber-200 selection:text-amber-900">
      {/* Cover / Welcome Envelope Modal Overlay */}
      {isCoverOpen && (
        <CoverOverlay
          isOpen={isCoverOpen}
          settings={settings}
          guest={currentGuest}
          onOpen={handleOpenInvitation}
        />
      )}

      {/* Real-time Broadcast Announcement Banner */}
      {settings?.announcement?.active && settings.announcement.message && !announcementDismissed && (
        <div className="sticky top-0 z-50 bg-amber-900 text-amber-50 px-4 py-2.5 text-xs sm:text-sm font-medium shadow-md flex items-center justify-between gap-3 animate-fade-in border-b border-amber-800">
          <div className="flex items-center gap-2.5 mx-auto max-w-4xl">
            <BellRing className="w-4 h-4 text-amber-300 animate-bounce flex-shrink-0" />
            <span>
              <strong>Pengumuman:</strong> {settings.announcement.message}
            </span>
          </div>
          <button
            onClick={() => setAnnouncementDismissed(true)}
            className="text-amber-300 hover:text-white p-1 rounded-md"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Invitation Sections */}
      <main className="relative pb-24">
        <HeroSection settings={settings} guest={currentGuest} />
        <CoupleSection settings={settings} />
        <EventsSection settings={settings} />
        <StoryGallerySection 
          settings={settings} 
          onOpenFullGallery={() => setIsGalleryPageOpen(true)} 
        />
        <RsvpSection guest={currentGuest} />
        <RealtimeWishesSection guest={currentGuest} />
        <DigitalGiftSection settings={settings} />
      </main>

      {/* Footer */}
      <FooterSection
        settings={settings}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenAdmin={() => setViewMode('admin')}
        isAuthenticated={isAuthenticated}
      />

      {/* Persistent Floating Controls (tampil setelah sampul undangan dibuka) */}
      {!isCoverOpen && (
        <>
          <Navbar
            onOpenQr={() => setIsQrModalOpen(true)}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onOpenAdmin={() => setViewMode('admin')}
            onOpenGallery={() => setIsGalleryPageOpen(true)}
          />

          <MusicPlayer />
        </>
      )}

      {/* Full Photo Gallery Page / Modal */}
      <GalleryPage
        photos={settings?.galleries || []}
        isOpen={isGalleryPageOpen}
        onClose={() => setIsGalleryPageOpen(false)}
      />

      {/* QR Pass Modal */}
      <GuestQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        guest={currentGuest}
      />

      {/* Login Admin Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => setViewMode('admin')}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </RealtimeProvider>
    </AuthProvider>
  );
}
