import React, { useState, useEffect } from 'react';
import { 
  Save, 
  BellRing, 
  Send, 
  Heart, 
  Calendar, 
  CreditCard, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  Check,
  RotateCcw,
  Eye,
  Sliders,
  HelpCircle,
  Upload,
  Zap,
  Loader2,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  Globe,
  Palette
} from 'lucide-react';
import type { WeddingSettings, ReligionFormat, ThemeTemplateId } from '../../types.ts';
import { RELIGION_PRESETS, RELIGION_LIST, type ReligionPresetDetail } from '../../utils/religionPresets.ts';
import { WEDDING_THEME_TEMPLATES, getThemeById } from '../../utils/themeTemplates.ts';
import { compressImageFile, formatFileSize } from '../../utils/imageCompressor.ts';
import { generateWeddingSlug, sanitizeSlug, getFullInvitationUrl } from '../../utils/slugHelper.ts';
import { useAuth, saveCachedAdminUser } from '../../context/AuthContext.tsx';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { syncSettingsToSupabaseClient, syncUserToSupabaseClient } from '../../lib/supabase.ts';

interface SettingsTabProps {
  settings: WeddingSettings | null;
  onRefresh: () => void;
  onOpenPublicInvitation?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onRefresh,
  onOpenPublicInvitation
}) => {
  const { user } = useAuth();
  const { updateSettingsDirectly } = useRealtime();
  // Announcement state
  const [announcementMsg, setAnnouncementMsg] = useState(settings?.announcement?.message || '');
  const [announcementActive, setAnnouncementActive] = useState(settings?.announcement?.active || false);
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [announcementToast, setAnnouncementToast] = useState(false);

  // Religion / Invitation Format state
  const initialReligion: ReligionFormat = settings?.religionFormat || settings?.invitationFormat?.religion || 'islam';
  const [selectedReligion, setSelectedReligion] = useState<ReligionFormat>(initialReligion);

  // Website Design Theme state (12 templates)
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeTemplateId>(
    settings?.themeTemplateId || 'royal-javanese-gold'
  );
  const activeThemeObj = getThemeById(selectedThemeId);

  const [openingGreeting, setOpeningGreeting] = useState(
    settings?.invitationFormat?.openingGreeting || RELIGION_PRESETS[initialReligion]?.config.openingGreeting || "Assalamu'alaikum Warahmatullahi Wabarakatuh"
  );
  const [openingSubtext, setOpeningSubtext] = useState(
    settings?.invitationFormat?.openingSubtext || RELIGION_PRESETS[initialReligion]?.config.openingSubtext || ''
  );
  const [verseLabel, setVerseLabel] = useState(
    settings?.invitationFormat?.holyVerse?.label || RELIGION_PRESETS[initialReligion]?.config.holyVerse.label || "Ayat Suci Al-Qur'an"
  );
  const [verseText, setVerseText] = useState(
    settings?.invitationFormat?.holyVerse?.text || settings?.quote?.text || RELIGION_PRESETS[initialReligion]?.config.holyVerse.text || ''
  );
  const [verseSource, setVerseSource] = useState(
    settings?.invitationFormat?.holyVerse?.source || settings?.quote?.source || RELIGION_PRESETS[initialReligion]?.config.holyVerse.source || ''
  );
  const [ceremonyName, setCeremonyName] = useState(
    settings?.invitationFormat?.ceremonyName || settings?.events[0]?.name || RELIGION_PRESETS[initialReligion]?.config.ceremonyName || 'Akad Nikah'
  );
  const [receptionName, setReceptionName] = useState(
    settings?.invitationFormat?.receptionName || settings?.events[1]?.name || RELIGION_PRESETS[initialReligion]?.config.receptionName || 'Resepsi Pernikahan'
  );
  const [closingGreeting, setClosingGreeting] = useState(
    settings?.invitationFormat?.closingGreeting || RELIGION_PRESETS[initialReligion]?.config.closingGreeting || "Wassalamu'alaikum Warahmatullahi Wabarakatuh"
  );
  const [closingBlessing, setClosingBlessing] = useState(
    settings?.invitationFormat?.closingBlessing || RELIGION_PRESETS[initialReligion]?.config.closingBlessing || ''
  );
  const [presetNotice, setPresetNotice] = useState<string | null>(null);
  const [formatActiveTab, setFormatActiveTab] = useState<'editor' | 'preview'>('editor');

  // Form states
  const [groomName, setGroomName] = useState(settings?.groom.fullName || '');
  const [groomNick, setGroomNick] = useState(settings?.groom.nickname || '');
  const [groomFather, setGroomFather] = useState(settings?.groom.fatherName || '');
  const [groomMother, setGroomMother] = useState(settings?.groom.motherName || '');
  const [groomPhoto, setGroomPhoto] = useState(settings?.groom.photoUrl || '');
  const [groomIg, setGroomIg] = useState(settings?.groom.instagram || '');
  const [groomBio, setGroomBio] = useState(settings?.groom.bio || '');

  const [brideName, setBrideName] = useState(settings?.bride.fullName || '');
  const [brideNick, setBrideNick] = useState(settings?.bride.nickname || '');
  const [brideFather, setBrideFather] = useState(settings?.bride.fatherName || '');
  const [brideMother, setBrideMother] = useState(settings?.bride.motherName || '');
  const [bridePhoto, setBridePhoto] = useState(settings?.bride.photoUrl || '');
  const [brideIg, setBrideIg] = useState(settings?.bride.instagram || '');
  const [brideBio, setBrideBio] = useState(settings?.bride.bio || '');

  const [countdownDate, setCountdownDate] = useState(settings?.countdownDate || '2026-10-24T08:00:00');

  const [akadDate, setAkadDate] = useState(settings?.events[0]?.date || 'Sabtu, 24 Oktober 2026');
  const [akadVenue, setAkadVenue] = useState(settings?.events[0]?.location || '');
  const [akadAddress, setAkadAddress] = useState(settings?.events[0]?.address || '');
  const [akadTime, setAkadTime] = useState(settings?.events[0]?.time || '');
  const [akadMapUrl, setAkadMapUrl] = useState(settings?.events[0]?.mapUrl || '');

  const [resepsiDate, setResepsiDate] = useState(settings?.events[1]?.date || 'Sabtu, 24 Oktober 2026');
  const [resepsiVenue, setResepsiVenue] = useState(settings?.events[1]?.location || '');
  const [resepsiAddress, setResepsiAddress] = useState(settings?.events[1]?.address || '');
  const [resepsiTime, setResepsiTime] = useState(settings?.events[1]?.time || '');
  const [resepsiMapUrl, setResepsiMapUrl] = useState(settings?.events[1]?.mapUrl || '');

  const [bank1BankName, setBank1BankName] = useState(settings?.bankAccounts[0]?.bank || 'Bank Central Asia (BCA)');
  const [bank1Num, setBank1Num] = useState(settings?.bankAccounts[0]?.accountNumber || '');
  const [bank1Name, setBank1Name] = useState(settings?.bankAccounts[0]?.accountName || '');
  const [bank2BankName, setBank2BankName] = useState(settings?.bankAccounts[1]?.bank || 'Bank Mandiri');
  const [bank2Num, setBank2Num] = useState(settings?.bankAccounts[1]?.accountNumber || '');
  const [bank2Name, setBank2Name] = useState(settings?.bankAccounts[1]?.accountName || '');

  const [giftRecipient, setGiftRecipient] = useState(settings?.giftAddress.recipient || '');
  const [giftPhone, setGiftPhone] = useState(settings?.giftAddress.phone || '');
  const [giftAddress, setGiftAddress] = useState(settings?.giftAddress.address || '');

  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Wedding custom URL slug states
  const [weddingSlug, setWeddingSlug] = useState(
    user?.weddingSlug ||
      settings?.slug ||
      (settings?.groom?.nickname && settings?.bride?.nickname
        ? generateWeddingSlug(settings.groom.nickname, settings.bride.nickname)
        : 'romeo_dan_juliet')
  );
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const settingsSignature = settings
    ? JSON.stringify({
        slug: settings.slug,
        coupleNames: settings.coupleNames,
        groom: settings.groom,
        bride: settings.bride,
        events: settings.events,
        countdownDate: settings.countdownDate,
        themeTemplateId: settings.themeTemplateId,
        religionFormat: settings.religionFormat,
        invitationFormat: settings.invitationFormat,
        quote: settings.quote,
        bankAccounts: settings.bankAccounts,
        giftAddress: settings.giftAddress,
        announcement: settings.announcement,
      })
    : '';

  // Sync form states whenever settings for the active wedding slug arrive or change from server
  useEffect(() => {
    if (!settings) return;
    // Do not overwrite while user is actively typing in an input/textarea on this device
    const activeEl = document.activeElement;
    const isTypingInForm =
      activeEl &&
      (activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT');
    if (isTypingInForm && saveLoading === false) {
      return;
    }
    // If logged in as a specific couple's Super Admin, ignore stale default settings from another slug
    const userSlug = !user?.isOwner && user?.weddingSlug ? sanitizeSlug(user.weddingSlug) : null;
    if (userSlug && settings.slug && sanitizeSlug(settings.slug) !== userSlug) {
      onRefresh();
      return;
    }

    setAnnouncementMsg(settings.announcement?.message || '');
    setAnnouncementActive(Boolean(settings.announcement?.active));
    const rel: ReligionFormat = settings.religionFormat || settings.invitationFormat?.religion || 'islam';
    setSelectedReligion(rel);
    setSelectedThemeId(settings.themeTemplateId || 'royal-javanese-gold');
    setOpeningGreeting(
      settings.invitationFormat?.openingGreeting ||
        RELIGION_PRESETS[rel]?.config.openingGreeting ||
        "Assalamu'alaikum Warahmatullahi Wabarakatuh"
    );
    setOpeningSubtext(
      settings.invitationFormat?.openingSubtext ||
        RELIGION_PRESETS[rel]?.config.openingSubtext ||
        ''
    );
    setVerseLabel(
      settings.invitationFormat?.holyVerse?.label ||
        RELIGION_PRESETS[rel]?.config.holyVerse.label ||
        "Ayat Suci Al-Qur'an"
    );
    setVerseText(
      settings.invitationFormat?.holyVerse?.text ||
        settings.quote?.text ||
        RELIGION_PRESETS[rel]?.config.holyVerse.text ||
        ''
    );
    setVerseSource(
      settings.invitationFormat?.holyVerse?.source ||
        settings.quote?.source ||
        RELIGION_PRESETS[rel]?.config.holyVerse.source ||
        ''
    );
    setCeremonyName(
      settings.invitationFormat?.ceremonyName ||
        settings.events?.[0]?.name ||
        RELIGION_PRESETS[rel]?.config.ceremonyName ||
        'Akad Nikah'
    );
    setReceptionName(
      settings.invitationFormat?.receptionName ||
        settings.events?.[1]?.name ||
        RELIGION_PRESETS[rel]?.config.receptionName ||
        'Resepsi Pernikahan'
    );
    setClosingGreeting(
      settings.invitationFormat?.closingGreeting ||
        RELIGION_PRESETS[rel]?.config.closingGreeting ||
        "Wassalamu'alaikum Warahmatullahi Wabarakatuh"
    );
    setClosingBlessing(
      settings.invitationFormat?.closingBlessing ||
        RELIGION_PRESETS[rel]?.config.closingBlessing ||
        ''
    );
    setGroomName(settings.groom?.fullName || '');
    setGroomNick(settings.groom?.nickname || '');
    setGroomFather(settings.groom?.fatherName || '');
    setGroomMother(settings.groom?.motherName || '');
    setGroomPhoto(settings.groom?.photoUrl || '');
    setGroomIg(settings.groom?.instagram || '');
    setGroomBio(settings.groom?.bio || '');

    setBrideName(settings.bride?.fullName || '');
    setBrideNick(settings.bride?.nickname || '');
    setBrideFather(settings.bride?.fatherName || '');
    setBrideMother(settings.bride?.motherName || '');
    setBridePhoto(settings.bride?.photoUrl || '');
    setBrideIg(settings.bride?.instagram || '');
    setBrideBio(settings.bride?.bio || '');

    setCountdownDate(settings.countdownDate || '2026-10-24T08:00:00');

    setAkadDate(settings.events?.[0]?.date || 'Sabtu, 24 Oktober 2026');
    setAkadVenue(settings.events?.[0]?.location || '');
    setAkadAddress(settings.events?.[0]?.address || '');
    setAkadTime(settings.events?.[0]?.time || '');
    setAkadMapUrl(settings.events?.[0]?.mapUrl || '');

    setResepsiDate(settings.events?.[1]?.date || 'Sabtu, 24 Oktober 2026');
    setResepsiVenue(settings.events?.[1]?.location || '');
    setResepsiAddress(settings.events?.[1]?.address || '');
    setResepsiTime(settings.events?.[1]?.time || '');
    setResepsiMapUrl(settings.events?.[1]?.mapUrl || '');

    setBank1BankName(settings.bankAccounts?.[0]?.bank || 'Bank Central Asia (BCA)');
    setBank1Num(settings.bankAccounts?.[0]?.accountNumber || '');
    setBank1Name(settings.bankAccounts?.[0]?.accountName || '');
    setBank2BankName(settings.bankAccounts?.[1]?.bank || 'Bank Mandiri');
    setBank2Num(settings.bankAccounts?.[1]?.accountNumber || '');
    setBank2Name(settings.bankAccounts?.[1]?.accountName || '');

    setGiftRecipient(settings.giftAddress?.recipient || '');
    setGiftPhone(settings.giftAddress?.phone || '');
    setGiftAddress(settings.giftAddress?.address || '');

    if (settings.slug) {
      setWeddingSlug(settings.slug);
    } else if (userSlug) {
      setWeddingSlug(userSlug);
    }
  }, [settingsSignature, user?.weddingSlug, user?.isOwner]);

  useEffect(() => {
    if (settings?.themeTemplateId) {
      setSelectedThemeId(settings.themeTemplateId);
    }
  }, [settings?.themeTemplateId]);

  const extractFirstNickname = (fullNameVal: string): string => {
    const cleaned = fullNameVal
      .replace(/(?:^|\s)(?:bpk|ibu|mas|mbak|dr|dra|drs|ir|prof|h|hj)\.?\s+/gi, ' ')
      .replace(/,\s*.*$/, '')
      .trim();
    return cleaned.split(/\s+/)[0] || fullNameVal.trim();
  };

  const handleGroomNameChange = (val: string) => {
    const prevFirst = extractFirstNickname(groomName).toLowerCase();
    const curNickLower = groomNick.trim().toLowerCase();
    setGroomName(val);
    const shouldAutoNick =
      !curNickLower ||
      curNickLower === groomName.trim().toLowerCase() ||
      curNickLower === prevFirst ||
      curNickLower === 'rizky';
    const nextNick = shouldAutoNick ? extractFirstNickname(val) : groomNick;
    if (shouldAutoNick) {
      setGroomNick(nextNick);
    }
    if (!isSlugManual && (nextNick || brideNick)) {
      setWeddingSlug(generateWeddingSlug(nextNick || val, brideNick || brideName));
    }
  };

  const handleBrideNameChange = (val: string) => {
    const prevFirst = extractFirstNickname(brideName).toLowerCase();
    const curNickLower = brideNick.trim().toLowerCase();
    setBrideName(val);
    const shouldAutoNick =
      !curNickLower ||
      curNickLower === brideName.trim().toLowerCase() ||
      curNickLower === prevFirst ||
      curNickLower === 'siti';
    const nextNick = shouldAutoNick ? extractFirstNickname(val) : brideNick;
    if (shouldAutoNick) {
      setBrideNick(nextNick);
    }
    if (!isSlugManual && (groomNick || nextNick)) {
      setWeddingSlug(generateWeddingSlug(groomNick || groomName, nextNick || val));
    }
  };

  const handleGroomNickChange = (val: string) => {
    const prevNick = groomNick.trim();
    setGroomNick(val);
    if (
      !groomName.trim() ||
      groomName.trim() === prevNick ||
      (groomName.trim() === 'Rizky Pratama Putra, S.T.' && !val.trim().toLowerCase().startsWith('rizky'))
    ) {
      setGroomName(val);
    }
    if (!isSlugManual) {
      setWeddingSlug(generateWeddingSlug(val, brideNick));
    }
  };

  const handleBrideNickChange = (val: string) => {
    const prevNick = brideNick.trim();
    setBrideNick(val);
    if (
      !brideName.trim() ||
      brideName.trim() === prevNick ||
      (brideName.trim() === 'Siti Nurhaliza Putri, S.Psi.' && !val.trim().toLowerCase().startsWith('siti'))
    ) {
      setBrideName(val);
    }
    if (!isSlugManual) {
      setWeddingSlug(generateWeddingSlug(groomNick, val));
    }
  };

  const handleCopyLink = () => {
    const url = getFullInvitationUrl(weddingSlug);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Profile photo compression state
  const [groomCompLoading, setGroomCompLoading] = useState(false);
  const [groomCompInfo, setGroomCompInfo] = useState<string | null>(null);
  const [brideCompLoading, setBrideCompLoading] = useState(false);
  const [brideCompInfo, setBrideCompInfo] = useState<string | null>(null);

  const handleCompressGroomPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGroomCompLoading(true);
    setGroomCompInfo(null);
    try {
      const res = await compressImageFile(file, { maxWidth: 900, maxHeight: 900, quality: 0.68 });
      setGroomPhoto(res.dataUrl);
      setGroomCompInfo(`WebP ${formatFileSize(res.compressedSize)} (Hemat ${res.savedPercentage}%)`);
    } catch (err: any) {
      setSaveError('Gagal mengompres foto: ' + (err?.message || 'Kesalahan file'));
    } finally {
      setGroomCompLoading(false);
    }
  };

  const handleCompressBridePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBrideCompLoading(true);
    setBrideCompInfo(null);
    try {
      const res = await compressImageFile(file, { maxWidth: 900, maxHeight: 900, quality: 0.68 });
      setBridePhoto(res.dataUrl);
      setBrideCompInfo(`WebP ${formatFileSize(res.compressedSize)} (Hemat ${res.savedPercentage}%)`);
    } catch (err: any) {
      setSaveError('Gagal mengompres foto: ' + (err?.message || 'Kesalahan file'));
    } finally {
      setBrideCompLoading(false);
    }
  };

  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnnouncementLoading(true);
    const activeSlug = weddingSlug || user?.weddingSlug || settings?.slug || 'rizky_dan_siti';
    try {
      const res = await fetch('/api/superadmin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: activeSlug,
          message: announcementMsg,
          active: announcementActive
        })
      });
      if (res.ok) {
        if (settings) {
          updateSettingsDirectly({
            ...settings,
            announcement: announcementActive && announcementMsg
              ? {
                  id: `ann-${Date.now()}`,
                  message: announcementMsg,
                  active: true,
                  createdAt: new Date().toISOString()
                }
              : null
          });
        }
        setAnnouncementToast(true);
        setTimeout(() => setAnnouncementToast(false), 3500);
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to broadcast announcement:', err);
    } finally {
      setAnnouncementLoading(false);
    }
  };

  const handleApplyPreset = (religionId: ReligionFormat) => {
    setSelectedReligion(religionId);
    const preset = RELIGION_PRESETS[religionId];
    if (!preset) return;
    setOpeningGreeting(preset.config.openingGreeting);
    setOpeningSubtext(preset.config.openingSubtext || '');
    setVerseLabel(preset.config.holyVerse.label);
    setVerseText(preset.config.holyVerse.text);
    setVerseSource(preset.config.holyVerse.source);
    setCeremonyName(preset.config.ceremonyName);
    setReceptionName(preset.config.receptionName);
    setClosingGreeting(preset.config.closingGreeting);
    setClosingBlessing(preset.config.closingBlessing || '');
    setPresetNotice(`Template ${preset.name} (${preset.badge}) berhasil diterapkan!`);
    setTimeout(() => setPresetNotice(null), 3500);
  };

  const handleSaveAllSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setSaveLoading(true);
    setSaveSuccess(false);
    setSaveError(null);

    const rawGroomName = groomName.trim();
    const rawBrideName = brideName.trim();
    const rawGroomNick = groomNick.trim();
    const rawBrideNick = brideNick.trim();

    const resolvedGroomNick =
      rawGroomNick && !(rawGroomNick.toLowerCase() === 'rizky' && rawGroomName && !rawGroomName.toLowerCase().startsWith('rizky'))
        ? rawGroomNick
        : extractFirstNickname(rawGroomName) || 'Mempelai Pria';

    const resolvedBrideNick =
      rawBrideNick && !(rawBrideNick.toLowerCase() === 'siti' && rawBrideName && !rawBrideName.toLowerCase().startsWith('siti'))
        ? rawBrideNick
        : extractFirstNickname(rawBrideName) || 'Mempelai Wanita';

    const resolvedGroomFull =
      rawGroomName && !(rawGroomName === 'Rizky Pratama Putra, S.T.' && resolvedGroomNick.toLowerCase() !== 'rizky')
        ? rawGroomName
        : resolvedGroomNick;

    const resolvedBrideFull =
      rawBrideName && !(rawBrideName === 'Siti Nurhaliza Putri, S.Psi.' && resolvedBrideNick.toLowerCase() !== 'siti')
        ? rawBrideName
        : resolvedBrideNick;

    const targetSlug = !isSlugManual
      ? generateWeddingSlug(resolvedGroomNick, resolvedBrideNick)
      : weddingSlug
      ? sanitizeSlug(weddingSlug)
      : user?.weddingSlug
      ? sanitizeSlug(user.weddingSlug)
      : generateWeddingSlug(resolvedGroomNick, resolvedBrideNick);
    const coupleDisplay = `${resolvedGroomNick} & ${resolvedBrideNick}`;

    const baseSettings: WeddingSettings = settings || {
      id: targetSlug,
      slug: targetSlug,
      title: `The Wedding of ${coupleDisplay}`,
      coupleNames: coupleDisplay,
      groom: {
        fullName: resolvedGroomFull,
        nickname: resolvedGroomNick,
        fatherName: groomFather,
        motherName: groomMother,
        photoUrl: groomPhoto,
        instagram: groomIg,
        bio: groomBio
      },
      bride: {
        fullName: resolvedBrideFull,
        nickname: resolvedBrideNick,
        fatherName: brideFather,
        motherName: brideMother,
        photoUrl: bridePhoto,
        instagram: brideIg,
        bio: brideBio
      },
      events: [],
      countdownDate,
      quote: { text: verseText, source: verseSource },
      loveStories: [],
      galleries: [],
      bankAccounts: [],
      giftAddress: {
        recipient: giftRecipient,
        phone: giftPhone,
        address: giftAddress
      },
      musicUrl: '',
      announcement: null
    };

    const updated: WeddingSettings = {
      ...baseSettings,
      id: targetSlug,
      slug: targetSlug,
      coupleNames: coupleDisplay,
      title: `The Wedding of ${coupleDisplay}`,
      countdownDate,
      themeTemplateId: selectedThemeId,
      religionFormat: selectedReligion,
      invitationFormat: {
        religion: selectedReligion,
        openingGreeting,
        openingSubtext,
        holyVerse: {
          label: verseLabel,
          text: verseText,
          source: verseSource
        },
        ceremonyName,
        receptionName,
        closingGreeting,
        closingBlessing
      },
      quote: {
        text: verseText,
        source: verseSource
      },
      groom: {
        ...(baseSettings.groom || {}),
        fullName: resolvedGroomFull,
        nickname: resolvedGroomNick,
        fatherName: groomFather,
        motherName: groomMother,
        photoUrl: groomPhoto,
        instagram: groomIg,
        bio: groomBio
      },
      bride: {
        ...(baseSettings.bride || {}),
        fullName: resolvedBrideFull,
        nickname: resolvedBrideNick,
        fatherName: brideFather,
        motherName: brideMother,
        photoUrl: bridePhoto,
        instagram: brideIg,
        bio: brideBio
      },
      events: [
        {
          ...(baseSettings.events?.[0] || { id: 'akad', date: akadDate, mapUrl: akadMapUrl }),
          id: baseSettings.events?.[0]?.id || 'akad',
          name: ceremonyName,
          date: akadDate || 'Sabtu, 24 Oktober 2026',
          location: akadVenue,
          address: akadAddress,
          time: akadTime,
          mapUrl: akadMapUrl || `https://maps.google.com/?q=${encodeURIComponent(`${akadVenue} ${akadAddress}`)}`
        },
        {
          ...(baseSettings.events?.[1] || { id: 'resepsi', date: resepsiDate, mapUrl: resepsiMapUrl }),
          id: baseSettings.events?.[1]?.id || 'resepsi',
          name: receptionName,
          date: resepsiDate || akadDate || 'Sabtu, 24 Oktober 2026',
          location: resepsiVenue,
          address: resepsiAddress,
          time: resepsiTime,
          mapUrl: resepsiMapUrl || `https://maps.google.com/?q=${encodeURIComponent(`${resepsiVenue} ${resepsiAddress}`)}`
        }
      ],
      bankAccounts: [
        {
          id: 'bank-1',
          bank: bank1BankName || 'Bank Central Asia (BCA)',
          accountNumber: bank1Num,
          accountName: bank1Name
        },
        {
          id: 'bank-2',
          bank: bank2BankName || 'Bank Mandiri',
          accountNumber: bank2Num,
          accountName: bank2Name
        }
      ],
      giftAddress: {
        recipient: giftRecipient,
        phone: giftPhone,
        address: giftAddress
      }
    };

    // Immediately apply and cache locally so the Super Admin's changes take effect right away
    setWeddingSlug(targetSlug);
    setGroomName(resolvedGroomFull);
    setGroomNick(resolvedGroomNick);
    setBrideName(resolvedBrideFull);
    setBrideNick(resolvedBrideNick);
    updateSettingsDirectly(updated);
    if (targetSlug) {
      syncSettingsToSupabaseClient(updated, targetSlug).catch(() => {});
      syncSettingsToSupabaseClient(updated, 'main').catch(() => {});
    }
    if (user && !user.isOwner) {
      const updatedUserObj = {
        ...user,
        name: coupleDisplay,
        coupleNames: coupleDisplay,
        weddingSlug: targetSlug
      };
      saveCachedAdminUser(updatedUserObj, false);
      syncUserToSupabaseClient(updatedUserObj).catch(() => {});
      window.dispatchEvent(new Event('admins-updated'));
    }
    if (targetSlug) {
      try {
        sessionStorage.setItem('wedding_active_slug', targetSlug);
        if (window.location.hash !== `#/${targetSlug}`) {
          window.location.hash = `#/${targetSlug}`;
        }
      } catch {
        // ignore
      }
    }

    try {
      const res = await fetch('/api/superadmin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updated,
          slug: targetSlug,
          oldSlug: settings?.slug || user?.weddingSlug,
          adminEmail: user?.username || user?.email
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          updateSettingsDirectly(data.settings, false);
        }
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
      onRefresh();
    } catch (err) {
      console.error('Failed to update settings on server, local cache saved:', err);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-10 relative">
      {/* Floating Save Success Notification Banner */}
      {saveSuccess && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-md bg-emerald-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-400/40 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <div className="text-xs sm:text-sm font-semibold">
            Pengaturan berhasil disimpan! Seluruh perubahan telah diterapkan ke undangan.
          </div>
        </div>
      )}

      {/* Wedding Custom URL Suffix & Public Invitation Card */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-100/40 to-white border-2 border-amber-300 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5 pb-5 border-b border-amber-200/80">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-800 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Globe className="w-6 h-6 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif-wedding text-2xl font-bold text-amber-950">
                  Tautan Publik &amp; URL Undangan Mempelai
                </h3>
                <span className="text-[11px] font-bold bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full">
                  Akhiran URL Khusus
                </span>
              </div>
              <p className="text-xs text-amber-900/80 mt-1 max-w-2xl leading-relaxed">
                URL unik pernikahan Anda berakhiran nama kedua mempelai. Tamu yang membuka URL ini otomatis melihat informasi, foto, dan jadwal khusus pasangan Anda.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-800" />
                  <span>Salin Tautan</span>
                </>
              )}
            </button>

            {onOpenPublicInvitation ? (
              <button
                type="button"
                onClick={onOpenPublicInvitation}
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-amber-300" />
                <span>Buka Undangan</span>
              </button>
            ) : (
              <a
                href={getFullInvitationUrl(weddingSlug)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
              >
                <ExternalLink className="w-4 h-4 text-amber-300" />
                <span>Buka Undangan</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => handleSaveAllSettings()}
              disabled={saveLoading}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saveLoading ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}</span>
            </button>
          </div>
        </div>

        {/* Slug configuration input & live preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-6">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-amber-950 uppercase tracking-wider">
                Kustomisasi Akhiran URL (Slug)
              </label>
              <label className="text-[11px] text-amber-900 flex items-center gap-1.5 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={!isSlugManual}
                  onChange={(e) => {
                    setIsSlugManual(!e.target.checked);
                    if (e.target.checked) {
                      setWeddingSlug(generateWeddingSlug(groomNick || groomName, brideNick || brideName));
                    }
                  }}
                  className="rounded text-amber-700 focus:ring-amber-500 w-3.5 h-3.5"
                />
                <span>Otomatis dari Nama</span>
              </label>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-stone-400 font-bold">
                /#/
              </span>
              <input
                type="text"
                value={weddingSlug}
                onChange={(e) => {
                  setIsSlugManual(true);
                  setWeddingSlug(sanitizeSlug(e.target.value));
                }}
                placeholder="thomas_dan_juwita"
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-xs sm:text-sm font-mono text-amber-950 focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="lg:col-span-6 bg-white/90 border border-amber-200/90 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
              Pratinjau Alamat Lengkap (Dibagikan ke Tamu)
            </span>
            <div className="flex items-center gap-2 font-mono text-xs text-amber-950 break-all bg-amber-50/70 px-3 py-2 rounded-xl border border-amber-200/70">
              <LinkIcon className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="font-semibold text-amber-900">
                {getFullInvitationUrl(weddingSlug)}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Real-Time Live Announcement Broadcast Card */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif-wedding text-2xl font-bold text-amber-950">
              Siaran Pengumuman Real-Time (Live Broadcast)
            </h3>
            <p className="text-xs text-amber-800">
              Pesan ini akan langsung muncul sebagai banner informasi di halaman utama untuk seluruh pengunjung yang sedang membuka website undangan secara bersamaan.
            </p>
          </div>
        </div>

        {announcementToast && (
          <div className="my-3 p-3 bg-emerald-100 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Pengumuman berhasil disiarkan secara real-time ke semua tamu online!</span>
          </div>
        )}

        <form onSubmit={handleBroadcastAnnouncement} className="mt-4 space-y-3">
          <textarea
            rows={2}
            value={announcementMsg}
            onChange={(e) => setAnnouncementMsg(e.target.value)}
            placeholder="Contoh: Info Parkir: Tamu undangan akad & resepsi dapat memarkirkan kendaraan di Basement Gedung B..."
            className="w-full p-3.5 bg-white border border-amber-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-800"
          />

          <div className="flex items-center justify-between flex-wrap gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-amber-950 cursor-pointer">
              <input
                type="checkbox"
                checked={announcementActive}
                onChange={(e) => setAnnouncementActive(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
              />
              <span>Aktifkan Banner Pengumuman di Website</span>
            </label>

            <button
              type="submit"
              disabled={announcementLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{announcementLoading ? 'Menyiarkan...' : 'Siarkan Pengumuman Sekarang'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveAllSettings} className="space-y-8">
        {saveSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Semua perubahan data mempelai, jadwal acara, dan rekening telah berhasil disimpan!</span>
          </div>
        )}

        {/* Pilihan 12 Template Tema Desain Website */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h4 className="font-serif-wedding text-2xl font-bold text-stone-800 flex items-center gap-2">
                <Palette className="w-5 h-5 text-amber-700" />
                <span>Pilihan Template Tema Desain Website ({WEDDING_THEME_TEMPLATES.length} Tema)</span>
              </h4>
              <p className="text-xs text-stone-500 mt-1 max-w-2xl">
                Pilih tampilan warna sampul, halaman utama, kartu acara, dan gaya bingkai foto mempelai. Tema terpilih: <strong className="text-stone-900">{activeThemeObj.number}. {activeThemeObj.name}</strong>.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {activeThemeObj.palette.swatchColors.map((hex, idx) => (
                <span
                  key={idx}
                  className="w-5 h-5 rounded-full border border-stone-300 shadow-2xs"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {WEDDING_THEME_TEMPLATES.map((tpl) => {
              const isChosen = tpl.id === selectedThemeId;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedThemeId(tpl.id)}
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isChosen
                      ? 'border-2 border-amber-600 bg-amber-50/50 shadow-sm'
                      : 'border-stone-200 hover:border-stone-300 bg-stone-50/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-stone-500">
                        Tema #{tpl.number} • {tpl.category}
                      </span>
                      <p className="font-serif-wedding text-lg font-bold text-stone-900 leading-snug">
                        {tpl.name}
                      </p>
                    </div>
                    {isChosen && (
                      <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-stone-600 line-clamp-2">
                    {tpl.tagline}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-200/70">
                    <div className="flex items-center gap-1.5">
                      {tpl.palette.swatchColors.map((hex, i) => (
                        <span
                          key={i}
                          className="w-4 h-4 rounded-full border border-stone-300"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                    <span className="text-[10.5px] font-semibold text-stone-600">
                      {tpl.motifLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 0. Pilihan Format Undangan Agama & Tradisi */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-100 pb-5">
            <div>
              <h4 className="font-serif-wedding text-2xl font-bold text-stone-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-700" />
                <span>Format Undangan Agama &amp; Tradisi</span>
              </h4>
              <p className="text-xs text-stone-500 mt-1 max-w-2xl">
                Sesuaikan nuansa undangan untuk <strong>Islam, Kristen/Katolik, Hindu, Buddha, Konghucu</strong>, atau <strong>Universal (Nasional)</strong>. Pilihan ini mengatur salam pembuka, ayat suci/kutipan mutiara, nama prosesi sakral, hingga doa dan salam penutup.
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setFormatActiveTab('editor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  formatActiveTab === 'editor'
                    ? 'bg-white text-stone-800 shadow-xs'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Edit Rincian</span>
              </button>
              <button
                type="button"
                onClick={() => setFormatActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  formatActiveTab === 'preview'
                    ? 'bg-white text-stone-800 shadow-xs'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Pratinjau Format</span>
              </button>
            </div>
          </div>

          {presetNotice && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm rounded-2xl flex items-center gap-2.5 animate-fade-in shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span className="font-medium">{presetNotice}</span>
            </div>
          )}

          {/* Grid 6 Kartu Format Agama */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {RELIGION_LIST.map((relKey) => {
              const item = RELIGION_PRESETS[relKey];
              const isSelected = selectedReligion === relKey;

              return (
                <div
                  key={relKey}
                  onClick={() => handleApplyPreset(relKey)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative group ${
                    isSelected
                      ? 'border-amber-700 bg-amber-50/60 ring-2 ring-amber-600/20 shadow-xs'
                      : 'border-stone-200 hover:border-amber-300 hover:bg-stone-50/70'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{item.iconText}</span>
                        <div>
                          <h5 className="text-sm font-bold text-stone-800 group-hover:text-amber-900 transition-colors">
                            {item.name}
                          </h5>
                          <span className="text-[10px] text-stone-400 font-medium block">
                            {item.badge}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-800 text-white text-[10px] font-semibold">
                          <Check className="w-3 h-3" />
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="opacity-0 group-hover:opacity-100 text-[10px] font-semibold text-stone-400 transition-opacity">
                          Klik Pilih
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-2 mt-1">
                      {item.tagline}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-100/80 flex items-center justify-between text-[11px]">
                    <span className="text-stone-500 font-medium truncate max-w-[140px]">
                      {item.config.ceremonyName}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApplyPreset(relKey);
                      }}
                      className={`font-semibold px-2 py-1 rounded-md text-[11px] transition-colors ${
                        isSelected
                          ? 'text-amber-800 bg-amber-100/70 font-bold'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                      }`}
                    >
                      {isSelected ? 'Format Terpilih' : 'Terapkan'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Configuration Editor or Preview */}
          {formatActiveTab === 'editor' ? (
            <div className="bg-stone-50/80 p-5 sm:p-6 rounded-2xl border border-stone-200/80 space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-stone-200/70 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{RELIGION_PRESETS[selectedReligion]?.iconText}</span>
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-stone-800">
                      Rincian Teks Format: {RELIGION_PRESETS[selectedReligion]?.name}
                    </h5>
                    <span className="text-[11px] text-stone-500">
                      Anda bebas mengubah kata-kata di bawah ini tanpa merusak template asli.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(selectedReligion)}
                  className="inline-flex items-center gap-1 text-[11px] text-stone-600 hover:text-stone-900 hover:bg-stone-200 px-2.5 py-1.5 rounded-lg border border-stone-300 transition-colors cursor-pointer"
                  title="Kembalikan teks format ini ke default template"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default Template</span>
                </button>
              </div>

              {/* Salam Pembuka & Nama Upacara */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Salam Pembuka
                  </label>
                  <input
                    type="text"
                    value={openingGreeting}
                    onChange={(e) => setOpeningGreeting(e.target.value)}
                    placeholder="Contoh: Assalamu'alaikum Warahmatullahi Wabarakatuh"
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Nama Upacara Utama (Acara 1)
                  </label>
                  <input
                    type="text"
                    value={ceremonyName}
                    onChange={(e) => setCeremonyName(e.target.value)}
                    placeholder="Akad Nikah / Pemberkatan Kudus / Pawiwahan"
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Nama Syukuran / Resepsi (Acara 2)
                  </label>
                  <input
                    type="text"
                    value={receptionName}
                    onChange={(e) => setReceptionName(e.target.value)}
                    placeholder="Resepsi Pernikahan / Walimatul 'Ursy"
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Kalimat Pengantar Mukadimah */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Kalimat Mukadimah / Pengantar Undangan
                </label>
                <textarea
                  rows={2}
                  value={openingSubtext}
                  onChange={(e) => setOpeningSubtext(e.target.value)}
                  placeholder="Dengan memohon rahmat dan ridho Tuhan Yang Maha Esa..."
                  className="w-full p-3 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Ayat Suci & Kutipan Berkah */}
              <div className="p-4 bg-white rounded-2xl border border-stone-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                      Label / Jenis Kutipan Suci
                    </label>
                    <input
                      type="text"
                      value={verseLabel}
                      onChange={(e) => setVerseLabel(e.target.value)}
                      placeholder="Ayat Suci Al-Qur'an / Ayat Alkitab / Sloka Rg Veda"
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                      Sumber Surat / Ayat / Kitab
                    </label>
                    <input
                      type="text"
                      value={verseSource}
                      onChange={(e) => setVerseSource(e.target.value)}
                      placeholder="QS. Ar-Rum: 21 / Matius 19:6"
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Isi Teks Ayat / Petikan Suci / Mutiara Kasih
                  </label>
                  <textarea
                    rows={3}
                    value={verseText}
                    onChange={(e) => setVerseText(e.target.value)}
                    placeholder="Tuliskan teks ayat atau kutipan..."
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
                  />
                </div>

                {/* Alternatif Ayat Lain jika tersedia */}
                {RELIGION_PRESETS[selectedReligion]?.alternativeVerses && (
                  <div className="pt-2 border-t border-stone-100 flex items-center flex-wrap gap-2">
                    <span className="text-[11px] font-semibold text-stone-500">
                      Pilihan Ayat / Petikan Lain:
                    </span>
                    {RELIGION_PRESETS[selectedReligion].alternativeVerses!.map((alt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setVerseLabel(alt.label);
                          setVerseText(alt.text);
                          setVerseSource(alt.source);
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-stone-100 hover:bg-amber-100 hover:text-amber-900 text-stone-600 border border-stone-200 transition-colors cursor-pointer"
                      >
                        {alt.source}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Salam Penutup & Doa Berkah */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Salam Penutup
                  </label>
                  <input
                    type="text"
                    value={closingGreeting}
                    onChange={(e) => setClosingGreeting(e.target.value)}
                    placeholder="Wassalamu'alaikum Warahmatullahi Wabarakatuh"
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Kalimat Doa / Restu Penutup
                  </label>
                  <textarea
                    rows={2}
                    value={closingBlessing}
                    onChange={(e) => setClosingBlessing(e.target.value)}
                    placeholder="Merupakan suatu kehormatan dan kebahagiaan bagi kami..."
                    className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Live Simulated Preview */
            <div className="p-6 sm:p-8 bg-[#FAF7F2] rounded-3xl border border-amber-200/80 text-stone-800 relative overflow-hidden shadow-inner">
              <div className="max-w-xl mx-auto text-center space-y-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold">
                  <span>{RELIGION_PRESETS[selectedReligion]?.iconText}</span>
                  <span>Pratinjau Format Undangan: {RELIGION_PRESETS[selectedReligion]?.name}</span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-serif-wedding text-xl sm:text-2xl font-bold text-amber-950">
                    {openingGreeting}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
                    {openingSubtext}
                  </p>
                </div>

                {/* Verse Card */}
                <div className="bg-white/90 p-5 rounded-2xl border border-amber-200/70 shadow-xs max-w-lg mx-auto">
                  <div className="flex items-center justify-center gap-1.5 text-amber-800 text-[11px] uppercase tracking-widest font-semibold mb-2">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{verseLabel}</span>
                  </div>
                  <p className="font-serif-wedding text-xs sm:text-sm italic text-stone-700 leading-relaxed mb-2">
                    "{verseText}"
                  </p>
                  <span className="text-[11px] font-bold text-amber-900 block">
                    — {verseSource}
                  </span>
                </div>

                {/* Procession Badges */}
                <div className="flex items-center justify-center gap-3 flex-wrap text-xs">
                  <div className="px-3.5 py-1.5 rounded-xl bg-white border border-stone-200 shadow-xs">
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Acara 1</span>
                    <span className="font-bold text-stone-800">{ceremonyName}</span>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-white border border-stone-200 shadow-xs">
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Acara 2</span>
                    <span className="font-bold text-stone-800">{receptionName}</span>
                  </div>
                </div>

                {/* Closing */}
                <div className="pt-3 border-t border-stone-200/70 text-center space-y-1">
                  <p className="text-xs text-stone-500 italic">
                    "{closingBlessing}"
                  </p>
                  <p className="font-serif-wedding text-sm sm:text-base font-bold text-amber-950 pt-1">
                    {closingGreeting}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 1. Mempelai Pria */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs">
          <h4 className="font-serif-wedding text-2xl font-bold text-stone-800 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-amber-700" />
            <span>Data Mempelai Pria</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                Nama Lengkap &amp; Gelar
              </label>
              <input
                type="text"
                value={groomName}
                onChange={(e) => handleGroomNameChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Nama Panggilan
              </label>
              <input
                type="text"
                value={groomNick}
                onChange={(e) => handleGroomNickChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Nama Ayah
              </label>
              <input
                type="text"
                value={groomFather}
                onChange={(e) => setGroomFather(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Nama Ibu
              </label>
              <input
                type="text"
                value={groomMother}
                onChange={(e) => setGroomMother(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Username Instagram
              </label>
              <input
                type="text"
                value={groomIg}
                onChange={(e) => setGroomIg(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Foto Profil Pria
                </label>
                {groomCompInfo && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                    ⚡ {groomCompInfo}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={groomPhoto}
                  onChange={(e) => setGroomPhoto(e.target.value)}
                  placeholder="URL gambar atau unggah file..."
                  className="flex-1 px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <label className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                  groomCompLoading
                    ? 'bg-amber-100 text-amber-900 border-amber-300 cursor-wait'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                }`}>
                  {groomCompLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                  ) : (
                    <Upload className="w-4 h-4 text-amber-700" />
                  )}
                  <span>{groomCompLoading ? 'Mengompres...' : 'Unggah & Kompres'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={groomCompLoading}
                    onChange={handleCompressGroomPhoto}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Profil / Bio Singkat Mempelai Pria
            </label>
            <textarea
              rows={2}
              value={groomBio}
              onChange={(e) => setGroomBio(e.target.value)}
              placeholder="Deskripsi singkat tentang mempelai pria..."
              className="w-full p-3 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* 2. Mempelai Wanita */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs">
          <h4 className="font-serif-wedding text-2xl font-bold text-stone-800 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-600" />
            <span>Data Mempelai Wanita</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                Nama Lengkap &amp; Gelar
              </label>
              <input
                type="text"
                value={brideName}
                onChange={(e) => handleBrideNameChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Nama Panggilan
              </label>
              <input
                type="text"
                value={brideNick}
                onChange={(e) => handleBrideNickChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Nama Ayah
              </label>
              <input
                type="text"
                value={brideFather}
                onChange={(e) => setBrideFather(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Nama Ibu
              </label>
              <input
                type="text"
                value={brideMother}
                onChange={(e) => setBrideMother(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Username Instagram
              </label>
              <input
                type="text"
                value={brideIg}
                onChange={(e) => setBrideIg(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Foto Profil Wanita
                </label>
                {brideCompInfo && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                    ⚡ {brideCompInfo}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={bridePhoto}
                  onChange={(e) => setBridePhoto(e.target.value)}
                  placeholder="URL gambar atau unggah file..."
                  className="flex-1 px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <label className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                  brideCompLoading
                    ? 'bg-amber-100 text-amber-900 border-amber-300 cursor-wait'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                }`}>
                  {brideCompLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                  ) : (
                    <Upload className="w-4 h-4 text-amber-700" />
                  )}
                  <span>{brideCompLoading ? 'Mengompres...' : 'Unggah & Kompres'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={brideCompLoading}
                    onChange={handleCompressBridePhoto}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Profil / Bio Singkat Mempelai Wanita
            </label>
            <textarea
              rows={2}
              value={brideBio}
              onChange={(e) => setBrideBio(e.target.value)}
              placeholder="Deskripsi singkat tentang mempelai wanita..."
              className="w-full p-3 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* 3. Jadwal & Lokasi Acara */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <h4 className="font-serif-wedding text-2xl font-bold text-stone-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-700" />
              <span>Jadwal, Tanggal &amp; Lokasi Acara</span>
            </h4>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-stone-600">Waktu Hitung Mundur (Countdown):</label>
              <input
                type="datetime-local"
                value={countdownDate.slice(0, 16)}
                onChange={(e) => setCountdownDate(e.target.value)}
                className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <h5 className="font-semibold text-xs text-stone-700 uppercase tracking-wider">
                {ceremonyName || 'Akad Nikah'}
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Hari & Tanggal (cth: Sabtu, 24 Oktober 2026)"
                  value={akadDate}
                  onChange={(e) => setAkadDate(e.target.value)}
                  className="px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <input
                  type="text"
                  placeholder="Waktu (e.g. 08:00 - 10:00 WIB)"
                  value={akadTime}
                  onChange={(e) => setAkadTime(e.target.value)}
                  className="px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <input
                  type="text"
                  placeholder="Gedung / Masjid / Gereja"
                  value={akadVenue}
                  onChange={(e) => setAkadVenue(e.target.value)}
                  className="px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <input
                  type="text"
                  placeholder="Alamat Lengkap"
                  value={akadAddress}
                  onChange={(e) => setAkadAddress(e.target.value)}
                  className="px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <input
                type="text"
                placeholder="Tautan Google Maps Lokasi (Opsional, otomatis dibuat jika kosong)"
                value={akadMapUrl}
                onChange={(e) => setAkadMapUrl(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 font-mono placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <h5 className="font-semibold text-xs text-stone-700 uppercase tracking-wider">
                {receptionName || 'Resepsi Pernikahan'}
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Hari & Tanggal (cth: Sabtu, 24 Oktober 2026)"
                  value={resepsiDate}
                  onChange={(e) => setResepsiDate(e.target.value)}
                  className="px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <input
                  type="text"
                  placeholder="Waktu (e.g. 11:00 - 14:00 WIB)"
                  value={resepsiTime}
                  onChange={(e) => setResepsiTime(e.target.value)}
                  className="px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <input
                  type="text"
                  placeholder="Ballroom / Gedung"
                  value={resepsiVenue}
                  onChange={(e) => setResepsiVenue(e.target.value)}
                  className="px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <input
                  type="text"
                  placeholder="Alamat Lengkap"
                  value={resepsiAddress}
                  onChange={(e) => setResepsiAddress(e.target.value)}
                  className="px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <input
                type="text"
                placeholder="Tautan Google Maps Lokasi (Opsional, otomatis dibuat jika kosong)"
                value={resepsiMapUrl}
                onChange={(e) => setResepsiMapUrl(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 font-mono placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* 4. Rekening Amplop Digital */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs">
          <h4 className="font-serif-wedding text-2xl font-bold text-stone-800 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-700" />
            <span>Rekening Amplop Digital &amp; Alamat Kado</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
              <span className="text-xs font-bold text-stone-700 uppercase block">
                Rekening Bank 1
              </span>
              <input
                type="text"
                placeholder="Nama Bank (cth: Bank Central Asia (BCA))"
                value={bank1BankName}
                onChange={(e) => setBank1BankName(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 font-semibold placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="text"
                placeholder="Nomor Rekening"
                value={bank1Num}
                onChange={(e) => setBank1Num(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="text"
                placeholder="Atas Nama"
                value={bank1Name}
                onChange={(e) => setBank1Name(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
              <span className="text-xs font-bold text-stone-700 uppercase block">
                Rekening Bank 2
              </span>
              <input
                type="text"
                placeholder="Nama Bank (cth: Bank Mandiri)"
                value={bank2BankName}
                onChange={(e) => setBank2BankName(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 font-semibold placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="text"
                placeholder="Nomor Rekening"
                value={bank2Num}
                onChange={(e) => setBank2Num(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="text"
                placeholder="Atas Nama"
                value={bank2Name}
                onChange={(e) => setBank2Name(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
            <span className="text-xs font-bold text-stone-700 uppercase mb-2 block">
              Alamat Pengiriman Kado Fisik
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                placeholder="Nama Penerima"
                value={giftRecipient}
                onChange={(e) => setGiftRecipient(e.target.value)}
                className="px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="text"
                placeholder="No. Telepon / WhatsApp"
                value={giftPhone}
                onChange={(e) => setGiftPhone(e.target.value)}
                className="px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <textarea
              rows={2}
              placeholder="Alamat Lengkap Pengiriman..."
              value={giftAddress}
              onChange={(e) => setGiftAddress(e.target.value)}
              className="w-full p-3 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Bottom Feedback & Submit Bar */}
        <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-stone-200 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            {saveSuccess ? (
              <div className="flex items-center gap-2.5 text-emerald-700 font-semibold text-xs sm:text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Semua perubahan data mempelai, jadwal acara, tema, dan rekening berhasil disimpan!</span>
              </div>
            ) : saveError ? (
              <div className="flex items-center gap-2 text-rose-700 font-semibold text-xs sm:text-sm">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{saveError}</span>
              </div>
            ) : (
              <p className="text-xs text-stone-500">
                Pastikan klik <strong>Simpan Semua Pengaturan</strong> setelah melakukan perubahan data undangan.
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={saveLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-amber-800 hover:bg-amber-900 active:scale-[0.99] text-white font-semibold text-xs sm:text-sm tracking-wide shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saveLoading ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
