import React from 'react';
import { motion } from 'motion/react';
import { Instagram, Heart, BookOpen } from 'lucide-react';
import type { WeddingSettings } from '../../types.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { getTranslatedInvitationFormat } from '../../utils/religionPresets.ts';
import { getThemeById } from '../../utils/themeTemplates.ts';

interface CoupleSectionProps {
  settings: WeddingSettings | null;
}

export const CoupleSection: React.FC<CoupleSectionProps> = ({ settings }) => {
  const { t, lang } = useLanguage();
  const activeTheme = getThemeById(settings?.themeTemplateId);

  const frameRadiusClass =
    activeTheme.photoFrameStyle === 'arch-frame'
      ? 'rounded-t-full rounded-b-3xl'
      : activeTheme.photoFrameStyle === 'rounded-luxury'
      ? 'rounded-3xl'
      : activeTheme.photoFrameStyle === 'classic-oval'
      ? 'rounded-[45%]'
      : 'rounded-full border-dashed';

  const format = getTranslatedInvitationFormat(settings?.invitationFormat, lang);
  const openingGreeting = format.openingGreeting;
  const openingSubtext = format.openingSubtext;
  const verseLabel = format.holyVerse?.label || t.couple.holyVerse;
  const quoteText = format.holyVerse?.text || t.couple.verseText;
  const quoteSource = format.holyVerse?.source || t.couple.verseSource;

  const groom = settings?.groom;
  const bride = settings?.bride;

  const formatParentName = (name: string | undefined, defaultVal: string) => {
    const val = name || defaultVal;
    if (lang === 'en') {
      return val.replace(/\bBpk\.\s*/g, 'Mr. ').replace(/\bIbu\s*/g, 'Mrs. ');
    }
    return val;
  };

  const getGroomBio = () => {
    if (lang === 'en') {
      if (!groom?.bio || groom.bio.includes('Putra pertama') || groom.bio.includes('Software Architect')) {
        return 'First son of Mr. H. Bambang Sudiro & Mrs. Hj. Endang Sulastri. A Software Architect who is passionate about photography and nature exploration.';
      }
    }
    return groom?.bio;
  };

  const getBrideBio = () => {
    if (lang === 'en') {
      if (!bride?.bio || bride.bio.includes('Putri bungsu') || bride.bio.includes('financial planner')) {
        return 'Youngest daughter of Mr. Ir. H. Ahmad Fauzi & Mrs. Hj. Rina Marlina. A financial planner who is devoted to floral aesthetics and culinary discovery.';
      }
    }
    return bride?.bio;
  };

  return (
    <section id="couple-section" className="py-20 px-4 max-w-5xl mx-auto">
      {/* Opening Greeting & Subtext */}
      {openingGreeting && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-10 space-y-2.5"
        >
          <p className="font-serif-wedding text-2xl sm:text-3xl text-amber-950 font-bold tracking-wide">
            {openingGreeting}
          </p>
          {openingSubtext && (
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-lg mx-auto">
              {openingSubtext}
            </p>
          )}
        </motion.div>
      )}

      {/* Holy Verse / Blessing Quote Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        style={{
          backgroundColor: activeTheme.palette.accentSoftBg,
          borderColor: activeTheme.palette.accentBorder
        }}
        className="max-w-2xl mx-auto text-center mb-20 border rounded-3xl p-8 sm:p-10 shadow-sm relative overflow-hidden"
      >
        <div
          style={{ color: activeTheme.palette.primary }}
          className="flex items-center justify-center gap-2 mb-4"
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-xs tracking-widest uppercase font-semibold">{verseLabel}</span>
        </div>
        <p className="font-serif-wedding text-lg sm:text-xl text-stone-700 leading-relaxed italic mb-4">
          "{quoteText}"
        </p>
        <span
          style={{ color: activeTheme.palette.headingText }}
          className="text-xs sm:text-sm font-semibold tracking-wider"
        >
          — {quoteSource}
        </span>
      </motion.div>

      {/* Section Header */}
      <div className="text-center mb-16">
        <span
          style={{ color: activeTheme.palette.primary }}
          className="text-xs uppercase tracking-[0.25em] font-semibold"
        >
          {t.couple.eyebrow}
        </span>
        <h2
          style={{ color: activeTheme.palette.headingText }}
          className="font-serif-wedding text-3xl sm:text-4xl md:text-5xl font-bold mt-2"
        >
          {t.couple.title}
        </h2>
        <p className="text-stone-500 text-sm max-w-md mx-auto mt-2">
          {t.couple.subtitle}
        </p>
      </div>

      {/* Couple Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
        {/* Groom */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{ borderColor: activeTheme.palette.accentBorder }}
          className="bg-white rounded-3xl p-6 sm:p-8 border shadow-md text-center flex flex-col items-center relative group transition-all"
        >
          <div
            style={{ borderColor: activeTheme.palette.primary }}
            className={`relative w-44 h-44 sm:w-52 sm:h-52 mb-6 overflow-hidden p-1.5 border-2 shadow-inner ${frameRadiusClass}`}
          >
            <img
              src={groom?.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop'}
              alt={groom?.fullName || 'Mempelai Pria'}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${frameRadiusClass}`}
            />
          </div>

          <span
            style={{
              color: activeTheme.palette.primary,
              backgroundColor: activeTheme.palette.accentSoftBg
            }}
            className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-3"
          >
            {t.couple.groomBadge}
          </span>
          <h3
            style={{ color: activeTheme.palette.headingText }}
            className="font-serif-wedding text-2xl sm:text-3xl font-bold mb-2"
          >
            {groom?.fullName || 'Muhammad Rizky Pratama, S.Kom.'}
          </h3>
          <p className="text-xs text-stone-500 font-medium mb-4">
            {t.couple.sonOf} <br />
            <span className="text-stone-700 font-semibold">{formatParentName(groom?.fatherName, 'Bpk. H. Bambang Sudiro')}</span> {t.couple.and}{' '}
            <span className="text-stone-700 font-semibold">{formatParentName(groom?.motherName, 'Ibu Hj. Endang Sulastri')}</span>
          </p>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-5 max-w-sm">
            {getGroomBio()}
          </p>

          {groom?.instagram && (
            <a
              href={`https://instagram.com/${groom.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: activeTheme.palette.primary }}
              className="inline-flex items-center gap-1.5 text-xs bg-stone-50 hover:bg-stone-100 px-4 py-1.5 rounded-full border border-stone-200 transition-colors"
            >
              <Instagram className="w-3.5 h-3.5" style={{ color: activeTheme.palette.primary }} />
              <span>{groom.instagram}</span>
            </a>
          )}
        </motion.div>

        {/* Bride */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{ borderColor: activeTheme.palette.accentBorder }}
          className="bg-white rounded-3xl p-6 sm:p-8 border shadow-md text-center flex flex-col items-center relative group transition-all"
        >
          <div
            style={{ borderColor: activeTheme.palette.primary }}
            className={`relative w-44 h-44 sm:w-52 sm:h-52 mb-6 overflow-hidden p-1.5 border-2 shadow-inner ${frameRadiusClass}`}
          >
            <img
              src={bride?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop'}
              alt={bride?.fullName || 'Mempelai Wanita'}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${frameRadiusClass}`}
            />
          </div>

          <span
            style={{
              color: activeTheme.palette.primary,
              backgroundColor: activeTheme.palette.accentSoftBg
            }}
            className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-3"
          >
            {t.couple.brideBadge}
          </span>
          <h3
            style={{ color: activeTheme.palette.headingText }}
            className="font-serif-wedding text-2xl sm:text-3xl font-bold mb-2"
          >
            {bride?.fullName || 'Siti Nurhaliza, S.E.'}
          </h3>
          <p className="text-xs text-stone-500 font-medium mb-4">
            {t.couple.daughterOf} <br />
            <span className="text-stone-700 font-semibold">{formatParentName(bride?.fatherName, 'Bpk. Ir. H. Ahmad Fauzi')}</span> {t.couple.and}{' '}
            <span className="text-stone-700 font-semibold">{formatParentName(bride?.motherName, 'Ibu Hj. Rina Marlina')}</span>
          </p>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-5 max-w-sm">
            {getBrideBio()}
          </p>

          {bride?.instagram && (
            <a
              href={`https://instagram.com/${bride.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-amber-800 hover:text-amber-600 bg-stone-50 hover:bg-stone-100 px-4 py-1.5 rounded-full border border-stone-200 transition-colors"
            >
              <Instagram className="w-3.5 h-3.5 text-amber-700" />
              <span>{bride.instagram}</span>
            </a>
          )}
        </motion.div>
      </div>

      <div className="flex justify-center mt-8">
        <Heart className="w-5 h-5 text-amber-600 fill-amber-600/30 animate-pulse" />
      </div>
    </section>
  );
};
