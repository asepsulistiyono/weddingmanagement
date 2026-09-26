/**
 * Image Compressor Utility
 * Kompresi Agresif untuk Menghemat Kapasitas Database & Mempercepat Loading Tamu
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 - 1.0 (default: 0.70)
  targetFormat?: 'image/webp' | 'image/jpeg';
  maxSizeBytes?: number; // target max size (e.g. 120KB)
}

export interface CompressionResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  savedPercentage: number;
  originalWidth: number;
  originalHeight: number;
  compressedWidth: number;
  compressedHeight: number;
  format: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Mengompres file gambar lokal dari input file secara agresif
 */
export async function compressImageFile(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.onload = async () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error('Format data gambar tidak valid'));
      }
      try {
        const result = await compressBase64Image(reader.result, {
          ...options,
          originalSizeOverride: originalSize
        });
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Mengompres string base64 / Data URL secara agresif menggunakan HTML5 Canvas
 */
export async function compressBase64Image(
  dataUrl: string,
  options: CompressionOptions & { originalSizeOverride?: number } = {}
): Promise<CompressionResult> {
  const maxWidth = options.maxWidth || 1200;
  const maxHeight = options.maxHeight || 1200;
  let quality = options.quality ?? 0.70;
  const targetFormat = options.targetFormat || 'image/webp';

  // Estimasi ukuran byte dari base64 string
  const base64Content = dataUrl.split(',')[1] || dataUrl;
  const rawSize = Math.round((base64Content.length * 3) / 4);
  const originalSize = options.originalSizeOverride || rawSize;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onerror = () => reject(new Error('Gagal memuat gambar ke memori'));

    img.onload = () => {
      const originalWidth = img.width;
      const originalHeight = img.height;

      // Hitung skala rasio gambar
      let targetW = originalWidth;
      let targetH = originalHeight;

      if (targetW > maxWidth || targetH > maxHeight) {
        if (targetW / maxWidth > targetH / maxHeight) {
          targetH = Math.round((targetH * maxWidth) / targetW);
          targetW = maxWidth;
        } else {
          targetW = Math.round((targetW * maxHeight) / targetH);
          targetH = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Browser tidak mendukung Canvas 2D'));
      }

      // Kualitas rendering tinggi
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Gambar ke canvas
      ctx.drawImage(img, 0, 0, targetW, targetH);

      // Cek apakah browser mendukung image/webp
      let compressedDataUrl = canvas.toDataURL(targetFormat, quality);
      let formatUsed = targetFormat;

      // Jika browser tidak support WebP (misal Safari lawas), fallback ke JPEG
      if (!compressedDataUrl.startsWith(`data:${targetFormat}`)) {
        compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        formatUsed = 'image/jpeg';
      }

      // Hitung ukuran hasil kompresi pertama
      let compBase64 = compressedDataUrl.split(',')[1] || '';
      let compSize = Math.round((compBase64.length * 3) / 4);

      // Pass kedua: Jika ukuran masih di atas 140 KB, lakukan kompresi kedua yang lebih agresif
      if (compSize > 140 * 1024 && (targetW > 960 || targetH > 960)) {
        const pass2W = Math.round(targetW * 0.82);
        const pass2H = Math.round(targetH * 0.82);
        const canvas2 = document.createElement('canvas');
        canvas2.width = pass2W;
        canvas2.height = pass2H;
        const ctx2 = canvas2.getContext('2d');
        if (ctx2) {
          ctx2.imageSmoothingEnabled = true;
          ctx2.imageSmoothingQuality = 'high';
          ctx2.drawImage(img, 0, 0, pass2W, pass2H);
          const pass2Url = canvas2.toDataURL(formatUsed, 0.62);
          const pass2Base64 = pass2Url.split(',')[1] || '';
          const pass2Size = Math.round((pass2Base64.length * 3) / 4);
          if (pass2Size < compSize) {
            compressedDataUrl = pass2Url;
            compSize = pass2Size;
            targetW = pass2W;
            targetH = pass2H;
          }
        }
      }

      const savedBytes = Math.max(0, originalSize - compSize);
      const savedPercentage = originalSize > 0 
        ? Math.round(((originalSize - compSize) / originalSize) * 1000) / 10 
        : 0;

      resolve({
        dataUrl: compressedDataUrl,
        originalSize,
        compressedSize: compSize,
        savedBytes,
        savedPercentage,
        originalWidth,
        originalHeight,
        compressedWidth: targetW,
        compressedHeight: targetH,
        format: formatUsed === 'image/webp' ? 'WebP' : 'JPEG'
      });
    };

    img.src = dataUrl;
  });
}
