import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Sparkles, ZoomIn, Images, ArrowRight } from 'lucide-react';
import type { WeddingSettings } from '../../types.ts';
import { GalleryPage } from './GalleryPage.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

interface StoryGallerySectionProps {
  settings: WeddingSettings | null;
  onOpenFullGallery?: () => void;
}

export const StoryGallerySection: React.FC<StoryGallerySectionProps> = ({ 
  settings, 
  onOpenFullGallery 
}) => {
  const { t, lang } = useLanguage();
  const loveStories = settings?.loveStories || [];
  const galleries = settings?.galleries || [];
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [initialIndex, setInitialIndex] = useState<number>(0);

  const getStoryContent = (story: { title: string; description: string }, index: number) => {
    if (lang === 'en') {
      if (index === 0 || story.title.toLowerCase().includes('pertemuan')) {
        return {
          title: t.story.firstMeetTitle,
          description: t.story.firstMeetDesc
        };
      }
      if (index === 1 || story.title.toLowerCase().includes('komitmen') || story.title.toLowerCase().includes('lamaran')) {
        return {
          title: t.story.engagementTitle,
          description: t.story.engagementDesc
        };
      }
      if (index === 2 || story.title.toLowerCase().includes('pernikahan') || story.title.toLowerCase().includes('selamanya')) {
        return {
          title: t.story.marriageTitle,
          description: t.story.marriageDesc
        };
      }
    }
    return {
      title: story.title,
      description: story.description
    };
  };

  const handleOpenPhoto = (idx: number) => {
    if (onOpenFullGallery) {
      onOpenFullGallery();
    } else {
      setInitialIndex(idx);
      setIsGalleryOpen(true);
    }
  };

  return (
    <section id="story-gallery-section" className="py-20 px-4 max-w-5xl mx-auto">
      {/* Love Story Section */}
      <div className="text-center mb-16">
        <span className="text-xs uppercase tracking-[0.25em] text-amber-800 font-semibold">
          {t.story.eyebrow}
        </span>
        <h2 className="font-serif-wedding text-3xl sm:text-4xl md:text-5xl font-bold text-stone-800 mt-2">
          {t.story.title}
        </h2>
        <p className="text-stone-500 text-sm max-w-md mx-auto mt-2">
          {t.story.subtitle}
        </p>
      </div>

      {/* Story Timeline */}
      <div className="relative max-w-3xl mx-auto mb-24">
        {/* Center line */}
        <div className="absolute left-4 sm:left-1/2 top-4 bottom-4 w-0.5 bg-amber-200 sm:-translate-x-1/2" />

        <div className="space-y-10 sm:space-y-12">
          {loveStories.map((story, idx) => {
            const isEven = idx % 2 === 0;
            const content = getStoryContent(story, idx);
            return (
              <motion.div
                key={story.id || idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className={`relative flex flex-col sm:flex-row items-start ${
                  isEven ? 'sm:flex-row-reverse' : ''
                }`}
              >
                {/* Timeline node */}
                <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md border-4 border-white z-10">
                  <Heart className="w-3.5 h-3.5 fill-white" />
                </div>

                {/* Content Box */}
                <div className="ml-12 sm:ml-0 sm:w-1/2 sm:px-8">
                  <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-sm hover:border-amber-300 transition-colors">
                    <span className="inline-block px-3 py-1 bg-amber-100/70 text-amber-900 text-xs font-bold rounded-full mb-2">
                      {story.year}
                    </span>
                    <h4 className="font-serif-wedding text-xl font-bold text-stone-900 mb-2">
                      {content.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      {content.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Photo Gallery Section Header */}
      <div className="text-center mb-10">
        <span className="text-xs uppercase tracking-[0.25em] text-amber-800 font-semibold">
          {t.story.galleryEyebrow}
        </span>
        <h2 className="font-serif-wedding text-3xl sm:text-4xl md:text-5xl font-bold text-stone-800 mt-2">
          {t.story.galleryTitle}
        </h2>
        <p className="text-stone-500 text-sm max-w-md mx-auto mt-2">
          {t.story.gallerySubtitle}
        </p>
      </div>

      {/* Preview Photos Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {galleries.slice(0, 8).map((item, idx) => (
          <motion.div
            key={item.id || idx}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.08 }}
            onClick={() => handleOpenPhoto(idx)}
            className="group relative h-48 sm:h-64 rounded-2xl overflow-hidden cursor-pointer shadow-sm border border-stone-200 bg-stone-100"
          >
            <img
              src={item.url}
              alt={item.caption}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
            {/* Category tag */}
            <div className="absolute top-2.5 left-2.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-950/70 text-amber-300 backdrop-blur-md">
                {item.category || 'Momen'}
              </span>
            </div>

            <div className="absolute inset-0 bg-stone-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-center text-white">
              <ZoomIn className="w-6 h-6 mb-1 text-amber-300" />
              <p className="text-xs font-medium tracking-wide line-clamp-2">{item.caption}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Button to open complete gallery */}
      <div className="text-center">
        <button
          onClick={() => {
            if (onOpenFullGallery) {
              onOpenFullGallery();
            } else {
              setInitialIndex(0);
              setIsGalleryOpen(true);
            }
          }}
          className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs sm:text-sm font-semibold tracking-wide shadow-md transition-all cursor-pointer group hover:scale-[1.02]"
        >
          <Images className="w-4 h-4 text-amber-400" />
          <span>{t.story.openFullGallery} ({galleries.length} {t.story.photos})</span>
          <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Standalone gallery modal fallback if not passed from parent */}
      <GalleryPage
        photos={galleries}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        initialPhotoIndex={initialIndex}
      />
    </section>
  );
};
