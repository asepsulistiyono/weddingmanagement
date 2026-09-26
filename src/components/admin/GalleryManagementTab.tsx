import React, { useState } from 'react';
import { 
  Images, 
  Plus, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Upload, 
  Link as LinkIcon, 
  Check, 
  X, 
  Search, 
  Filter, 
  Copy,
  ExternalLink,
  Eye,
  Zap,
  Database,
  CheckCircle2,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import type { GalleryPhoto } from '../../types.ts';
import { 
  compressImageFile, 
  compressBase64Image, 
  formatFileSize, 
  type CompressionResult 
} from '../../utils/imageCompressor.ts';

export const GalleryManagementTab: React.FC = () => {
  const { settings, refreshAll } = useRealtime();
  const photos: GalleryPhoto[] = settings?.galleries || [];

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);

  // Form states
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoCaption, setPhotoCaption] = useState<string>('');
  const [photoCategory, setPhotoCategory] = useState<'Prewedding' | 'Lamaran' | 'Momen Romantis' | 'Akad & Resepsi'>('Prewedding');
  const [photoIsFeatured, setPhotoIsFeatured] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Compression states
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressionStats, setCompressionStats] = useState<CompressionResult | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<'ultra' | 'balanced'>('ultra');
  const [batchCompressing, setBatchCompressing] = useState<boolean>(false);
  const [batchResultMsg, setBatchResultMsg] = useState<string | null>(null);

  const categories = ['Semua', 'Prewedding', 'Lamaran', 'Momen Romantis', 'Akad & Resepsi'];

  // Handle local file upload with AGGRESSIVE COMPRESSION
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFeedbackMsg({ type: 'error', text: 'Hanya file gambar (JPG, PNG, WEBP) yang diperbolehkan.' });
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setFeedbackMsg({ type: 'error', text: 'Ukuran file terlalu besar. Maksimal 25 MB.' });
      return;
    }

    setIsCompressing(true);
    setFeedbackMsg(null);

    try {
      // Kompresi agresif: Max 1080px di mode Ultra (target ~50-80KB), Max 1200px di mode Balanced (~80-120KB)
      const options = compressionLevel === 'ultra' 
        ? { maxWidth: 1080, maxHeight: 1080, quality: 0.65 }
        : { maxWidth: 1200, maxHeight: 1200, quality: 0.72 };

      const result = await compressImageFile(file, options);
      setPhotoUrl(result.dataUrl);
      setCompressionStats(result);

      if (!photoCaption) {
        const defaultCaption = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setPhotoCaption(defaultCaption);
      }
    } catch (err: any) {
      console.error('Compression error:', err);
      setFeedbackMsg({ type: 'error', text: 'Gagal mengompresi gambar: ' + (err.message || 'Kesalahan sistem') });
    } finally {
      setIsCompressing(false);
    }
  };

  // Re-compress existing Data URL if needed
  const handleRecompressUrl = async () => {
    if (!photoUrl.startsWith('data:image/')) return;
    setIsCompressing(true);
    try {
      const options = compressionLevel === 'ultra' 
        ? { maxWidth: 1080, maxHeight: 1080, quality: 0.65 }
        : { maxWidth: 1200, maxHeight: 1200, quality: 0.72 };
      const result = await compressBase64Image(photoUrl, options);
      setPhotoUrl(result.dataUrl);
      setCompressionStats(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCompressing(false);
    }
  };

  // Scan and compress all existing gallery photos in database
  const handleBatchCompressDatabase = async () => {
    const uncompressedPhotos = photos.filter(p => p.url.startsWith('data:image/') && p.url.length > 200 * 1024);
    if (uncompressedPhotos.length === 0) {
      setBatchResultMsg('Semua foto di galeri database Anda sudah berukuran optimal dan terkompresi.');
      setTimeout(() => setBatchResultMsg(null), 4000);
      return;
    }

    if (!confirm(`Ditemukan ${uncompressedPhotos.length} foto berukuran besar di database. Mulai kompresi agresif sekarang?`)) {
      return;
    }

    setBatchCompressing(true);
    setBatchResultMsg(null);
    let totalSavedBytes = 0;
    let count = 0;

    try {
      for (const p of uncompressedPhotos) {
        try {
          const comp = await compressBase64Image(p.url, { maxWidth: 1080, maxHeight: 1080, quality: 0.65 });
          totalSavedBytes += comp.savedBytes;
          
          await fetch(`/api/admin/gallery/${p.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: comp.dataUrl })
          });
          count++;
        } catch (err) {
          console.error('Failed to compress photo ' + p.id, err);
        }
      }

      await refreshAll();
      setBatchResultMsg(`Sukses! ${count} foto berhasil dikompres secara agresif. Hemat ${formatFileSize(totalSavedBytes)} di database!`);
    } catch (err) {
      console.error(err);
      setBatchResultMsg('Terjadi kesalahan saat memproses kompresi database.');
    } finally {
      setBatchCompressing(false);
      setTimeout(() => setBatchResultMsg(null), 6000);
    }
  };

  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Mohon pilih file foto atau masukkan tautan URL gambar.' });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMsg(null);

    try {
      if (editingPhoto) {
        // Edit existing photo
        const res = await fetch(`/api/admin/gallery/${editingPhoto.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: photoUrl.trim(),
            caption: photoCaption.trim(),
            category: photoCategory,
            isFeatured: photoIsFeatured
          })
        });

        if (res.ok) {
          setFeedbackMsg({ type: 'success', text: 'Foto berhasil diperbarui!' });
          closeModal();
          await refreshAll();
        } else {
          const errData = await res.json();
          setFeedbackMsg({ type: 'error', text: errData.error || 'Gagal memperbarui foto.' });
        }
      } else {
        // Create new photo
        const res = await fetch('/api/admin/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: photoUrl.trim(),
            caption: photoCaption.trim() || 'Momen Bahagia',
            category: photoCategory,
            isFeatured: photoIsFeatured
          })
        });

        if (res.ok) {
          setFeedbackMsg({ type: 'success', text: 'Foto baru berhasil ditambahkan ke galeri!' });
          closeModal();
          await refreshAll();
        } else {
          const errData = await res.json();
          setFeedbackMsg({ type: 'error', text: errData.error || 'Gagal menambahkan foto.' });
        }
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Terjadi gangguan jaringan saat menghubungi server.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus foto ini dari galeri?')) return;

    try {
      const res = await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await refreshAll();
      } else {
        alert('Gagal menghapus foto.');
      }
    } catch {
      alert('Terjadi kesalahan jaringan.');
    }
  };

  const handleToggleFeatured = async (photo: GalleryPhoto) => {
    try {
      await fetch(`/api/admin/gallery/${photo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !photo.isFeatured })
      });
      await refreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    setEditingPhoto(null);
    setPhotoUrl('');
    setPhotoCaption('');
    setPhotoCategory('Prewedding');
    setPhotoIsFeatured(false);
    setUploadMode('upload');
    setFeedbackMsg(null);
    setCompressionStats(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (photo: GalleryPhoto) => {
    setEditingPhoto(photo);
    setPhotoUrl(photo.url);
    setPhotoCaption(photo.caption || '');
    setPhotoCategory((photo.category as any) || 'Prewedding');
    setPhotoIsFeatured(Boolean(photo.isFeatured));
    setUploadMode(photo.url.startsWith('data:') ? 'upload' : 'url');
    setFeedbackMsg(null);
    setCompressionStats(null);
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingPhoto(null);
    setPhotoUrl('');
    setPhotoCaption('');
    setCompressionStats(null);
  };

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered photos
  const filteredPhotos = photos.filter((p) => {
    const matchCategory = activeCategoryFilter === 'Semua' || (p.category || 'Prewedding') === activeCategoryFilter;
    const matchSearch = (p.caption || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold uppercase tracking-wider">
            <Images className="w-4 h-4 text-amber-600" />
            <span>Manajemen Galeri Foto</span>
          </div>
          <h2 className="font-serif-wedding text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
            Kelola Album &amp; Potret Kenangan
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-xl">
            Unggah foto baru secara langsung atau melalui URL gambar. Foto akan langsung ditampilkan di website undangan tamu secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleBatchCompressDatabase}
            disabled={batchCompressing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 font-medium text-xs shadow-xs transition-all cursor-pointer flex-shrink-0"
            title="Scan dan kompres foto berukuran besar di database"
          >
            {batchCompressing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
            ) : (
              <Database className="w-3.5 h-3.5 text-emerald-700" />
            )}
            <span>{batchCompressing ? 'Mengompres Database...' : '⚡ Optimasi Foto Database'}</span>
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-800 hover:bg-amber-900 text-white font-medium text-xs sm:text-sm shadow-sm transition-all cursor-pointer flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Unggah Foto Baru</span>
          </button>
        </div>
      </div>

      {/* Aggressive Compression Database Status Alert */}
      <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-700 shadow-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-950 text-sm">Kompresi Agresif Hemat Database Aktif</span>
              <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full font-bold">WebP Auto-Scaling</span>
            </div>
            <p className="text-stone-600 text-xs mt-0.5">
              Setiap foto yang diunggah dikompres otomatis hingga <strong className="text-emerald-900 font-bold">95% – 98% lebih kecil</strong> (ke kisaran ~50–90 KB) tanpa mengurangi kejernihan visual di ponsel &amp; monitor tamu.
            </p>
          </div>
        </div>
      </div>

      {batchResultMsg && (
        <div className="p-3.5 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{batchResultMsg}</span>
        </div>
      )}

      {/* Quick Category Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {['Prewedding', 'Lamaran', 'Momen Romantis', 'Akad & Resepsi'].map((cat) => {
          const count = photos.filter(p => (p.category || 'Prewedding') === cat).length;
          return (
            <div key={cat} className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-stone-500 block truncate">{cat}</span>
              <p className="text-xl sm:text-2xl font-bold text-stone-900 mt-1">{count} <span className="text-xs font-normal text-stone-400">foto</span></p>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Chips */}
        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-stone-400 mr-1 hidden sm:inline" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeCategoryFilter === cat
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari keterangan foto..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/90 text-stone-400">
          <Images className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-800" />
          <p className="text-base font-medium text-stone-600">Tidak ada foto yang sesuai kriteria.</p>
          <p className="text-xs text-stone-400 mt-1">Coba ubah kata kunci pencarian atau unggah foto baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-xs hover:border-stone-300 transition-all flex flex-col group"
            >
              {/* Photo Image */}
              <div className="relative h-48 sm:h-52 bg-stone-100 overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Top Badges */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-900/80 text-white backdrop-blur-md">
                    {photo.category || 'Prewedding'}
                  </span>
                </div>

                {/* Featured Toggle Button */}
                <button
                  onClick={() => handleToggleFeatured(photo)}
                  title={photo.isFeatured ? 'Hapus dari Pilihan' : 'Jadikan Foto Pilihan (Featured)'}
                  className={`absolute top-2.5 right-2.5 p-1.5 rounded-full transition-all cursor-pointer backdrop-blur-md ${
                    photo.isFeatured
                      ? 'bg-amber-500 text-stone-950 shadow-md ring-2 ring-amber-300/60'
                      : 'bg-stone-900/60 text-stone-300 hover:text-white hover:bg-stone-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Info & Caption */}
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-stone-800 line-clamp-2">
                    {photo.caption || 'Tanpa keterangan'}
                  </p>
                  <p className="text-[10px] text-stone-400 mt-1">
                    {photo.uploadedAt ? new Date(photo.uploadedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Foto Bawaan'}
                  </p>
                </div>

                {/* Actions row */}
                <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between gap-1">
                  <button
                    onClick={() => handleCopyUrl(photo.id, photo.url)}
                    title="Salin Tautan Foto"
                    className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                  >
                    {copiedId === photo.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(photo)}
                      title="Edit Keterangan"
                      className="p-1.5 rounded-lg text-stone-600 hover:text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      title="Hapus Foto"
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Photo Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-stone-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif-wedding text-2xl font-bold text-stone-900 mb-1">
              {editingPhoto ? 'Edit Informasi Foto' : 'Unggah Foto Baru ke Galeri'}
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              Foto yang diunggah akan otomatis disinkronkan ke halaman galeri undangan tamu.
            </p>

            {feedbackMsg && (
              <div className={`p-3.5 rounded-xl text-xs mb-4 ${
                feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {feedbackMsg.text}
              </div>
            )}

            <form onSubmit={handleSavePhoto} className="space-y-5">
              {/* Upload method switcher */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  Metode Unggah Foto
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadMode('upload')}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      uploadMode === 'upload'
                        ? 'bg-amber-50 border-amber-600 text-amber-900 font-bold'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah File Komputer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      uploadMode === 'url'
                        ? 'bg-amber-50 border-amber-600 text-amber-900 font-bold'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Tautan URL Gambar</span>
                  </button>
                </div>
              </div>

              {/* Compression Mode Selector */}
              <div className="bg-amber-50/60 border border-amber-200/70 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-700" />
                    Tingkat Kompresi Hemat Database
                  </span>
                  <span className="text-[10px] font-semibold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                    Rekomendasi
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setCompressionLevel('ultra')}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      compressionLevel === 'ultra'
                        ? 'bg-amber-800 text-white border-amber-900 font-bold shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="font-semibold text-xs">Ultra Agresif</div>
                    <div className={`text-[10px] ${compressionLevel === 'ultra' ? 'text-amber-200' : 'text-stone-400'}`}>
                      Maks 1080px (~50-80 KB, hemat 98%)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCompressionLevel('balanced')}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      compressionLevel === 'balanced'
                        ? 'bg-amber-800 text-white border-amber-900 font-bold shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="font-semibold text-xs">Agresif Seimbang</div>
                    <div className={`text-[10px] ${compressionLevel === 'balanced' ? 'text-amber-200' : 'text-stone-400'}`}>
                      Maks 1200px (~80-120 KB, hemat 95%)
                    </div>
                  </button>
                </div>
              </div>

              {/* File Input or URL input */}
              {uploadMode === 'upload' ? (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                    Pilih File Gambar
                  </label>
                  <label className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    isCompressing 
                      ? 'border-amber-400 bg-amber-50/50 cursor-wait' 
                      : 'border-stone-300 hover:border-amber-500 bg-stone-50/50'
                  }`}>
                    {isCompressing ? (
                      <div className="flex flex-col items-center justify-center text-center py-2">
                        <Loader2 className="w-8 h-8 text-amber-700 animate-spin mb-2" />
                        <span className="text-xs font-bold text-amber-950">
                          Sedang Mengompres Foto Secara Agresif...
                        </span>
                        <span className="text-[11px] text-amber-800/80 mt-1">
                          Mengurangi piksel berlebih &amp; mengonversi ke WebP untuk menghemat kuota database Anda.
                        </span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-amber-700 mb-2 opacity-80" />
                        <span className="text-xs font-semibold text-stone-800">
                          Klik untuk memilih foto dari perangkat
                        </span>
                        <span className="text-[11px] text-stone-400 mt-1">
                          Mendukung JPG, PNG, WEBP (Otomatis dikompres agresif saat dipilih)
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isCompressing}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                    Tautan URL Gambar
                  </label>
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  {photoUrl.startsWith('data:image/') && photoUrl.length > 100 * 1024 && (
                    <button
                      type="button"
                      onClick={handleRecompressUrl}
                      disabled={isCompressing}
                      className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer hover:bg-emerald-100 transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Data base64 terdeteksi besar ({formatFileSize(Math.round((photoUrl.length * 3) / 4))}). Klik untuk kompres agresif sekarang!</span>
                    </button>
                  )}
                </div>
              )}

              {/* Compression Stats Badge */}
              {compressionStats && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300/80 rounded-2xl p-4 text-xs shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Kompresi Agresif Berhasil!</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-xs">
                      Hemat {compressionStats.savedPercentage}% Kuota
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-white/70 p-2.5 rounded-xl border border-emerald-200/60 font-mono text-[11px]">
                    <div>
                      <div className="text-[10px] text-stone-400 uppercase font-sans">Sebelum</div>
                      <div className="line-through text-stone-500">{formatFileSize(compressionStats.originalSize)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-emerald-800 uppercase font-sans font-bold">Di Database</div>
                      <div className="font-bold text-emerald-700">{formatFileSize(compressionStats.compressedSize)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-stone-400 uppercase font-sans">Dimensi</div>
                      <div className="text-stone-700 font-semibold">{compressionStats.compressedWidth}x{compressionStats.compressedHeight} ({compressionStats.format})</div>
                    </div>
                  </div>
                  <p className="text-[10px] text-emerald-800/80 mt-2 italic">
                    *Kapasitas database sangat terlindungi dan tamu akan membuka galeri ini dengan sangat cepat.
                  </p>
                </div>
              )}

              {/* Photo Preview if available */}
              {photoUrl && (
                <div className="relative h-44 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100">
                  <img
                    src={photoUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-stone-900/85 text-[10px] text-white flex items-center gap-1 backdrop-blur-xs">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Pratinjau Foto Galeri</span>
                  </div>
                </div>
              )}

              {/* Caption */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  Keterangan Foto (Caption)
                </label>
                <input
                  type="text"
                  required
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="Contoh: Momen Romantis di Pantai Kuta"
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Category & Featured */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                    Kategori / Album
                  </label>
                  <select
                    value={photoCategory}
                    onChange={(e) => setPhotoCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Prewedding">Prewedding</option>
                    <option value="Lamaran">Lamaran</option>
                    <option value="Momen Romantis">Momen Romantis</option>
                    <option value="Akad & Resepsi">Akad &amp; Resepsi</option>
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={photoIsFeatured}
                      onChange={(e) => setPhotoIsFeatured(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-700 focus:ring-amber-500 border-stone-300 cursor-pointer"
                    />
                    <span className="text-xs font-medium text-stone-700 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Foto Pilihan (Featured)
                    </span>
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50 cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? 'Menyimpan...' : editingPhoto ? 'Simpan Perubahan' : 'Unggah ke Galeri'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
