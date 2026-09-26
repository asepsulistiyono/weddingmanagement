import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, QrCode, CheckCircle2, UserCheck, ShieldCheck } from 'lucide-react';
import type { Guest } from '../../types.ts';

interface GuestQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: Guest | null;
}

export const GuestQrModal: React.FC<GuestQrModalProps> = ({ isOpen, onClose, guest }) => {
  if (!isOpen) return null;

  const qrData = guest 
    ? `WEDDING-GUEST:${guest.id}:${guest.slug}` 
    : 'WEDDING-GUEST:GENERAL:VISITOR';

  // Quick reliable QR generator via public API
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrData)}&color=332211&bgcolor=ffffff`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 shadow-2xl text-center border border-amber-200"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-6 h-6 text-amber-700" />
          </div>

          <h3 className="font-serif-wedding text-2xl font-bold text-stone-800 mb-1">
            QR Pass Undangan Digital
          </h3>
          <p className="text-xs text-stone-500 mb-6">
            Tunjukkan kode QR ini ke petugas meja resepsi saat tiba di lokasi acara untuk proses check-in cepat.
          </p>

          {/* QR Code Container */}
          <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-200/80 inline-block mb-6 shadow-inner">
            <img
              src={qrUrl}
              alt="QR Code Tamu"
              className="w-48 h-48 mx-auto rounded-lg shadow-xs"
            />
          </div>

          {/* Guest Identity Card */}
          <div className="bg-stone-50 rounded-2xl p-4 text-left border border-stone-200 mb-4">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
              Nama Tamu Undangan
            </p>
            <h4 className="font-semibold text-stone-900 text-sm mb-1">
              {guest ? guest.name : 'Tamu Umum / Sahabat Mempelai'}
            </h4>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                <UserCheck className="w-3 h-3" />
                {guest ? guest.category : 'Tamu Umum'}
              </span>
              {guest?.checkedIn && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Sudah Check-In
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Terverifikasi Buku Tamu Digital</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
