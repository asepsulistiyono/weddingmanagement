import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Play, 
  Pause, 
  Sparkles, 
  Heart, 
  Image as ImageIcon,
  Share2,
  Check,
  Filter
} from 'lucide-react';
import type { GalleryPhoto } from '../../types.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';

interface GalleryPageProps {
  photos: GalleryPhoto[];
  isOpen: boolean;
  onClose: () => void;
  initialPhotoIndex?: number;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({
  photos,
  isOpen,
  onClose,
  initialPhotoIndex = 0
}) => {
  const { t, lang } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [isPlayingSlideshow, setIsPlayingSlideshow] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Category definitions with ID and EN labels
  const rawCategories = ['Semua', 'Prewedding', 'Lamaran', 'Momen Romantis', 'Akad & Resepsi'];

  const getCategoryLabel = (cat: string) => {
    if (lang === 'en') {
      if (cat === 'Semua') return t.galleryPage.allCategories;
      if (cat === 'Prewedding') return t.galleryPage.prewedding;
      if (cat === 'Lamaran') return t.galleryPage.engagement;
      if (cat === 'Momen Romantis') return t.galleryPage.romantic;
      if (cat === 'Akad & Resepsi') return t.galleryPage.weddingDay;
    }
    return cat;
  };

  const filteredPhotos = selectedCategory === 'Semua' 
    ? photos 
    : photos.filter(p => (p.category || 'Prewedding') === selectedCategory);

  // Open lightbox with initial index if requested
  useEffect(() => {
    if (isOpen && initialPhotoIndex !== undefined && initialPhotoIndex >= 0 && initialPhotoIndex < photos.length) {
      setActiveLightboxIndex(initialPhotoIndex);
    }
  }, [isOpen, initialPhotoIndex, photos.length]);

  // Slideshow timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingSlideshow && activeLightboxIndex !== null && filteredPhotos.length > 1) {
      timer = setInterval(() => {
        setActiveLightboxIndex((prev) => 
          prev !== null ? (prev + 1) % filteredPhotos.length : 0
        );
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isPlayingSlideshow, activeLightboxIndex, filteredPhotos.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || activeLightboxIndex === null) return;
      if (e.key === 'ArrowRight') {
        setActiveLightboxIndex((prev) => 
          prev !== null ? (prev + 1) % filteredPhotos.length : 0
        );
      } else if (e.key === 'ArrowLeft') {
        setActiveLightboxIndex((prev) => 
          prev !== null ? (prev - 1 + filteredPhotos.length) % filteredPhotos.length : 0
        );
      } else if (e.key === 'Escape') {
        if (activeLightboxIndex !== null) {
          setActiveLightboxIndex(null);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeLightboxIndex, filteredPhotos.length, onClose]);

  const handleSharePhoto = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  const currentPhoto = activeLightboxIndex !== null ? filteredPhotos[activeLightboxIndex] : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/95 backdrop-blur-md flex flex-col">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 px-4 sm:px-8 py-4 bg-stone-900/90 backdrop-blur-lg border-b border-stone-800 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif-wedding text-lg sm:text-xl font-bold tracking-wide">
              {t.galleryPage.title}
            </h2>
            <p className="text-xs text-stone-400">
              Rizky &amp; Siti &bull; {photos.length} {t.galleryPage.moments}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
          title={lang === 'en' ? 'Close Gallery' : 'Tutup Galeri'}
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter Chips */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-8 pb-4 border-b border-stone-800">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-4 h-4 text-stone-400 mr-1" />
            {rawCategories.map((cat) => {
              const count = cat === 'Semua' 
                ? photos.length 
                : photos.filter(p => (p.category || 'Prewedding') === cat).length;
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-md ring-2 ring-amber-300/30'
                      : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700 hover:text-white'
                  }`}
                >
                  <span>{getCategoryLabel(cat)}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-stone-950/20 text-stone-950' : 'bg-stone-900 text-stone-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-stone-400">
            {lang === 'en' ? 'Showing' : 'Menampilkan'} <strong className="text-amber-400">{filteredPhotos.length}</strong> {t.story.photos}
          </p>
        </div>

        {/* Photos Grid */}
        {filteredPhotos.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-40 text-amber-500" />
            <p className="text-base font-medium">{t.galleryPage.emptyCategory}</p>
            <p className="text-xs text-stone-500 mt-1">
              {lang === 'en' ? 'Admin can add photos via the management panel.' : 'Admin dapat menambahkan foto melalui panel kelola.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredPhotos.map((photo, idx) => (
              <motion.div
                key={photo.id || idx}
                layoutId={`gallery-item-${photo.id}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.5) }}
                onClick={() => {
                  setActiveLightboxIndex(idx);
                  setIsZoomed(false);
                }}
                className="group relative h-64 sm:h-72 rounded-2xl overflow-hidden cursor-pointer bg-stone-900 border border-stone-800/80 shadow-md hover:border-amber-500/50 hover:shadow-amber-500/10 transition-all"
              >
                <img
                  src={photo.url}
                  alt={photo.caption || 'Foto Pernikahan'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-stone-950/70 text-amber-300 backdrop-blur-md border border-stone-700/50">
                    {getCategoryLabel(photo.category || 'Prewedding')}
                  </span>
                  {photo.isFeatured && (
                    <span className="p-1 rounded-full bg-amber-500 text-stone-950" title={lang === 'en' ? 'Featured' : 'Foto Pilihan'}>
                      <Sparkles className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {/* Hover overlay with caption */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
                  <p className="text-xs font-semibold text-stone-100 line-clamp-2">
                    {photo.caption}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-amber-300/80 mt-2">
                    <span className="flex items-center gap-1">
                      <ZoomIn className="w-3.5 h-3.5" /> {lang === 'en' ? 'Enlarge' : 'Perbesar'}
                    </span>
                    <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Interactive Lightbox Modal */}
      <AnimatePresence>
        {activeLightboxIndex !== null && currentPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-black/95 flex flex-col justify-between p-3 sm:p-6 backdrop-blur-xl"
          >
            {/* Lightbox Controls Header */}
            <div className="flex items-center justify-between text-white z-20 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-300 bg-stone-800/80 px-3 py-1 rounded-full border border-stone-700">
                  {activeLightboxIndex + 1} / {filteredPhotos.length}
                </span>
                <span className="text-xs text-amber-400 font-medium hidden sm:inline">
                  {getCategoryLabel(currentPhoto.category || 'Prewedding')}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlayingSlideshow(!isPlayingSlideshow)}
                  title={isPlayingSlideshow ? t.galleryPage.slideshowPause : t.galleryPage.slideshowPlay}
                  className="p-2 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
                >
                  {isPlayingSlideshow ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsZoomed(!isZoomed)}
                  title={isZoomed ? (lang === 'en' ? 'Normal size' : 'Ukuran Normal') : (lang === 'en' ? 'Zoom in' : 'Perbesar')}
                  className="p-2 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
                >
                  {isZoomed ? <ZoomOut className="w-4 h-4 text-amber-400" /> : <ZoomIn className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => handleSharePhoto(currentPhoto.url)}
                  title={t.galleryPage.sharePhoto}
                  className="p-2 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => {
                    setActiveLightboxIndex(null);
                    setIsPlayingSlideshow(false);
                  }}
                  title="Tutup (Esc)"
                  className="p-2 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lightbox Center Image Stage */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden my-2">
              {/* Previous button */}
              {filteredPhotos.length > 1 && (
                <button
                  onClick={() => {
                    setActiveLightboxIndex((prev) => 
                      prev !== null ? (prev - 1 + filteredPhotos.length) % filteredPhotos.length : 0
                    );
                    setIsZoomed(false);
                  }}
                  className="absolute left-2 sm:left-4 z-20 p-3 rounded-full bg-stone-900/70 hover:bg-stone-800 text-white backdrop-blur-md border border-stone-700/60 shadow-xl transition-all cursor-pointer"
                  title={lang === 'en' ? 'Previous photo' : 'Foto Sebelumnya'}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Main Photo */}
              <motion.img
                key={currentPhoto.id || activeLightboxIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ 
                  opacity: 1, 
                  scale: isZoomed ? 1.4 : 1,
                  transition: { duration: 0.3 }
                }}
                exit={{ opacity: 0 }}
                src={currentPhoto.url}
                alt={currentPhoto.caption}
                className={`max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl transition-transform select-none ${
                  isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
                }`}
                onClick={() => setIsZoomed(!isZoomed)}
              />

              {/* Next button */}
              {filteredPhotos.length > 1 && (
                <button
                  onClick={() => {
                    setActiveLightboxIndex((prev) => 
                      prev !== null ? (prev + 1) % filteredPhotos.length : 0
                    );
                    setIsZoomed(false);
                  }}
                  className="absolute right-2 sm:right-4 z-20 p-3 rounded-full bg-stone-900/70 hover:bg-stone-800 text-white backdrop-blur-md border border-stone-700/60 shadow-xl transition-all cursor-pointer"
                  title={lang === 'en' ? 'Next photo' : 'Foto Berikutnya'}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Lightbox Bottom Caption */}
            <div className="text-center max-w-xl mx-auto z-20 pt-2 pb-1">
              <p className="text-stone-200 text-sm font-medium">
                {currentPhoto.caption}
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {lang === 'en' ? 'Use left / right keyboard arrow keys to navigate' : 'Gunakan tombol panah kiri / kanan pada keyboard untuk bernavigasi'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
