import React, { useState, useId, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Download,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Users,
  Info,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import type { Guest, GuestCategory } from '../../types.ts';
import { useRealtime } from '../../context/RealtimeContext.tsx';

interface ParsedGuest {
  name: string;
  category: GuestCategory;
  phone: string;
  paxAllocated: number;
  notes: string;
  customGreeting?: string;
  isDuplicate?: boolean;
}

interface GuestImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingGuests: Guest[];
  onImportSuccess: () => void;
}

const VALID_CATEGORIES: GuestCategory[] = [
  'VIP',
  'Keluarga Inti',
  'Keluarga Besar',
  'Sahabat',
  'Rekan Kerja',
  'Tamu Umum'
];

const SAMPLE_TEMPLATE_TEXT = `# ============================================================================== #
# TEMPLATE IMPORT DAFTAR TAMU UNDANGAN (.TXT)                                   #
# ============================================================================== #
# PETUNJUK FORMAT:
# 1. Tulis 1 (satu) data tamu per baris.
# 2. Pisahkan antar kolom dengan simbol pipa: |
# 3. Urutan kolom:
#    Nama Tamu | Kategori | Nomor WhatsApp | Jumlah Pax | Catatan / Meja
#
# PILIHAN KATEGORI YANG VALID:
#    VIP, Keluarga Inti, Keluarga Besar, Sahabat, Rekan Kerja, Tamu Umum
#
# FORMAT SEDERHANA (Hanya nama per baris juga didukung!):
#    Bpk. Ahmad Fauzi & Keluarga
#    dr. Linda Permata
#
# CONTOH DAFTAR TAMU DI BAWAH INI (Silakan sesuaikan atau ganti dengan daftar Anda):
# ============================================================================== #

Bpk. H. Ahmad Sudirman & Partner | VIP | 081234567890 | 2 | Meja VIP 1
Siti Rahmawati, S.Kom | Sahabat | 085678901234 | 2 | Teman Kampus
Keluarga Besar Bpk. Hendra Gunawan | Keluarga Besar | 081987654321 | 4 | Meja Keluarga
dr. Kevin Pratama & Istri | Rekan Kerja | 082198765432 | 2 | Rekan Rumah Sakit
Budi Santoso | Tamu Umum | 087712345678 | 1 | Komunitas
Ibu Hj. Aminah & Keluarga | VIP | 081345678901 | 3 | VIP Utama
Rian Hidayat | Sahabat | | 2 | Teman SMA
Pak RT Bambang & Ibu | Tamu Umum | | 2 | Warga RT 04`;

export const GuestImportModal: React.FC<GuestImportModalProps> = ({
  isOpen,
  onClose,
  existingGuests,
  onImportSuccess
}) => {
  const { addGuestsBatchDirectly } = useRealtime();
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [copiedSample, setCopiedSample] = useState(false);

  // Settings
  const [defaultCategory, setDefaultCategory] = useState<GuestCategory>('Sahabat');
  const [defaultPax, setDefaultPax] = useState<number>(2);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  // Process states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ added: number; skipped: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneId = useId();

  if (!isOpen) return null;

  // Clean raw line name by removing leading numbering (e.g. "1. ", "2) ", "- ", "• ")
  const cleanName = (str: string) => {
    return str.replace(/^(\d+[\.\)\-:]|\-|\*|•)\s*/, '').trim();
  };

  // Match category loosely
  const matchCategory = (val: string): GuestCategory => {
    if (!val) return defaultCategory;
    const clean = val.trim().toLowerCase();
    for (const cat of VALID_CATEGORIES) {
      if (cat.toLowerCase() === clean) return cat;
    }
    // Partial matches
    if (clean.includes('vip')) return 'VIP';
    if (clean.includes('inti')) return 'Keluarga Inti';
    if (clean.includes('besar') || clean.includes('keluarga')) return 'Keluarga Besar';
    if (clean.includes('sahabat') || clean.includes('teman')) return 'Sahabat';
    if (clean.includes('rekan') || clean.includes('kantor') || clean.includes('kerja')) return 'Rekan Kerja';
    return defaultCategory;
  };

  // Parse text into structured guests
  const parseLines = (text: string): ParsedGuest[] => {
    if (!text.trim()) return [];

    const lines = text.split(/\r?\n/);
    const existingNamesSet = new Set(existingGuests.map((g) => g.name.toLowerCase().trim()));
    const result: ParsedGuest[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Skip empty or comment lines
      if (!line || line.startsWith('#') || line.startsWith('//')) {
        continue;
      }

      // Check separator: pipe | is primary, or comma if no pipe
      let parts: string[] = [];
      if (line.includes('|')) {
        parts = line.split('|').map((p) => p.trim());
      } else if (line.includes('\t')) {
        parts = line.split('\t').map((p) => p.trim());
      } else {
        // Just single name per line
        parts = [line];
      }

      const rawGuestName = cleanName(parts[0] || '');
      if (!rawGuestName) continue;

      const categoryPart = parts[1] ? matchCategory(parts[1]) : defaultCategory;
      const phonePart = parts[2] ? parts[2].replace(/[^0-9+]/g, '') : '';
      const paxPart = parts[3] && !isNaN(Number(parts[3])) ? Math.max(1, Math.min(20, Number(parts[3]))) : defaultPax;
      const notesPart = parts[4] || '';

      const isDup = existingNamesSet.has(rawGuestName.toLowerCase());

      result.push({
        name: rawGuestName,
        category: categoryPart,
        phone: phonePart,
        paxAllocated: paxPart,
        notes: notesPart,
        isDuplicate: isDup
      });
    }

    return result;
  };

  const parsedGuests = parseLines(rawText);
  const eligibleGuests = skipDuplicates ? parsedGuests.filter((g) => !g.isDuplicate) : parsedGuests;
  const duplicateCount = parsedGuests.filter((g) => g.isDuplicate).length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage(null);
    setSuccessResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content || '');
    };
    reader.onerror = () => {
      setErrorMessage('Gagal membaca berkas .txt. Pastikan file valid.');
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    // Generate text blob for reliable offline & online download
    const blob = new Blob([SAMPLE_TEMPLATE_TEXT], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_daftar_tamu.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySample = () => {
    navigator.clipboard.writeText(SAMPLE_TEMPLATE_TEXT);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 2500);
  };

  const handleExecuteImport = async () => {
    if (eligibleGuests.length === 0) {
      setErrorMessage('Tidak ada data calon tamu yang dapat diimpor.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const localBatch: Guest[] = eligibleGuests.map((g, idx) => {
      const baseSlug = g.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `tamu-${Date.now()}`;
      return {
        id: `g-${Date.now()}-${idx}`,
        name: g.name,
        slug: `${baseSlug}-${idx + 1}`,
        phone: g.phone,
        category: g.category,
        paxAllocated: g.paxAllocated,
        rsvpStatus: 'unconfirmed',
        paxConfirmed: 0,
        checkedIn: false,
        checkedInAt: null,
        notes: g.notes,
        invitationSent: false,
        createdAt: new Date().toISOString()
      };
    });

    try {
      const payload = {
        guests: eligibleGuests.map((g) => ({
          name: g.name,
          category: g.category,
          phone: g.phone,
          paxAllocated: g.paxAllocated,
          notes: g.notes
        })),
        skipDuplicates
      };

      const res = await fetch('/api/admin/guests/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data.addedGuests) && data.addedGuests.length > 0) {
          addGuestsBatchDirectly(data.addedGuests);
        } else {
          addGuestsBatchDirectly(localBatch);
        }
        setSuccessResult({
          added: data.addedCount ?? eligibleGuests.length,
          skipped: data.skippedCount ?? duplicateCount
        });
        onImportSuccess();
      } else {
        addGuestsBatchDirectly(localBatch);
        setSuccessResult({
          added: localBatch.length,
          skipped: duplicateCount
        });
        onImportSuccess();
      }
    } catch {
      addGuestsBatchDirectly(localBatch);
      setSuccessResult({
        added: localBatch.length,
        skipped: duplicateCount
      });
      onImportSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200 my-auto max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 pb-3 border-b border-stone-100 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-serif-wedding text-xl sm:text-2xl font-bold text-stone-800">
                Import Daftar Tamu (.TXT)
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
                Tambahkan banyak tamu sekaligus dari berkas teks atau tempel langsung daftar nama.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer shrink-0 -mr-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 overscroll-contain">
          {/* Success Banner */}
          {successResult && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Berhasil Mengimpor Tamu!</p>
                <p className="text-emerald-700 text-xs mt-0.5">
                  Sebanyak <strong>{successResult.added} tamu</strong> baru berhasil dimasukkan ke dalam daftar undangan.
                  {successResult.skipped > 0 && ` (${successResult.skipped} nama dilewati karena duplikat)`}
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
                  >
                    Selesai &amp; Tutup
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSuccessResult(null);
                      setRawText('');
                      setFileName(null);
                    }}
                    className="px-3 py-1 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100/50 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Import Lagi
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Template & Instructions Action Banner */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-700 shrink-0" />
              <div className="text-xs text-stone-700">
                <span className="font-semibold text-stone-900">Template Berkas: </span>
                <span>Gunakan format standar untuk pengisian yang rapi.</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-800 hover:bg-amber-900 active:scale-[0.99] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Template .TXT</span>
              </button>
              <button
                type="button"
                onClick={() => setShowInstructions((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
                <span>{showInstructions ? 'Tutup Petunjuk' : 'Petunjuk Format'}</span>
                {showInstructions ? <ChevronUp className="w-3 h-3 text-stone-400" /> : <ChevronDown className="w-3 h-3 text-stone-400" />}
              </button>
            </div>
          </div>

          {/* Instructions Accordion */}
          {showInstructions && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3 text-xs text-stone-700 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  Petunjuk Format Penulisan Berkas .TXT
                </span>
                <button
                  type="button"
                  onClick={handleCopySample}
                  className="text-[11px] text-amber-800 hover:text-amber-950 font-semibold inline-flex items-center gap-1 cursor-pointer bg-white/80 px-2 py-0.5 rounded border border-amber-300"
                >
                  {copiedSample ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSample ? 'Tersalin!' : 'Salin Contoh'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
                <div className="bg-white p-2.5 rounded-lg border border-amber-200/80 space-y-1">
                  <div className="font-bold text-amber-900">1. Format Lengkap (Pemisah |)</div>
                  <div className="font-mono text-[10.5px] bg-stone-50 p-1.5 rounded border border-stone-200 text-stone-800">
                    Nama | Kategori | No WA | Pax | Meja
                  </div>
                  <p className="text-stone-600">
                    Contoh: <br />
                    <code className="text-amber-900 font-mono">Bpk. Ahmad Fauzi &amp; Istri | VIP | 081234567890 | 2 | Meja VIP 1</code>
                  </p>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-amber-200/80 space-y-1">
                  <div className="font-bold text-amber-900">2. Format Cepat (Hanya Nama)</div>
                  <div className="font-mono text-[10.5px] bg-stone-50 p-1.5 rounded border border-stone-200 text-stone-800">
                    Tulis 1 nama per baris
                  </div>
                  <p className="text-stone-600">
                    Contoh salinan dari chat WhatsApp:<br />
                    <code className="text-amber-900 font-mono">1. Bpk. Hendra Gunawan<br />2. dr. Linda Permata<br />3. Andi Wijaya</code>
                  </p>
                </div>
              </div>

              <div className="bg-amber-100/50 p-2 rounded-lg text-[10.5px] text-amber-950 space-y-0.5">
                <p>
                  • <strong>Kategori yang Valid:</strong> <span className="font-semibold">VIP, Keluarga Inti, Keluarga Besar, Sahabat, Rekan Kerja, Tamu Umum</span>. Jika kosong, sistem menggunakan kategori bawaan.
                </p>
                <p>
                  • <strong>Otomatis:</strong> Penomoran baris (misal <em>1.</em>, <em>2)</em>, <em>-</em>) dan baris petunjuk yang diawali tanda pagar (<em>#</em>) akan diabaikan secara otomatis.
                </p>
              </div>
            </div>
          )}

          {/* Input Method Tabs */}
          <div>
            <div className="flex border-b border-stone-200 mb-3">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'upload'
                    ? 'border-amber-800 text-amber-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Pilih Berkas .TXT</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'paste'
                    ? 'border-amber-800 text-amber-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Tempel / Ketik Teks Langsung</span>
              </button>
            </div>

            {activeTab === 'upload' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-300 hover:border-amber-500 bg-stone-50 hover:bg-amber-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all group"
              >
                <input
                  id={dropZoneId}
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-stone-200 text-stone-400 group-hover:text-amber-700 group-hover:border-amber-300 flex items-center justify-center mx-auto mb-2.5 transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs font-semibold text-stone-800 group-hover:text-amber-950">
                  {fileName ? (
                    <span className="text-amber-900 font-bold">Berkas Terpilih: {fileName}</span>
                  ) : (
                    <span>Klik untuk memilih berkas .txt atau tarik file ke sini</span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Format berkas harus berekstensi <strong>.txt</strong> (Plain Text UTF-8)
                </p>
                {fileName && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="mt-3 px-3 py-1 bg-white border border-stone-200 text-stone-700 rounded-lg text-xs font-medium hover:bg-stone-50"
                  >
                    Ganti Berkas
                  </button>
                )}
              </div>
            ) : (
              <div>
                <textarea
                  rows={6}
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    setFileName(null);
                    setSuccessResult(null);
                  }}
                  placeholder={`Tempel daftar nama tamu di sini...\nContoh:\nBpk. H. Ahmad Sudirman & Partner | VIP | 081234567890 | 2 | Meja VIP 1\nSiti Rahmawati | Sahabat | 085678901234 | 2\nKeluarga Besar Bpk. Hendra Gunawan | Keluarga Besar | | 4`}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-800 leading-relaxed"
                />
                <div className="flex items-center justify-between text-[11px] text-stone-400 mt-1">
                  <span>Mendukung copy-paste langsung dari WhatsApp atau Excel.</span>
                  {rawText && (
                    <button
                      type="button"
                      onClick={() => setRawText('')}
                      className="text-rose-600 hover:text-rose-800 font-medium"
                    >
                      Bersihkan Teks
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Import Settings & Fallback Options */}
          <div className="bg-stone-50/70 border border-stone-200 rounded-xl p-3 space-y-2.5">
            <div className="text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-stone-500" />
              <span>Pengaturan Tambahan</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] text-stone-600 mb-1">
                  Kategori Standar (Bawaan)
                </label>
                <select
                  value={defaultCategory}
                  onChange={(e) => setDefaultCategory(e.target.value as GuestCategory)}
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-700 cursor-pointer"
                >
                  {VALID_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-stone-600 mb-1">
                  Jumlah Pax Bawaan
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={defaultPax}
                  onChange={(e) => setDefaultPax(Math.max(1, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-700"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-700 py-1.5">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-700 focus:ring-amber-500 border-stone-300"
                  />
                  <span>Lewati nama yang sudah ada (Cegah Duplikat)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Live Preview Table */}
          {parsedGuests.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-stone-500" />
                  <span className="text-xs font-bold text-stone-800">
                    Pratinjau Hasil Pembacaan ({eligibleGuests.length} Tamu Siap Diimpor)
                  </span>
                </div>
                {duplicateCount > 0 && (
                  <span className="text-[11px] text-amber-800 font-medium bg-amber-100/70 px-2 py-0.5 rounded-full">
                    {duplicateCount} nama sudah ada di database {skipDuplicates ? '(Akan dilewati)' : ''}
                  </span>
                )}
              </div>

              <div className="border border-stone-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 text-stone-600 uppercase text-[10px] font-semibold sticky top-0 border-b border-stone-200">
                    <tr>
                      <th className="py-2 px-3 w-8">#</th>
                      <th className="py-2 px-3">Nama Tamu</th>
                      <th className="py-2 px-3">Kategori</th>
                      <th className="py-2 px-3">WhatsApp</th>
                      <th className="py-2 px-3 text-center">Pax</th>
                      <th className="py-2 px-3">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 bg-white">
                    {parsedGuests.map((guest, idx) => {
                      const isSkipped = skipDuplicates && guest.isDuplicate;
                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-stone-50 transition-colors ${
                            isSkipped ? 'opacity-40 bg-stone-50/80 line-through' : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-stone-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-stone-900">
                            {guest.name}
                            {guest.isDuplicate && (
                              <span className="ml-1.5 text-[9px] px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-bold no-underline inline-block">
                                Duplikat
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-700 border border-stone-200">
                              {guest.category}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-stone-600">
                            {guest.phone || '-'}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-stone-800">
                            {guest.paxAllocated}
                          </td>
                          <td className="py-2 px-3 text-stone-500 text-[11px] truncate max-w-[120px]">
                            {guest.notes || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {parsedGuests.length === 0 && rawText.trim() && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>Tidak ditemukan data tamu valid dari teks. Pastikan baris tidak diawali simbol #.</span>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="p-3.5 sm:p-4 bg-stone-50/90 border-t border-stone-200 flex items-center justify-between gap-2.5 shrink-0">
          <div className="text-xs text-stone-500">
            {eligibleGuests.length > 0 ? (
              <span>
                Total <strong>{eligibleGuests.length} calon tamu</strong> siap dimasukkan.
              </span>
            ) : (
              <span>Pilih berkas .txt atau ketik teks untuk mulai.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-200/60 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSubmitting || eligibleGuests.length === 0}
              onClick={handleExecuteImport}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 active:scale-[0.99] text-white text-xs sm:text-sm font-semibold tracking-wide transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Mengimpor Data...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Import {eligibleGuests.length > 0 ? `${eligibleGuests.length} Tamu` : ''}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
