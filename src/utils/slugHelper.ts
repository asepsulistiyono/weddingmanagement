/**
 * Helper Utility untuk URL Slug Pernikahan & Tautan Undangan Multi-Tenant
 * Format: https://domain/#/nama_pria_dan_nama_wanita (contoh: /#/thomas_dan_juwita)
 */

export function sanitizeSlug(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // hapus karakter aneh
    .replace(/[\s-]+/g, '_') // ubah spasi atau strip jadi underscore
    .replace(/_+/g, '_')     // hindari dobel underscore
    .replace(/^_+|_+$/g, ''); // trim underscore di awal/akhir
}

export function cleanNameForSlug(fullNameOrNick: string): string {
  if (!fullNameOrNick) return '';
  // Hapus gelar dan sapaan umum seperti S.Kom., S.E., Bpk., Ibu, Dr., Ir.
  const cleaned = fullNameOrNick
    .replace(/(?:^|\s)(?:bpk|ibu|mas|mbak|dr|dra|drs|ir|prof|h|hj)\.?\s+/gi, ' ')
    .replace(/,\s*.*$/, '') // hilangkan gelar setelah koma (mis: ", S.T.")
    .trim();
  
  // Ambil kata pertama (nama panggilan / first name)
  const firstWord = cleaned.split(/\s+/)[0] || '';
  return sanitizeSlug(firstWord);
}

/**
 * Otomatis menghasilkan slug dari nama kedua mempelai
 * Contoh: Thomas & Juwita -> "thomas_dan_juwita"
 */
export function generateWeddingSlug(groom: string, bride: string): string {
  const g = cleanNameForSlug(groom);
  const b = cleanNameForSlug(bride);

  if (g && b) {
    return `${g}_dan_${b}`;
  }
  if (g) return g;
  if (b) return b;
  return 'undangan_pernikahan';
}

/**
 * Menghasilkan URL lengkap undangan website
 * Contoh output: https://wedsys.vercel.app/#/thomas_dan_juwita atau dengan ?to=NamaTamu
 */
export function getFullInvitationUrl(slug?: string, guestSlug?: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const clean = slug ? sanitizeSlug(slug) : '';

  if (!clean || clean === 'main' || clean === 'default') {
    return guestSlug ? `${origin}/?to=${encodeURIComponent(guestSlug)}` : origin;
  }

  if (guestSlug) {
    return `${origin}/#/${clean}?to=${encodeURIComponent(guestSlug)}`;
  }

  return `${origin}/#/${clean}`;
}

/**
 * Parsing URL aktif saat ini untuk mendeteksi slug pernikahan & parameter tamu
 * Mendukung format hash: /#/thomas_dan_juwita atau /#/thomas_dan_juwita?to=budi
 */
export function parseWeddingAndGuestFromUrl(): { weddingSlug: string | null; guestSlug: string | null } {
  if (typeof window === 'undefined') {
    return { weddingSlug: null, guestSlug: null };
  }

  const hash = window.location.hash || '';
  const search = window.location.search || '';

  let weddingSlug: string | null = null;
  let guestSlug: string | null = null;

  // 1. Periksa bagian Hash (/#/slug atau /#/slug?to=tamu)
  if (hash.startsWith('#/')) {
    const rawPath = hash.slice(2); // buang '#/'
    const [pathPart, queryPart] = rawPath.split('?');
    const trimmed = pathPart.trim().replace(/\/+$/, '');

    // Pastikan bukan route internal
    if (trimmed && trimmed !== 'admin' && trimmed !== 'gallery') {
      weddingSlug = sanitizeSlug(trimmed);
    }

    if (queryPart) {
      const hashParams = new URLSearchParams(queryPart);
      guestSlug = hashParams.get('to') || hashParams.get('guest') || hashParams.get('u');
    }
  }

  // 2. Periksa window.location.search (?to=tamu atau ?slug=thomas_dan_juwita)
  if (search) {
    const searchParams = new URLSearchParams(search);
    if (!guestSlug) {
      guestSlug = searchParams.get('to') || searchParams.get('guest') || searchParams.get('u');
    }
    if (!weddingSlug) {
      const paramSlug = searchParams.get('w') || searchParams.get('event') || searchParams.get('slug');
      if (paramSlug) {
        weddingSlug = sanitizeSlug(paramSlug);
      }
    }
  }

  // 3. Periksa window.location.pathname jika bukan '/' atau '/index.html'
  if (!weddingSlug && window.location.pathname && window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
    const rawPath = window.location.pathname.replace(/^\/+|\/+$/g, '');
    if (rawPath && rawPath !== 'admin' && rawPath !== 'gallery' && !rawPath.startsWith('api/')) {
      weddingSlug = sanitizeSlug(rawPath);
    }
  }

  return { weddingSlug, guestSlug };
}
