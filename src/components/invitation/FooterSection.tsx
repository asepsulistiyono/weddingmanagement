import React from 'react';
import { Heart, ShieldCheck } from 'lucide-react';
import type { WeddingSettings } from '../../types.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { getTranslatedInvitationFormat } from '../../utils/religionPresets.ts';
import { getThemeById } from '../../utils/themeTemplates.ts';

interface FooterSectionProps {
  settings: WeddingSettings | null;
  onOpenLogin: () => void;
  onOpenAdmin: () => void;
  isAuthenticated: boolean;
}

export const FooterSection: React.FC<FooterSectionProps> = ({
  settings,
  onOpenLogin,
  onOpenAdmin,
  isAuthenticated
}) => {
  const { t, lang } = useLanguage();
  const format = getTranslatedInvitationFormat(settings?.invitationFormat, lang);
  const coupleName = settings ? (settings.coupleNames || `${settings.groom.fullName} & ${settings.bride.fullName}`) : 'Muhammad Rizky & Siti Nurhaliza';
  const activeTheme = getThemeById(settings?.themeTemplateId);

  return (
    <footer
      style={{ backgroundColor: activeTheme.palette.footerBg }}
      className="text-stone-300 py-16 px-4 text-center border-t border-stone-800 transition-colors duration-500"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <p className="font-serif-wedding text-3xl sm:text-4xl text-amber-200">
          {coupleName}
        </p>

        {format.closingBlessing ? (
          <p className="text-xs sm:text-sm text-stone-400 max-w-lg mx-auto leading-relaxed">
            {format.closingBlessing}
          </p>
        ) : (
          <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto leading-relaxed">
            {t.footer.thankYou}
          </p>
        )}

        {format.closingGreeting && (
          <p className="font-serif-wedding text-base sm:text-lg text-amber-200/90 font-medium tracking-wide">
            {format.closingGreeting}
          </p>
        )}

        <div className="flex items-center justify-center gap-1.5 text-xs text-stone-400">
          <span>{t.footer.withJoy},</span>
        </div>
        <p className="text-sm font-semibold text-stone-200">
          {t.footer.bigFamily}
        </p>

        <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-4">
          <p>© 2026 The Wedding of {settings?.groom.nickname || 'Rizky'} &amp; {settings?.bride.nickname || 'Siti'}. {t.footer.allRights}</p>

          <div>
            {isAuthenticated ? (
              <button
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t.footer.openAdmin}</span>
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 text-stone-400 hover:text-stone-300 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t.footer.adminLogin}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
