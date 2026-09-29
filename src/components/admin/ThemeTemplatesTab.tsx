import React, { useState } from 'react';
import {
  Palette,
  Check,
  Sparkles,
  ExternalLink,
  Eye,
  Heart,
  MailOpen,
  Calendar,
  CheckCircle2,
  X
} from 'lucide-react';
import type { WeddingSettings, ThemeTemplateId } from '../../types.ts';
import {
  WEDDING_THEME_TEMPLATES,
  getThemeById,
  type WeddingThemeTemplate,
  type ThemeCategory
} from '../../utils/themeTemplates.ts';
import { getFullInvitationUrl, generateWeddingSlug, sanitizeSlug } from '../../utils/slugHelper.ts';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface ThemeTemplatesTabProps {
  settings: WeddingSettings | null;
  onRefresh: () => void;
  onOpenPublicInvitation?: () => void;
}

const CATEGORIES: ('Semua' | ThemeCategory)[] = [
  'Semua',
  'Tradisional & Nusantara',
  'Modern & Luxury',
  'Floral & Romantic',
  'Minimalist & Editorial'
];

export const ThemeTemplatesTab: React.FC<ThemeTemplatesTabProps> = ({
  settings,
  onRefresh,
  onOpenPublicInvitation
}) => {
  const { updateSettingsDirectly } = useRealtime();
  const { user } = useAuth();
  const currentThemeId: ThemeTemplateId = settings?.themeTemplateId || 'royal-javanese-gold';
  const activeTheme = getThemeById(currentThemeId);

  const [selectedCategory, setSelectedCategory] = useState<'Semua' | ThemeCategory>('Semua');
  const [applyingId, setApplyingId] = useState<ThemeTemplateId | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [previewModalTheme, setPreviewModalTheme] = useState<WeddingThemeTemplate | null>(null);

  const groomName = settings?.groom?.nickname || 'Rizky';
  const brideName = settings?.bride?.nickname || 'Siti';
  const coupleDisplay = `${groomName} & ${brideName}`;
  const activeSlug =
    (!user?.isOwner && user?.weddingSlug ? sanitizeSlug(user.weddingSlug) : null) ||
    settings?.slug ||
    generateWeddingSlug(groomName, brideName) ||
    'rizky_dan_siti';

  const filteredThemes =
    selectedCategory === 'Semua'
      ? WEDDING_THEME_TEMPLATES
      : WEDDING_THEME_TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleApplyTheme = async (theme: WeddingThemeTemplate) => {
    if (!settings) return;
    setApplyingId(theme.id);
    setSuccessBanner(null);

    const updated: WeddingSettings = {
      ...settings,
      slug: activeSlug,
      themeTemplateId: theme.id
    };

    // Immediately update state and local cache so theme persists
    updateSettingsDirectly(updated);

    try {
      const res = await fetch('/api/superadmin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updated,
          slug: activeSlug,
          oldSlug: settings.slug
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          updateSettingsDirectly(data.settings);
        }
      }
      setSuccessBanner(
        `Tema "${theme.number}. ${theme.name}" berhasil diterapkan ke undangan ${coupleDisplay}!`
      );
      onRefresh();
      if (previewModalTheme) {
        setPreviewModalTheme(null);
      }
      setTimeout(() => setSuccessBanner(null), 5000);
    } catch (err) {
      console.error('Failed to apply theme template:', err);
      setSuccessBanner(
        `Tema "${theme.number}. ${theme.name}" berhasil diterapkan ke undangan ${coupleDisplay}!`
      );
      if (previewModalTheme) {
        setPreviewModalTheme(null);
      }
      setTimeout(() => setSuccessBanner(null), 5000);
    } finally {
      setApplyingId(null);
    }
  };

  const getFrameBorderRadius = (style: WeddingThemeTemplate['photoFrameStyle']) => {
    switch (style) {
      case 'arch-frame':
        return 'rounded-t-full rounded-b-2xl';
      case 'rounded-luxury':
        return 'rounded-2xl';
      case 'classic-oval':
        return 'rounded-[45%]';
      default:
        return 'rounded-full border-dashed';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
              <Palette className="w-4 h-4 text-amber-700" />
              <span>Galeri Tema Desain Website ({WEDDING_THEME_TEMPLATES.length} Pilihan Eksklusif)</span>
            </div>
            <h2 className="font-serif-wedding text-2xl sm:text-4xl font-bold text-stone-900">
              Pilih Tema Desain Undangan {coupleDisplay}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
              Pilih salah satu dari <strong>{WEDDING_THEME_TEMPLATES.length} template desain website</strong> di bawah ini. Perubahan warna sampul, tipografi, kartu acara, bingkai foto mempelai, hingga tombol aksi akan langsung diterapkan secara <em>real-time</em> ke URL undangan <strong>/#/{activeSlug}</strong>.
            </p>
          </div>

          {/* Active Theme Summary Box */}
          <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0 border border-white/20"
                style={{ background: activeTheme.palette.buttonBg }}
              >
                {activeTheme.number}
              </div>
              <div>
                <span className="text-[11px] text-stone-500 font-medium block">
                  Tema Aktif Saat Ini:
                </span>
                <strong className="text-sm font-bold text-stone-900 block">
                  {activeTheme.name}
                </strong>
                <div className="flex items-center gap-1.5 mt-1">
                  {activeTheme.palette.swatchColors.map((hex, i) => (
                    <span
                      key={i}
                      className="w-3.5 h-3.5 rounded-full border border-stone-300"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                  <span className="text-[11px] text-stone-500 ml-1">
                    {activeTheme.category}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200">
              {onOpenPublicInvitation ? (
                <button
                  type="button"
                  onClick={onOpenPublicInvitation}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-white" />
                  <span className="text-white">Lihat Hasil di Undangan</span>
                </button>
              ) : (
                <a
                  href={getFullInvitationUrl(activeSlug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-white" />
                  <span className="text-white">Buka Undangan</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Category Filter Bar */}
        <div className="mt-6 pt-5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
            {CATEGORIES.map((cat) => {
              const count =
                cat === 'Semua'
                  ? WEDDING_THEME_TEMPLATES.length
                  : WEDDING_THEME_TEMPLATES.filter((t) => t.category === cat).length;
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-stone-900 shadow-2xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          <span className="text-xs text-stone-500">
            Menampilkan <strong>{filteredThemes.length}</strong> dari{' '}
            <strong>{WEDDING_THEME_TEMPLATES.length}</strong> template desain
          </span>
        </div>
      </div>

      {/* Toast Notification */}
      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 12 Themes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredThemes.map((theme) => {
          const isSelected = theme.id === currentThemeId;
          const isApplying = applyingId === theme.id;

          return (
            <div
              key={theme.id}
              className={`bg-white rounded-3xl overflow-hidden transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-2 border-amber-500 ring-4 ring-amber-500/15 shadow-lg'
                  : 'border border-stone-200/90 hover:border-stone-300 shadow-xs'
              }`}
            >
              <div>
                {/* Visual Miniature Preview Split (Cover + Hero) */}
                <div className="grid grid-cols-12 h-44 overflow-hidden border-b border-stone-100">
                  {/* Left: Cover Envelope Mockup (5 cols) */}
                  <div
                    className="col-span-5 p-3 flex flex-col items-center justify-between text-center relative"
                    style={{ backgroundColor: theme.palette.coverBg }}
                  >
                    <div
                      className="absolute inset-1.5 border rounded-lg pointer-events-none opacity-30"
                      style={{ borderColor: theme.palette.accentBorder }}
                    />
                    <span className="text-[8px] tracking-widest uppercase text-stone-300 mt-1">
                      Sampul
                    </span>
                    <div className="my-auto">
                      <p className="font-script-wedding text-lg text-white leading-tight">
                        {groomName} &amp; {brideName}
                      </p>
                      <div className="mt-1.5 px-2 py-1 rounded bg-black/35 border border-white/15 text-[8px] text-stone-200">
                        Kepada Yth. Tamu
                      </div>
                    </div>
                    <span
                      className="w-full py-1 px-2 rounded-full text-[8px] font-bold text-white flex items-center justify-center gap-1 shadow-xs"
                      style={{ background: theme.palette.buttonBg }}
                    >
                      <MailOpen className="w-2.5 h-2.5 text-white" />
                      <span>Buka Undangan</span>
                    </span>
                  </div>

                  {/* Right: Hero & Couple Preview (7 cols) */}
                  <div
                    className="col-span-7 p-3 flex flex-col items-center justify-between text-center relative"
                    style={{ backgroundColor: theme.palette.heroBg }}
                  >
                    <span
                      className="text-[8px] uppercase tracking-wider font-semibold"
                      style={{ color: theme.palette.primary }}
                    >
                      The Wedding Of
                    </span>

                    <div className="my-auto flex flex-col items-center">
                      <p
                        className="font-script-wedding text-2xl leading-none"
                        style={{ color: theme.palette.headingText }}
                      >
                        {groomName} &amp; {brideName}
                      </p>

                      {/* Couple Frame Style Indicator */}
                      <div className="flex items-center gap-2 mt-2">
                        <div
                          className={`w-7 h-7 border-2 flex items-center justify-center text-[9px] font-bold ${getFrameBorderRadius(
                            theme.photoFrameStyle
                          )}`}
                          style={{
                            borderColor: theme.palette.primary,
                            backgroundColor: theme.palette.accentSoftBg,
                            color: theme.palette.headingText
                          }}
                        >
                          {groomName.charAt(0)}
                        </div>
                        <Heart
                          className="w-3 h-3"
                          style={{
                            color: theme.palette.primary,
                            fill: theme.palette.primary
                          }}
                        />
                        <div
                          className={`w-7 h-7 border-2 flex items-center justify-center text-[9px] font-bold ${getFrameBorderRadius(
                            theme.photoFrameStyle
                          )}`}
                          style={{
                            borderColor: theme.palette.primary,
                            backgroundColor: theme.palette.accentSoftBg,
                            color: theme.palette.headingText
                          }}
                        >
                          {brideName.charAt(0)}
                        </div>
                      </div>
                    </div>

                    {/* Mini Countdown Boxes */}
                    <div className="grid grid-cols-4 gap-1 w-full">
                      {['12', '08', '45', '30'].map((val, idx) => (
                        <div
                          key={idx}
                          className="py-1 rounded border text-center bg-white"
                          style={{ borderColor: theme.palette.accentBorder }}
                        >
                          <span
                            className="text-[9px] font-bold font-mono block leading-none"
                            style={{ color: theme.palette.headingText }}
                          >
                            {val}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-stone-500">
                        <span className="font-mono font-bold text-stone-700">
                          {theme.number}.
                        </span>
                        <span>{theme.category}</span>
                      </div>
                      <h3 className="font-serif-wedding text-xl font-bold text-stone-900 mt-0.5">
                        {theme.name}
                      </h3>
                    </div>

                    {isSelected && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold shrink-0">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Aktif</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed">
                    {theme.description}
                  </p>

                  {/* Color Palette Swatches & Motif Info */}
                  <div className="pt-2 flex items-center justify-between border-t border-stone-100 text-xs text-stone-500">
                    <div className="flex items-center gap-1.5">
                      {theme.palette.swatchColors.map((hex, idx) => (
                        <span
                          key={idx}
                          className="w-4 h-4 rounded-full border border-stone-300 shadow-2xs"
                          style={{ backgroundColor: hex }}
                          title={`Warna ${hex}`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-stone-500 truncate max-w-[160px]">
                      {theme.motifLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Action Footer */}
              <div className="px-5 pb-5 pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewModalTheme(theme)}
                  className="px-3 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Pratinjau</span>
                </button>

                <button
                  type="button"
                  disabled={isSelected || isApplying}
                  onClick={() => handleApplyTheme(theme)}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'text-white hover:opacity-95 shadow-xs'
                  }`}
                  style={
                    isSelected
                      ? undefined
                      : { background: theme.palette.buttonBg }
                  }
                >
                  {isApplying ? (
                    <span className="text-white">Menerapkan...</span>
                  ) : isSelected ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span className="text-white">Tema Sedang Digunakan</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                      <span className="text-white">Gunakan Tema Ini</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Interactive Preview Modal */}
      {previewModalTheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-stone-200 my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between gap-4">
              <div>
                <span className="text-[11px] text-amber-300 font-semibold">
                  Pratinjau Desain Tema #{previewModalTheme.number} • {previewModalTheme.category}
                </span>
                <h3 className="font-serif-wedding text-xl sm:text-2xl font-bold text-white">
                  {previewModalTheme.name} — {coupleDisplay}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalTheme(null)}
                className="p-2 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Side-by-side Live Simulation */}
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Simulated Cover Overlay */}
              <div
                className="p-8 flex flex-col items-center justify-center text-center min-h-[360px] relative"
                style={{ backgroundColor: previewModalTheme.palette.coverBg }}
              >
                <div
                  className="absolute inset-4 border rounded-2xl pointer-events-none opacity-30"
                  style={{ borderColor: previewModalTheme.palette.accentBorder }}
                />
                <span className="text-[10px] tracking-[0.25em] uppercase text-stone-300 mb-2">
                  The Wedding Celebration Of
                </span>
                <h4 className="font-script-wedding text-5xl text-white my-2">
                  {groomName} &amp; {brideName}
                </h4>
                <p className="text-xs text-stone-300 tracking-widest uppercase mb-5">
                  Sabtu, 24 Oktober 2026
                </p>
                <div className="w-full max-w-xs bg-black/40 backdrop-blur-xs border border-white/20 rounded-2xl p-4 mb-5">
                  <p className="text-[10px] uppercase tracking-wider text-stone-300 mb-1">
                    Kepada Yth. Bapak/Ibu/Saudara/i
                  </p>
                  <p className="font-serif-wedding text-lg font-bold text-white">
                    Tamu Kehormatan
                  </p>
                </div>
                <span
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-white shadow-lg border border-white/40"
                  style={{ background: previewModalTheme.palette.buttonBg }}
                >
                  <MailOpen className="w-4 h-4 text-white" />
                  <span>Buka Undangan</span>
                  <Heart className="w-3.5 h-3.5 text-white fill-white" />
                </span>
              </div>

              {/* Simulated Hero & Couple Section */}
              <div
                className="p-8 flex flex-col items-center justify-center text-center min-h-[360px]"
                style={{ backgroundColor: previewModalTheme.palette.heroBg }}
              >
                <span
                  className="text-[11px] uppercase tracking-[0.25em] font-semibold mb-2"
                  style={{ color: previewModalTheme.palette.primary }}
                >
                  {previewModalTheme.motifLabel}
                </span>
                <h4
                  className="font-script-wedding text-5xl my-1"
                  style={{ color: previewModalTheme.palette.headingText }}
                >
                  {groomName} &amp; {brideName}
                </h4>
                <p
                  className="text-xs italic mb-5 max-w-xs"
                  style={{ color: previewModalTheme.palette.bodyText }}
                >
                  Kami mengundang Bapak/Ibu/Saudara/i untuk hadir di hari bahagia kami
                </p>

                {/* Simulated Quote Card */}
                <div
                  className="w-full max-w-xs rounded-2xl p-4 border mb-5 text-xs"
                  style={{
                    backgroundColor: previewModalTheme.palette.accentSoftBg,
                    borderColor: previewModalTheme.palette.accentBorder,
                    color: previewModalTheme.palette.headingText
                  }}
                >
                  <p className="font-serif-wedding italic text-sm">
                    "Semoga menjadi keluarga yang sakinah, mawaddah, wa rahmah."
                  </p>
                </div>

                <span
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white shadow-sm"
                  style={{ background: previewModalTheme.palette.buttonBg }}
                >
                  <Calendar className="w-3.5 h-3.5 text-white" />
                  <span>Simpan ke Kalender</span>
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-stone-600">
                <strong>{previewModalTheme.name}</strong>: {previewModalTheme.tagline}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setPreviewModalTheme(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-200/70 cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTheme(previewModalTheme)}
                  disabled={applyingId === previewModalTheme.id}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer shadow-sm"
                  style={{ background: previewModalTheme.palette.buttonBg }}
                >
                  {applyingId === previewModalTheme.id
                    ? 'Menerapkan...'
                    : `Terapkan Tema "${previewModalTheme.name}"`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
