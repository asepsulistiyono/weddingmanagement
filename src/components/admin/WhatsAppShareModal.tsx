import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  ExternalLink, 
  Phone, 
  Sparkles, 
  MessageCircle, 
  Eye, 
  CheckCheck,
  User,
  RefreshCw
} from 'lucide-react';
import type { Guest, WeddingSettings } from '../../types.ts';
import { getFullInvitationUrl } from '../../utils/slugHelper.ts';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: Guest | null;
  settings: WeddingSettings | null;
  onGuestUpdated?: () => void;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  guest,
  settings,
  onGuestUpdated
}) => {
  if (!isOpen || !guest) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const groomName = settings?.groom.nickname || 'Rizky';
  const brideName = settings?.bride.nickname || 'Siti';
  const coupleName = settings?.title || `The Wedding of ${groomName} & ${brideName}`;
  const weddingDate = settings?.events[0]?.date || 'Sabtu, 24 Oktober 2026';
  const weddingLocation = settings?.events[0]?.location || 'Masjid Agung Al-Ikhlas';

  // Templates
  type TemplateType = 'formal' | 'sahabat' | 'keluarga' | 'reminder';

  const [messageLang, setMessageLang] = useState<'id' | 'en'>('id');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('formal');
  const [phone, setPhone] = useState<string>(guest.phone || '');
  const [customText, setCustomText] = useState<string>('');
  const [isCopiedMsg, setIsCopiedMsg] = useState<boolean>(false);
  const [isCopiedLink, setIsCopiedLink] = useState<boolean>(false);
  const [isSavingStatus, setIsSavingStatus] = useState<boolean>(false);
  const [isSentStatus, setIsSentStatus] = useState<boolean>(guest.invitationSent || false);

  const baseInvitationUrl = getFullInvitationUrl(settings?.slug, guest.slug);
  const invitationUrl = messageLang === 'en' 
    ? `${baseInvitationUrl}${baseInvitationUrl.includes('?') ? '&' : '?'}lang=en`
    : baseInvitationUrl;

  // Clean and format Indonesian phone number to international WhatsApp format
  const formatPhoneNumber = (input: string): string => {
    let cleaned = input.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8')) {
      cleaned = '62' + cleaned;
    }
    return cleaned;
  };

  // Generate message based on selected template and language
  const generateMessage = (tpl: TemplateType, langChoice: 'id' | 'en'): string => {
    const activeUrl = langChoice === 'en'
      ? `${baseInvitationUrl}${baseInvitationUrl.includes('?') ? '&' : '?'}lang=en`
      : baseInvitationUrl;

    if (langChoice === 'en') {
      switch (tpl) {
        case 'formal':
          return `Dear *${guest.name}*,\n\nTogether with our families, we cordially invite you to celebrate our wedding day:\n\n*${coupleName}*\n🗓 *${weddingDate}*\n📍 *${weddingLocation}*\n\nPlease find the full event schedule, Google Maps location, and RSVP confirmation at your personalized digital invitation link:\n\n👉 *${activeUrl}*\n\nIt would be our great honor and pleasure to have your presence and blessings on our special day.\n\nWarm regards,\n*${groomName} & ${brideName}*`;

        case 'sahabat':
          return `Hi *${guest.name}*! 👋✨\n\nWe are getting married and we would love for you to celebrate this special day with us!\n\n*The Wedding of ${groomName} & ${brideName}*\n🗓 *${weddingDate}*\n📍 *${weddingLocation}*\n\nPlease open your personalized digital wedding invitation here:\n👉 *${activeUrl}*\n\nDon't forget to confirm your attendance (RSVP) on the site so we can prepare everything for you. Can't wait to celebrate together! ❤️🎉`;

        case 'keluarga':
          return `Dear Family & Relatives / *${guest.name}*,\n\nWith joyful hearts and blessings, we request the pleasure of your company at the wedding celebration of our beloved:\n\n*${coupleName}*\n🗓 *${weddingDate}*\n📍 *${weddingLocation}*\n\nPlease access the event details and venue navigation via this link:\n👉 *${activeUrl}*\n\nYour presence and prayers mean the world to our family.\n\nWarmest regards,\n*The Families of ${groomName} & ${brideName}*`;

        case 'reminder':
          return `Wedding Reminder 🔔\n\nDear *${guest.name}*,\n\nThis is a friendly reminder for our upcoming wedding celebration on:\n🗓 *${weddingDate}*\n📍 *${weddingLocation}*\n\nIf you haven't had the chance yet, please confirm your attendance (RSVP) via your digital invitation:\n👉 *${activeUrl}*\n\nWe look forward to celebrating together! 🙏💐`;

        default:
          return '';
      }
    }

    // Indonesian templates
    switch (tpl) {
      case 'formal':
        return `Assalamu’alaikum Warahmatullahi Wabarakatuh\n\nKepada Yth.\n*${guest.name}*\n${guest.notes ? `(${guest.notes})\n` : ''}\nTanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada hari bahagia pernikahan kami:\n\n*${coupleName}*\n🗓 *${weddingDate}*\n📍 *${weddingLocation}*\n\nInformasi lengkap mengenai jadwal acara, peta lokasi Google Maps, dan konfirmasi kehadiran (RSVP) dapat diakses melalui tautan undangan digital berikut:\n\n👉 *${activeUrl}*\n\nMerupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan doa restu bagi kami berdua.\n\nAtas kehadiran dan doa restunya, kami ucapkan terima kasih yang tulus.\n\nWassalamu’alaikum Warahmatullahi Wabarakatuh\n\nKami yang berbahagia,\n*${groomName} & ${brideName}*`;

      case 'sahabat':
        return `Halo *${guest.name}*! 👋✨\n\nAlhamdulillah, hari yang kami nanti akhirnya tiba. Kami ingin mengajak kamu untuk menjadi bagian dari momen bahagia pernikahan kami:\n\n*The Wedding of ${groomName} & ${brideName}*\n🗓 *${weddingDate}*\n📍 *${weddingLocation}*\n\nYuk buka dan lihat undangan digital spesial buat kamu di link ini:\n👉 *${activeUrl}*\n\nJangan lupa isi konfirmasi kehadiran (RSVP) di website yaa biar kami bisa siapkan jamuan terbaik buat kamu. Ditunggu kehadirannya dan mohon doa restunya ya! ❤️🎉`;

      case 'keluarga':
        return `Bismillahirrohmanirrohim\n\nKepada Yth. Keluarga Besar / *${guest.name}*\nDi Tempat\n\nDengan rasa syukur dan memohon rahmat Allah SWT, kami bermaksud menyelenggarakan syukuran pernikahan putra-putri kami tercinta:\n\n*${coupleName}*\n🗓 *${weddingDate}*\n📍 *${weddingLocation}*\n\nDetail susunan acara dan panduan rute lokasi dapat dilihat melalui undangan resmi berikut:\n👉 *${activeUrl}*\n\nKehadiran serta doa restu dari Bapak/Ibu dan seluruh sanak keluarga adalah anugerah terindah bagi kami.\n\nHormat kami sekeluarga,\n*Keluarga Besar ${groomName} & ${brideName}*`;

      case 'reminder':
        return `Pengingat Acara Pernikahan (Reminder) 🔔\n\nKepada Yth. *${guest.name}*,\n\nMenjelang hari bahagia kami yang akan diselenggarakan pada:\n🗓 *${weddingDate}*\n📍 *${weddingLocation}*\n\nKami mengingatkan kembali untuk konfirmasi kehadiran (RSVP) melalui undangan digital Anda di:\n👉 *${activeUrl}*\n\nSampai jumpa di hari bahagia kami! Terima kasih banyak atas doa dan perhatiannya. 🙏💐`;

      default:
        return '';
    }
  };

  // Sync initial message when template, language, or guest changes
  useEffect(() => {
    setCustomText(generateMessage(selectedTemplate, messageLang));
  }, [selectedTemplate, messageLang, guest.id, guest.name, guest.slug]);

  useEffect(() => {
    setPhone(guest.phone || '');
    setIsSentStatus(guest.invitationSent || false);
  }, [guest]);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customText);
    setIsCopiedMsg(true);
    setTimeout(() => setIsCopiedMsg(false), 2000);
  };

  const handleCopyLinkOnly = () => {
    navigator.clipboard.writeText(invitationUrl);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 2000);
  };

  // Mark invitation sent status in backend
  const updateSentStatus = async (status: boolean) => {
    setIsSavingStatus(true);
    try {
      const res = await fetch(`/api/admin/guests/${guest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationSent: status,
          phone: phone.trim()
        })
      });
      if (res.ok) {
        setIsSentStatus(status);
        if (onGuestUpdated) onGuestUpdated();
      }
    } catch (err) {
      console.error('Failed to update invitationSent status:', err);
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleSendViaWhatsApp = async () => {
    const formattedPhone = formatPhoneNumber(phone);
    const encodedMsg = encodeURIComponent(customText);

    const waLink = formattedPhone 
      ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMsg}`
      : `https://api.whatsapp.com/send?text=${encodedMsg}`;

    // Auto mark as sent
    await updateSentStatus(true);

    // Open WhatsApp
    window.open(waLink, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 border border-stone-200 shadow-2xl relative max-h-[92vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-wedding text-xl sm:text-2xl font-bold text-stone-900">
                  Kirim Undangan via WhatsApp
                </h3>
                {isSentStatus ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCheck className="w-3 h-3 text-emerald-600" />
                    Terkirim
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-600">
                    Belum Terkirim
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500">
                Penerima: <strong className="text-stone-800">{guest.name}</strong> ({guest.category} &bull; Alokasi {guest.paxAllocated} Pax)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {/* Recipient Phone input */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Nomor WhatsApp Penerima
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 08123456789 atau 628123456789"
                  className="w-full text-sm font-medium text-stone-900 bg-transparent focus:outline-none placeholder:text-stone-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => updateSentStatus(!isSentStatus)}
                disabled={isSavingStatus}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isSentStatus
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100'
                }`}
              >
                {isSentStatus ? <Check className="w-3.5 h-3.5" /> : null}
                <span>{isSentStatus ? 'Tandai Belum Terkirim' : 'Tandai Sudah Terkirim'}</span>
              </button>
            </div>
          </div>

          {/* Language and Template Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                Pilih Bahasa &amp; Gaya Pesan WhatsApp
              </label>

              {/* Language toggle */}
              <div className="inline-flex rounded-xl p-0.5 bg-stone-100 border border-stone-200">
                <button
                  type="button"
                  onClick={() => setMessageLang('id')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    messageLang === 'id'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  🇮🇩 Indonesia
                </button>
                <button
                  type="button"
                  onClick={() => setMessageLang('en')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    messageLang === 'en'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { 
                  id: 'formal', 
                  label: messageLang === 'en' ? 'Formal / Cordial' : 'Formal / Sopan', 
                  desc: messageLang === 'en' ? 'Official & Polite' : 'Resmi & Santun' 
                },
                { 
                  id: 'sahabat', 
                  label: messageLang === 'en' ? 'Close Friends' : 'Sahabat / Teman', 
                  desc: messageLang === 'en' ? 'Warm & Casual' : 'Akrab & Santai' 
                },
                { 
                  id: 'keluarga', 
                  label: messageLang === 'en' ? 'Family & Relatives' : 'Keluarga Besar', 
                  desc: messageLang === 'en' ? 'Respectful' : 'Takzim & Hormat' 
                },
                { 
                  id: 'reminder', 
                  label: messageLang === 'en' ? 'Wedding Reminder' : 'Pengingat Acara', 
                  desc: messageLang === 'en' ? 'Save the Date' : 'Jelang Hari H' 
                }
              ].map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tpl.id as TemplateType)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedTemplate === tpl.id
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-semibold ring-2 ring-emerald-500/20'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <p className="text-xs font-bold leading-tight">{tpl.label}</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">{tpl.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Live Message Preview & Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>Pratinjau &amp; Kustomisasi Pesan</span>
              </label>
              <button
                type="button"
                onClick={() => setCustomText(generateMessage(selectedTemplate, messageLang))}
                className="text-[11px] text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer font-medium"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset ke Template</span>
              </button>
            </div>

            {/* Simulated WhatsApp Chat Bubble */}
            <div className="bg-[#EFEAE2] p-4 rounded-2xl border border-stone-300/80 shadow-inner relative">
              <div className="bg-white rounded-xl rounded-tl-xs p-3.5 shadow-sm border border-stone-200/50 max-w-xl">
                <textarea
                  rows={8}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full text-xs sm:text-[13px] text-stone-800 bg-transparent resize-y focus:outline-none font-sans leading-relaxed"
                />
                <div className="text-right text-[10px] text-stone-400 pt-1 flex items-center justify-end gap-1">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Guest Link Quick Card */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="truncate flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span className="text-stone-600 font-mono text-[11px] truncate">
                {invitationUrl}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleCopyLinkOnly}
                className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 font-medium text-[11px] flex items-center gap-1 cursor-pointer"
              >
                {isCopiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{isCopiedLink ? 'Tersalin' : 'Salin Link'}</span>
              </button>
              <a
                href={invitationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-[11px] flex items-center gap-1"
                title="Buka Pratinjau Undangan Tamu"
              >
                <Eye className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleCopyMessage}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            {isCopiedMsg ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-500" />}
            <span>{isCopiedMsg ? 'Pesan Tersalin!' : 'Salin Teks Lengkap'}</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50 cursor-pointer transition-colors"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSendViaWhatsApp}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Buka WhatsApp &amp; Kirim</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
