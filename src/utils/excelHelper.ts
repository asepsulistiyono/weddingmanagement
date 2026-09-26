import * as XLSX from 'xlsx';
import type { Guest, GuestCategory } from '../types.ts';

export interface ParsedGuestRow {
  id: string;
  name: string;
  phone: string;
  category: GuestCategory;
  paxAllocated: number;
  customGreeting: string;
  notes: string;
  isValid: boolean;
  validationError?: string;
  isDuplicate?: boolean;
}

export const VALID_CATEGORIES: GuestCategory[] = [
  'VIP',
  'Keluarga Inti',
  'Keluarga Besar',
  'Sahabat',
  'Rekan Kerja',
  'Tamu Umum'
];

/**
 * Downloads a pre-formatted Excel template for importing guests.
 * Includes sample rows and a dedicated guide sheet.
 */
export const downloadExcelTemplate = () => {
  const sampleData = [
    {
      'Nama Tamu': 'Bpk. Hendra Gunawan & Keluarga',
      'No WhatsApp / HP': '081234567890',
      'Kategori': 'VIP',
      'Jumlah Undangan (Pax)': 2,
      'Sapaan Khusus': 'Bapak & Ibu yang kami hormati',
      'Catatan': 'Meja VIP A1 - Sesi 1'
    },
    {
      'Nama Tamu': 'dr. Anisa Rahmawati',
      'No WhatsApp / HP': '081298765432',
      'Kategori': 'Sahabat',
      'Jumlah Undangan (Pax)': 2,
      'Sapaan Khusus': 'Sahabat tersayang',
      'Catatan': 'Alumni Kedokteran'
    },
    {
      'Nama Tamu': 'Dimas Aditya & Rekan',
      'No WhatsApp / HP': '085712345678',
      'Kategori': 'Rekan Kerja',
      'Jumlah Undangan (Pax)': 1,
      'Sapaan Khusus': 'Rekan terbaik',
      'Catatan': 'Tim Kantor / Divisi IT'
    },
    {
      'Nama Tamu': 'Keluarga Om Rahmat Hidayat',
      'No WhatsApp / HP': '081377889900',
      'Kategori': 'Keluarga Besar',
      'Jumlah Undangan (Pax)': 4,
      'Sapaan Khusus': 'Keluarga Tercinta di Surabaya',
      'Catatan': 'Rombongan Keluarga Ayah'
    },
    {
      'Nama Tamu': 'Rina Wulandari, S.Kom',
      'No WhatsApp / HP': '082155667788',
      'Kategori': 'Tamu Umum',
      'Jumlah Undangan (Pax)': 2,
      'Sapaan Khusus': '',
      'Catatan': 'Tetangga Komplek'
    }
  ];

  const guideData = [
    {
      'Nama Kolom': 'Nama Tamu',
      'Sifat': 'WAJIB',
      'Keterangan & Petunjuk Pengisian': 'Nama lengkap atau entitas tamu undangan (Contoh: "Bpk. Hendra Gunawan & Keluarga" atau "dr. Anisa").'
    },
    {
      'Nama Kolom': 'No WhatsApp / HP',
      'Sifat': 'OPSIONAL',
      'Keterangan & Petunjuk Pengisian': 'Nomor HP/WA untuk kemudahan kirim undangan langsung 1-klik (Disarankan format: 08xxxxxxxxxx atau 62xxxxxxxxxx).'
    },
    {
      'Nama Kolom': 'Kategori',
      'Sifat': 'OPSIONAL',
      'Keterangan & Petunjuk Pengisian': 'Pilih salah satu: VIP, Keluarga Inti, Keluarga Besar, Sahabat, Rekan Kerja, Tamu Umum. (Bila kosong otomatis diset: Sahabat).'
    },
    {
      'Nama Kolom': 'Jumlah Undangan (Pax)',
      'Sifat': 'OPSIONAL',
      'Keterangan & Petunjuk Pengisian': 'Jumlah kuota kursi/porsi yang dialokasikan (Isi angka bulat, contoh: 1, 2, atau 4. Default: 2).'
    },
    {
      'Nama Kolom': 'Sapaan Khusus',
      'Sifat': 'OPSIONAL',
      'Keterangan & Petunjuk Pengisian': 'Sapaan pembuka di atas nama tamu pada kartu undangan (Contoh: "Bapak & Ibu yang kami hormati" atau "Sahabat terkasih").'
    },
    {
      'Nama Kolom': 'Catatan',
      'Sifat': 'OPSIONAL',
      'Keterangan & Petunjuk Pengisian': 'Catatan meja resepsi, sesi kehadiran, atau informasi internal panitia (Contoh: "Meja VIP A1", "Sesi 1").'
    }
  ];

  const wb = XLSX.utils.book_new();

  // Sheet 1: Template
  const wsTemplate = XLSX.utils.json_to_sheet(sampleData);
  wsTemplate['!cols'] = [
    { wch: 32 }, // Nama Tamu
    { wch: 20 }, // No WhatsApp / HP
    { wch: 18 }, // Kategori
    { wch: 24 }, // Jumlah Undangan (Pax)
    { wch: 32 }, // Sapaan Khusus
    { wch: 28 }  // Catatan
  ];
  XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template Daftar Tamu');

  // Sheet 2: Petunjuk
  const wsGuide = XLSX.utils.json_to_sheet(guideData);
  wsGuide['!cols'] = [
    { wch: 24 },
    { wch: 14 },
    { wch: 75 }
  ];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk Pengisian');

  // Generate file and trigger download
  XLSX.writeFile(wb, 'Template_Import_Tamu_Undangan.xlsx');
};

/**
 * Normalizes phone numbers to standard format (e.g. 08xx or 62xx)
 */
export const normalizePhoneNumber = (raw: any): string => {
  if (!raw) return '';
  let str = String(raw).trim().replace(/[^0-9+]/g, '');
  if (str.startsWith('+62')) {
    str = '0' + str.slice(3);
  } else if (str.startsWith('62')) {
    str = '0' + str.slice(2);
  }
  return str;
};

/**
 * Normalizes category input to valid GuestCategory
 */
export const normalizeCategory = (raw: any): GuestCategory => {
  if (!raw) return 'Sahabat';
  const clean = String(raw).trim().toLowerCase();
  
  if (clean.includes('vip')) return 'VIP';
  if (clean.includes('inti')) return 'Keluarga Inti';
  if (clean.includes('keluarga') || clean.includes('besar') || clean.includes('fam')) return 'Keluarga Besar';
  if (clean.includes('kerja') || clean.includes('kantor') || clean.includes('colleague')) return 'Rekan Kerja';
  if (clean.includes('sahabat') || clean.includes('teman') || clean.includes('friend')) return 'Sahabat';
  if (clean.includes('umum') || clean.includes('general')) return 'Tamu Umum';

  return 'Sahabat';
};

/**
 * Parse an uploaded Excel or CSV file
 */
export const parseGuestExcelFile = async (
  file: File, 
  existingGuests: Guest[] = []
): Promise<ParsedGuestRow[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  // Use the first sheet (or the one named 'Template Daftar Tamu' if available)
  const sheetName = workbook.SheetNames.includes('Template Daftar Tamu')
    ? 'Template Daftar Tamu'
    : workbook.SheetNames[0];

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error('Lembar kerja (sheet) tidak ditemukan di dalam file.');
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  if (rawRows.length === 0) {
    throw new Error('File Excel tidak memiliki baris data (kosong).');
  }

  const existingNamesSet = new Set(existingGuests.map(g => g.name.toLowerCase().trim()));

  const parsedList: ParsedGuestRow[] = [];

  rawRows.forEach((row, idx) => {
    // Dynamic column matching (supports lower, upper, trimmed, and aliases)
    const normalizedKeys: Record<string, any> = {};
    for (const [k, v] of Object.entries(row)) {
      normalizedKeys[k.trim().toLowerCase()] = v;
    }

    const name = String(
      normalizedKeys['nama tamu'] ||
      normalizedKeys['nama'] ||
      normalizedKeys['name'] ||
      normalizedKeys['guest name'] ||
      normalizedKeys['tamu'] ||
      ''
    ).trim();

    const phoneRaw = 
      normalizedKeys['no whatsapp / hp'] ||
      normalizedKeys['no whatsapp'] ||
      normalizedKeys['no hp'] ||
      normalizedKeys['nomor whatsapp'] ||
      normalizedKeys['nomor hp'] ||
      normalizedKeys['phone'] ||
      normalizedKeys['whatsapp'] ||
      normalizedKeys['telepon'] ||
      '';

    const categoryRaw = 
      normalizedKeys['kategori'] ||
      normalizedKeys['category'] ||
      normalizedKeys['kategori tamu'] ||
      '';

    const paxRaw = 
      normalizedKeys['jumlah undangan (pax)'] ||
      normalizedKeys['jumlah undangan'] ||
      normalizedKeys['jumlah pax'] ||
      normalizedKeys['pax'] ||
      normalizedKeys['kuota'] ||
      normalizedKeys['kursi'] ||
      2;

    const customGreeting = String(
      normalizedKeys['sapaan khusus'] ||
      normalizedKeys['sapaan'] ||
      normalizedKeys['greeting'] ||
      normalizedKeys['custom greeting'] ||
      ''
    ).trim();

    const notes = String(
      normalizedKeys['catatan'] ||
      normalizedKeys['notes'] ||
      normalizedKeys['keterangan'] ||
      normalizedKeys['meja'] ||
      normalizedKeys['sesi'] ||
      ''
    ).trim();

    const phone = normalizePhoneNumber(phoneRaw);
    const category = normalizeCategory(categoryRaw);
    const paxAllocated = !isNaN(Number(paxRaw)) && Number(paxRaw) > 0 ? Math.round(Number(paxRaw)) : 2;

    const isValid = Boolean(name && name.length >= 2);
    const isDuplicate = existingNamesSet.has(name.toLowerCase());

    parsedList.push({
      id: `row-${idx + 1}-${Date.now()}`,
      name,
      phone,
      category,
      paxAllocated,
      customGreeting,
      notes,
      isValid,
      validationError: !isValid ? 'Nama tamu kosong atau terlalu pendek' : undefined,
      isDuplicate
    });
  });

  return parsedList;
};

/**
 * Export current guests list directly to Excel format
 */
export const exportGuestsToExcel = (guests: Guest[], weddingTitle = 'Daftar Tamu Undangan') => {
  const exportData = guests.map((g, idx) => ({
    'No': idx + 1,
    'Nama Tamu': g.name,
    'Kategori': g.category,
    'Nomor WhatsApp / HP': g.phone || '-',
    'Alokasi Pax': g.paxAllocated,
    'Status RSVP': g.rsvpStatus === 'attending' ? 'Hadir' : (g.rsvpStatus === 'not_attending' ? 'Tidak Hadir' : (g.rsvpStatus === 'tentative' ? 'Masih Ragu' : 'Belum Konfirmasi')),
    'Pax Dikonfirmasi': g.paxConfirmed || 0,
    'Kehadiran (Check-in)': g.checkedIn ? 'Sudah Check-in' : 'Belum',
    'Waktu Check-in': g.checkedInAt || '-',
    'Undangan WA Terkirim': g.invitationSent ? 'Sudah' : 'Belum',
    'Sapaan Khusus': g.customGreeting || '-',
    'Catatan Tamu': g.notes || '-'
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = [
    { wch: 5 },
    { wch: 30 },
    { wch: 18 },
    { wch: 20 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 30 },
    { wch: 30 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Data Tamu');
  const filename = `${weddingTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_Daftar_Tamu.xlsx`;
  XLSX.writeFile(wb, filename);
};
